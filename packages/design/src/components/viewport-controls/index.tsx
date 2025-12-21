import { component$, $ } from "@builder.io/qwik";

export interface ViewportState {
  width: number;
  height: number;
  zoom: number;
  isResizing: boolean;
}

export const ViewportControls = component$<{ viewport: ViewportState }>(
  ({ viewport }) => {
    const devices = [
      { name: "Mobile", width: 375, height: 667 },
      { name: "Tablet", width: 768, height: 1024 },
      { name: "Laptop", width: 1366, height: 768 },
      { name: "Desktop", width: 1920, height: 1080 },
    ];

    const zoomPresets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

    const updateZoom = $((val: number) => {
      viewport.zoom = Math.max(0.1, Math.min(3, val));
    });

    return (
      <>
        {/* Device Selector */}
        <div class="flex flex-none items-center gap-2">
          <span class="text-xs font-bold text-neutral-500 uppercase">
            Viewport
          </span>
          <div class="join">
            {devices.map((d) => (
              <button
                key={d.name}
                class={[
                  "btn join-item btn-xs",
                  viewport.width === d.width ? "btn-primary" : "btn-ghost",
                ]}
                onClick$={() => {
                  viewport.width = d.width;
                  viewport.height = d.height;
                }}
              >
                {d.name}
              </button>
            ))}
          </div>
          <div class="ml-2 flex items-center gap-1">
            <input
              type="number"
              value={Math.round(viewport.width)}
              onInput$={(e) =>
                (viewport.width = parseInt(
                  (e.target as HTMLInputElement).value,
                ))
              }
              class="input input-xs w-16 text-center font-mono"
            />
            <span class="text-xs opacity-50">×</span>
            <input
              type="number"
              value={Math.round(viewport.height)}
              onInput$={(e) =>
                (viewport.height = parseInt(
                  (e.target as HTMLInputElement).value,
                ))
              }
              class="input input-xs w-16 text-center font-mono"
            />
          </div>
        </div>

        <div class="divider divider-horizontal mx-0 flex-none"></div>

        {/* Zoom Control */}
        <div class="flex flex-none items-center gap-2">
          <span class="text-xs font-bold text-neutral-500 uppercase">Zoom</span>
          <div class="join">
            <label class="input join-item input-xs w-20">
              <input
                type="text"
                value={Math.round(viewport.zoom * 100).toString()}
                onKeyDown$={(e, el) => {
                  if (e.key === "Enter") {
                    const val = parseInt(el.value);
                    if (!isNaN(val)) updateZoom(val / 100);
                    el.blur();
                  }
                }}
                onBlur$={(_, el) => {
                  const val = parseInt(el.value);
                  if (!isNaN(val)) updateZoom(val / 100);
                }}
                class="text-center font-mono"
              />
              <span class="label p-1">%</span>
            </label>
            <select
              class="select join-item select-xs w-8 px-0"
              onChange$={(e) => {
                const val = parseFloat((e.target as HTMLSelectElement).value);
                if (!isNaN(val)) updateZoom(val);
                (e.target as HTMLSelectElement).value = "";
              }}
            >
              <option value="" disabled selected hidden></option>
              {zoomPresets.map((p) => (
                <option key={p} value={p}>
                  {`${p * 100}%`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </>
    );
  },
);
