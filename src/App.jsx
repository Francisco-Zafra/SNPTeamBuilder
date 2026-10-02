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
import { ActionBar, DragGhost, DragTip, PreviewPanel, SelectionBar, TabBar } from "./components/Bars.jsx";
import { Header } from "./components/Header.jsx";
import { LineupPanel } from "./components/LineupPanel.jsx";
import { PlaceSheet } from "./components/PlaceSheet.jsx";
import { RosterPanel } from "./components/RosterPanel.jsx";
import { ConfirmClearSheet, PickSheet } from "./components/Sheets.jsx";
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
const KEEP_SELECTION = "button, [role=dialog], [role=alertdialog], .p-compact, .posed";

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

  const { actions } = b;
  const canAct = b.count > 0;
  const hasPlace = !isDesktop && b.tab === "roster" && b.selectedPlayer != null;
  const hasSelBar = !isDesktop && b.tab === "lineup" && b.selectedId != null;
  const rootCls =
    `app ${layoutCls} t-${b.tab}` + (hasPlace ? " has-place" : "") + (hasSelBar ? " has-selbar" : "");

  const onBackdropClick = (e) => {
    if (!e.target.closest(KEEP_SELECTION)) actions.cancel();
  };

  return (
    <div className={rootCls} onClick={onBackdropClick}>
      <Header
        teamName={roster.teamName}
        canAct={canAct}
        onClear={actions.askClear}
        onShare={actions.share}
        onCopy={actions.copy}
      />
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
            dropEnabled={isDesktop}
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
      {b.drag && <DragTip />}
      {b.toast && <Toast key={b.toast.key} toast={b.toast} />}
    </div>
  );
}
