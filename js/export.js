// export.js
// Export von Minecraft-Skins als PNG-Datei

const SkinExporter = {

    getFileName() {
        const input = document.getElementById("filenameInput");
        const name = input ? input.value.trim() : "";

        if (!name) {
            return "minecraft-skin.png";
        }

        return name.toLowerCase().endsWith(".png") ? name : `${name}.png`;
    },


    createExportCanvas() {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 64, 64);

        for (let y = 0; y < 64; y++) {
            for (let x = 0; x < 64; x++) {
                const pixel = Skin.getPixel(x, y);

                if (!pixel || !pixel.color || pixel.alpha === 0) {
                    continue;
                }

                ctx.fillStyle = pixel.color;
                ctx.fillRect(x, y, 1, 1);
            }
        }

        return canvas;
    },


    exportAsDataURL() {
        const canvas = this.createExportCanvas();
        return canvas.toDataURL("image/png");
    },


    download() {
        const dataURL = this.exportAsDataURL();
        const fileName = this.getFileName();

        const link = document.createElement("a");
        link.href = dataURL;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
    },


    copyToClipboard() {
        const canvas = this.createExportCanvas();

        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        "image/png": blob
                    })
                ]);

                alert("Skin wurde in die Zwischenablage kopiert.");
            } catch (error) {
                console.error("Clipboard-Export fehlgeschlagen:", error);
                alert("Kopieren in die Zwischenablage hat nicht funktioniert.");
            }
        }, "image/png");
    },


    exportBlob() {
        return new Promise((resolve, reject) => {
            const canvas = this.createExportCanvas();

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error("PNG konnte nicht erstellt werden."));
                    return;
                }

                resolve(blob);
            }, "image/png");
        });
    },


    saveWithTimestamp() {
        const now = new Date();
        const stamp =
            now.getFullYear() +
            "-" +
            String(now.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(now.getDate()).padStart(2, "0") +
            "_" +
            String(now.getHours()).padStart(2, "0") +
            "-" +
            String(now.getMinutes()).padStart(2, "0");

        const base = this.getFileName().replace(/\.png$/i, "");
        const link = document.createElement("a");

        link.href = this.exportAsDataURL();
        link.download = `${base}_${stamp}.png`;

        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
