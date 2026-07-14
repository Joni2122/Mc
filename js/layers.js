// layers.js
// Verwaltung der Minecraft-Skin-Schichten
// Base-Layer + Overlay-Layer (Hut, Ärmel, Hose usw.)

const Layers = {

    activeLayer: "base",

    base: [],
    overlay: [],

    width: 64,
    height: 64,


    init() {

        this.base = this.createEmptyLayer();
        this.overlay = this.createEmptyLayer();

    },


    createEmptyLayer() {

        const layer = [];

        for(let y = 0; y < this.height; y++) {

            layer[y] = [];

            for(let x = 0; x < this.width; x++) {

                layer[y][x] = {
                    color: null,
                    alpha: 0
                };

            }

        }

        return layer;

    },


    setActive(layerName) {

        if(layerName === "overlay" || layerName === "base") {

            this.activeLayer = layerName;

        }

    },


    getActiveLayer() {

        return this.activeLayer === "overlay"
            ? this.overlay
            : this.base;

    },


    setPixel(x, y, color, alpha = 255) {

        if(!this.inside(x,y)) return;

        const layer = this.getActiveLayer();

        layer[y][x] = {
            color,
            alpha
        };

    },


    getPixel(x,y, layerName = this.activeLayer) {

        if(!this.inside(x,y)) return null;


        const layer =
            layerName === "overlay"
            ? this.overlay
            : this.base;


        return layer[y][x];

    },


    clearPixel(x,y) {

        if(!this.inside(x,y)) return;

        const layer = this.getActiveLayer();

        layer[y][x] = {
            color:null,
            alpha:0
        };

    },


    inside(x,y) {

        return (
            x >= 0 &&
            y >= 0 &&
            x < this.width &&
            y < this.height
        );

    },


    toggleOverlay(enabled) {

        Skin.layers.overlay = enabled;

        if(typeof Editor !== "undefined") {

            Editor.render();

        }

    },


    mergeLayers() {

        const result = this.createEmptyLayer();


        for(let y = 0; y < this.height; y++) {

            for(let x = 0; x < this.width; x++) {


                const base = this.base[y][x];
                const overlay = this.overlay[y][x];


                if(
                    overlay &&
                    overlay.alpha > 0 &&
                    overlay.color
                ) {

                    result[y][x] = {
                        color: overlay.color,
                        alpha: overlay.alpha
                    };

                }

                else if(
                    base &&
                    base.alpha > 0 &&
                    base.color
                ) {

                    result[y][x] = {
                        color: base.color,
                        alpha: base.alpha
                    };

                }


            }

        }


        return result;

    },


    clearLayer(layerName) {

        if(layerName === "overlay") {

            this.overlay = this.createEmptyLayer();

        }

        else {

            this.base = this.createEmptyLayer();

        }


        if(typeof Editor !== "undefined") {

            Editor.render();

        }

    },


    copyLayer(layerName) {

        const source =
            layerName === "overlay"
            ? this.overlay
            : this.base;


        return JSON.parse(
            JSON.stringify(source)
        );

    },


    pasteLayer(data, layerName) {

        if(!data) return;


        if(layerName === "overlay") {

            this.overlay = data;

        }

        else {

            this.base = data;

        }


        if(typeof Editor !== "undefined") {

            Editor.render();

        }

    },


    exportLayers() {

        return {

            base: this.base,
            overlay: this.overlay

        };

    },


    importLayers(data) {

        if(!data) return;


        if(data.base) {

            this.base = data.base;

        }


        if(data.overlay) {

            this.overlay = data.overlay;

        }

    }

};


Layers.init();
