/**
 * PixelEditor
 * Verwaltet den 64x64 Pixel-Canvas, alle Zeichenwerkzeuge, Zoom, Raster,
 * Ebenen (Base/Overlay) und die Undo/Redo-History.
 */
export class PixelEditor {
  constructor({ canvasId, gridCanvasId, skinManager }) {
    this.canvas = document.getElementById(canvasId);
    this.gridCanvas = document.getElementById(gridCanvasId);
    this.ctx = this.canvas.getContext('2d');
    this.gridCtx = this.gridCanvas.getContext('2d');
    this.skinManager = skinManager;

    this.size = 64;
    this.zoom = 8; // Startzoom (400% entspricht hier 8px pro Pixel bei Basisgröße)
    this.minZoom = 2;
    this.maxZoom = 20;

    this.showGrid = true;
    this.currentTool = 'brush';
    this.currentLayer = 'base';
    this.currentColor = { r: 255, g: 255, b: 255, a: 255 };

    this.isDrawing = false;
    this.startPixel = null;
    this.lastPixel = null;
    this.clipboard = null;
    this.selection = null; // {x0,y0,x1,y1}

    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 100;

    this._bindEvents();
  }

  init() {
    this._resizeCanvases();
    this._pushHistory(); // initialer Zustand
    this.render();
  }

  // ===== Canvas-Größe basierend auf Zoom =====
  _resizeCanvases() {
    const pixelSize = this.zoom;
    const displaySize = this.size * pixelSize;
    [this.canvas, this.gridCanvas].forEach((c) => {
      c.style.width = `${displaySize}px`;
      c.style.height = `${displaySize}px`;
    });
    this._drawGrid();
  }

  setZoom(newZoom) {
    this.zoom = Math.min(this.maxZoom, Math.max(this.minZoom, newZoom));
    this._resizeCanvases();
    const zoomLabel = document.getElementById('zoom-level');
    if (zoomLabel) zoomLabel.textContent = `${Math.round((this.zoom / 8) * 400)}%`;
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    this._drawGrid();
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setLayer(layer) {
    this.currentLayer = layer;
    this.render();
  }

  setColor(rgba) {
    this.currentColor = rgba;
  }

  // ===== Koordinaten-Umrechnung =====
  _getPixelFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = Math.floor((clientX - rect.left) * scaleX * (rect.width / (this.size * this.zoom)) * this.size / this.size);
    // Vereinfachte, robuste Berechnung:
    const px = Math.floor(((clientX - rect.left) / rect.width) * this.size);
    const py = Math.floor(((clientY - rect.top) / rect.height) * this.size);
    if (px < 0 || py < 0 || px >= this.size || py >= this.size) return null;
    return { x: px, y: py };
  }

  // ===== Events =====
  _bindEvents() {
    const start = (e) => this._onPointerDown(e);
    const move = (e) => this._onPointerMove(e);
    const end = () => this._onPointerUp();

    this.canvas.addEventListener('mousedown', start);
    this.canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, { passive: false });
    this.canvas.addEventListener('touchend', (e) => { e.preventDefault(); end(); });
  }

  _onPointerDown(e) {
    const pixel = this._getPixelFromEvent(e);
    if (!pixel) return;
    this.isDrawing = true;
    this.startPixel = pixel;
    this.lastPixel = pixel;

    switch (this.currentTool) {
      case 'brush':
        this._paintPixel(pixel.x, pixel.y);
        this.render();
        break;
      case 'eraser':
        this._erasePixel(pixel.x, pixel.y);
        this.render();
        break;
      case 'bucket':
        this._floodFill(pixel.x, pixel.y);
        this.render();
        this._pushHistory();
        break;
      case 'eyedropper':
        this._pickColor(pixel.x, pixel.y);
        break;
      case 'mirror':
        this._paintMirrored(pixel.x, pixel.y);
        this.render();
        break;
      case 'copy':
        this.selection = { x0: pixel.x, y0: pixel.y, x1: pixel.x, y1: pixel.y };
        break;
      default:
        break;
    }
  }

  _onPointerMove(e) {
    if (!this.isDrawing) return;
    const pixel = this._getPixelFromEvent(e);
    if (!pixel) return;

    switch (this.currentTool) {
      case 'brush':
        this._paintLine(this.lastPixel, pixel);
        this.render();
        break;
      case 'eraser':
        this._paintLine(this.lastPixel, pixel, true);
        this.render();
        break;
      case 'mirror':
        this._paintMirrored(pixel.x, pixel.y);
        this.render();
        break;
      case 'line':
      case 'rectangle':
      case 'circle':
      case 'select':
      case 'copy':
        this.selection = { x0: this.startPixel.x, y0: this.startPixel.y, x1: pixel.x, y1: pixel.y };
        this.render();
        this._drawPreviewShape();
        break;
      default:
        break;
    }
    this.lastPixel = pixel;
  }

  _onPointerUp() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    switch (this.currentTool) {
      case 'line':
        this._commitLine();
        break;
      case 'rectangle':
        this._commitRectangle();
        break;
      case 'circle':
        this._commitCircle();
        break;
      default:
        break;
    }

    if (this.currentTool !== 'select' && this.currentTool !== 'copy' && this.currentTool !== 'eyedropper') {
      this._pushHistory();
    }
  }

  // ===== Zeichenoperationen =====
  _paintPixel(x, y) {
    this.skinManager.setPixel(this.currentLayer, x, y, this.currentColor);
  }

  _erasePixel(x, y) {
    this.skinManager.setPixel(this.currentLayer, x, y, { r: 0, g: 0, b: 0, a: 0 });
  }

  _paintLine(p0, p1, erase = false) {
    const points = this._bresenhamLine(p0.x, p0.y, p1.x, p1.y);
    points.forEach((p) => {
      if (erase) this._erasePixel(p.x, p.y);
      else this._paintPixel(p.x, p.y);
    });
  }

  _paintMirrored(x, y) {
    this._paintPixel(x, y);
    const mirroredX = this.size - 1 - x;
    this._paintPixel(mirroredX, y);
  }

  _bresenhamLine(x0, y0, x1, y1) {
    const points = [];
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      points.push({ x: x0, y: y0 });
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
    return points;
  }

  _commitLine() {
    if (!this.selection) return;
    const { x0, y0, x1, y1 } = this.selection;
    this._paintLine({ x: x0, y: y0 }, { x: x1, y: y1 });
    this.selection = null;
    this.render();
  }

  _commitRectangle() {
    if (!this.selection) return;
    const { x0, y0, x1, y1 } = this.selection;
    const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
    for (let x = minX; x <= maxX; x++) {
      this._paintPixel(x, minY);
      this._paintPixel(x, maxY);
    }
    for (let y = minY; y <= maxY; y++) {
      this._paintPixel(minX, y);
      this._paintPixel(maxX, y);
    }
    this.selection = null;
    this.render();
  }

  _commitCircle() {
    if (!this.selection) return;
    const { x0, y0, x1, y1 } = this.selection;
    const cx = x0, cy = y0;
    const radius = Math.round(Math.hypot(x1 - x0, y1 - y0));
    let x = radius, y = 0, err = 0;
    while (x >= y) {
      [[cx + x, cy + y], [cx + y, cy + x], [cx - y, cy + x], [cx - x, cy + y],
       [cx - x, cy - y], [cx - y, cy - x], [cx + y, cy - x], [cx + x, cy - y]]
        .forEach(([px, py]) => this._paintPixel(px, py));
      y += 1;
      err += 1 + 2 * y;
      if (2 * (err - x) + 1 > 0) { x -= 1; err += 1 - 2 * x; }
    }
    this.selection = null;
    this.render();
  }

  _floodFill(x, y) {
    const target = this.skinManager.getPixel(this.currentLayer, x, y);
    const replacement = this.currentColor;
    if (this._colorsEqual(target, replacement)) return;

    const stack = [{ x, y }];
    const visited = new Set();

    while (stack.length) {
      const p = stack.pop();
      const key = `${p.x},${p.y}`;
      if (visited.has(key)) continue;
      if (p.x < 0 || p.y < 0 || p.x >= this.size || p.y >= this.size) continue;

      const current = this.skinManager.getPixel(this.currentLayer, p.x, p.y);
      if (!this._colorsEqual(current, target)) continue;

      this.skinManager.setPixel(this.currentLayer, p.x, p.y, replacement);
      visited.add(key);

      stack.push({ x: p.x + 1, y: p.y });
      stack.push({ x: p.x - 1, y: p.y });
      stack.push({ x: p.x, y: p.y + 1 });
      stack.push({ x: p.x, y: p.y - 1 });
    }
  }

  _colorsEqual(a, b) {
    return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
  }

  _pickColor(x, y) {
    const color = this.skinManager.getPixel(this.currentLayer, x, y);
    this.currentColor = color;
    document.dispatchEvent(new CustomEvent('color-picked', { detail: color }));
  }

  // ===== Kopieren/Einfügen =====
  copySelection() {
    if (!this.selection) return;
    const { x0, y0, x1, y1 } = this.selection;
    const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
    const data = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        data.push({ dx: x - minX, dy: y - minY, color: this.skinManager.getPixel(this.currentLayer, x, y) });
      }
    }
    this.clipboard = data;
  }

  pasteAt(x, y) {
    if (!this.clipboard) return;
    this.clipboard.forEach((p) => {
      this.skinManager.setPixel(this.currentLayer, x + p.dx, y + p.dy, p.color);
    });
    this.render();
    this._pushHistory();
  }

  // ===== Undo/Redo =====
  _pushHistory() {
    const snapshot = this.skinManager.exportState();
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  undo() {
    if (this.historyIndex <= 0) return;
    this.historyIndex--;
    this.skinManager.importState(this.history[this.historyIndex]);
    this.render();
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return;
    this.historyIndex++;
    this.skinManager.importState(this.history[this.historyIndex]);
    this.render();
  }

  // ===== Rendering =====
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.imageSmoothingEnabled = false;

    // Base Layer immer zeichnen
    this.ctx.drawImage(this.skinManager.getLayerCanvas('base'), 0, 0);
    // Overlay Layer darüber, falls sichtbar
    if (this.skinManager.isLayerVisible('overlay')) {
      this.ctx.drawImage(this.skinManager.getLayerCanvas('overlay'), 0, 0);
    }
  }

  _drawGrid() {
    this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
    if (!this.showGrid) return;
    this.gridCtx.strokeStyle = 'rgba(255,255,255,0.15)';
    this.gridCtx.lineWidth = 0.05;
    for (let i = 0; i <= this.size; i++) {
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(i, 0);
      this.gridCtx.lineTo(i, this.size);
      this.gridCtx.stroke();
      this.gridCtx.beginPath();
      this.gridCtx.moveTo(0, i);
      this.gridCtx.lineTo(this.size, i);
      this.gridCtx.stroke();
    }
  }

  _drawPreviewShape() {
    // Leichte visuelle Vorschau während des Ziehens (optional erweiterbar)
  }
  }
