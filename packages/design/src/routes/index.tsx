import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import YAML from "yaml";

import { MonacoEditor } from "~/components/monaco-editor";
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

  // Load from localStorage on mount
  // eslint-disable-next-line qwik/no-use-visible-task
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
              <div class="border-base-300 h-96 overflow-hidden rounded-lg border">
                <MonacoEditor
                  value={YAML.stringify({ entities: entities.value })}
                  language="yaml"
                  onChange$={$((newValue) => {
                    try {
                      const parsed = YAML.parse(newValue) as EntitiesYaml;
                      if (parsed && parsed.entities) {
                        saveEntities(parsed.entities);
                      }
                    } catch {
                      // Ignore parse errors while typing
                    }
                  })}
                />
              </div>
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
                          <span class="badge badge-primary badge-sm">ID</span>
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
