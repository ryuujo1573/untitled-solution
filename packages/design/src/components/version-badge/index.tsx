import { component$, useStore, $ } from "@builder.io/qwik";
import { getVersionInfo } from "~/utils/version";
import { FlCopySolid } from "@qwikest/icons/flowbite";

export const VersionBadge = component$(() => {
  const versionInfo = getVersionInfo();
  const state = useStore({
    copied: false,
  });

  const copyHash = $(async () => {
    await navigator.clipboard.writeText(versionInfo.gitHash!);
    state.copied = true;
    setTimeout(() => {
      state.copied = false;
    }, 2000);
  });

  return (
    <div
      class={[
        "tooltip tooltip-bottom group flex cursor-default items-center gap-1",
      ]}
      data-tip={
        state.copied
          ? "Copied!"
          : `${new Date(versionInfo.buildTime).toLocaleString()}${versionInfo.isDirty ? " (modified)" : ""}`
      }
    >
      <div class="badge badge-primary badge-outline indicator relative h-6 min-w-20 flex-none overflow-hidden font-mono transition-all duration-200">
        <span
          class={[
            "flex items-center transition-all duration-200 group-hover:-translate-y-full",
          ]}
        >
          v{versionInfo.version}
          {versionInfo.isDirty && (
            <span class="indicator-item badge badge-error badge-xs top-1 right-1 h-1.5 w-1.5 p-0"></span>
          )}
          {versionInfo.isDev && (
            <div class="flex w-[4ch] flex-none items-center justify-center overflow-hidden ps-1">
              <div class="badge badge-warning badge-xs scale-80 font-bold tracking-tighter uppercase">
                dev
              </div>
            </div>
          )}
        </span>
        <button
          class={[
            "btn btn-ghost btn-xs absolute flex w-fit translate-y-full opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100",
          ]}
          title="Click to copy"
          onClick$={copyHash}
          aria-label="Copy Git Hash"
        >
          <FlCopySolid class="h-3 w-3" />
          {versionInfo.gitHash}
        </button>
      </div>
    </div>
  );
});
