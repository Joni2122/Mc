export class KeyboardShortcuts {
  constructor(editor, skinManager) {
    this.editor = editor;
    this.skinManager = skinManager;
  }

  init() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    // Ctrl+Z - Rückgängig
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.editor.undo();
    }

    // Ctrl+Y - Wiederholen
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      this.editor.redo();
    }

    // B - Pinsel
    if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
      this.editor.setTool('brush');
    }

    // E - Radierer
    if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
      this.editor.setTool('eraser');
    }

    // F - Füllen
    if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
      this.editor.setTool('bucket');
    }

    // I - Pipette
    if (e.key === 'i' && !e.ctrlKey && !e.metaKey) {
      this.editor.setTool('pipette');
    }

    // G - Gitter
    if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.editor.toggleGrid();
    }
  }
}
