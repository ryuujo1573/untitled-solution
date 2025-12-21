import { ClassList, component$ } from "@builder.io/qwik";

export interface VisualSettings {
  showFlexInfo: boolean;
  showGridInfo: boolean;
}

export const FlexOverlay = component$<{
  props: any;
  settings: VisualSettings;
  class?: ClassList;
}>(({ props, settings, class: className }) => {
  if (!settings.showFlexInfo) return null;

  const isColumn = props?.direction === "column";
  const align = props?.align || "stretch";
  const justify = props?.justify || "start";

  return (
    <div
      class={[
        "pointer-events-none absolute inset-0 z-30 overflow-hidden",
        className,
      ]}
    >
      {/* Main Axis Direction Arrow */}
      <div
        class={[
          "bg-primary/90 absolute top-1 left-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold text-white shadow-lg ring-1 ring-white/20",
          isColumn ? "flex-col" : "flex-row",
        ]}
      >
        <span class="uppercase">{isColumn ? "Column" : "Row"}</span>
        <svg
          class={["h-3 w-3", isColumn ? "rotate-90" : ""]}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>

      {/* Cross Axis Alignment (Align Items) */}
      <div class="absolute inset-0 flex items-center justify-center">
        {align === "center" && (
          <div class="border-accent/50 h-px w-full border-t border-dashed">
            <span class="bg-accent absolute top-0 right-2 -translate-y-1/2 rounded px-1 text-[8px] text-white">
              align: center
            </span>
          </div>
        )}
        {align === "stretch" && (
          <div class="bg-accent/5 h-full w-full opacity-20">
            <span class="bg-accent absolute top-1/2 right-2 -translate-y-1/2 rounded px-1 text-[8px] text-white">
              align: stretch
            </span>
          </div>
        )}
      </div>

      {/* Main Axis Alignment (Justify Content) */}
      <div class="absolute inset-0 flex items-center justify-center">
        {justify === "center" && (
          <div class="border-secondary/50 h-full w-px border-l border-dashed">
            <span class="bg-secondary absolute bottom-2 left-0 -translate-x-1/2 rounded px-1 text-[8px] text-white">
              justify: center
            </span>
          </div>
        )}
      </div>

      {/* Edge Indicators */}
      <div class="border-primary/30 absolute inset-0 border">
        {align === "start" && (
          <div class="bg-accent/40 absolute top-0 h-1 w-full"></div>
        )}
        {align === "end" && (
          <div class="bg-accent/40 absolute bottom-0 h-1 w-full"></div>
        )}
        {justify === "start" && (
          <div class="bg-secondary/40 absolute left-0 h-full w-1"></div>
        )}
        {justify === "end" && (
          <div class="bg-secondary/40 absolute right-0 h-full w-1"></div>
        )}
      </div>
    </div>
  );
});

export const GridOverlay = component$<{
  props: any;
  settings: VisualSettings;
  class: ClassList;
}>(({ props, settings, class: className }) => {
  if (!settings.showGridInfo) return null;

  return (
    <div class={["pointer-events-none absolute inset-0 z-30", className]}>
      {/* Grid Lines (Chrome DevTools Style) */}
      <div
        class="h-full w-full"
        style={{
          display: "grid",
          gridTemplateColumns: props?.columns || "1fr",
          gap:
            typeof props?.gap === "number"
              ? `${props.gap * 4}px`
              : props?.gap || "0px",
        }}
      >
        {/* We can't easily know the number of children here to draw exact cells, 
            but we can draw a repeating pattern that matches the grid config */}
        <div
          class="col-span-full row-span-full h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, oklch(var(--p) / 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(var(--p) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%",
            border: "1px solid oklch(var(--p) / 0.5)",
          }}
        ></div>
      </div>

      {/* Gap Highlight */}
      {props?.gap && (
        <div
          class="absolute inset-0 opacity-20"
          style={{
            backgroundColor: "oklch(var(--s))",
            maskImage:
              "repeating-linear-gradient(45deg, black, black 10px, transparent 10px, transparent 20px)",
          }}
        ></div>
      )}

      <div class="bg-primary absolute top-0 left-0 -translate-y-full rounded-t px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
        GRID: {props?.columns}
      </div>
    </div>
  );
});
