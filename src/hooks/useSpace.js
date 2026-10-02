import { useEffect, useRef, useState } from "react";
import { MESSAGES } from "../ui/feedback.js";
import { copyToClipboard, shareText } from "../utils/clipboard.js";
import { parseTeamLink } from "../store/teamCode.js";

/**
 * Lista de alineaciones y espacio compartido: hojas abiertas, formularios y las
 * acciones que llevan al almacén. `team` viene de `useTeamStore`.
 */
export function useSpace({ team, teamName, activeLineup, setActiveId, readOnly, flash, onLineupOpened }) {
  const [sheet, setSheet] = useState(null); // "lists" | null
  const [menuFor, setMenuFor] = useState(null); // id con el menú ⋯ abierto
  const [form, setForm] = useState(null); // { mode: "new"|"rename", id?, name, date, from, error }
  const [deleteId, setDeleteId] = useState(null);
  const [teamSheet, setTeamSheet] = useState(null); // "join" | "invite" | "leave" | null
  const [joinText, setJoinText] = useState("");
  const [deletedNotice, setDeletedNotice] = useState(null); // { name, now }

  const lineups = team.lineups;
  const byId = (id) => lineups.find((l) => l.id === id);

  const blocked = () => {
    if (!readOnly) return false;
    flash(team.status === "offline" ? MESSAGES.readOnly : MESSAGES.notReady);
    return true;
  };

  const failed = (error) => {
    console.error("No se ha guardado el cambio:", error);
    flash(MESSAGES.saveFailed);
  };

  // La alineación que estaba viendo la ha borrado otra persona.
  const deletingRef = useRef(null);
  const previous = useRef(null);
  useEffect(() => {
    const prev = previous.current;
    if (
      prev &&
      prev.mode === "shared" &&
      team.mode === "shared" &&
      team.ready &&
      deletingRef.current !== prev.id &&
      !lineups.some((l) => l.id === prev.id)
    ) {
      setDeletedNotice({ name: prev.name, now: activeLineup?.name ?? null });
    }
    previous.current = activeLineup ? { id: activeLineup.id, name: activeLineup.name, mode: team.mode } : null;
  }, [lineups, activeLineup, team.mode, team.ready]);

  const closeAll = () => {
    setSheet(null);
    setMenuFor(null);
    setForm(null);
    setDeleteId(null);
    setTeamSheet(null);
  };

  const lists = {
    open() {
      setSheet("lists");
      setMenuFor(null);
    },
    close() {
      setSheet(null);
      setMenuFor(null);
    },
    toggleMenu(id) {
      if (blocked()) return;
      setMenuFor((current) => (current === id ? null : id));
    },
    pick(id) {
      setSheet(null);
      setMenuFor(null);
      onLineupOpened();
      if (id === activeLineup?.id) return;
      setActiveId(id);
      const target = byId(id);
      if (target) flash(MESSAGES.viewing(target.name));
    },
    openNew() {
      if (blocked()) return;
      setMenuFor(null);
      setForm({ mode: "new", name: "", date: "", from: lineups[0]?.id ?? "empty", error: false });
    },
    openRename(id) {
      const target = byId(id);
      if (!target || blocked()) return;
      setMenuFor(null);
      setForm({ mode: "rename", id, name: target.name, date: target.date ?? "", error: false });
    },
    openDuplicate(id) {
      const target = byId(id);
      if (!target || blocked()) return;
      setMenuFor(null);
      setForm({ mode: "new", name: `Copia de ${target.name}`, date: "", from: id, error: false });
    },
    setFormField(field, value) {
      setForm((current) => current && { ...current, [field]: value, ...(field === "name" ? { error: false } : {}) });
    },
    cancelForm: () => setForm(null),
    async submitForm() {
      if (!form || blocked()) return;
      const name = form.name.trim();
      if (!name) return setForm({ ...form, error: true });
      const date = form.date || null;
      try {
        if (form.mode === "rename") {
          setForm(null);
          await team.store.updateLineupMeta(form.id, { name, date });
          flash(MESSAGES.lineupRenamed(name));
          return;
        }
        const from = form.from !== "empty" ? byId(form.from) : null;
        setForm(null);
        setSheet(null);
        const id = await team.store.createLineup({ name, date, fromId: from?.id });
        setActiveId(id);
        onLineupOpened();
        flash(MESSAGES.lineupCreated(from?.name));
      } catch (error) {
        failed(error);
      }
    },
    askDelete(id) {
      if (blocked()) return;
      setMenuFor(null);
      setDeleteId(id);
    },
    cancelDelete: () => setDeleteId(null),
    async confirmDelete() {
      const target = byId(deleteId);
      setDeleteId(null);
      if (!target || blocked()) return;
      deletingRef.current = target.id;
      try {
        await team.store.deleteLineup(target.id);
        flash(MESSAGES.lineupDeleted(target.name));
      } catch (error) {
        failed(error);
      } finally {
        deletingRef.current = null;
      }
    },
  };

  const copyLink = async () => {
    flash((await copyToClipboard(team.inviteLink)) ? MESSAGES.linkCopied : MESSAGES.copyFailed);
  };

  const space = {
    open() {
      setSheet(null);
      setTeamSheet(team.mode === "shared" ? "invite" : "join");
    },
    close: () => setTeamSheet(null),
    setJoinText,
    async paste() {
      try {
        setJoinText(await navigator.clipboard.readText());
      } catch {
        // Sin permiso para leer el portapapeles: que lo pegue a mano.
      }
    },
    submitJoin() {
      const code = parseTeamLink(joinText);
      if (!code) return flash(MESSAGES.badJoinLink);
      setTeamSheet(null);
      setJoinText("");
      team.join(code);
    },
    async shareLink() {
      const title = teamName ?? "Alineaciones";
      const result = await shareText({ title, text: `Alineaciones de ${title}`, url: team.inviteLink });
      if (result === "unsupported") await copyLink();
    },
    copyLink,
    askLeave: () => setTeamSheet("leave"),
    confirmLeave() {
      setTeamSheet(null);
      team.leave();
      flash(MESSAGES.left);
    },
    enter() {
      team.dismissWelcome();
      flash(MESSAGES.joined);
    },
    // Pantalla de enlace no válido.
    invalidPaste() {
      team.leave();
      setTeamSheet("join");
    },
    invalidLocal: () => team.leave(),
    ackDeleted: () => setDeletedNotice(null),
    deletedToLists() {
      setDeletedNotice(null);
      setSheet("lists");
    },
  };

  return {
    sheet,
    menuFor,
    form,
    deleteTarget: deleteId ? byId(deleteId) ?? null : null,
    teamSheet,
    joinText,
    deletedNotice,
    lists,
    space,
    closeAll,
  };
}
