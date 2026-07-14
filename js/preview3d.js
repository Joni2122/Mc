// preview3d.js
// Einfache 3D-ähnliche Vorschau für den Minecraft-Skin

const Preview3D = {

    canvas: null,
    ctx: null,
    width: 320,
    height: 320,

    rotationX: -0.25,
    rotationY: 0.35,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    animationId: null,

    init() {
        this.canvas = document.getElementById("preview3dCanvas");

        if (!this.canvas) {
            this.createCanvas();
        }

        this.ctx = this.canvas.getContext("2d", { alpha: true });

        this.resize();
        this.bindEvents();
        this.loop();
    },


    createCanvas() {
        const wrap = document.getElementById("preview3dWrap");

        this.canvas = document.createElement("canvas");
        this.canvas.id = "preview3dCanvas";
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = "100%";
        this.canvas.style.height = "320px";
        this.canvas.style.borderRadius = "18px";
        this.canvas.style.border = "1px solid rgba(255,255,255,.10)";
        this.canvas.style.background = "rgba(255,255,255,.03)";
        this.canvas.style.display = "block";

        if (wrap) {
            wrap.appendChild(this.canvas);
        } else {
            document.body.appendChild(this.canvas);
        }
    },


    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const size = Math.max(220, Math.floor(Math.min(rect.width || 320, 420)));

        this.canvas.width = size;
        this.canvas.height = size;

        this.width = size;
        this.height = size;
    },


    bindEvents() {
        this.canvas.addEventListener("pointerdown", (e) => {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvas.setPointerCapture(e.pointerId);
        });

        this.canvas.addEventListener("pointermove", (e) => {
            if (!this.isDragging) return;

            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;

            this.rotationY += dx * 0.01;
            this.rotationX += dy * 0.01;

            this.rotationX = Math.max(-1.2, Math.min(1.2, this.rotationX));

            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });

        this.canvas.addEventListener("pointerup", () => {
            this.isDragging = false;
        });

        window.addEventListener("resize", () => this.resize());
    },


    loop() {
        this.render();
        this.animationId = requestAnimationFrame(() => this.loop());
    },


    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },


    render() {
        if (!this.ctx || typeof Skin === "undefined") return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Hintergrund
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, "rgba(18,24,19,1)");
        bg.addColorStop(1, "rgba(8,12,9,1)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Lichtkreis
        const glow = ctx.createRadialGradient(
            w * 0.5,
            h * 0.35,
            10,
            w * 0.5,
            h * 0.35,
            w * 0.45
        );
        glow.addColorStop(0, "rgba(126,231,135,.18)");
        glow.addColorStop(1, "rgba(126,231,135,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        const centerX = w * 0.5;
        const centerY = h * 0.58;

        // Boden-Schlagschatten
        ctx.save();
        ctx.translate(centerX, centerY + 90);
        ctx.scale(1.4, 0.45);
        ctx.fillStyle = "rgba(0,0,0,.35)";
        ctx.beginPath();
        ctx.arc(0, 0, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Figur zeichnen
        this.drawFigure(centerX, centerY);

        // Overlay
        ctx.fillStyle = "rgba(255,255,255,.03)";
        ctx.fillRect(0, 0, w, h);
    },


    drawFigure(cx, cy) {
        const ctx = this.ctx;
        const scale = Math.min(this.width, this.height) / 170;

        const t = performance.now() * 0.0008;
        const sway = Math.sin(t) * 0.05;

        // Reihenfolge: Beine, Körper, Arme, Kopf
        this.drawBodyPart(cx, cy + 28 * scale, 16 * scale, 24 * scale, 8 * scale, 12 * scale, "#6bb6ff", this.rotationY, this.rotationX);
        this.drawBodyPart(cx + 10 * scale, cy + 26 * scale, 16 * scale, 24 * scale, 4 * scale, 12 * scale, "#f1c7a8", this.rotationY + sway, this.rotationX);
        this.drawBodyPart(cx - 10 * scale, cy + 26 * scale, 16 * scale, 24 * scale, 4 * scale, 12 * scale, "#f1c7a8", this.rotationY - sway, this.rotationX);
        this.drawBodyPart(cx, cy + 2 * scale, 16 * scale, 16 * scale, 8 * scale, 8 * scale, "#f1c7a8", this.rotationY * 0.2, this.rotationX);

        // Kopf-Details
        ctx.save();
        ctx.fillStyle = "#1d1d1d";
        ctx.globalAlpha = 0.95;
        const headX = cx;
        const headY = cy + 2 * scale;
        const faceOffset = Math.sin(this.rotationY) * 3 * scale;

        ctx.fillRect(headX - 3 * scale + faceOffset, headY - 1 * scale, 1.5 * scale, 1.5 * scale);
        ctx.fillRect(headX + 1.5 * scale + faceOffset, headY - 1 * scale, 1.5 * scale, 1.5 * scale);
        ctx.restore();
    },


    drawBodyPart(cx, cy, frontW, frontH, sideW, sideH, color, rotY, rotX) {
        const ctx = this.ctx;

        const depth = 8;
        const shadowAlpha = 0.18;

        // Körper in 2.5D: Front + Seite + leichte Schatten
        const scaleX = Math.cos(rotY);
        const scaleZ = Math.sin(rotY);

        const wobble = Math.sin(rotX) * 2;

        // Shadow
        ctx.save();
        ctx.translate(cx + scaleZ * 10, cy + 18);
        ctx.scale(1.1, 0.35);
        ctx.fillStyle = "rgba(0,0,0,.30)";
        ctx.beginPath();
        ctx.arc(0, 0, frontW * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Seitenfläche
        ctx.save();
        ctx.translate(cx + scaleZ * depth, cy + wobble);
        ctx.fillStyle = this.shadeColor(color, -18);
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.roundRect(-sideW / 2, -frontH / 2, sideW, frontH, 2);
        ctx.fill();
        ctx.restore();

        // Frontfläche
        ctx.save();
        ctx.translate(cx, cy + wobble);
        ctx.fillStyle = color;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.roundRect(-frontW / 2, -frontH / 2, frontW, frontH, 3);
        ctx.fill();

        // Lichtkante
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-frontW / 2 + 1, -frontH / 2 + 1, frontW - 2, 2);

        ctx.restore();
    },


    shadeColor(hex, amount) {
        const h = hex.replace("#", "");
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);

        const clamp = (n) => Math.max(0, Math.min(255, n));
        const nr = clamp(r + amount);
        const ng = clamp(g + amount);
        const nb = clamp(b + amount);

        return `rgb(${nr}, ${ng}, ${nb})`;
    }
};


// Safe init, wenn ein Preview-Container vorhanden ist
document.addEventListener("DOMContentLoaded", () => {
    const wrap = document.getElementById("preview3dWrap");
    if (wrap) {
        Preview3D.init();
    }
});
