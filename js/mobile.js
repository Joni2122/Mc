// mobile.js
// Mobile Optimierung: Touch-Steuerung, Gesten und Handy-Anpassungen

const Mobile = {

    isMobile: false,

    startX: 0,
    startY: 0,

    lastDistance: 0,

    init() {

        this.detect();

        if(this.isMobile) {

            this.enableTouch();

            this.optimizeLayout();

        }

    },


    detect() {

        this.isMobile =
            /Android|iPhone|iPad|iPod/i.test(
                navigator.userAgent
            );

    },


    enableTouch() {

        const canvas =
            document.getElementById(
                "editorCanvas"
            );


        if(!canvas) return;


        canvas.style.touchAction =
            "none";


        canvas.addEventListener(
            "touchstart",
            (event) => {

                if(event.touches.length === 1) {

                    this.startX =
                        event.touches[0].clientX;

                    this.startY =
                        event.touches[0].clientY;

                }

            },
            {
                passive:false
            }
        );


        canvas.addEventListener(
            "touchmove",
            (event) => {

                event.preventDefault();


                if(event.touches.length === 1) {


                    const touch =
                        event.touches[0];


                    const rect =
                        canvas.getBoundingClientRect();


                    const x =
                        Math.floor(
                            ((touch.clientX - rect.left)
                            / rect.width)
                            * Skin.width
                        );


                    const y =
                        Math.floor(
                            ((touch.clientY - rect.top)
                            / rect.height)
                            * Skin.height
                        );


                    if(
                        typeof Tools !== "undefined"
                    ) {

                        Tools.handlePointerMove(
                            x,
                            y
                        );

                    }

                }


                if(event.touches.length === 2) {

                    this.handlePinch(event);

                }

            },
            {
                passive:false
            }
        );


        canvas.addEventListener(
            "touchend",
            () => {

                if(typeof Tools !== "undefined") {

                    Tools.handlePointerUp();

                }

            }
        );

    },


    handlePinch(event) {

        const a =
            event.touches[0];

        const b =
            event.touches[1];


        const distance =
            Math.hypot(
                b.clientX - a.clientX,
                b.clientY - a.clientY
            );


        if(this.lastDistance !== 0) {

            const diff =
                distance -
                this.lastDistance;


            if(
                Math.abs(diff) > 5 &&
                typeof Editor !== "undefined"
            ) {

                const zoom =
                    Editor.scale +
                    (diff > 0 ? 1 : -1);


                Editor.setZoom(
                    zoom
                );

            }

        }


        this.lastDistance =
            distance;

    },


    optimizeLayout() {

        document.body.classList.add(
            "mobile"
        );


        const buttons =
            document.querySelectorAll(
                "button"
            );


        buttons.forEach(button => {

            button.style.minHeight =
                "44px";

        });

    },


    addFullscreenButton() {

        const button =
            document.createElement(
                "button"
            );


        button.textContent =
            "⛶ Vollbild";


        button.className =
            "fullscreen-button";


        button.onclick = () => {

            if(
                document.fullscreenElement
            ) {

                document.exitFullscreen();

            }

            else {

                document.documentElement.requestFullscreen();

            }

        };


        document.body.appendChild(
            button
        );

    }

};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        Mobile.init();

    }
);
