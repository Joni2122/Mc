// canvas.js
// Canvas-Logik, Zeichenfläche, Koordinaten, Rendering, Interaktion

const Editor = {
    canvas: null,
    ctx: null,
    previewCanvas: null,
    previewCtx: null,

    scale: 10,
    showGrid: true,
    showGuide: true,
    activePart: null,

    init() {
        this.canvas = document.getElementById("editorCanvas");
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });

        this.previewCanvas = document.getElementById("previewCanvas");
        this.previewCtx = this.previewCanvas.getContext("2d", { willReadFrequently: true });

        this.bindEvents();
        this.render();
    },

    bindEvents() {
        if (!this.canvas) return;

        const pointerToPixel = (event) => this.getPixelFromEvent(event);

        this.canvas.addEventListener("pointerdown", (event) => {
            event.preventDefault();

            const pos = pointerToPixel(event);
            this.canvas.setPointerCapture(event.pointerId);

            if (typeof Tools !== "undefined") {
                Tools.handlePointerDown(pos.x, pos.y);
            }
        });

        this.canvas.addEventListener("pointermove", (event) => {
            event.preventDefault();

            const pos = pointerToPixel(event);
            this.updateCursor(pos.x, pos.y);

            if (typeof Tools !== "undefined") {
                Tools.handlePointerMove(pos.x, pos.y);
            }
        });

        this.canvas.addEventListener("pointerup", (event) => {
            event.preventDefault();

            if (typeof Tools !== "undefined") {
                Tools.handlePointerUp();
            }
        });

        this.canvas.addEventListener("pointerleave", () => {
            this.hideCursor();
            if (typeof Tools !== "undefined") {
                Tools.handlePointerUp();
            }
        });

        this.canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
    },

    getPixelFromEvent(event) {
        const rect = this.canvas.getBoundingClientRect();

        const x = Math.floor(((event.clientX - rect.left) / rect.width) * Skin.width);
        const y = Math.floor(((event.clientY - rect.top) / rect.height) * Skin.height);

        return {
            x: Math.max(0, Math.min(Skin.width - 1, x)),
            y: Math.max(0, Math.min(Skin.height - 1, y))
        };
    },

    setZoom(value) {
        const zoom = Math.max(4, Math.min(24, Number(value) || 10));
        this.scale = zoom;

        if (this.canvas) {
            this.canvas.style.width = `min(86vw, ${Skin.width * zoom}px)`;
            this.canvas.style.height = `min(86vw, ${Skin.height * zoom}px)`;
        }

        const zoomLabel = document.getElementById("zoomLabel");
        if (zoomLabel) {
            zoomLabel.textContent = `${zoom}×`;
        }
    },

    syncColorUI(color) {
        const colorPicker = document.getElementById("colorPicker");
        const hexInput = document.getElementById("hexInput");
        const hexLabel = document.getElementById("hexLabel");

        if (colorPicker) colorPicker.value = color;
        if (hexInput) hexInput.value = color;
        if (hexLabel) hexLabel.textContent = color;
    },

    updateCursor(x, y) {
        const cursor = document.getElementById("cursorInfo");
        if (!cursor) return;
        cursor.textContent = `x: ${x}, y: ${y}`;
    },

    hideCursor() {
        const cursor = document.getElementById("cursorInfo");
        if (!cursor) return;
        cursor.textContent = "x: –, y: –";
    },

    clearCanvas() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawBackground() {
        if (!this.ctx) return;

        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    },

    drawGrid() {
        if (!this.showGrid) return;
        if (!this.ctx) return;

        this.ctx.save();
        this.ctx.strokeStyle = "rgba(255,255,255,.12)";
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= Skin.width; i++) {
            const p = i * this.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(p + 0.5, 0);
            this.ctx.lineTo(p + 0.5, Skin.height * this.scale);
            this.ctx.stroke();
        }

        for (let i = 0; i <= Skin.height; i++) {
            const p = i * this.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(0, p + 0.5);
            this.ctx.lineTo(Skin.width * this.scale, p + 0.5);
            this.ctx.stroke();
        }

        this.ctx.restore();
    },

    drawGuide() {
        if (!this.showGuide) return;
        if (!this.ctx || !Skin.parts) return;

        this.ctx.save();
        this.ctx.strokeStyle = "rgba(126,231,135,.45)";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 6]);

        for (const key of Object.keys(Skin.parts)) {
            const part = Skin.parts[key];
            this.ctx.strokeRect(
                part.x * this.scale + 1,
                part.y * this.scale + 1,
                part.width * this.scale - 2,
                part.height * this.scale - 2
            );
        }

        this.ctx.restore();
    },

    drawPixels() {
        if (!this.ctx) return;

        for (let y = 0; y < Skin.height; y++) {
            for (let x = 0; x < Skin.width; x++) {
                const pixel = Skin.getPixel(x, y);
                if (!pixel || !pixel.color || pixel.alpha === 0) continue;

                this.ctx.fillStyle = pixel.color;
                this.ctx.fillRect(
                    x * this.scale,
                    y * this.scale,
                    this.scale,
                    this.scale
                );
            }
        }
    },

    drawSelection() {
        if (!this.ctx || !this.activePart || !Skin.getPart(this.activePart)) return;

        const part = Skin.getPart(this.activePart);

        this.ctx.save();
        this.ctx.strokeStyle = "rgba(255,255,255,.9)";
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([]);

        this.ctx.strokeRect(
            part.x * this.scale + 1,
            part.y * this.scale + 1,
            part.width * this.scale - 2,
            part.height * this.scale - 2
        );

        this.ctx.restore();
    },

    render() {
        if (!this.ctx) return;

        this.clearCanvas();
        this.drawBackground();
        this.drawPixels();
        this.drawGrid();
        this.drawGuide();
        this.drawSelection();
        this.renderPreview();

        if (typeof window !== "undefined") {
            window.requestAnimationFrame(() => {});
        }
    },

    renderPreview() {
        if (!this.previewCtx || !this.previewCanvas) return;

        const size = this.previewCanvas.width;
        const scale = size / Skin.width;

        this.previewCtx.clearRect(0, 0, size, size);

        for (let y = 0; y < Skin.height; y++) {
            for (let x = 0; x < Skin.width; x++) {
                const pixel = Skin.getPixel(x, y);
                if (!pixel || !pixel.color || pixel.alpha === 0) continue;

                this.previewCtx.fillStyle = pixel.color;
                this.previewCtx.fillRect(x * scale, y * scale, scale, scale);
            }
        }

        if (this.showGrid) {
            this.previewCtx.save();
            this.previewCtx.strokeStyle = "rgba(255,255,255,.10)";
            this.previewCtx.lineWidth = 1;

            for (let i = 0; i <= Skin.width; i += 4) {
                const p = i * scale;
                this.previewCtx.beginPath();
                this.previewCtx.moveTo(p + 0.5, 0);
                this.previewCtx.lineTo(p + 0.5, size);
                this.previewCtx.stroke();
            }

            for (let i = 0; i <= Skin.height; i += 4) {
                const p = i * scale;
                this.previewCtx.beginPath();
                this.previewCtx.moveTo(0, p + 0.5);
                this.previewCtx.lineTo(size, p + 0.5);
                this.previewCtx.stroke();
            }

            this.previewCtx.restore();
        }
    },

    toggleGrid(force) {
        this.showGrid = typeof force === "boolean" ? force : !this.showGrid;
        this.render();

        const btn = document.getElementById("toggleGridBtn");
        if (btn) {
            btn.textContent = `Grid: ${this.showGrid ? "an" : "aus"}`;
        }
    },

    toggleGuide(force) {
        this.showGuide = typeof force === "boolean" ? force : !this.showGuide;
        this.render();

        const btn = document.getElementById("toggleGuideBtn");
        if (btn) {
            btn.textContent = `Guide: ${this.showGuide ? "an" : "aus"}`;
        }
    },

    selectPart(partName) {
        this.activePart = partName;
        this.render();
    },

    clearSelection() {
        this.activePart = null;
        this.render();
    },

    exportPNG() {
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = Skin.width;
        exportCanvas.height = Skin.height;

        const exportCtx = exportCanvas.getContext("2d", { willReadFrequently: true });
        exportCtx.imageSmoothingEnabled = false;

        for (let y = 0; y < Skin.height; y++) {
            for (let x = 0; x < Skin.width; x++) {
                const pixel = Skin.getPixel(x, y);
                if (!pixel || !pixel.color || pixel.alpha === 0) continue;

                exportCtx.fillStyle = pixel.color;
                exportCtx.fillRect(x, y, 1, 1);
            }
        }

        return exportCanvas.toDataURL("image/png");
    },

    download(filename = "minecraft-skin.png") {
        const link = document.createElement("a");
        link.href = this.exportPNG();
        link.download = filename.toLowerCase().endsWith(".png")
            ? filename
            : `${filename}.png`;
        link.click();
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (typeof Skin !== "undefined") {
        Editor.init();
        Editor.setZoom(10);
    }

    const zoomSlider = document.getElementById("zoomSlider");
    if (zoomSlider) {
        zoomSlider.addEventListener("input", () => {
            Editor.setZoom(Number(zoomSlider.value));
        });
    }

    const toggleGridBtn = document.getElementById("toggleGridBtn");
    if (toggleGridBtn) {
        toggleGridBtn.addEventListener("click", () => Editor.toggleGrid());
    }

    const toggleGuideBtn = document.getElementById("toggleGuideBtn");
    if (toggleGuideBtn) {
        toggleGuideBtn.addEventListener("click", () => Editor.toggleGuide());
    }
});
