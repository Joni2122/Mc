import { StartAnimation } from './animations/startAnimation.js';
import { PixelEditor } from './editor/pixelEditor.js';
import { PreviewRenderer } from './3d/previewRenderer.js';
import { SkinManager } from './manager/skinManager.js';
import { UIManager } from './ui/uiManager.js';
import { KeyboardShortcuts } from './input/keyboardShortcuts.js';

class MinecraftPixeler {
  constructor() {
    this.startAnimation = null;
    this.pixelEditor = null;
    this.previewRenderer = null;
    this.skinManager = null;
    this.uiManager = null;
    this.keyboardShortcuts = null;
  }

  async init() {
    console.log('🎮 Initializing Minecraft Pixeler...');

    // Startanimation abspielen
    this.startAnimation = new StartAnimation();
    await this.startAnimation.play();

    // Hauptanwendung anzeigen
    document.getElementById('mainApp').classList.remove('hidden');

    // Manager initialisieren
    this.skinManager = new SkinManager();
    await this.skinManager.init();

    // Editor initialisieren
    this.pixelEditor = new PixelEditor(document.getElementById('pixelCanvas'));
    this.pixelEditor.init();

    // UI Manager
    this.uiManager = new UIManager(this.pixelEditor, this.skinManager);
    this.uiManager.init();

    // 3D Vorschau
    this.previewRenderer = new PreviewRenderer(document.getElementById('preview3d'), this.pixelEditor);
    await this.previewRenderer.init();
    this.previewRenderer.animate();

    // Tastenkürzel
    this.keyboardShortcuts = new KeyboardShortcuts(this.pixelEditor, this.skinManager);
    this.keyboardShortcuts.init();

    // Verbindungen herstellen
    this.connectModules();

    console.log('✅ Minecraft Pixeler ready!');
  }

  connectModules() {
    // Editor -> Vorschau
    this.pixelEditor.on('pixelChange', () => {
      this.previewRenderer.updateSkin(this.pixelEditor.getSkinData());
    });

    // Editor -> Speichern
    this.pixelEditor.on('pixelChange', () => {
      this.skinManager.autoSave(this.pixelEditor.getSkinData());
    });
  }
}

// App starten
window.addEventListener('DOMContentLoaded', async () => {
  const app = new MinecraftPixeler();
  await app.init();
  window.app = app;
});
