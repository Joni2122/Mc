// tools.js
// Werkzeuge: Pinsel, Radierer, Pipette, Füllen, Linien, Rechtecke

const Tools = {

    currentTool: "brush",
    currentColor: "#5fd34e",
    brushSize: 1,
    isMouseDown: false,

    setTool(toolName){
        this.currentTool = toolName;
    },

    setColor(color){
        this.currentColor = color;
    },

    setBrushSize(size){
        this.brushSize = Math.max(1, Math.min(8, size));
    },

    handlePointerDown(x, y){
        this.isMouseDown = true;

        if(this.currentTool === "fill"){
            this.fill(x, y, this.currentColor);
            History.save();
            Editor.render();
            return;
        }

        if(this.currentTool === "eyedropper"){
            const picked = Skin.getPixel(x, y);
            if(picked && picked.color){
                this.setColor(picked.color);
                if(typeof Editor !== "undefined" && Editor.syncColorUI){
                    Editor.syncColorUI(picked.color);
                }
            }
            return;
        }

        History.save();
        this.applyTool(x, y, true);
        Editor.render();
    },

    handlePointerMove(x, y){
        if(!this.isMouseDown) return;

        if(this.currentTool === "brush" || this.currentTool === "eraser"){
            this.applyTool(x, y, false);
            Editor.render();
        }
    },

    handlePointerUp(){
        this.isMouseDown = false;
    },

    applyTool(x, y, force = false){
        if(this.currentTool === "brush"){
            this.paint(x, y, this.currentColor, force);
        }
        else if(this.currentTool === "eraser"){
            this.erase(x, y, force);
        }
    },

    paint(x, y, color, force = false){
        const size = this.brushSize;

        for(let iy = 0; iy < size; iy++){
            for(let ix = 0; ix < size; ix++){
                Skin.setPixel(x + ix, y + iy, color, 255);
            }
        }

        if(force){
            Skin.setPixel(x, y, color, 255);
        }
    },

    erase(x, y, force = false){
        const size = this.brushSize;

        for(let iy = 0; iy < size; iy++){
            for(let ix = 0; ix < size; ix++){
                Skin.clearPixel(x + ix, y + iy);
            }
        }

        if(force){
            Skin.clearPixel(x, y);
        }
    },

    fill(startX, startY, color){
        const target = Skin.getPixel(startX, startY);

        const targetColor = target && target.color ? target.color : null;
        if(targetColor === color) return;

        const stack = [[startX, startY]];
        const visited = new Set();

        while(stack.length > 0){
            const [x, y] = stack.pop();
            const key = `${x},${y}`;

            if(visited.has(key)) continue;
            visited.add(key);

            if(!Skin.isInside(x, y)) continue;

            const pixel = Skin.getPixel(x, y);
            const pixelColor = pixel && pixel.color ? pixel.color : null;

            if(pixelColor !== targetColor) continue;

            Skin.setPixel(x, y, color, 255);

            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    },

    drawLine(x1, y1, x2, y2, color){
        let dx = Math.abs(x2 - x1);
        let sx = x1 < x2 ? 1 : -1;
        let dy = -Math.abs(y2 - y1);
        let sy = y1 < y2 ? 1 : -1;
        let err = dx + dy;

        while(true){
            Skin.setPixel(x1, y1, color, 255);

            if(x1 === x2 && y1 === y2) break;

            const e2 = 2 * err;
            if(e2 >= dy){
                err += dy;
                x1 += sx;
            }
            if(e2 <= dx){
                err += dx;
                y1 += sy;
            }
        }
    },

    drawRect(x, y, w, h, color, filled = false){
        if(filled){
            for(let iy = y; iy < y + h; iy++){
                for(let ix = x; ix < x + w; ix++){
                    Skin.setPixel(ix, iy, color, 255);
                }
            }
            return;
        }

        for(let ix = x; ix < x + w; ix++){
            Skin.setPixel(ix, y, color, 255);
            Skin.setPixel(ix, y + h - 1, color, 255);
        }

        for(let iy = y; iy < y + h; iy++){
            Skin.setPixel(x, iy, color, 255);
            Skin.setPixel(x + w - 1, iy, color, 255);
        }
    },

    flipHorizontal(partName){
        const part = Skin.getPart(partName);
        if(!part) return;

        const copy = [];

        for(let y = 0; y < part.height; y++){
            copy[y] = [];
            for(let x = 0; x < part.width; x++){
                const pixel = Skin.getPixel(part.x + x, part.y + y);
                copy[y][x] = pixel ? pixel.color : null;
            }
        }

        for(let y = 0; y < part.height; y++){
            for(let x = 0; x < part.width; x++){
                const color = copy[y][part.width - 1 - x];
                if(color){
                    Skin.setPixel(part.x + x, part.y + y, color, 255);
                }else{
                    Skin.clearPixel(part.x + x, part.y + y);
                }
            }
        }

        Editor.render();
    },

    flipVertical(partName){
        const part = Skin.getPart(partName);
        if(!part) return;

        const copy = [];

        for(let y = 0; y < part.height; y++){
            copy[y] = [];
            for(let x = 0; x < part.width; x++){
                const pixel = Skin.getPixel(part.x + x, part.y + y);
                copy[y][x] = pixel ? pixel.color : null;
            }
        }

        for(let y = 0; y < part.height; y++){
            for(let x = 0; x < part.width; x++){
                const color = copy[part.height - 1 - y][x];
                if(color){
                    Skin.setPixel(part.x + x, part.y + y, color, 255);
                }else{
                    Skin.clearPixel(part.x + x, part.y + y);
                }
            }
        }

        Editor.render();
    },

    mirrorPartToOtherSide(sourceName, targetName){
        const source = Skin.getPart(sourceName);
        const target = Skin.getPart(targetName);

        if(!source || !target) return;

        for(let y = 0; y < source.height; y++){
            for(let x = 0; x < source.width; x++){
                const pixel = Skin.getPixel(source.x + x, source.y + y);
                if(pixel && pixel.color){
                    const tx = target.x + x;
                    const ty = target.y + y;
                    Skin.setPixel(tx, ty, pixel.color, 255);
                }else{
                    Skin.clearPixel(target.x + x, target.y + y);
                }
            }
        }

        Editor.render();
    }
};
