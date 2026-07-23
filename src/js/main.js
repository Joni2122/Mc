import { playStartAnimation } from './animations/startAnimation.js';
import { PixelEditor } from './editor/pixelEditor.js';
import { PreviewRenderer } from './3d/previewRenderer.js';
import { SkinManager } from './manager/skinManager.js';
import { UIManager } from './ui/uiManager.js';
import { registerShortcuts } from './input/keyboardShortcuts.js';

/**
 * App-Einstiegspunkt
 * Initialisiert alle Module und startet die App nach der Startanimation.
 */
class App {
  constructor() {
    this.skinManager = null;
    this.editor = null;
    this.preview = null;
    this.ui = null;
  }

  async init() {
    // Startanimation abspielen
    await playStartAnimation();

    // App-Container sichtbar machen
    const appEl = document.getElementById('app');
    const startScreen = document.getElementById('start-screen');
    appEl.classList.remove('hidden');
    startScreen.remove();

    // Kern-Module initialisieren
    this.skinManager = new SkinManager();
    await this.skinManager.init();

    this.editor = new PixelEditor({
      canvasId: 'skin-canvas',
      gridCanvasId: 'grid-canvas',
      skinManager: this.skinManager
    });
    this.editor.init();

    this.preview = new PreviewRenderer({
      canvasId: 'preview-canvas',
      skinManager: this.skinManager
    });
    this.preview.init();

    this.ui = new UIManager({
      editor: this.editor,
      preview: this.preview,
      skinManager: this.skinManager
    });
    this.ui.init();

    // Editor & Preview verbinden: bei jeder Änderung neu rendern
    this.skinManager.onChange(() => {
      this.editor.render();
      this.preview.updateTexture();
    });

    // Tastenkürzel registrieren
    registerShortcuts({
      editor: this.editor,
      ui: this.ui,
      skinManager: this.skinManager
    });

    // Erste Darstellung
    this.editor.render();
    this.preview.updateTexture();

    console.log('%c🎮 Minecraft Pixeler bereit!', 'color:#6abe30;font-weight:bold;');
  }
}

const app = new App();
app.init();
