import { component$, type PropFunction, $ } from "@builder.io/qwik";
import type { LayoutNode } from "@cnmjs/schema";
import { FlFolderSolid, FlLayersSolid } from "@qwikest/icons/flowbite";

export interface TreeViewProps {
  node: LayoutNode;
  selectedId?: string | null;
  onSelect$?: PropFunction<(id: string) => void>;
  depth?: number;
}

export const TreeItem = component$<TreeViewProps>(
  ({ node, selectedId, onSelect$, depth = 0 }) => {
    const isSelected = selectedId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    const handleClick = $((e: MouseEvent) => {
      e.stopPropagation();
      if (onSelect$) {
        onSelect$(node.id);
      }
    });

    const label =
      node.type === "layout" ? `Layout (${node.context})` : node.name;
    const Icon = node.type === "layout" ? FlFolderSolid : FlLayersSolid;

    if (!hasChildren) {
      return (
        <li>
          <button
            class={["flex items-center gap-2 py-1", isSelected && "menu-active"]}
            onClick$={handleClick}
          >
            <Icon class="h-4 w-4 opacity-70" />
            <span class="truncate text-xs">{label}</span>
          </button>
        </li>
      );
    }

    return (
      <li>
        <details open={depth < 2}>
          <summary
            class={["flex items-center gap-2 py-1", isSelected && "menu-active"]}
            onClick$={handleClick}
          >
            <Icon class="h-4 w-4 opacity-70" />
            <span class="truncate text-xs">{label}</span>
          </summary>
          <ul>
            {node.children?.map((child) => (
              <TreeItem
                key={child.id}
                node={child}
                selectedId={selectedId}
                onSelect$={onSelect$}
                depth={depth + 1}
              />
            ))}
          </ul>
        </details>
      </li>
    );
  },
);

export const TreeView = component$<{
  root: LayoutNode;
  selectedId?: string | null;
  onSelect$?: PropFunction<(id: string) => void>;
}>(({ root, selectedId, onSelect$ }) => {
  return (
    <div class="w-full overflow-auto">
      <ul class="menu menu-xs w-full p-0">
        <TreeItem node={root} selectedId={selectedId} onSelect$={onSelect$} />
      </ul>
    </div>
  );
});
