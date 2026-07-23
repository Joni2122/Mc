/**
 * SkinManager
 * Verwaltet die Skin-Daten (Base- & Overlay-Layer als Offscreen-Canvases),
 * PNG-Import/-Export, LocalStorage Auto-Save und Change-Events.
 */
export class SkinManager {
  constructor() {
    this.size = 64;
    this.layers = {
      base: this._createLayerCanvas(),
      overlay: this._createLayerCanvas()
    };
    this.layerVisibility = { base: true, overlay: true };
    this.changeListeners = [];
    this.storageKey = 'minecraft-pixeler-autosave';
  }

  async init() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.importState(data);
      } catch (e) {
        console.warn('Auto-Save konnte nicht geladen werden, starte mit leerem Skin.', e);
      }
    }
  }

  _createLayerCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.size;
    canvas.height = this.size;
    return canvas;
  }

  getLayerCanvas(layer) {
    return this.layers[layer];
  }

  isLayerVisible(layer) {
    return this.layerVisibility[layer];
  }

  toggleLayerVisibility(layer) {
    this.layerVisibility[layer] = !this.layerVisibility[layer];
    this._notifyChange();
  }

  setPixel(layer, x, y, rgba) {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
    const ctx = this.layers[layer].getContext('2d');
    ctx.clearRect(x, y, 1, 1);
    ctx.fillStyle = `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a / 255})`;
    ctx.fillRect(x, y, 1, 1);
    this._notifyChange();
    this._autoSave();
  }

  getPixel(layer, x, y) {
    const ctx = this.layers[layer].getContext('2d');
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return { r: 0, g: 0, b: 0, a: 0 };
    const data = ctx.getImageData(x, y, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  }

  clearLayer(layer) {
    const ctx = this.layers[layer].getContext('2d');
    ctx.clearRect(0, 0, this.size, this.size);
    this._notifyChange();
    this._autoSave();
  }

  // Kombiniertes Bild aus Base + Overlay für die 3D-Vorschau / Export
  getFullSkinCanvas() {
    const combined = document.createElement('canvas');
    combined.width = this.size;
    combined.height = this.size;
    const ctx = combined.getContext('2d');
    ctx.drawImage(this.layers.base, 0, 0);
    if (this.layerVisibility.overlay) {
      ctx.drawImage(this.layers.overlay, 0, 0);
    }
    return combined;
  }

  // ===== Import/Export PNG =====
  async importPNG(file) {
    const bitmap = await createImageBitmap(file);
    const ctx = this.layers.base.getContext('2d');
    ctx.clearRect(0, 0, this.size, this.size);
    ctx.drawImage(bitmap, 0, 0, this.size, this.size);
    this._notifyChange();
    this._autoSave();
  }

  exportPNG() {
    const canvas = this.getFullSkinCanvas();
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  // ===== State für Undo/Redo & Auto-Save =====
  exportState() {
    return {
      base: this.layers.base.toDataURL(),
      overlay: this.layers.overlay.toDataURL(),
      visibility: { ...this.layerVisibility }
    };
  }

  importState(state) {
    return Promise.all(
      ['base', 'overlay'].map(
        (layer) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const ctx = this.layers[layer].getContext('2d');
              ctx.clearRect(0, 0, this.size, this.size);
              ctx.drawImage(img, 0, 0);
              resolve();
            };
            img.src = state[layer];
          })
      )
    ).then(() => {
      if (state.visibility) this.layerVisibility = { ...state.visibility };
      this._notifyChange();
    });
  }

  _autoSave() {
    clearTimeout(this._autoSaveTimeout);
    this._autoSaveTimeout = setTimeout(() => {
      const state = this.exportState();
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    }, 500);
  }

  // ===== Change Events =====
  onChange(callback) {
    this.changeListeners.push(callback);
  }

  _notifyChange() {
    this.changeListeners.forEach((cb) => cb());
  }
            }
