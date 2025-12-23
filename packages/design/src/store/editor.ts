import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LayoutIR, LayoutNode } from "@cnmjs/schema";

export interface EditorState {
  present: LayoutIR;
  past: LayoutIR[];
  future: LayoutIR[];
  selectedNodeId: string | null;
}

const MAX_HISTORY = 50;

const findAndRemoveNode = (
  root: LayoutNode,
  id: string,
): { node: LayoutNode; parent: LayoutNode | null; index: number } | null => {
  if (root.id === id) return { node: root, parent: null, index: -1 };

  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      if (child.id === id) {
        root.children.splice(i, 1);
        return { node: child, parent: root, index: i };
      }
      const found = findAndRemoveNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

const findNodeById = (root: LayoutNode, id: string): LayoutNode | null => {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};

export const editorSlice = createSlice({
  name: "editor",
  initialState: null as unknown as EditorState,
  reducers: {
    init(state, action: PayloadAction<LayoutIR>) {
      return {
        present: action.payload,
        past: [],
        future: [],
        selectedNodeId: null,
      };
    },
    selectNode(state, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload;
    },
    moveNode(
      state,
      action: PayloadAction<{
        sourceId: string;
        targetId: string;
        position: "before" | "after" | "inside";
      }>,
    ) {
      const { sourceId, targetId, position } = action.payload;
      if (sourceId === targetId) return;

      // Save to history
      state.past.push(JSON.parse(JSON.stringify(state.present)));
      if (state.past.length > MAX_HISTORY) state.past.shift();
      state.future = [];

      const root = state.present.root;
      const sourceResult = findAndRemoveNode(root, sourceId);
      if (!sourceResult) return;

      const targetNode = findNodeById(root, targetId);
      if (!targetNode) {
        // Rollback if target not found (shouldn't happen)
        state.present = state.past.pop()!;
        return;
      }

      if (position === "inside") {
        if (!targetNode.children) targetNode.children = [];
        targetNode.children.push(sourceResult.node);
      } else {
        // Find parent of target
        const findParent = (
          current: LayoutNode,
          id: string,
        ): { parent: LayoutNode; index: number } | null => {
          if (current.children) {
            for (let i = 0; i < current.children.length; i++) {
              if (current.children[i].id === id)
                return { parent: current, index: i };
              const found = findParent(current.children[i], id);
              if (found) return found;
            }
          }
          return null;
        };

        const targetParentResult = findParent(root, targetId);
        if (targetParentResult) {
          const insertIndex =
            position === "before"
              ? targetParentResult.index
              : targetParentResult.index + 1;
          targetParentResult.parent.children!.splice(
            insertIndex,
            0,
            sourceResult.node,
          );
        }
      }
    },
    undo(state) {
      if (state.past.length === 0) return;
      const previous = state.past.pop()!;
      state.future.unshift(JSON.parse(JSON.stringify(state.present)));
      state.present = previous;
    },
    redo(state) {
      if (state.future.length === 0) return;
      const next = state.future.shift()!;
      state.past.push(JSON.parse(JSON.stringify(state.present)));
      state.present = next;
    },
    updateIR(state, action: PayloadAction<LayoutIR>) {
      state.past.push(JSON.parse(JSON.stringify(state.present)));
      if (state.past.length > MAX_HISTORY) state.past.shift();
      state.future = [];
      state.present = action.payload;
    },
  },
});

export const { init, selectNode, moveNode, undo, redo, updateIR } =
  editorSlice.actions;
