// history.js
// Undo / Redo System für den Minecraft Pixeler

const History = {

    undoStack: [],
    redoStack: [],

    maxSteps: 100,


    save(){

        const state = this.createSnapshot();

        this.undoStack.push(state);


        if(this.undoStack.length > this.maxSteps){

            this.undoStack.shift();

        }


        // Sobald etwas Neues gemacht wird,
        // wird die alte Redo-Historie gelöscht

        this.redoStack = [];

    },


    undo(){

        if(this.undoStack.length === 0){

            return false;

        }


        const current = this.createSnapshot();

        this.redoStack.push(current);


        const previous = this.undoStack.pop();

        this.restoreSnapshot(previous);


        return true;

    },


    redo(){

        if(this.redoStack.length === 0){

            return false;

        }


        const current = this.createSnapshot();

        this.undoStack.push(current);


        const next = this.redoStack.pop();

        this.restoreSnapshot(next);


        return true;

    },


    createSnapshot(){

        return JSON.stringify({

            pixels: Skin.pixels,

            layers: Skin.layers

        });

    },


    restoreSnapshot(snapshot){

        try{


            const data = JSON.parse(snapshot);


            Skin.pixels = data.pixels;

            Skin.layers = data.layers;


            if(typeof Editor !== "undefined"){

                Editor.render();

            }


        }

        catch(error){

            console.error(
                "Fehler beim Wiederherstellen:",
                error
            );

        }

    },


    clear(){

        this.undoStack = [];

        this.redoStack = [];

    },


    canUndo(){

        return this.undoStack.length > 0;

    },


    canRedo(){

        return this.redoStack.length > 0;

    },


    getStatus(){

        return {

            undo:this.undoStack.length,

            redo:this.redoStack.length

        };

    }

};
