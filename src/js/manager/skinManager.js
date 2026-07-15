export class SkinManager {
  constructor() {
    this.currentSkin = null;
    this.autoSaveEnabled = true;
    this.storageKey = 'minecraft-pixeler-skin';
  }

  async init() {
    console.log('Initializing Skin Manager...');
    this.loadAutoSave();
  }

  autoSave(skinData) {
    if (!this.autoSaveEnabled) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(skinData));
      console.log('Skin auto-saved');
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  }

  loadAutoSave() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.currentSkin = JSON.parse(saved);
        console.log('Auto-save loaded');
        return this.currentSkin;
      }
    } catch (e) {
      console.error('Load auto-save failed:', e);
    }
    return null;
  }

  exportSkin(skinData, filename = 'skin') {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(skinData.base, 0, 0);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  importSkin(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve(img);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
