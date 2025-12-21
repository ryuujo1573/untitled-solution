import {
  component$,
  useVisibleTask$,
  useSignal,
  useStore,
  noSerialize,
  type NoSerialize,
} from "@builder.io/qwik";
import * as monaco from "monaco-editor";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";

export interface MonacoEditorProps {
  value: string;
  readonly language: "json" | "yaml";
  onChange$?: (value: string) => void;
  highlightId?: string | null;
}

export const MonacoEditor = component$<MonacoEditorProps>(
  ({ onChange$, value, language, highlightId }) => {
    const containerRef = useSignal<HTMLElement>();
    const editorRef =
      useSignal<NoSerialize<monaco.editor.IStandaloneCodeEditor>>();

    const status = useStore({
      ln: 1,
      col: 1,
      path: ["root"] as string[],
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ cleanup }) => {
      // Configure Monaco Environment for Web Workers
      (window as any).MonacoEnvironment = {
        getWorker(_: any, label: string) {
          if (label === "json") {
            return new jsonWorker();
          }
          return new editorWorker();
        },
      };

      if (containerRef.value) {
        const editor = monaco.editor.create(containerRef.value, {
          value,
          language,
          theme: "vs-dark",
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 12,
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          roundedSelection: false,
          readOnly: false,
          cursorStyle: "line",
          stickyScroll: {
            enabled: true,
            maxLineCount: 5,
          },
        });

        editorRef.value = noSerialize(editor);

        const disposableContent = editor.onDidChangeModelContent(() => {
          // eslint-disable-next-line qwik/valid-lexical-scope
          onChange$?.(editor.getValue());
        });

        const disposableCursor = editor.onDidChangeCursorPosition((e) => {
          status.ln = e.position.lineNumber;
          status.col = e.position.column;

          const model = editor.getModel();
          if (!model) return;

          const path: string[] = [];
          const currentLine = e.position.lineNumber;

          if (language === "yaml") {
            let lastIndent = model.getLineFirstNonWhitespaceColumn(currentLine);
            if (lastIndent === 0) lastIndent = 1000;

            for (let i = currentLine; i >= 1; i--) {
              const indent = model.getLineFirstNonWhitespaceColumn(i);
              const content = model.getLineContent(i);

              if (indent > 0 && indent < lastIndent) {
                // Check for array item first
                const arrayMatch = content.match(/^(\s*)-\s+/);
                if (arrayMatch) {
                  const currentIndent = arrayMatch[1].length + 1;
                  if (currentIndent < lastIndent) {
                    let index = 0;
                    for (let j = i - 1; j >= 1; j--) {
                      const prevIndent =
                        model.getLineFirstNonWhitespaceColumn(j);
                      if (prevIndent < currentIndent) break;
                      if (
                        prevIndent === currentIndent &&
                        model.getLineContent(j).match(/^\s*-\s+/)
                      ) {
                        index++;
                      }
                    }
                    path.unshift(`[${index}]`);
                    lastIndent = currentIndent;
                  }
                }

                // Check for key
                const keyMatch = content.match(/^\s*([\w-]+):/);
                if (keyMatch) {
                  const currentIndent =
                    model.getLineFirstNonWhitespaceColumn(i);
                  if (currentIndent < lastIndent) {
                    path.unshift(keyMatch[1]);
                    lastIndent = currentIndent;
                  }
                }
              }
            }
          } else {
            // JSON path heuristic
            let depth = 0;
            let arrayDepth = 0;
            for (let i = currentLine; i >= 1; i--) {
              const content = model.getLineContent(i);
              const opens = (content.match(/{/g) || []).length;
              const closes = (content.match(/}/g) || []).length;
              const aOpens = (content.match(/\[/g) || []).length;
              const aCloses = (content.match(/\]/g) || []).length;

              depth += closes - opens;
              arrayDepth += aCloses - aOpens;

              if (depth < 0) {
                const match = content.match(/"([\w-]+)"\s*:/);
                if (match) {
                  path.unshift(match[1]);
                  depth = 0;
                }
              }

              if (arrayDepth < 0) {
                // Estimate index by counting commas at the same level
                let index = 0;
                let bracketDepth = 0;
                for (let j = i; j >= 1; j--) {
                  const line = model.getLineContent(j);
                  if (line.includes("]")) bracketDepth++;
                  if (line.includes("[")) {
                    bracketDepth--;
                    if (bracketDepth < 0) break;
                  }
                  if (bracketDepth === 0 && line.includes(",")) index++;
                }
                path.unshift(`[${index}]`);
                arrayDepth = 0;
              }
            }
          }
          status.path = path;
        });

        cleanup(() => {
          disposableContent.dispose();
          disposableCursor.dispose();
          editor.dispose();
        });
      }
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(({ track }) => {
      track(() => value);
      track(() => language);
      track(() => highlightId);

      if (editorRef.value) {
        if (editorRef.value.getValue() !== value) {
          editorRef.value.setValue(value);
        }
        const model = editorRef.value.getModel();
        if (model && model.getLanguageId() !== language) {
          monaco.editor.setModelLanguage(model, language);
        }
      }
      if (editorRef.value && highlightId) {
        const model = editorRef.value.getModel();
        if (model) {
          const searchText =
            language === "yaml"
              ? `id: ${highlightId}`
              : `"id": "${highlightId}"`;

          const matches = model.findMatches(
            searchText,
            false,
            false,
            false,
            null,
            true,
          );

          if (matches.length > 0) {
            const range = matches[0].range;
            editorRef.value.revealRangeInCenter(range);
            editorRef.value.setSelection(range);
          }
        }
      }
    });

    return (
      <div class="flex h-full w-full flex-col">
        {/* Breadcrumbs (JSONPath style) */}
        <div class="bg-base-200 border-base-300 flex items-center border-b px-4 py-1 font-mono text-[10px] select-none">
          <span class="text-primary font-bold">$</span>
          {status.path.map((segment, i) => (
            <span key={i} class="flex items-center">
              {!segment.startsWith("[") && <span class="opacity-40">.</span>}
              <span class="hover:text-primary cursor-default opacity-70 transition-opacity hover:opacity-100">
                {segment}
              </span>
            </span>
          ))}
        </div>

        <div ref={containerRef} class="flex-1" />
        <div class="flex items-center justify-end bg-[#007acc] px-4 py-0.5 text-[11px] font-medium text-white select-none">
          <div class="flex items-center gap-4">
            <span>{language.toUpperCase()}</span>
            <div class="flex items-center gap-1">
              <span>Ln {status.ln},</span>
              <span>Col {status.col}</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
