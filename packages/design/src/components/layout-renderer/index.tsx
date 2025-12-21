import { component$, type PropFunction, $ } from "@builder.io/qwik";
import type { ComponentCategory } from "@cnmjs/schema";
import { FlexOverlay, GridOverlay, type VisualSettings } from "./overlays";

export interface RendererConfig {
  colors: Record<ComponentCategory, { border: string; bg: string }>;
}

export const DEFAULT_CONFIG: RendererConfig = {
  colors: {
    reusable: { border: "border-neutral-500/90", bg: "bg-neutral-500/30" },
    library: { border: "border-blue-500/90", bg: "bg-blue-500/30" },
    new: { border: "border-yellow-500/90", bg: "bg-yellow-500/30" },
    primitive: { border: "border-slate-400/90", bg: "bg-slate-400/30" },
  },
};

export const ComponentNode = component$<{
  node: any;
  colors: any;
  isSelected: boolean;
  onClick$: PropFunction<(e: MouseEvent) => void>;
}>(({ node, colors, isSelected, onClick$ }) => {
  const category = node.category as ComponentCategory;
  const color = colors[category];
  return (
    <div
      id={node.id}
      onClick$={onClick$}
      class={[
        "relative flex min-h-10 cursor-pointer items-center justify-center rounded border-2 p-2 transition-all hover:z-10 hover:scale-[1.01]",
        isSelected ? "ring-primary z-20 ring-4 ring-offset-2" : "",
        color.border,
        color.bg,
      ]}
      title={`${node.name} (${node.category})`}
    >
      <span class="text-xs font-medium opacity-80">{node.name}</span>
      <div class="absolute top-0 left-0 -translate-y-full rounded-t bg-black/50 px-1 text-[10px] text-white opacity-0 transition-opacity hover:opacity-100">
        {node.id}
      </div>
    </div>
  );
});

export const LayoutNodeRenderer = component$<{
  node: any;
  config?: RendererConfig;
  selectedId?: string | null;
  onSelect$?: PropFunction<(id: string) => void>;
  visualSettings?: VisualSettings;
}>(
  ({
    node,
    config = DEFAULT_CONFIG,
    selectedId,
    onSelect$,
    visualSettings = { showFlexInfo: false, showGridInfo: false },
  }) => {
    const { colors } = config;
    const isSelected = selectedId === node.id;

    const handleClick = $((e: MouseEvent) => {
      e.stopPropagation();
      if (onSelect$) {
        onSelect$(node.id);
      }
    });

    if (node.type === "component") {
      return (
        <ComponentNode
          node={node}
          colors={colors}
          isSelected={isSelected}
          onClick$={handleClick}
        />
      );
    }

    // Layout rendering
    const isFlex = node.context === "flex";
    const isGrid = node.context === "grid";
    const isScroll = node.context === "scroll";

    const layoutClasses = [
      "relative min-h-[50px] rounded border border-dashed border-base-content/20 p-4 transition-all cursor-pointer",
      isSelected ? "ring-4 ring-primary ring-offset-2 z-20" : "",
      isFlex && "flex",
      isFlex && node.props?.direction === "column" ? "flex-col" : "flex-row",
      isGrid && "grid",
      isScroll && "scroll-pattern overflow-auto",
    ];

    const style: any = {};
    if (isFlex) {
      if (node.props?.gap)
        style.gap =
          typeof node.props.gap === "number"
            ? `${node.props.gap * 4}px`
            : node.props.gap;
      if (node.props?.align) style.alignItems = node.props.align;
      if (node.props?.justify) style.justifyContent = node.props.justify;
    }
    if (isGrid) {
      if (node.props?.columns) style.gridTemplateColumns = node.props.columns;
      if (node.props?.gap)
        style.gap =
          typeof node.props.gap === "number"
            ? `${node.props.gap * 4}px`
            : node.props.gap;
    }
    if (node.props?.flex) style.flex = node.props.flex;
    if (node.props?.width) style.width = node.props.width;
    if (node.props?.height) style.height = node.props.height;
    if (node.props?.padding) style.padding = node.props.padding;

    return (
      <div
        id={node.id}
        onClick$={handleClick}
        class={layoutClasses}
        style={style}
      >
        {/* Overlays */}
        <FlexOverlay
          class={["invisible", isFlex && ["visible"]]}
          props={node.props}
          settings={visualSettings}
        />
        <GridOverlay
          class={["invisible", isFlex && ["visible"]]}
          props={node.props}
          settings={visualSettings}
        />

        {/* Context Label */}
        <div class="bg-base-300 text-base-content/50 absolute top-0 right-0 z-40 rounded-bl px-1 text-[10px] font-bold uppercase">
          {node.context}
        </div>

        {node.children?.map((child: any) => (
          <LayoutNodeRenderer
            key={child.id}
            node={child}
            config={config}
            selectedId={selectedId}
            onSelect$={onSelect$}
            visualSettings={visualSettings}
          />
        ))}
      </div>
    );
  },
);
