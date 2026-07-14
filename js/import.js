// import.js
// Import von Minecraft-Skins als PNG

const SkinImporter = {

    loadFile(file) {

        if (!file) return;


        if (!file.type.includes("png")) {

            alert("Bitte eine PNG-Datei auswählen.");

            return;

        }


        const reader = new FileReader();


        reader.onload = (event) => {

            this.loadImage(event.target.result);

        };


        reader.readAsDataURL(file);

    },


    loadImage(source) {

        const img = new Image();


        img.onload = () => {

            if(img.width !== 64 || img.height !== 64){

                const answer = confirm(
                    "Der Skin ist nicht 64x64 Pixel groß. Soll er angepasst werden?"
                );


                if(!answer){

                    return;

                }

            }


            const canvas = document.createElement("canvas");

            canvas.width = 64;

            canvas.height = 64;


            const ctx = canvas.getContext(
                "2d",
                {
                    willReadFrequently:true
                }
            );


            ctx.imageSmoothingEnabled = false;


            ctx.clearRect(
                0,
                0,
                64,
                64
            );


            ctx.drawImage(
                img,
                0,
                0,
                64,
                64
            );


            const imageData = ctx.getImageData(
                0,
                0,
                64,
                64
            );


            History.save();


            for(let y = 0; y < 64; y++){

                for(let x = 0; x < 64; x++){


                    const index =
                        (y * 64 + x) * 4;


                    const r =
                        imageData.data[index];


                    const g =
                        imageData.data[index + 1];


                    const b =
                        imageData.data[index + 2];


                    const a =
                        imageData.data[index + 3];


                    if(a === 0){

                        Skin.clearPixel(
                            x,
                            y
                        );

                    }

                    else {

                        Skin.setPixel(
                            x,
                            y,
                            `rgb(${r},${g},${b})`,
                            a
                        );

                    }

                }

            }


            Editor.render();


        };


        img.onerror = () => {

            alert(
                "Der Skin konnte nicht geladen werden."
            );

        };


        img.src = source;

    },


    loadFromURL(url){

        const img = new Image();

        img.crossOrigin = "anonymous";


        img.onload = () => {

            const canvas =
                document.createElement("canvas");


            canvas.width = 64;

            canvas.height = 64;


            const ctx =
                canvas.getContext("2d");


            ctx.imageSmoothingEnabled = false;


            ctx.drawImage(
                img,
                0,
                0,
                64,
                64
            );


            this.loadImage(
                canvas.toDataURL("image/png")
            );

        };


        img.src = url;

    },


    createInput(){

        const input =
            document.createElement("input");


        input.type = "file";

        input.accept = "image/png";


        input.style.display = "none";


        document.body.appendChild(input);


        input.addEventListener(
            "change",
            () => {

                const file =
                    input.files[0];


                if(file){

                    this.loadFile(file);

                }

            }
        );


        return input;

    }

};
