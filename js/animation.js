// animation.js
// Startanimation mit Grasblock-Explosion und Übergang

const SplashAnimation = {

    splashEl: null,
    blockEl: null,
    particlesEl: null,
    started: false,

    init() {
        this.splashEl = document.getElementById("splash");
        this.blockEl = document.getElementById("splashBlock");
        this.particlesEl = document.getElementById("particles");

        if (!this.splashEl) return;

        this.createParticles();
        this.play();
    },


    createParticles() {
        if (!this.particlesEl) return;

        this.particlesEl.innerHTML = "";

        const directions = [
            [-60, -20],
            [-35, -55],
            [0, -70],
            [35, -55],
            [60, -20],
            [75, 15],
            [50, 55],
            [10, 75],
            [-25, 60],
            [-65, 35]
        ];

        directions.forEach((dir, i) => {
            const p = document.createElement("div");
            p.className = "particle";
            p.style.left = "40px";
            p.style.top = "40px";
            p.style.setProperty("--dx", `${dir[0]}px`);
            p.style.setProperty("--dy", `${dir[1]}px`);
            p.style.animationDelay = `${i * 25}ms`;
            this.particlesEl.appendChild(p);
        });
    },


    play() {
        if (this.started) return;
        this.started = true;

        setTimeout(() => {
            if (this.splashEl) {
                this.splashEl.classList.add("
