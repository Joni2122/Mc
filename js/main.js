// main.js
// Start-Datei: verbindet UI, Import, Export und Splashscreen

const App = {

    init() {
        this.bindUI();
        this.startSplash();
        this.loadDemoSkin();
    },


    bindUI() {
        const downloadBtn = document.getElementById("downloadBtn");
        const importBtn = document.getElementById("importBtn");
        const importFile = document.getElementById("importFile");
        const clearBtn = document.getElementById("clearBtn");
        const undoBtn = document.getElementById("undoBtn");
        const redoBtn = document.getElementById("redoBtn");
        const colorPicker = document.getElementById("colorPicker");
        const hexInput = document.getElementById("hexInput");
        const palette = document.getElementById("palette");
        const toggleGridBtn = document.getElementById("toggleGridBtn");
        const toggleGuideBtn = document.getElementById("toggleGuideBtn");
        const zoomSlider = document.getElementById("zoomSlider");

        if (downloadBtn) {
            downloadBtn.addEventListener("click", () => {
                if (typeof SkinExporter !== "undefined") {
                    SkinExporter.download();
                }
            });
        }

        if (importBtn && importFile) {
            importBtn.addEventListener("click", () => importFile.click());

            importFile.addEventListener("change", () => {
                const file = importFile.files && importFile.files[0];
                if (file && typeof SkinImporter !== "undefined") {
                    SkinImporter.loadFile(file);
                }
                importFile.value = "";
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                if (!confirm("Wirklich alles löschen?")) return;

                if (typeof History !== "undefined") {
                    History.save();
                }

                if (typeof Skin !== "undefined") {
                    Skin.clear();
                }

                if (typeof Editor !== "undefined") {
                    Editor.render();
                }
            });
        }

        if (undoBtn) {
            undoBtn.addEventListener("click", () => {
                if (typeof History !== "undefined") {
                    History.undo();
                }
            });
        }

        if (redoBtn) {
            redoBtn.addEventListener("click", () => {
                if (typeof History !== "undefined") {
                    History.redo();
                }
            });
        }

        if (colorPicker) {
            colorPicker.addEventListener("input", () => {
                if (typeof Tools !== "undefined") {
                    Tools.setColor(colorPicker.value);
                }
                if (typeof Editor !== "undefined") {
                    Editor.syncColorUI(colorPicker.value);
                }
            });
        }

        if (hexInput) {
            hexInput.addEventListener("change", () => {
                const color = this.normalizeHex(hexInput.value);

                if (typeof Tools !== "undefined") {
                    Tools.setColor(color);
                }
                if (typeof Editor !== "undefined") {
                    Editor.syncColorUI(color);
                }
            });
        }

        if (palette) {
            palette.addEventListener("click", (event) => {
                const btn = event.target.closest(".color-btn");
                if (!btn) return;

                const color = btn.dataset.color;
                if (!color) return;

                if (typeof Tools !== "undefined") {
                    Tools.setColor(color);
                }
                if (typeof Editor !== "undefined") {
                    Editor.syncColorUI(color);
                }
            });
        }

        if (toggleGridBtn) {
            toggleGridBtn.addEventListener("click", () => {
                if (typeof Editor !== "undefined") {
                    Editor.toggleGrid();
                }
            });
        }

        if (toggleGuideBtn) {
            toggleGuideBtn.addEventListener("click", () => {
                if (typeof Editor !== "undefined") {
                    Editor.toggleGuide();
                }
            });
        }

        if (zoomSlider) {
            zoomSlider.addEventListener("input", () => {
                if (typeof Editor !== "undefined") {
                    Editor.setZoom(Number(zoomSlider.value));
                }
            });
        }

        window.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase();

            if (key === "z" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                if (typeof History !== "undefined") History.undo();
            }

            if (key === "y" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                if (typeof History !== "undefined") History.redo();
            }

            if (key === "b" && typeof Tools !== "undefined") {
                Tools.setTool("brush");
            }

            if (key === "e" && typeof Tools !== "undefined") {
                Tools.setTool("eraser");
            }

            if (key === "p" && typeof Tools !== "undefined") {
                Tools.setTool("eyedropper");
            }

            if (key === "f" && typeof Tools !== "undefined") {
                Tools.setTool("fill");
            }
        });
    },


    startSplash() {
        const splash = document.getElementById("splash");
        if (!splash) return;

        const particles = document.getElementById("particles");
        if (particles) {
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

        setTimeout(() => {
            splash.classList.add("fade-out");
            setTimeout(() => {
                splash.remove();
                const app = document.getElementById("app");
                if (app) app.classList.remove("hidden");
            }, 560);
        }, 1500);
    },


    loadDemoSkin() {
        if (typeof Skin === "undefined" || typeof Editor === "undefined") return;

        // Ein kleiner Demo-Start-Skin, damit die Seite direkt lebendig wirkt
        const colors = {
            green: "#5fd34e",
            darkGreen: "#2f7d32",
            brown: "#7b5532",
            darkBrown: "#573b22",
            black: "#1d1d1d",
            skin: "#f1c7a8",
            shirt: "#4cc9f0",
            pants: "#6bb6ff"
        };

        const fillRect = (x, y, w, h, color) => {
            for (let iy = y; iy < y + h; iy++) {
                for (let ix = x; ix < x + w; ix++) {
                    Skin.setPixel(ix, iy, color, 255);
                }
            }
        };

        Skin.clear();

        // Kopf
        fillRect(24, 8, 8, 8, colors.skin);
        fillRect(24, 8, 8, 2, colors.darkGreen);
        fillRect(24, 14, 8, 2, colors.darkGreen);
        fillRect(24, 10, 2, 4, colors.black);
        fillRect(30, 10, 2, 4, colors.black);

        // Körper
        fillRect(20, 20, 8, 12, colors.shirt);
        fillRect(20, 20, 8, 2, colors.green);

        // Arme
        fillRect(36, 20, 4, 12, colors.skin);
        fillRect(44, 20, 4, 12, colors.skin);

        // Beine
        fillRect(20, 52, 4, 12, colors.pants);
        fillRect(4, 20, 4, 12, colors.pants);

        // Kleine Details
        fillRect(21, 24, 6, 1, colors.darkGreen);
        fillRect(21, 28, 6, 1, colors.darkBrown);
        fillRect(5, 24, 2, 1, colors.darkBrown);
        fillRect(21, 55, 2, 1, colors.darkBrown);
        fillRect(23, 55, 2, 1, colors.darkBrown);

        Editor.render();
    },


    normalizeHex(value) {
        let hex = String(value || "").trim();
        if (!hex.startsWith("#")) hex = "#" + hex;

        if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
            hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }

        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
            return "#5fd34e";
        }

        return hex.toLowerCase();
    }

};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});
