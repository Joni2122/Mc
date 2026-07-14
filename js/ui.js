// ui.js
// Benutzeroberfläche: Buttons, Werkzeuge, Menüs und Anzeigen

const UI = {

    init() {

        this.bindTools();
        this.bindColors();
        this.bindLayerButtons();
        this.bindPartButtons();

    },


    bindTools() {

        const buttons = document.querySelectorAll("[data-tool]");


        buttons.forEach(button => {

            button.addEventListener("click", () => {

                const tool = button.dataset.tool;


                if(typeof Tools !== "undefined") {

                    Tools.setTool(tool);

                }


                this.setActiveButton(button);

            });

        });

    },


    bindColors() {

        const colorInput =
            document.getElementById("colorPicker");


        if(colorInput) {

            colorInput.addEventListener(
                "input",
                () => {

                    if(typeof Tools !== "undefined") {

                        Tools.setColor(
                            colorInput.value
                        );

                    }

                }
            );

        }


        const palette =
            document.querySelectorAll(
                "[data-color]"
            );


        palette.forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const color =
                        item.dataset.color;


                    if(typeof Tools !== "undefined") {

                        Tools.setColor(color);

                    }


                    if(typeof Editor !== "undefined") {

                        Editor.syncColorUI(color);

                    }

                }
            );

        });

    },


    bindLayerButtons() {

        const layerButtons =
            document.querySelectorAll(
                "[data-layer]"
            );


        layerButtons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const layer =
                        button.dataset.layer;


                    if(typeof Layers !== "undefined") {

                        Layers.setActive(layer);

                    }


                    this.setActiveButton(button);

                }
            );

        });

    },


    bindPartButtons() {

        const parts =
            document.querySelectorAll(
                "[data-part]"
            );


        parts.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const part =
                        button.dataset.part;


                    if(typeof Editor !== "undefined") {

                        Editor.selectPart(part);

                    }

                }
            );

        });

    },


    setActiveButton(active) {

        const buttons =
            document.querySelectorAll(
                ".tool-button.active"
            );


        buttons.forEach(button => {

            button.classList.remove(
                "active"
            );

        });


        if(active) {

            active.classList.add(
                "active"
            );

        }

    },


    showNotification(text) {

        let box =
            document.getElementById(
                "notification"
            );


        if(!box) {

            box =
                document.createElement(
                    "div"
                );

            box.id =
                "notification";


            document.body.appendChild(
                box
            );

        }


        box.textContent = text;


        box.classList.add(
            "show"
        );


        setTimeout(() => {

            box.classList.remove(
                "show"
            );

        }, 1800);

    },


    updateStats() {

        const pixelCount =
            document.getElementById(
                "pixelCount"
            );


        if(!pixelCount ||
           typeof Skin === "undefined") {

            return;

        }


        let count = 0;


        for(let y = 0; y < Skin.height; y++) {

            for(let x = 0; x < Skin.width; x++) {

                const pixel =
                    Skin.getPixel(
                        x,
                        y
                    );


                if(
                    pixel &&
                    pixel.color &&
                    pixel.alpha > 0
                ) {

                    count++;

                }

            }

        }


        pixelCount.textContent =
            `${count} Pixel`;

    },


    openPanel(id) {

        const panel =
            document.getElementById(id);


        if(panel) {

            panel.classList.add(
                "open"
            );

        }

    },


    closePanel(id) {

        const panel =
            document.getElementById(id);


        if(panel) {

            panel.classList.remove(
                "open"
            );

        }

    }

};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        UI.init();

    }
);
