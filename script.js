const SIZE = 64;
const DRAW_SCALE = 10;
const EXPORT_SIZE = 64;

const editorCanvas = document.getElementById("editorCanvas");
const ectx = editorCanvas.getContext("2d", { willReadFrequently: true });

const previewCanvas = document.getElementById("previewCanvas");
const pctx = previewCanvas.getContext("2d", { willReadFrequently: true });

const splash = document.getElementById("splash");
const app = document.getElementById("app");
const particles = document.getElementById("particles");

const colorPicker = document.getElementById("colorPicker");
const hexInput = document.getElementById("hexInput");
const hexLabel = document.getElementById("hexLabel");
const paletteEl = document.getElementById("palette");

const zoomSlider = document.getElementById("zoomSlider");
const zoomLabel = document.getElementById("zoomLabel");
const filenameInput = document.getElementById("filenameInput");
const cursorInfo = document.getElementById("cursorInfo");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const toggleGridBtn = document.getElementById("toggleGridBtn");
const toggleGuideBtn = document.getElementById("toggleGuideBtn");

const toolButtons = [...document.querySelectorAll("[data-tool]")];

const palette = [
  "#ffffff", "#c7d0d9", "#7f8a93", "#30343b",
  "#ff5d5d", "#ff9f43", "#ffd166", "#7ee787",
  "#4cc9f0", "#6bb6ff", "#b48cff", "#ff7ad9",
  "#7a4f2b", "#a06f43", "#5a7a34", "#2f4f2f"
];

let pixels = new Array(SIZE * SIZE).fill(null);
let currentTool = "brush";
let currentColor = "#5fd34e";
let isDrawing = false;
let lastIndex = -1;
let showGrid = true;
let showGuide = true;
let undoStack = [];
let redoStack = [];

const guideRects = [
  { x: 24, y: 0, w: 8, h: 8 },
  { x: 24, y: 8, w: 8, h: 12 },
  { x: 20, y: 8, w: 4, h: 12 },
  { x: 32, y: 8, w: 4, h: 12 },
  { x: 24, y: 20, w: 4, h: 12 },
  { x: 28, y: 20, w: 4, h: 12 }
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normalizeHex(hex) {
  if (!hex) return "#000000";
  let h = String(hex).trim();
  if (h[0] !== "#") h = "#" + h;
  if (h.length === 4) {
    h = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  }
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : "#000000";
}

function copyState(arr) {
  return arr.slice();
}

function pushUndo() {
  undoStack.push(copyState(pixels));
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
}

function setTool(tool) {
  currentTool = tool;
  toolButtons.forEach(b => b.classList.toggle("active", b.dataset.tool === tool));
}

function setColor(hex) {
  currentColor = normalizeHex(hex);
  colorPicker.value = currentColor;
  hexInput.value = currentColor;
  hexLabel.textContent = currentColor;
  document.querySelectorAll(".color-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.color === currentColor);
  });
}

function idx(x, y) {
  return y * SIZE + x;
}

function getPixel(x, y) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
  return pixels[idx(x, y)];
}

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  pixels[idx(x, y)] = color;
}

function drawGrid() {
  if (!showGrid) return;
  ectx.save();
  ectx.strokeStyle = "rgba(255,255,255,.12)";
  ectx.lineWidth = 1;
  for (let i = 0; i <= SIZE; i++) {
    const p = i * DRAW_SCALE;
    ectx.beginPath();
    ectx.moveTo(p + 0.5, 0);
    ectx.lineTo(p + 0.5, SIZE * DRAW_SCALE);
    ectx.stroke();

    ectx.beginPath();
    ectx.moveTo(0, p + 0.5);
    ectx.lineTo(SIZE * DRAW_SCALE, p + 0.5);
    ectx.stroke();
  }
  ectx.restore();
}

function drawGuide() {
  if (!showGuide) return;
  ectx.save();
  ectx.strokeStyle = "rgba(126,231,135,.45)";
  ectx.lineWidth = 2;
  ectx.setLineDash([8, 6]);
  guideRects.forEach(r => {
    ectx.strokeRect(
      r.x * DRAW_SCALE + 1,
      r.y * DRAW_SCALE + 1,
      r.w * DRAW_SCALE - 2,
      r.h * DRAW_SCALE - 2
    );
  });
  ectx.restore();
}

function render() {
  ectx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const c = pixels[idx(x, y)];
      if (!c) continue;
      ectx.fillStyle = c;
      ectx.fillRect(x * DRAW_SCALE, y * DRAW_SCALE, DRAW_SCALE, DRAW_SCALE);
    }
  }

  drawGrid();
  drawGuide();
  renderPreview();
}

function renderPreview() {
  pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  const scale = previewCanvas.width / SIZE;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const c = pixels[idx(x, y)];
      if (!c) continue;
      pctx.fillStyle = c;
      pctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  if (showGrid) {
    pctx.save();
    pctx.strokeStyle = "rgba(255,255,255,.10)";
    pctx.lineWidth = 1;
    for (let i = 0; i <= SIZE; i += 4) {
      const p = i * scale;
      pctx.beginPath();
      pctx.moveTo(p + 0.5, 0);
      pctx.lineTo(p + 0.5, previewCanvas.height);
      pctx.stroke();

      pctx.beginPath();
      pctx.moveTo(0, p + 0.5);
      pctx.lineTo(previewCanvas.width, p + 0.5);
      pctx.stroke();
    }
    pctx.restore();
  }
}

function canvasPosToPixel(event) {
  const rect = editorCanvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE);
  return { x: clamp(x, 0, SIZE - 1), y: clamp(y, 0, SIZE - 1) };
}

function updateCursor(event) {
  const { x, y } = canvasPosToPixel(event);
  cursorInfo.textContent = `x: ${x}, y: ${y}`;
}

function floodFill(startX, startY, newColor) {
  const target = getPixel(startX, startY);
  if (target === newColor) return;

  const stack = [[startX, startY]];
  const visited = new Set();

  while (stack.length) {
    const [x, y] = stack.pop();
    const key = x + "," + y;
    if (visited.has(key)) continue;
    visited.add(key);

    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) continue;
    if (getPixel(x, y) !== target) continue;

    setPixel(x, y, newColor);
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }
}

function paintAt(event, force = false) {
  const { x, y } = canvasPosToPixel(event);
  const i = idx(x, y);

  if (!force && i === lastIndex && currentTool !== "fill") return;
  lastIndex = i;

  if (currentTool === "eyedropper") {
    const c = getPixel(x, y);
    if (c) setColor(c);
    return;
  }

  if (currentTool === "brush") {
    setPixel(x, y, currentColor);
  } else if (currentTool === "eraser") {
    setPixel(x, y, null);
  } else if (currentTool === "fill") {
    pushUndo();
    floodFill(x, y, currentColor);
    render();
    return;
  }

  render();
}

function exportPNG() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = EXPORT_SIZE;
  exportCanvas.height = EXPORT_SIZE;
  const xctx = exportCanvas.getContext("2d", { willReadFrequently: true });
  xctx.imageSmoothingEnabled = false;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const c = pixels[idx(x, y)];
      if (!c) continue;
      xctx.fillStyle = c;
      xctx.fillRect(x, y, 1, 1);
    }
  }

  return exportCanvas.toDataURL("image/png");
}

function downloadSkin() {
  const link = document.createElement("a");
  link.href = exportPNG();
  const name = filenameInput.value.trim() || "minecraft-skin.png";
  link.download = name.toLowerCase().endsWith(".png") ? name : `${name}.png`;
  link.click();
}

function clearSkin() {
  pushUndo();
  pixels = new Array(SIZE * SIZE).fill(null);
  render();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(copyState(pixels));
  pixels = undoStack.pop();
  render();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(copyState(pixels));
  pixels = redoStack.pop();
  render();
}

function createPalette() {
  paletteEl.innerHTML = "";
  palette.forEach(col => {
    const b = document.createElement("button");
    b.className = "color-btn";
    b.dataset.color = col;
    b.style.background = col;
    b.title = col;
    if (col.toLowerCase() === currentColor.toLowerCase()) b.classList.add("active");
    b.addEventListener("click", () => setColor(col));
    paletteEl.appendChild(b);
  });
}

function applyZoom(value) {
  zoomLabel.textContent = `${value}×`;
  editorCanvas.style.width = `min(86vw, ${SIZE * value}px)`;
  editorCanvas.style.height = `min(86vw, ${SIZE * value}px)`;
}

function importImage(file) {
  const img = new Image();
  img.onload = () => {
    pushUndo();

    const off = document.createElement("canvas");
    off.width = SIZE;
    off.height = SIZE;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.clearRect(0, 0, SIZE, SIZE);
    octx.imageSmoothingEnabled = false;
    octx.drawImage(img, 0, 0, SIZE, SIZE);

    const data = octx.getImageData(0, 0, SIZE, SIZE).data;
    pixels = new Array(SIZE * SIZE).fill(null);

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const p = (y * SIZE + x) * 4;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const a = data[p + 3];
        if (a === 0) continue;
        pixels[idx(x, y)] = `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`;
      }
    }

    render();
  };
  img.src = URL.createObjectURL(file);
}

function bootstrapParticles() {
  particles.innerHTML = "";
  const positions = [
    [-50, -25], [40, -40], [70, -5], [-70, 30], [20, 65], [90, 42],
    [-95, -10], [110, 0], [0, -85], [55, 95], [-20, 110], [140, -20]
  ];

  positions.forEach(([dx, dy], i) => {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = `${72 + (Math.random() * 24 - 12)}px`;
    p.style.top = `${72 + (Math.random() * 24 - 12)}px`;
    p.style.setProperty("--dx", `${dx}px`);
    p.style.setProperty("--dy", `${dy}px`);
    p.style.animationDelay = `${i * 18}ms`;
    particles.appendChild(p);
  });
}

function finishSplash() {
  splash.classList.add("fade-out");
  setTimeout(() => {
    splash.remove();
    app.classList.remove("hidden");
  }, 560);
}

// Events
toolButtons.forEach(btn => {
  btn.addEventListener("click", () => setTool(btn.dataset.tool));
});

colorPicker.addEventListener("input", () => setColor(colorPicker.value));
hexInput.addEventListener("change", () => setColor(hexInput.value));

zoomSlider.addEventListener("input", () => applyZoom(Number(zoomSlider.value)));

editorCanvas.addEventListener("pointerdown", (e) => {
  pushUndo();
  isDrawing = true;
  editorCanvas.setPointerCapture(e.pointerId);
  paintAt(e, true);
});

editorCanvas.addEventListener("pointermove", (e) => {
  updateCursor(e);
  if (!isDrawing) return;
  if (currentTool === "brush" || currentTool === "eraser" || currentTool === "eyedropper") {
    paintAt(e);
  }
});

editorCanvas.addEventListener("pointerup", () => {
  isDrawing = false;
  lastIndex = -1;
});

editorCanvas.addEventListener("pointerleave", () => {
  isDrawing = false;
  lastIndex = -1;
  cursorInfo.textContent = "x: –, y: –";
});

editorCanvas.addEventListener("contextmenu", (e) => e.preventDefault());

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);
clearBtn.addEventListener("click", clearSkin);
downloadBtn.addEventListener("click", downloadSkin);

importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => {
  const file = importFile.files && importFile.files[0];
  if (file) importImage(file);
  importFile.value = "";
});

toggleGridBtn.addEventListener("click", () => {
  showGrid = !showGrid;
  toggleGridBtn.textContent = `Grid: ${showGrid ? "an" : "aus"}`;
  render();
});

toggleGuideBtn.addEventListener("click", () => {
  showGuide = !showGuide;
  toggleGuideBtn.textContent = `Guide: ${showGuide ? "an" : "aus"}`;
  render();
});

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "z") undo();
  if (key === "y") redo();
  if (key === "b") setTool("brush");
  if (key === "e") setTool("eraser");
  if (key === "p") setTool("eyedropper");
  if (key === "f") setTool("fill");
});

createPalette();
setColor("#5fd34e");
applyZoom(Number(zoomSlider.value));
render();
bootstrapParticles();
setTimeout(finishSplash, 1500);
