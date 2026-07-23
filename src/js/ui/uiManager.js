/**
 * UIManager
 * Verbindet alle DOM-Elemente (Toolbar, Farb-Panel, Topbar, Layer-Tabs, Zoom)
 * mit dem Editor, der 3D-Vorschau und dem SkinManager.
 */
export class UIManager {
  constructor({ editor, preview, skinManager }) {
    this.editor = editor;
    this.preview = preview;
    this.skinManager = skinManager;

    this.mcPalette = [
      '#FFFFFF', '#C6C6C6', '#8B8B8B', '#000000',
      '#F9BAB2', '#E48C7E', '#B37166', '#7D4B3A',
      '#FFE93D', '#FFAA00', '#D87F33', '#7C5A3A',
      '#3AB3DA', '#3366CC', '#1A237E', '#4A2A7A',
      '#6ABE30', '#4A9E20', '#2D6A1E', '#1B3A0F',
      '#FF5555', '#AA0000', '#550000', '#2B0000'
    ];
    this.recentColors = [];
  }

  init() {
    this._bindToolbar();
    this._bindTopbar();
    this._bindLayerTabs();
    this._bindZoom();
    this._bindColorPanel();
    this._bindPreviewControls();
    this._bindDragAndDrop();
    this._renderPalette();
  }

  // ===== Werkzeugleiste =====
  _bindToolbar() {
    document.querySelectorAll('.tool[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool[data-tool]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.editor.setTool(btn.dataset.tool);

        if (btn.dataset.tool === 'copy' && this.editor.selection) {
          this.editor.copySelection();
        }
      });
    });

    document.getElementById('btn-grid').addEventListener('click', () => {
      this.editor.toggleGrid();
    });
  }

  // ===== Topbar =====
  _bindTopbar() {
    const fileInput = document.getElementById('file-input');

    document.getElementById('btn-import').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) await this.skinManager.importPNG(file);
      fileInput.value = '';
    });

    document.getElementById('btn-export').addEventListener('click', async () => {
      const blob = await this.skinManager.exportPNG();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'minecraft-skin.png';
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('btn-undo').addEventListener('click', () => this.editor.undo());
    document.getElementById('btn-redo').addEventListener('click', () => this.editor.redo());
  }

  // ===== Layer-Tabs =====
  _bindLayerTabs() {
    document.querySelectorAll('.layer-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.layer-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.editor.setLayer(tab.dataset.layer);
      });
    });

    document.getElementById('btn-toggle-layer').addEventListener('click', () => {
      this.skinManager.toggleLayerVisibility(this.editor.currentLayer);
    });
  }

  // ===== Zoom =====
  _bindZoom() {
    document.getElementById('zoom-in').addEventListener('click', () => {
      this.editor.setZoom(this.editor.zoom + 2);
    });
    document.getElementById('zoom-out').addEventListener('click', () => {
      this.editor.setZoom(this.editor.zoom - 2);
    });
    this.editor.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.editor.setZoom(this.editor.zoom + (e.deltaY < 0 ? 1 : -1));
    }, { passive: false });
  }

  // ===== Farb-Panel =====
  _bindColorPanel() {
    const wheel = document.getElementById('color-wheel');
    const wctx = wheel.getContext('2d');
    this._drawColorWheel(wctx, wheel.width, wheel.height);

    wheel.addEventListener('click', (e) => this._pickFromWheel(e, wheel));

    const hexInput = document.getElementById('hex-input');
    const rInput = document.getElementById('r-input');
    const gInput = document.getElementById('g-input');
    const bInput = document.getElementById('b-input');
    const alphaInput = document.getElementById('alpha-input');

    const applyFromRGB = () => {
      const color = {
        r: parseInt(rInput.value, 10) || 0,
        g: parseInt(gInput.value, 10) || 0,
        b: parseInt(bInput.value, 10) || 0,
        a: parseInt(alphaInput.value, 10)
      };
      hexInput.value = this._rgbToHex(color);
      this.editor.setColor(color);
    };

    [rInput, gInput, bInput, alphaInput].forEach((input) => {
      input.addEventListener('input', applyFromRGB);
    });

    hexInput.addEventListener('change', () => {
      const color = this._hexToRgb(hexInput.value);
      if (!color) return;
      rInput.value = color.r;
      gInput.value = color.g;
      bInput.value = color.b;
      color.a = parseInt(alphaInput.value, 10);
      this.editor.setColor(color);
    });

    document.addEventListener('color-picked', (e) => {
      const color = e.detail;
      rInput.value = color.r;
      gInput.value = color.g;
      bInput.value = color.b;
      alphaInput.value = color.a;
      hexInput.value = this._rgbToHex(color);
      this.editor.setColor(color);
      this._addRecentColor(color);
    });
  }

  _drawColorWheel(ctx, w, h) {
    const radius = w / 2;
    const image = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - radius, dy = y - radius;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * w + x) * 4;
        if (dist <= radius) {
          const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 180;
          const sat = dist / radius;
          const [r, g, b] = this._hsvToRgb(angle, sat, 1);
          image.data[idx] = r;
          image.data[idx + 1] = g;
          image.data[idx + 2] = b;
          image.data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  _pickFromWheel(e, wheel) {
    const rect = wheel.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (wheel.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (wheel.height / rect.height));
    const ctx = wheel.getContext('2d');
    const data = ctx.getImageData(x, y, 1, 1).data;
    if (data[3] === 0) return;
    const color = { r: data[0], g: data[1], b: data[2], a: parseInt(document.getElementById('alpha-input').value, 10) };
    document.getElementById('r-input').value = color.r;
    document.getElementById('g-input').value = color.g;
    document.getElementById('b-input').value = color.b;
    document.getElementById('hex-input').value = this._rgbToHex(color);
    this.editor.setColor(color);
    this._addRecentColor(color);
  }

  _hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }

  _rgbToHex({ r, g, b }) {
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  _hexToRgb(hex) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    if (!match) return null;
    return {
      r: parseInt(match[1], 16),
      g: parseInt(match[2], 16),
      b: parseInt(match[3], 16),
      a: 255
    };
  }

  _renderPalette() {
    const paletteEl = document.getElementById('mc-palette');
    paletteEl.innerHTML = '';
    this.mcPalette.forEach((hex) => {
      const swatch = document.createElement('div');
      swatch.style.background = hex;
      swatch.title = hex;
      swatch.addEventListener('click', () => {
        const color = this._hexToRgb(hex);
        color.a = parseInt(document.getElementById('alpha-input').value, 10);
        document.getElementById('hex-input').value = hex;
        document.getElementById('r-input').value = color.r;
        document.getElementById('g-input').value = color.g;
        document.getElementById('b-input').value = color.b;
        this.editor.setColor(color);
      });
      paletteEl.appendChild(swatch);
    });
  }

  _addRecentColor(color) {
    const hex = this._rgbToHex(color);
    this.recentColors = [hex, ...this.recentColors.filter((c) => c !== hex)].slice(0, 16);
    const recentEl = document.getElementById('recent-colors');
    recentEl.innerHTML = '';
    this.recentColors.forEach((hexColor) => {
      const swatch = document.createElement('div');
      swatch.style.background = hexColor;
      swatch.title = hexColor;
      swatch.addEventListener('click', () => {
        const c = this._hexToRgb(hexColor);
        c.a = parseInt(document.getElementById('alpha-input').value, 10);
        this.editor.setColor(c);
      });
      recentEl.appendChild(swatch);
    });
  }

  // ===== 3D-Vorschau-Controls =====
  _bindPreviewControls() {
    document.getElementById('btn-auto-rotate').addEventListener('click', () => {
      this.preview.toggleAutoRotate();
    });
    document.getElementById('btn-animate').addEventListener('click', () => {
      this.preview.toggleAnimation();
    });
    document.getElementById('slim-arms').addEventListener('change', (e) => {
      this.preview.rebuildForArmType(e.target.checked);
    });
  }

  // ===== Drag & Drop / Zwischenablage =====
  _bindDragAndDrop() {
    const wrapper = document.getElementById('canvas-wrapper');

    wrapper.addEventListener('dragover', (e) => e.preventDefault());
    wrapper.addEventListener('drop', async (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'image/png') {
        await this.skinManager.importPNG(file);
      }
    });

    document.addEventListener('paste', async (e) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const file = item.getAsFile();
          await this.skinManager.importPNG(file);
        }
      }
    });
  }
     }
