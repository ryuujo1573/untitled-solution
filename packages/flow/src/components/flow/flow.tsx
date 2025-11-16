import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { NodeBase } from "../../model/node";

export const Flow = component$(() => {
  const nodes: Array<NodeBase> = [
    {
      id: "1",
      position: { x: 0, y: 0 },
      attr: { label: "Input" },
    },
    {
      id: "2",
      position: { x: 200, y: 200 },
      attr: { label: "Output" },
    },
  ];
  return (
    <div class="absolute top-0 left-0 h-full w-full rounded-xl border border-amber-300/30 bg-amber-200/10 select-none">
      {nodes.map((node) => {
        return (
          <div
            key={node.id}
            class="w-fit rounded-md border border-amber-300/30 bg-amber-200/20 p-4"
            style={{
              top: `${node.position.y}px`,
              left: `${node.position.x}px`,
            }}
          >
            {JSON.stringify(node.attr, null, 2)}
          </div>
        );
      })}
    </div>
  );
});
