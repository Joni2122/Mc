export class PixelEditor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 64;
    this.height = 64;
    this.pixelSize = 10;
    this.currentTool = 'brush';
    this.currentColor = '#000000';
    this.currentAlpha = 1;
    this.brushSize = 1;
    this.showGrid = true;
    this.selectedLayer = 'base';
    this.isDrawing = false;

    // Daten
    this.layers = {
      base: new ImageData(64, 64),
      overlay: new ImageData(64, 64)
    };

    this.history = [];
    this.historyIndex = -1;

    // Events
    this.listeners = {};

    // Größe einstellen
    this.resizeCanvas();
  }

  init() {
    this.setupEventListeners();
    this.draw();
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const maxSize = Math.min(container.clientWidth - 40, container.clientHeight - 100);
    this.pixelSize = Math.floor(maxSize / this.width);
    this.canvas.width = this.width * this.pixelSize;
    this.canvas.height = this.height * this.pixelSize;
    this.draw();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.onMouseLeave(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  getPixelFromMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: Math.floor(x / this.pixelSize),
      y: Math.floor(y / this.pixelSize)
    };
  }

  onMouseDown(e) {
    const pixel = this.getPixelFromMouse(e);
    if (pixel.x < 0 || pixel.x >= 64 || pixel.y < 0 || pixel.y >= 64) return;

    this.isDrawing = true;
    this.saveHistory();

    if (e.button === 0) { // Links
      this.paintPixel(pixel.x, pixel.y);
    } else if (e.button === 2) { // Rechts
      this.erasePixel(pixel.x, pixel.y);
    }
  }

  onMouseMove(e) {
    if (!this.isDrawing) return;
    const pixel = this.getPixelFromMouse(e);
    if (pixel.x < 0 || pixel.x >= 64 || pixel.y < 0 || pixel.y >= 64) return;

    if (this.currentTool === 'brush') {
      this.paintPixel(pixel.x, pixel.y);
    }
  }

  onMouseUp(e) {
    this.isDrawing = false;
  }

  onMouseLeave(e) {
    this.isDrawing = false;
  }

  paintPixel(x, y) {
    const data = this.layers[this.selectedLayer].data;
    const index = (y * 64 + x) * 4;
    const rgb = this.hexToRgb(this.currentColor);
    data[index] = rgb.r;
    data[index + 1] = rgb.g;
    data[index + 2] = rgb.b;
    data[index + 3] = Math.floor(this.currentAlpha * 255);
    this.draw();
    this.emit('pixelChange');
  }

  erasePixel(x, y) {
    const data = this.layers[this.selectedLayer].data;
    const index = (y * 64 + x) * 4;
    data[index] = 0;
    data[index + 1] = 0;
    data[index + 2] = 0;
    data[index + 3] = 0;
    this.draw();
    this.emit('pixelChange');
  }

  draw() {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Base Layer
    this.ctx.putImageData(this.layers.base, 0, 0);

    // Overlay Layer
    if (this.selectedLayer !== 'base') {
      this.ctx.putImageData(this.layers.overlay, 0, 0);
    }

    // Grid
    if (this.showGrid) {
      this.drawGrid();
    }
  }

  drawGrid() {
    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= 64; i++) {
      const pos = i * this.pixelSize;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, this.canvas.height);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(this.canvas.width, pos);
      this.ctx.stroke();
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  setColor(hex) {
    this.currentColor = hex;
  }

  setAlpha(alpha) {
    this.currentAlpha = alpha / 100;
  }

  setBrushSize(size) {
    this.brushSize = size;
  }

  setZoom(zoom) {
    this.pixelSize = zoom;
    this.draw();
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.draw();
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setLayer(layer) {
    this.selectedLayer = layer;
    this.draw();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.layers = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.draw();
      this.emit('pixelChange');
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.layers = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.draw();
      this.emit('pixelChange');
    }
  }

  saveHistory() {
    this.historyIndex++;
    this.history = this.history.slice(0, this.historyIndex);
    this.history.push(JSON.parse(JSON.stringify(this.layers)));
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  clear() {
    this.layers.base = new ImageData(64, 64);
    this.layers.overlay = new ImageData(64, 64);
    this.saveHistory();
    this.draw();
    this.emit('pixelChange');
  }

  getSkinData() {
    return {
      base: this.layers.base,
      overlay: this.layers.overlay
    };
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb());
    }
  }
}
