import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createEmptyLineup, lineupReducer } from "../domain/lineupReducer.js";
import { countPlacedPlayers, getCourts, getTotalPoints, indexPlayers } from "../domain/lineupSelectors.js";
import { groupPlayersBySide, withPreferredSides } from "../domain/roster.js";
import { SLOT_ORDER } from "../domain/sides.js";
import { cleanAlias } from "../domain/aliases.js";
import { MESSAGES, aliasFeedback, placementFeedback, removalFeedback, sideFeedback } from "../ui/feedback.js";
import { copyToClipboard, shareText } from "../utils/clipboard.js";
import { buildLineupText } from "../utils/share.js";
import { STORAGE_KEYS } from "../utils/storage.js";
import { usePersistentState } from "./usePersistentState.js";
import { useSpace } from "./useSpace.js";
import { useTeamStore } from "./useTeamStore.js";

const TOAST_MS = 2600;
/** Cambios que llegan tras una acción propia en este margen no se anuncian como ajenos. */
const OWN_CHANGE_MS = 2500;
/** Duración del resalte de pistas cambiadas desde otro dispositivo (--dur-changed). */
const CHANGED_MS = 2400;
/** "Guardando…" se mantiene al menos este tiempo para que se llegue a ver. */
const SAVING_MIN_MS = 700;
const EMPTY_LINEUP = createEmptyLineup();
const restoreActiveId = (value) => (typeof value === "string" ? value : null);

function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const flash = useCallback((next) => {
    if (!next) return;
    clearTimeout(timer.current);
    setToast({ ...next, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, flash };
}

function useStickyFlag(flag, ms) {
  const [sticky, setSticky] = useState(flag);
  useEffect(() => {
    if (flag) return setSticky(true);
    const t = setTimeout(() => setSticky(false), ms);
    return () => clearTimeout(t);
  }, [flag, ms]);
  return flag || sticky;
}

const changedPairIds = (before, after) =>
  after
    .filter((pair) => {
      const old = before.find((p) => p.id === pair.id);
      return !old || old.reves !== pair.reves || old.derecha !== pair.derecha;
    })
    .map((pair) => pair.id);

/**
 * Estado de la pantalla: posiciones y alineaciones (del almacén local o
 * compartido), selección, hojas abiertas, arrastre y avisos. Las reglas viven en
 * `domain/`; aquí solo se traducen los toques en acciones.
 */
export function useLineupBuilder({ roster, isDesktop }) {
  const team = useTeamStore();
  const [activeId, setActiveId] = usePersistentState(STORAGE_KEYS.activeLineup, restoreActiveId);

  const [tab, setTab] = useState("lineup");
  const [selectedId, setSelectedId] = useState(null);
  const [pickFor, setPickFor] = useState(null); // { pairId, slot }
  const [posFor, setPosFor] = useState(null); // playerId con el selector de posición abierto
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drag, setDrag] = useState(null); // { playerId, from }
  const { toast, flash } = useToast();

  // Compartido: solo se edita con conexión y datos confirmados por el servidor.
  const readOnly = team.mode === "shared" && team.status !== "synced";

  const activeLineup = team.lineups.find((l) => l.id === activeId) ?? team.lineups[0] ?? null;
  const validIds = useMemo(() => roster.players.map((p) => p.id), [roster.players]);

  // Para mostrar se ignoran los jugadores que ya no están en la plantilla.
  const lineup = useMemo(() => {
    const pairs = activeLineup?.pairs ?? EMPTY_LINEUP;
    return validIds.length ? lineupReducer(pairs, { type: "PRUNE", validIds }) : pairs;
  }, [activeLineup?.pairs, validIds]);

  const players = useMemo(
    () => withPreferredSides(roster.players, team.sides, team.aliases),
    [roster.players, team.sides, team.aliases]
  );
  const playersById = useMemo(() => indexPlayers(players), [players]);
  const groups = useMemo(() => groupPlayersBySide(players), [players]);
  const courts = useMemo(() => getCourts(lineup, playersById), [lineup, playersById]);
  const courtsByPair = useMemo(() => new Map(courts.map((c) => [c.pairId, c])), [courts]);
  const locations = useMemo(() => {
    const map = new Map();
    for (const c of courts) {
      for (const slot of SLOT_ORDER) {
        if (c[slot]) map.set(c[slot].player.id, { court: c.court, pairId: c.pairId, slot });
      }
    }
    return map;
  }, [courts]);
  const totalPoints = getTotalPoints(courts);
  const count = countPlacedPlayers(courts);
  const copyText = useMemo(
    () => buildLineupText({ lineupName: activeLineup?.name, courts }),
    [activeLineup?.name, courts]
  );

  // Cambios llegados de otro dispositivo en la alineación activa: aviso y resalte de pistas.
  const [changed, setChanged] = useState([]);
  const lastOwnChange = useRef(0);
  const seenPairs = useRef({ id: null, pairs: null });
  useEffect(() => {
    if (!activeLineup) return;
    const seen = seenPairs.current;
    seenPairs.current = { id: activeLineup.id, pairs: activeLineup.pairs };
    if (team.mode !== "shared" || seen.id !== activeLineup.id || !seen.pairs) return;
    if (Date.now() - lastOwnChange.current < OWN_CHANGE_MS) return;
    const ids = changedPairIds(seen.pairs, activeLineup.pairs);
    if (!ids.length) return;
    setChanged(ids);
    const numbers = ids.map((id) => courtsByPair.get(id)?.court).filter(Boolean);
    flash(MESSAGES.remoteUpdate(numbers.sort((a, b) => a - b)));
  }, [activeLineup, team.mode, courtsByPair, flash]);
  useEffect(() => {
    if (!changed.length) return;
    const t = setTimeout(() => setChanged([]), CHANGED_MS);
    return () => clearTimeout(t);
  }, [changed]);

  const saving = useStickyFlag(team.saving, SAVING_MIN_MS);
  const syncState =
    team.mode === "local"
      ? "local"
      : team.status === "synced"
        ? saving
          ? "saving"
          : "ok"
        : team.status === "connecting"
          ? "connecting"
          : "offline";

  const clearTransient = () => {
    setSelectedId(null);
    setPickFor(null);
    setPosFor(null);
  };

  /** Bloquea la edición en solo lectura. Devuelve `true` si se puede editar. */
  const canEdit = () => {
    if (!readOnly && activeLineup) return true;
    if (readOnly) flash(team.status === "connecting" ? MESSAGES.notReady : MESSAGES.readOnly);
    return false;
  };

  const space = useSpace({
    team,
    teamName: roster.teamName,
    activeLineup,
    setActiveId,
    readOnly,
    flash,
    onLineupOpened: () => {
      clearTransient();
      setTab("lineup");
    },
  });

  const saveFailed = (error) => {
    console.error("No se ha guardado el cambio:", error);
    flash(error?.code === "not-found" ? MESSAGES.lineupGone : MESSAGES.saveFailed);
  };

  const apply = (action) => {
    lastOwnChange.current = Date.now();
    team.store.applyAction(activeLineup.id, action, { validIds }).catch(saveFailed);
  };

  const place = (playerId, pairId, slot) => {
    const action = { type: "PLACE", playerId, pairId, slot };
    const after = lineupReducer(lineup, action);
    clearTransient();
    if (after === lineup || !canEdit()) return;
    apply(action);
    flash(placementFeedback({ before: lineup, after, action, playersById }));
  };

  const remove = (pairId, slot) => {
    const playerId = lineup.find((p) => p.id === pairId)?.[slot];
    if (!playerId || !canEdit()) return;
    apply({ type: "REMOVE", pairId, slot });
    setSelectedId(null);
    const player = playersById.get(playerId);
    if (player) flash(removalFeedback(player, slot));
  };

  const copy = async () => {
    flash((await copyToClipboard(copyText)) ? MESSAGES.copied : MESSAGES.copyFailed);
  };

  const actions = {
    tapPlayer(playerId) {
      if (!canEdit()) return;
      if (pickFor) return place(playerId, pickFor.pairId, pickFor.slot);
      if (selectedId === playerId) return setSelectedId(null);
      setSelectedId(playerId);
      setPosFor(null);
    },

    tapSlot(pairId, slot) {
      if (!canEdit()) return;
      const occupant = lineup.find((p) => p.id === pairId)?.[slot] ?? null;
      if (selectedId) {
        if (selectedId === occupant) return setSelectedId(null);
        return place(selectedId, pairId, slot);
      }
      if (occupant) {
        setSelectedId(occupant);
        setPickFor(null);
        setPosFor(null);
        return;
      }
      if (!isDesktop) {
        setPickFor({ pairId, slot });
        setPosFor(null);
        return;
      }
      flash(MESSAGES.pickFirst);
    },

    remove,

    removeSelected() {
      const location = locations.get(selectedId);
      if (location) remove(location.pairId, location.slot);
    },

    togglePosition(playerId) {
      if (readOnly) return flash(MESSAGES.readOnly);
      setPosFor((current) => (current === playerId ? null : playerId));
      setSelectedId(null);
      setPickFor(null);
    },

    setSide(playerId, side) {
      setPosFor(null);
      if (readOnly) return flash(MESSAGES.readOnly);
      lastOwnChange.current = Date.now();
      team.store.setSide(playerId, side).catch(saveFailed);
      const player = playersById.get(playerId);
      if (player) flash(sideFeedback(player, side, team.mode));
    },

    setAlias(playerId, alias) {
      if (readOnly) return flash(MESSAGES.readOnly);
      const player = playersById.get(playerId);
      if (!player || cleanAlias(alias) === (player.alias ?? "")) return;
      lastOwnChange.current = Date.now();
      team.store.setAlias(playerId, alias).catch(saveFailed);
      flash(aliasFeedback(player, cleanAlias(alias), team.mode));
    },

    cancel: clearTransient,

    goTab(next) {
      setTab(next);
      setPosFor(null);
      setPickFor(null);
    },

    askClear() {
      setSelectedId(null);
      setPickFor(null);
      if (canEdit()) setConfirmOpen(true);
    },

    confirmClear() {
      setConfirmOpen(false);
      if (!canEdit()) return;
      apply({ type: "CLEAR" });
      flash(MESSAGES.cleared);
    },

    cancelClear: () => setConfirmOpen(false),

    copy,

    async share() {
      const result = await shareText({ title: roster.teamName ?? "Alineación", text: copyText });
      if (result === "unsupported") await copy();
    },

    async retry() {
      const wasStale = roster.status === "stale";
      const result = await roster.retry();
      if (!wasStale) return;
      if (result === "ready") flash(MESSAGES.refreshed(roster.players.length));
      else if (result === "stale") flash(MESSAGES.stillOffline);
    },

    dragStart({ active }) {
      const { playerId, from } = active.data.current ?? {};
      if (!playerId || !canEdit()) return;
      setDrag({ playerId, from });
      clearTransient();
    },

    dragEnd({ active, over }) {
      if (!drag) return;
      setDrag(null);
      const source = active.data.current;
      const target = over?.data.current;
      if (!source?.playerId || !target) return;
      if (target.type === "slot") place(source.playerId, target.pairId, target.slot);
      else if (target.type === "roster" && source.from) remove(source.from.pairId, source.from.slot);
    },

    dragCancel: () => setDrag(null),
  };

  // Esc cierra selección, hojas y diálogos.
  const closeSpaceSheets = useRef(space.closeAll);
  closeSpaceSheets.current = space.closeAll;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setSelectedId(null);
      setPickFor(null);
      setPosFor(null);
      setConfirmOpen(false);
      closeSpaceSheets.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activePlayerId = selectedId ?? drag?.playerId ?? null;

  return {
    players,
    playersById,
    groups,
    lineup,
    courtsByPair,
    locations,
    totalPoints,
    count,
    copyText,
    tab,
    selectedId,
    selectedPlayer: activePlayerId ? playersById.get(activePlayerId) ?? null : null,
    pickFor,
    posFor,
    confirmOpen,
    drag,
    toast,
    actions,
    changed,
    sync: {
      mode: team.mode,
      available: team.available,
      status: team.status,
      state: syncState,
      readOnly,
      ready: team.ready,
      inviteLink: team.inviteLink,
      teamCode: team.teamCode,
      welcome: team.welcome,
      invalid: team.status === "denied",
    },
    lineups: team.lineups,
    activeLineup,
    space,
  };
}
