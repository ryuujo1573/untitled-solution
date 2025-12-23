import {
  component$,
  useStore,
  $,
  useComputed$,
  isBrowser,
  useOnDocument,
} from "@builder.io/qwik";
import type { LayoutIR } from "@cnmjs/schema";
import { LayoutNodeRenderer } from "~/components/layout-renderer";
import { DndTreeView } from "~/components/tree-view/dnd-tree-view";
import { LayoutNodeBuilder } from "~/components/tree-view/layout-node-builder";
import { MonacoEditor } from "~/components/monaco-editor";
import { VersionBadge } from "~/components/version-badge";
import { ViewportControls } from "~/components/viewport-controls";
import { FlCopySolid } from "@qwikest/icons/flowbite";
import YAML from "yaml";
import { editorSlice, type EditorState } from "~/store/editor";

import initialIRRaw from "~/data/initial-ir.yaml";

export const UserInterface = component$(() => {
  const initialIR = initialIRRaw as LayoutIR;

  const editor = useStore<EditorState>({
    present: initialIR,
    past: [],
    future: [],
    selectedNodeId: null,
  });

  const viewport = useStore({
    width: 1200,
    height: 800,
    zoom: 0.8,
    isResizing: false,
  });

  const uiState = useStore({
    rightPanelWidth: 600, // Increased default width
    isResizingPanel: false,
    editorMode: "yaml" as "json" | "yaml",
    editorContent: YAML.stringify(initialIR),
    error: null as string | null,
    visualSettings: {
      showFlexInfo: false,
      showGridInfo: false,
    },
  });

  const dispatch = $((action: any) => {
    // We use a plain object for the reducer, but must ensure it's not a proxy
    // so Immer can work correctly with arrays.
    const currentState = JSON.parse(
      JSON.stringify({
        present: editor.present,
        past: editor.past,
        future: editor.future,
        selectedNodeId: editor.selectedNodeId,
      }),
    );

    const nextState = editorSlice.reducer(currentState, action);

    // Update the reactive store
    editor.present = nextState.present;
    editor.past = nextState.past;
    editor.future = nextState.future;
    editor.selectedNodeId = nextState.selectedNodeId;

    // Sync editor content if IR changed
    if (action.type !== "editor/selectNode") {
      uiState.editorContent =
        uiState.editorMode === "yaml"
          ? YAML.stringify(editor.present)
          : JSON.stringify(editor.present, null, 2);
    }
  });

  const onEditorChange = $((value: string) => {
    uiState.editorContent = value;
    try {
      let parsed;
      if (uiState.editorMode === "json") {
        parsed = JSON.parse(value);
      } else {
        parsed = YAML.parse(value);
      }
      dispatch(editorSlice.actions.updateIR(parsed));
      uiState.error = null;
    } catch (e: any) {
      uiState.error = e.message;
    }
  });

  const toggleEditorMode = $((mode: "json" | "yaml") => {
    if (uiState.editorMode === mode) return;

    try {
      if (mode === "yaml") {
        uiState.editorContent = YAML.stringify(editor.present);
      } else {
        uiState.editorContent = JSON.stringify(editor.present, null, 2);
      }
      uiState.editorMode = mode;
      uiState.error = null;
    } catch (e: any) {
      uiState.error = "Conversion error: " + e.message;
    }
  });

  useOnDocument(
    "keydown",
    $((e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          dispatch(editorSlice.actions.redo());
        } else {
          dispatch(editorSlice.actions.undo());
        }
        e.preventDefault();
      }
    }),
  );

  const minCh = 40;
  const minPixelWidth = useComputed$(() => {
    if (isBrowser) {
      const measureEl = document.createElement("span");
      measureEl.style.visibility = "hidden";
      measureEl.style.position = "absolute";
      measureEl.style.whiteSpace = "nowrap";
      measureEl.textContent = "0".repeat(minCh);
      document.body.appendChild(measureEl);
      const width = measureEl.getBoundingClientRect().width;
      document.body.removeChild(measureEl);
      console.log("Measured width for", minCh, "ch is", width);
      return width;
    }
    console.log("Not in browser environment, cannot measure width");

    return 0;
  });

  const onPanelResizeStart = $((e: PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    uiState.isResizingPanel = true;
    const startX = e.clientX;
    const startWidth = uiState.rightPanelWidth;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!uiState.isResizingPanel) return;
      const delta = startX - moveEvent.clientX;
      const newWidth = startWidth + delta;

      const minRightWidth = minPixelWidth.value;
      const maxRightWidth = window.innerWidth - 300;

      uiState.rightPanelWidth = Math.max(
        minRightWidth,
        Math.min(maxRightWidth, newWidth),
      );
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      uiState.isResizingPanel = false;
      (e.target as HTMLElement).releasePointerCapture(upEvent.pointerId);

      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  });

  const onResizeStart = $((e: PointerEvent) => {
    // 阻止默认行为，防止触发系统的拖放或选中
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    viewport.isResizing = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = viewport.width;
    const startHeight = viewport.height;

    // 锁定全局样式
    document.body.style.userSelect = "none";
    document.body.style.cursor = "nwse-resize";

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!viewport.isResizing) return;
      viewport.width = Math.max(
        320,
        startWidth + (moveEvent.clientX - startX) / viewport.zoom,
      );
      viewport.height = Math.max(
        200,
        startHeight + (moveEvent.clientY - startY) / viewport.zoom,
      );
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      viewport.isResizing = false;
      (e.target as HTMLElement).releasePointerCapture(upEvent.pointerId);

      // 恢复全局样式
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  });

  const syncToAgent = $(() => {
    const content = uiState.editorContent;
    navigator.clipboard.writeText(content);
    // We could add a toast here, but for now console is fine
    console.log("Synced to Agent:", content);
  });

  return (
    <div class="bg-base-100 text-base-content flex h-screen w-full flex-col">
      {/* Toolbar */}
      <div class="border-base-300 bg-base-200 flex items-center justify-between border-b px-6 py-3">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3">
            <h1 class="text-xl font-black tracking-tight">
               Flow IR
            </h1>
            <VersionBadge />
          </div>

          <div class="divider divider-horizontal mx-0"></div>

          <ViewportControls viewport={viewport} />

          <div class="divider divider-horizontal mx-0"></div>

          {/* Debug Toggles */}
          <div class="flex items-center gap-4">
            <span class="text-xs font-bold text-neutral-500 uppercase">
              Debug
            </span>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                class="toggle toggle-primary toggle-xs"
                checked={uiState.visualSettings.showFlexInfo}
                onChange$={(e) =>
                  (uiState.visualSettings.showFlexInfo = (
                    e.target as HTMLInputElement
                  ).checked)
                }
              />
              <span class="text-[10px] font-medium">Flex</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                class="toggle toggle-secondary toggle-xs"
                checked={uiState.visualSettings.showGridInfo}
                onChange$={(e) =>
                  (uiState.visualSettings.showGridInfo = (
                    e.target as HTMLInputElement
                  ).checked)
                }
              />
              <span class="text-[10px] font-medium">Grid</span>
            </label>
          </div>
        </div>

        <div class="flex gap-2">
          <div class="join mr-2">
            <button
              class="btn btn-sm btn-ghost join-item text-[10px] font-bold"
              disabled={editor.past.length === 0}
              onClick$={() => dispatch(editorSlice.actions.undo())}
              title="Undo (Cmd+Z)"
            >
              UNDO
            </button>
            <button
              class="btn btn-sm btn-ghost join-item text-[10px] font-bold"
              disabled={editor.future.length === 0}
              onClick$={() => dispatch(editorSlice.actions.redo())}
              title="Redo (Cmd+Shift+Z)"
            >
              REDO
            </button>
          </div>
          <button class="btn btn-sm btn-ghost">Export Code</button>
          <button
            class="btn btn-primary btn-sm tooltip tooltip-left lg:tooltip-bottom"
            data-tip="Copy to clipboard"
            onClick$={syncToAgent}
          >
            <FlCopySolid class="h-3.5 w-3.5 opacity-90" />
            <span class="hidden xl:inline">Copy to clipboard</span>
          </button>
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">
        {/* Tree View Sidebar */}
        <div class="border-base-300 bg-base-200 flex w-64 flex-col overflow-hidden border-r">
          <div class="border-base-300 flex items-center justify-between border-b px-4 py-2">
            <h2 class="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
              Structure
            </h2>
          </div>
          <div class="flex-1 overflow-auto p-2">
            <DndTreeView
              root={editor.present.root}
              selectedId={editor.selectedNodeId}
              onSelect$={(id) => dispatch(editorSlice.actions.selectNode(id))}
              onMove$={(info) => {
                if (info.targetId && info.position) {
                  dispatch(
                    editorSlice.actions.moveNode({
                      sourceId: info.sourceId,
                      targetId: info.targetId,
                      position: info.position,
                    }),
                  );
                }
              }}
              builder={LayoutNodeBuilder}
            />
          </div>
        </div>

        {/* Visualizer Area */}
        <div
          class="bg-base-300/20 relative flex-1 overflow-auto p-12"
          style={{ minWidth: "300px" }}
          onClick$={() => dispatch(editorSlice.actions.selectNode(null))}
        >
          <div
            class={[
              "bg-base-100 text-base-content relative mx-auto shadow-2xl",
              !viewport.isResizing && "transition-all duration-300",
            ]}
            style={{
              width: `${viewport.width}px`,
              height: `${viewport.height}px`,
              transform: `scale(${viewport.zoom})`,
              transformOrigin: "top center",
              boxShadow: viewport.isResizing
                ? "0 0 0 4px oklch(var(--p) / 0.3)"
                : "",
            }}
          >
            <div class="h-full w-full overflow-hidden">
              <LayoutNodeRenderer
                node={editor.present.root}
                selectedId={editor.selectedNodeId}
                onSelect$={(id) => dispatch(editorSlice.actions.selectNode(id))}
                visualSettings={uiState.visualSettings}
              />
            </div>

            {/* Resize Handles */}
            <div
              class="hover:bg-primary/30 absolute top-0 -right-1 bottom-0 w-2 cursor-ew-resize touch-none transition-colors"
              onPointerDown$={onResizeStart}
            ></div>
            <div
              class="hover:bg-primary/30 absolute right-0 bottom-0 -left-1 h-2 cursor-ns-resize touch-none transition-colors"
              onPointerDown$={onResizeStart}
            ></div>
            <div
              class="border-primary hover:bg-primary/50 absolute -right-2 -bottom-2 h-4 w-4 cursor-nwse-resize touch-none rounded-full border-2 bg-white transition-colors"
              onPointerDown$={onResizeStart}
            ></div>
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          class={[
            "group bg-base-300 hover:bg-primary relative w-1 cursor-col-resize touch-none transition-colors",
            uiState.isResizingPanel && "bg-primary",
          ]}
          onPointerDown$={onPanelResizeStart}
        >
          <div class="absolute inset-y-0 -right-1 -left-1 z-10"></div>
          {/* Tooltip hint */}
          <div class="pointer-events-none absolute top-1/2 left-1/2 isolate z-10 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
            <div class="bg-primary text-primary-content rounded px-1 text-[10px] whitespace-nowrap">
              RESIZE
            </div>
          </div>
        </div>

        {/* Inspector / Editor Area */}
        <div
          class="border-base-300 bg-base-100 flex flex-col border-l"
          style={{
            width: `${uiState.rightPanelWidth}px`,
            minWidth: `${minCh}ch`,
          }}
        >
          <div class="border-base-300 bg-base-200 flex items-center justify-between border-b px-4 py-1">
            <div class="tabs tabs-bordered">
              <button
                class={[
                  "tab tab-sm",
                  uiState.editorMode === "yaml" && "tab-active",
                ]}
                onClick$={() => toggleEditorMode("yaml")}
              >
                YAML
              </button>
              <button
                class={[
                  "tab tab-sm",
                  uiState.editorMode === "json" && "tab-active",
                ]}
                onClick$={() => toggleEditorMode("json")}
              >
                JSON
              </button>
            </div>
            {uiState.error && (
              <div
                class="badge badge-error badge-sm max-w-[200px] gap-1 truncate"
                title={uiState.error}
              >
                <span class="text-[10px]">Error</span>
              </div>
            )}
          </div>

          <div class="flex-1 overflow-hidden">
            <MonacoEditor
              value={uiState.editorContent}
              language={uiState.editorMode}
              onChange$={onEditorChange}
              highlightId={editor.selectedNodeId}
            />
          </div>

          <div class="border-base-300 border-t p-4">
            <h3 class="mb-2 text-sm font-bold">Legend</h3>
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded border border-neutral-500/90 bg-neutral-500/30"></div>
                <span class="text-xs">Reusable</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded border border-blue-500/90 bg-blue-500/30"></div>
                <span class="text-xs">Library</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded border border-yellow-500/90 bg-yellow-500/30"></div>
                <span class="text-xs">New Biz</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 w-3 rounded border border-slate-400/90 bg-slate-400/30"></div>
                <span class="text-xs">Primitive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default component$(() => {
  return <UserInterface />;
});
