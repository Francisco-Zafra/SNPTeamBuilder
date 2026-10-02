import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CompareScreen, UseCompareSheet } from "./components/CompareUI.jsx";
import { ActionBar, DragGhost, DragTip, PreviewPanel, SelectionBar, TabBar } from "./components/Bars.jsx";
import { Header } from "./components/Header.jsx";
import { LineupPanel } from "./components/LineupPanel.jsx";
import { PlaceSheet } from "./components/PlaceSheet.jsx";
import { RosterPanel } from "./components/RosterPanel.jsx";
import { ConfirmClearSheet, PickSheet } from "./components/Sheets.jsx";
import {
  DeleteLineupSheet,
  DeletedSheet,
  InvalidLinkScreen,
  InviteSheet,
  JoinSheet,
  LeaveSheet,
  LineupFormSheet,
  LineupsSheet,
  OfflineBar,
  SpaceHeader,
  WelcomeScreen,
} from "./components/SpaceUI.jsx";
import { CachedBanner, ErrorState, LoadingState, Toast } from "./components/States.jsx";
import { useLineupBuilder } from "./hooks/useLineupBuilder.js";
import { useMediaQuery } from "./hooks/useMediaQuery.js";
import { useRoster } from "./hooks/useRoster.js";

const DESKTOP_QUERY = "(min-width: 1024px)";

// Las hojas y paneles se miden siempre: la hoja de huecos aparece al empezar a arrastrar.
const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } };

const collisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

const DND_ACCESSIBILITY = {
  screenReaderInstructions: {
    draggable: "Tócalo para seleccionarlo y después toca un hueco. También puedes mantenerlo pulsado y arrastrarlo.",
  },
  announcements: {
    onDragStart: () => "Arrastrando jugador.",
    onDragOver: ({ over }) => (over ? "Sobre un hueco." : "Fuera de los huecos."),
    onDragEnd: ({ over }) => (over ? "Jugador soltado." : "Arrastre cancelado."),
    onDragCancel: () => "Arrastre cancelado.",
  },
};

// Toques fuera de botones y hojas cancelan la selección.
const KEEP_SELECTION = "button, input, label, [role=dialog], [role=alertdialog], .p-compact, .posed";

export default function App() {
  const roster = useRoster();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const b = useLineupBuilder({ roster, isDesktop });
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const layoutCls = isDesktop ? "l-desktop" : "l-tabs";

  if (!roster.players.length) {
    return (
      <div className={`app ${layoutCls}`}>
        <Header teamName={roster.teamName} />
        {roster.status === "error" ? <ErrorState onRetry={b.actions.retry} /> : <LoadingState />}
      </div>
    );
  }

  const { actions, space: sp, sync } = b;
  const shared = sync.mode === "shared";
  const locked = sync.state === "offline";
  const canAct = b.count > 0;
  const hasPlace = !isDesktop && b.tab === "roster" && b.selectedPlayer != null;
  const hasSelBar = !isDesktop && b.tab === "lineup" && b.selectedId != null;
  const rootCls =
    `app ${layoutCls} t-${b.tab} v2` +
    (hasPlace ? " has-place" : "") +
    (hasSelBar ? " has-selbar" : "") +
    (locked ? " is-locked" : "");

  const onBackdropClick = (e) => {
    if (!e.target.closest(KEEP_SELECTION)) actions.cancel();
  };

  return (
    <div className={rootCls} onClick={onBackdropClick}>
      <SpaceHeader
        teamName={roster.teamName}
        shared={shared}
        syncAvailable={sync.available}
        activeLineup={b.activeLineup}
        syncState={sync.state}
        canAct={canAct}
        onOpenLists={sp.lists.open}
        onOpenSpace={sp.space.open}
        onClear={actions.askClear}
        onShare={actions.share}
        onCopy={actions.copy}
      />
      {locked && <OfflineBar />}
      {roster.status === "stale" && (
        <CachedBanner fetchedAt={roster.fetchedAt} refreshing={roster.refreshing} onRetry={actions.retry} />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={MEASURING}
        accessibility={DND_ACCESSIBILITY}
        onDragStart={actions.dragStart}
        onDragEnd={actions.dragEnd}
        onDragCancel={actions.dragCancel}
      >
        <div className="main">
          <RosterPanel
            groups={b.groups}
            total={b.players.length}
            locations={b.locations}
            selectedId={b.selectedId}
            dragId={b.drag?.playerId ?? null}
            posFor={b.posFor}
            // Soltar en la plantilla quita al jugador (solo tiene efecto si viene de un hueco).
            dropEnabled={isDesktop && !locked}
            shared={shared}
            locked={locked}
            actions={actions}
          />
          <LineupPanel
            lineup={b.lineup}
            courtsByPair={b.courtsByPair}
            totalPoints={b.totalPoints}
            count={b.count}
            isDesktop={isDesktop}
            selectedPlayer={b.selectedPlayer}
            dropEnabled={isDesktop || b.tab === "lineup"}
            locked={locked}
            changed={b.changed}
            hasLineup={b.activeLineup != null || !sync.ready}
            emptyText={
              shared ? "Crea la primera; el equipo la verá al momento." : "Crea la primera para empezar a montar parejas."
            }
            onNewLineup={sp.lists.openNew}
            actions={actions}
          />
          {hasPlace && (
            <PlaceSheet
              lineup={b.lineup}
              courtsByPair={b.courtsByPair}
              selectedPlayer={b.selectedPlayer}
              dragging={b.drag != null}
              actions={actions}
            />
          )}
          {isDesktop && <PreviewPanel text={b.copyText} canAct={canAct} onCopy={actions.copy} />}
        </div>
        <DragOverlay dropAnimation={null}>
          {b.drag && b.playersById.has(b.drag.playerId) && <DragGhost player={b.playersById.get(b.drag.playerId)} />}
        </DragOverlay>
      </DndContext>

      {!isDesktop && <ActionBar canAct={canAct} onCopy={actions.copy} onShare={actions.share} />}
      {hasSelBar && (
        <SelectionBar
          player={b.selectedPlayer}
          location={b.locations.get(b.selectedId)}
          onRemove={actions.removeSelected}
          onCancel={actions.cancel}
        />
      )}
      {!isDesktop && (
        <TabBar tab={b.tab} count={b.count} rosterCount={b.players.length} onTab={actions.goTab} />
      )}

      {!isDesktop && b.pickFor && b.tab === "lineup" && (
        <PickSheet
          target={b.pickFor}
          court={b.courtsByPair.get(b.pickFor.pairId)}
          players={b.players}
          locations={b.locations}
          onPick={actions.tapPlayer}
          onClose={actions.cancel}
        />
      )}
      {b.confirmOpen && (
        <ConfirmClearSheet count={b.count} onConfirm={actions.confirmClear} onCancel={actions.cancelClear} />
      )}
      {sp.sheet === "lists" && (
        <LineupsSheet
          lineups={b.lineups}
          activeId={b.activeLineup?.id}
          menuFor={sp.menuFor}
          playersById={b.playersById}
          shared={shared}
          locked={b.sync.readOnly}
          lists={sp.lists}
          onShareSpace={sync.available ? sp.space.open : null}
          selecting={sp.selecting}
          picked={sp.picked}
          compare={sp.compare}
        />
      )}
      {sp.comparing && (
        <CompareScreen
          lineups={b.lineups}
          comparing={sp.comparing}
          playersById={b.playersById}
          isDesktop={isDesktop}
          locked={locked}
          compare={sp.compare}
        />
      )}
      {sp.comparing && sp.useDialog && (
        <UseCompareSheet
          lineups={b.lineups}
          comparing={sp.comparing}
          useDialog={sp.useDialog}
          shared={shared}
          locked={b.sync.readOnly}
          compare={sp.compare}
        />
      )}
      {sp.form && <LineupFormSheet form={sp.form} lineups={b.lineups} playersById={b.playersById} lists={sp.lists} />}
      {sp.deleteTarget && (
        <DeleteLineupSheet
          target={sp.deleteTarget}
          lineups={b.lineups}
          activeId={b.activeLineup?.id}
          shared={shared}
          lists={sp.lists}
        />
      )}
      {sp.teamSheet === "join" && <JoinSheet joinText={sp.joinText} space={sp.space} />}
      {sp.teamSheet === "invite" && <InviteSheet link={sync.inviteLink} syncState={sync.state} space={sp.space} />}
      {sp.teamSheet === "leave" && <LeaveSheet space={sp.space} />}
      {sp.deletedNotice && <DeletedSheet notice={sp.deletedNotice} space={sp.space} />}
      {sync.welcome && <WelcomeScreen teamName={roster.teamName} space={sp.space} />}
      {sync.invalid && <InvalidLinkScreen code={sync.teamCode} space={sp.space} />}
      {b.drag && <DragTip />}
      {b.toast && <Toast key={b.toast.key} toast={b.toast} />}
    </div>
  );
}
