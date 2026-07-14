// skin.js
// Minecraft Skin Struktur und Pixel-Verwaltung

const Skin = {
    width: 64,
    height: 64,

    pixels: [],

    layers: {
        base: true,
        overlay: true
    },

    init() {
        this.pixels = [];

        for (let y = 0; y < this.height; y++) {
            this.pixels[y] = [];

            for (let x = 0; x < this.width; x++) {
                this.pixels[y][x] = {
                    color: null,
                    alpha: 0
                };
            }
        }
    },


    setPixel(x, y, color, alpha = 255) {

        if (!this.isInside(x, y)) return;

        this.pixels[y][x] = {
            color: color,
            alpha: alpha
        };
    },


    getPixel(x, y) {

        if (!this.isInside(x, y)) {
            return null;
        }

        return this.pixels[y][x];
    },


    clearPixel(x, y) {

        if (!this.isInside(x, y)) return;

        this.pixels[y][x] = {
            color: null,
            alpha: 0
        };
    },


    isInside(x, y) {

        return (
            x >= 0 &&
            y >= 0 &&
            x < this.width &&
            y < this.height
        );
    },


    clear() {

        for (let y = 0; y < this.height; y++) {

            for (let x = 0; x < this.width; x++) {

                this.clearPixel(x, y);

            }
        }
    },


    // Bereiche eines Minecraft-Skins

    parts: {

        headFront: {
            x:24,
            y:8,
            width:8,
            height:8
        },

        headSide: {
            x:16,
            y:8,
            width:8,
            height:8
        },

        bodyFront: {
            x:20,
            y:20,
            width:8,
            height:12
        },

        bodyBack: {
            x:32,
            y:20,
            width:8,
            height:12
        },

        rightArm: {
            x:44,
            y:20,
            width:4,
            height:12
        },

        leftArm: {
            x:36,
            y:52,
            width:4,
            height:12
        },

        rightLeg: {
            x:4,
            y:20,
            width:4,
            height:12
        },

        leftLeg: {
            x:20,
            y:52,
            width:4,
            height:12
        }

    },


    getPart(name){

        return this.parts[name];

    },


    fillPart(name, color){

        const part = this.getPart(name);

        if(!part) return;


        for(
            let y = part.y;
            y < part.y + part.height;
            y++
        ){

            for(
                let x = part.x;
                x < part.x + part.width;
                x++
            ){

                this.setPixel(
                    x,
                    y,
                    color
                );

            }
        }
    },


    exportData(){

        return JSON.stringify({
            width:this.width,
            height:this.height,
            pixels:this.pixels
        });

    },


    importData(data){

        try {

            const parsed = JSON.parse(data);

            this.width = parsed.width;
            this.height = parsed.height;
            this.pixels = parsed.pixels;

        }

        catch(error){

            console.error(
                "Skin konnte nicht geladen werden",
                error
            );

        }

    }


};


// Start vorbereiten

Skin.init();
