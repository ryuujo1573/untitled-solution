import { component$ } from "@builder.io/qwik";
import {
  FlFolderSolid,
  FlFolderOpenSolid,
  FlLayersSolid,
} from "@qwikest/icons/flowbite";
import type { TreeNodeBuilderProps } from "./dnd-tree-view";

export const LayoutNodeBuilder = component$<TreeNodeBuilderProps>(
  ({ node, isSelected, isOpen, hasChildren, onToggle$ }) => {
    const label =
      node.type === "layout" ? `Layout (${node.context})` : node.name;

    const Icon =
      node.type === "layout"
        ? isOpen
          ? FlFolderOpenSolid
          : FlFolderSolid
        : FlLayersSolid;

    return (
      <div
        class={[
          "flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors group",
          isSelected ? "bg-primary text-primary-content" : "hover:bg-base-300",
        ]}
      >
        <div
          class="flex items-center justify-center w-5 h-5"
          onClick$={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              onToggle$();
            }
          }}
        >
          <Icon
            class={[
              "h-4 w-4 transition-transform",
              isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100",
              hasChildren && !isSelected && "text-primary",
            ]}
          />
        </div>
        <span class="truncate text-xs font-medium flex-1">{label}</span>
        {node.id && (
          <span
            class={[
              "text-[10px] ml-auto font-mono",
              isSelected ? "opacity-70" : "opacity-30",
            ]}
          >
            {node.id.slice(0, 4)}
          </span>
        )}
      </div>
    );
  },
);
