import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import YAML, { type YAMLSeq, type YAMLMap, type Node, type Scalar } from "yaml";

import entitiesData from "~/data/entities.yaml" with { type: "yaml" };

interface Entity {
  name: string;
  id: string;
  properties: Property[];
}

interface Property {
  name: string;
  type: PropertyType;
  valueExample: string;
  isIdentifier?: boolean;
}

interface EntitiesYaml {
  entities: Entity[];
}

type PropertyType =
  | "string"
  | "number"
  | "boolean"
  | "bigint"
  | "object"
  | "undefined"
  | "null";

interface Property {
  name: string;
  valueExample: string;
  type: PropertyType;
  isIdentifier?: boolean;
}

interface Entity {
  id: string;
  name: string;
  properties: Property[];
}

interface EntitiesYaml {
  entities: Entity[];
}

const STORAGE_KEY = "entities-yaml-data";

const defaultEntities = entitiesData.entities;

export default component$(() => {
  const entities = useSignal<Entity[]>(defaultEntities);
  const selectedEntity = useSignal<Entity | null>(null);
  const viewMode = useSignal<"list" | "code">("list");
  const editorRef = useSignal<HTMLDivElement>();

  // Load from localStorage on mount
  useVisibleTask$(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = YAML.parse(saved) as EntitiesYaml;
        entities.value = parsed.entities;
        selectedEntity.value = parsed.entities[0] || null;
      } catch (e) {
        console.error("Failed to parse saved YAML:", e);
        entities.value = defaultEntities;
        selectedEntity.value = defaultEntities[0] || null;
      }
    } else {
      entities.value = defaultEntities;
      selectedEntity.value = defaultEntities[0] || null;
    }
  });

  // Save entities to localStorage as YAML
  const saveEntities = $((newEntities: Entity[]) => {
    const yamlStr = YAML.stringify({ entities: newEntities });
    localStorage.setItem(STORAGE_KEY, yamlStr);
    entities.value = newEntities;
  });

  // Initialize Monaco Editor
  useVisibleTask$(({ track, cleanup }) => {
    track(() => viewMode.value);
    track(() => entities.value);

    if (viewMode.value === "code" && editorRef.value) {
      import("monaco-editor").then((monaco) => {
        const container = editorRef.value!;
        container.innerHTML = "";

        const yamlContent = YAML.stringify({ entities: entities.value });

        // Configure YAML language features
        monaco.languages.register({ id: "yaml" });

        // Add CSS for the highlight class
        const style = document.createElement("style");
        style.innerHTML = `
          .entity-definition-line {
            background-color: oklch(var(--p) / 0.15);
            border-left: 3px solid oklch(var(--p));
          }
        `;
        document.head.appendChild(style);

        const editor = monaco.editor.create(container, {
          value: yamlContent,
          language: "yaml",
          theme: "vs-dark",
          minimap: { enabled: false },
          automaticLayout: true,
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          insertSpaces: true,
          bracketPairColorization: { enabled: true },
          folding: true,
          foldingStrategy: "indentation",
        });

        let decorations: any[] = [];

        const updateDecorations = () => {
          const model = editor.getModel();
          if (!model) return;

          const text = model.getValue();
          const doc = YAML.parseDocument(text);
          const newDecorations: any[] = [];

          // Traverse CST to find entity definitions
          const entitiesNode = doc.get<typeof YAMLSeq<Entity>>("entities");
          if (entitiesNode && entitiesNode.items) {
            entitiesNode.items.forEach((item) => {
              // Get the range of the item
              // item.range is [start, end, end]
              if (item && item.range) {
                const startPos = item.range[0];
                // Convert index to line number
                // YAML document has linePos(index) -> { line, col } (1-based line, 1-based col)
                // Note: 'yaml' package linePos returns 1-based line numbers
                const linePos = doc.linePos(startPos);

                if (linePos) {
                  newDecorations.push({
                    range: new monaco.Range(linePos.line, 1, linePos.line, 1),
                    options: {
                      isWholeLine: true,
                      className: "entity-definition-line",
                      glyphMarginClassName: "text-primary",
                    },
                  });
                }
              }
            });
          }

          decorations = editor.deltaDecorations(decorations, newDecorations);
        };

        // Initial highlight
        updateDecorations();

        editor.onDidChangeModelContent(() => {
          try {
            const parsed = YAML.parse(editor.getValue()) as EntitiesYaml;
            saveEntities(parsed.entities);
            // Clear error decorations on successful parse
            // And update entity highlights
            updateDecorations();
          } catch (e) {
            console.error("Invalid YAML:", e);
          }
        });

        cleanup(() => {
          editor.dispose();
          style.remove();
        });
      });
    }
  });

  return (
    <main class="bg-base-300 container mx-auto min-h-screen p-2">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div class="card bg-base-100 border-primary border-2 shadow-2xl">
          <div class="card-body">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="card-title text-primary">Entities</h2>
              <div class="tabs tabs-box tabs-sm">
                <button
                  class={`tab ${viewMode.value === "list" ? "tab-active" : ""}`}
                  onClick$={() => {
                    viewMode.value = "list";
                  }}
                  title="List View"
                >
                  📋
                </button>
                <button
                  class={`tab ${viewMode.value === "code" ? "tab-active" : ""}`}
                  onClick$={() => {
                    viewMode.value = "code";
                  }}
                  title="Code View"
                >
                  💻
                </button>
              </div>
            </div>

            {viewMode.value === "list" ? (
              <ul class="menu bg-base-200 rounded-box w-full">
                {entities.value.map((entity) => (
                  <li key={entity.id} class="w-full">
                    <button
                      class={
                        selectedEntity.value?.id === entity.id
                          ? "active bg-primary text-primary-content"
                          : ""
                      }
                      onClick$={() => {
                        selectedEntity.value = entity;
                      }}
                    >
                      {entity.name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div class="h-96" ref={editorRef}></div>
            )}
          </div>
        </div>

        <div class="card bg-base-100 border-secondary border-2 shadow-2xl">
          <div class="card-body">
            <h2 class="card-title text-secondary">
              {selectedEntity.value?.name || "Select an Entity"}
            </h2>

            {selectedEntity.value ? (
              <div class="space-y-3">
                <p class="text-base-content text-sm opacity-70">Properties:</p>
                <div class="list">
                  {selectedEntity.value.properties.map((prop) => (
                    <div
                      key={prop.name}
                      class="list-row bg-base-200 rounded-lg p-3"
                    >
                      <div class="flex items-center gap-2">
                        <span class="font-semibold">{prop.name}</span>
                        {prop.isIdentifier && (
                          <span class="badge badge-primary badge-sm">
                            Identifier
                          </span>
                        )}
                      </div>
                      <div class="list-col-wrap"></div>
                      <div class="text-sm">
                        <span class="badge badge-ghost">{prop.type}</span>
                      </div>
                      <div class="list-col-wrap"></div>
                      <div class="text-base-content text-sm opacity-60">
                        <code class="bg-base-300 rounded px-2 py-1">
                          {prop.valueExample}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p class="text-base-content opacity-60">
                Click on an entity from the list to view its properties.
              </p>
            )}
          </div>
        </div>

        <div class="card bg-base-100 border-accent border-2 shadow-2xl">
          <div class="card-body">
            <h2 class="card-title text-accent">Panel 3</h2>
            <p class="text-base-content">
              This is the third panel content with responsive design.
            </p>
            <div class="card-actions justify-end">
              <button class="btn btn-accent">Learn More</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
