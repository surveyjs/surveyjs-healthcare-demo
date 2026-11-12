import * as monaco from 'monaco-editor/editor/editor.main';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker?worker';

declare global {
  interface Window {
    monaco?: typeof monaco;
    MonacoEnvironment?: monaco.Environment;
  }
}

export function installMonaco(): void {
  if (window.monaco) return;
  window.MonacoEnvironment = {
    getWorker: (_, label) => (label === 'json' ? new JsonWorker() : new EditorWorker()),
  };
  window.monaco = monaco;
}

export function applyMonacoTheme(mode: 'light' | 'dark'): void {
  monaco.editor.setTheme(mode === 'dark' ? 'vs-dark' : 'vs');
}
