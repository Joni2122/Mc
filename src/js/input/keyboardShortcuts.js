/**
 * Registriert alle Tastenkürzel:
 * Ctrl+Z Rückgängig, Ctrl+Y Wiederholen,
 * B Pinsel, E Radierer, F Füllen, I Pipette, G Gitter
 */
export function registerShortcuts({ editor, ui, skinManager }) {
  const toolKeyMap = {
    b: 'brush',
    e: 'eraser',
    f: 'bucket',
    i: 'eyedropper'
  };

  document.addEventListener('keydown', (e) => {
    // Nicht auslösen, wenn der Fokus in einem Eingabefeld liegt
    const activeTag = document.activeElement?.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

    const key = e.key.toLowerCase();

    // Ctrl/Cmd-Kombinationen
    if (e.ctrlKey || e.metaKey) {
      if (key === 'z') {
        e.preventDefault();
        editor.undo();
        return;
      }
      if (key === 'y') {
        e.preventDefault();
        editor.redo();
        return;
      }
      if (key === 'c') {
        e.preventDefault();
        editor.copySelection();
        return;
      }
      if (key === 'v') {
        e.preventDefault();
        if (editor.clipboard && editor.selection) {
          editor.pasteAt(editor.selection.x0, editor.selection.y0);
        }
        return;
      }
    }

    // Werkzeug-Kürzel
    if (toolKeyMap[key]) {
      e.preventDefault();
      editor.setTool(toolKeyMap[key]);
      document.querySelectorAll('.tool[data-tool]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tool === toolKeyMap[key]);
      });
      return;
    }

    // Gitter umschalten
    if (key === 'g') {
      e.preventDefault();
      editor.toggleGrid();
    }
  });
}
