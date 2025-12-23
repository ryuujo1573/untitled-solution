import {
  component$,
  useStore,
  $,
  type PropFunction,
  type Component,
  useTask$,
} from "@builder.io/qwik";
import type { LayoutNode } from "@cnmjs/schema";

export interface DragInfo {
  sourceId: string;
  targetId: string | null;
  position: "before" | "after" | "inside" | null;
}

export interface TreeNodeBuilderProps {
  node: LayoutNode;
  isSelected: boolean;
  isDragging: boolean;
  isOver: boolean;
  dropPosition: "before" | "after" | "inside" | null;
  isOpen: boolean;
  hasChildren: boolean;
  onToggle$: PropFunction<() => void>;
}

export interface DndTreeViewProps {
  root: LayoutNode;
  selectedId?: string | null;
  onSelect$?: PropFunction<(id: string) => void>;
  onMove$?: PropFunction<(info: DragInfo) => void>;
  builder: Component<TreeNodeBuilderProps>;
}

export const DndTreeItem = component$<{
  node: LayoutNode;
  depth: number;
  selectedId?: string | null;
  onSelect$?: PropFunction<(id: string) => void>;
  builder: Component<TreeNodeBuilderProps>;
  dragState: {
    activeId: string | null;
    overId: string | null;
    dropPosition: "before" | "after" | "inside" | null;
  };
  expandedIds: Record<string, boolean>;
  onToggle$: PropFunction<(id: string) => void>;
  onDragStart$: PropFunction<(id: string) => void>;
  onDragOver$: PropFunction<
    (id: string, position: "before" | "after" | "inside") => void
  >;
}>(
  ({
    node,
    depth,
    selectedId,
    onSelect$,
    builder: Builder,
    dragState,
    expandedIds,
    onToggle$,
    onDragStart$,
    onDragOver$,
  }) => {
    const isSelected = selectedId === node.id;
    const isDragging = dragState.activeId === node.id;
    const isOver = dragState.overId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isOpen = !!expandedIds[node.id];

    const handlePointerDown = $((e: PointerEvent, el: HTMLElement) => {
      if (e.button !== 0) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const pointerId = e.pointerId;
      let isDraggingStarted = false;
      let longPressTimer: any = null;

      const startDragging = async () => {
        if (isDraggingStarted) return;
        isDraggingStarted = true;
        await onDragStart$(node.id);
        // Release capture so that pointermove events can reach other elements (drop targets)
        el.releasePointerCapture(pointerId);
      };

      if (e.pointerType === "touch") {
        longPressTimer = setTimeout(startDragging, 500);
      }

      const onPointerMove = (moveEvent: PointerEvent) => {
        if (isDraggingStarted) return;
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Only start dragging if moved more than 5 pixels
        if (distance > 5) {
          if (longPressTimer) clearTimeout(longPressTimer);
          startDragging();
        }
      };

      const onPointerUp = () => {
        if (longPressTimer) clearTimeout(longPressTimer);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    });

    const handlePointerMove = $(async (e: PointerEvent, el: HTMLElement) => {
      if (!dragState.activeId || dragState.activeId === node.id) return;

      const rect = el.getBoundingClientRect();
      const relativeY = (e.clientY - rect.top) / rect.height;

      let position: "before" | "after" | "inside";
      if (node.type === "layout") {
        if (relativeY < 0.2) position = "before";
        else if (relativeY > 0.8) position = "after";
        else position = "inside";
      } else {
        if (relativeY < 0.5) position = "before";
        else position = "after";
      }

      await onDragOver$(node.id, position);
    });

    return (
      <li
        class={[
          "relative list-none",
          isDragging && "opacity-20 pointer-events-none",
        ]}
      >
        {isOver && dragState.dropPosition === "before" && (
          <div
            class="absolute top-0 right-0 z-10 h-0.5 bg-primary"
            style={{ left: `${depth * 16 + 20}px` }}
          />
        )}

        <div
          class={[
            "flex items-center transition-colors",
            isOver &&
              dragState.dropPosition === "inside" &&
              "bg-primary/20 rounded",
          ]}
          style={{ paddingLeft: `${depth * 16}px` }}
          onPointerMove$={handlePointerMove}
          onPointerDown$={handlePointerDown}
          onDragStart$={(e) => e.preventDefault()}
          onClick$={async () => await onSelect$?.(node.id)}
        >
          <div class="flex-1 min-w-0">
            <Builder
              node={node}
              isSelected={isSelected}
              isDragging={isDragging}
              isOver={isOver}
              dropPosition={dragState.dropPosition}
              isOpen={isOpen}
              hasChildren={!!hasChildren}
              onToggle$={$(() => onToggle$(node.id))}
            />
          </div>
        </div>

        {isOver && dragState.dropPosition === "after" && (
          <div
            class="absolute bottom-0 right-0 z-10 h-0.5 bg-primary"
            style={{ left: `${depth * 16 + 20}px` }}
          />
        )}

        {hasChildren && isOpen && (
          <ul class="list-none p-0">
            {node.children?.map((child) => (
              <DndTreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect$={onSelect$}
                builder={Builder}
                dragState={dragState}
                expandedIds={expandedIds}
                onToggle$={onToggle$}
                onDragStart$={onDragStart$}
                onDragOver$={onDragOver$}
              />
            ))}
          </ul>
        )}
      </li>
    );
  },
);

export const DndTreeView = component$<DndTreeViewProps>(
  ({ root, selectedId, onSelect$, onMove$, builder }) => {
    const state = useStore({
      drag: {
        activeId: null as string | null,
        overId: null as string | null,
        dropPosition: null as "before" | "after" | "inside" | null,
      },
      expandedIds: { [root.id]: true } as Record<string, boolean>,
    });

    const toggleExpand = $((id: string) => {
      state.expandedIds[id] = !state.expandedIds[id];
    });

    const handleDragStart = $((id: string) => {
      state.drag.activeId = id;

      const onPointerUp = async () => {
        if (
          state.drag.activeId &&
          state.drag.overId &&
          state.drag.dropPosition
        ) {
          await onMove$?.({
            sourceId: state.drag.activeId,
            targetId: state.drag.overId,
            position: state.drag.dropPosition,
          });
        }
        state.drag.activeId = null;
        state.drag.overId = null;
        state.drag.dropPosition = null;
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointerup", onPointerUp);
    });

    const handleDragOver = $(
      (id: string, position: "before" | "after" | "inside") => {
        if (state.drag.activeId === id) return;
        state.drag.overId = id;
        state.drag.dropPosition = position;
      },
    );

    const handleKeyDown = $((e: KeyboardEvent) => {
      const getVisibleNodes = (
        node: LayoutNode,
        expanded: Record<string, boolean>,
      ): LayoutNode[] => {
        const nodes = [node];
        if (expanded[node.id] && node.children) {
          for (const child of node.children) {
            nodes.push(...getVisibleNodes(child, expanded));
          }
        }
        return nodes;
      };

      const findParent = (
        current: LayoutNode,
        id: string,
      ): LayoutNode | null => {
        if (current.children) {
          for (const child of current.children) {
            if (child.id === id) return current;
            const found = findParent(child, id);
            if (found) return found;
          }
        }
        return null;
      };

      const visibleNodes = getVisibleNodes(root, state.expandedIds);
      const currentIndex = visibleNodes.findIndex((n) => n.id === selectedId);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < visibleNodes.length - 1) {
            onSelect$?.(visibleNodes[currentIndex + 1].id);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (currentIndex > 0) {
            onSelect$?.(visibleNodes[currentIndex - 1].id);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (currentIndex !== -1) {
            const node = visibleNodes[currentIndex];
            if (node.children && node.children.length > 0) {
              if (!state.expandedIds[node.id]) {
                toggleExpand(node.id);
              } else {
                onSelect$?.(node.children[0].id);
              }
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (currentIndex !== -1) {
            const node = visibleNodes[currentIndex];
            if (state.expandedIds[node.id]) {
              toggleExpand(node.id);
            } else {
              const parent = findParent(root, node.id);
              if (parent) {
                onSelect$?.(parent.id);
              }
            }
          }
          break;
      }
    });

    useTask$(({ track }) => {
      track(() => selectedId);
      if (selectedId) {
        const findPath = (
          current: LayoutNode,
          targetId: string,
          path: string[] = [],
        ): string[] | null => {
          if (current.id === targetId) return path;
          if (current.children) {
            for (const child of current.children) {
              const found = findPath(child, targetId, [...path, current.id]);
              if (found) return found;
            }
          }
          return null;
        };

        const path = findPath(root, selectedId);
        if (path) {
          let changed = false;
          for (const id of path) {
            if (!state.expandedIds[id]) {
              state.expandedIds[id] = true;
              changed = true;
            }
          }
          if (changed) {
            state.expandedIds = { ...state.expandedIds };
          }
        }
      }
    });

    return (
      <div
        class="w-full select-none outline-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-sm transition-shadow"
        tabIndex={0}
        onKeyDown$={handleKeyDown}
        onPointerLeave$={() => {
          state.drag.overId = null;
          state.drag.dropPosition = null;
        }}
      >
        <ul class="p-0">
          <DndTreeItem
            node={root}
            depth={0}
            selectedId={selectedId}
            onSelect$={onSelect$}
            builder={builder}
            dragState={state.drag}
            expandedIds={state.expandedIds}
            onToggle$={toggleExpand}
            onDragStart$={handleDragStart}
            onDragOver$={handleDragOver}
          />
        </ul>
      </div>
    );
  },
);
