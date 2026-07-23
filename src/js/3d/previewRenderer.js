import * as THREE from 'three';

/**
 * PreviewRenderer
 * Rendert eine 3D-Vorschau des Minecraft-Skins (Steve/Alex-Modell) in Echtzeit,
 * mit freier Rotation, Auto-Rotation und einfachen Bewegungsanimationen.
 */
export class PreviewRenderer {
  constructor({ canvasId, skinManager }) {
    this.canvas = document.getElementById(canvasId);
    this.skinManager = skinManager;

    this.autoRotate = false;
    this.animate = false;
    this.slimArms = false;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.model = null;
    this.texture = null;

    this.isDragging = false;
    this.previousMouse = { x: 0, y: 0 };
    this.rotationY = 0.4;
    this.rotationX = 0;

    this._animTime = 0;
  }

  init() {
    this._setupScene();
    this._buildModel();
    this._bindControls();
    this._loop();
    window.addEventListener('resize', () => this._onResize());
    this._onResize();
  }

  _setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 60);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(1, 1, 1);
    this.scene.add(ambient, directional);
  }

  _buildModel() {
    this.texture = new THREE.CanvasTexture(this.skinManager.getFullSkinCanvas());
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;

    const material = new THREE.MeshLambertMaterial({ map: this.texture, transparent: true });

    this.model = new THREE.Group();

    // Vereinfachtes Steve/Alex-Modell aus Boxen, UV-Mapping folgt Minecraft-Skin-Layout
    const armWidth = this.slimArms ? 3 : 4;

    this.head = this._makeBoxPart(8, 8, 8, material);
    this.head.position.y = 12;
    this.body = this._makeBoxPart(8, 12, 4, material);
    this.body.position.y = 2;
    this.armL = this._makeBoxPart(armWidth, 12, 4, material);
    this.armL.position.set(-(4 + armWidth / 2), 2, 0);
    this.armR = this._makeBoxPart(armWidth, 12, 4, material);
    this.armR.position.set(4 + armWidth / 2, 2, 0);
    this.legL = this._makeBoxPart(4, 12, 4, material);
    this.legL.position.set(-2, -10, 0);
    this.legR = this._makeBoxPart(4, 12, 4, material);
    this.legR.position.set(2, -10, 0);

    this.model.add(this.head, this.body, this.armL, this.armR, this.legL, this.legR);
    this.model.rotation.y = this.rotationY;
    this.scene.add(this.model);
  }

  _makeBoxPart(w, h, d, material) {
    const geometry = new THREE.BoxGeometry(w, h, d);
    return new THREE.Mesh(geometry, material);
  }

  updateTexture() {
    if (!this.texture) return;
    this.texture.needsUpdate = true;
  }

  rebuildForArmType(isSlim) {
    this.slimArms = isSlim;
    this.model.remove(this.armL, this.armR);
    this._buildModel();
  }

  _bindControls() {
    const start = (e) => {
      this.isDragging = true;
      const p = e.touches ? e.touches[0] : e;
      this.previousMouse = { x: p.clientX, y: p.clientY };
    };
    const move = (e) => {
      if (!this.isDragging) return;
      const p = e.touches ? e.touches[0] : e;
      const dx = p.clientX - this.previousMouse.x;
      const dy = p.clientY - this.previousMouse.y;
      this.rotationY += dx * 0.01;
      this.rotationX = Math.max(-0.6, Math.min(0.6, this.rotationX + dy * 0.01));
      this.previousMouse = { x: p.clientX, y: p.clientY };
    };
    const end = () => { this.isDragging = false; };

    this.canvas.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    this.canvas.addEventListener('touchstart', start, { passive: true });
    this.canvas.addEventListener('touchmove', move, { passive: true });
    this.canvas.addEventListener('touchend', end);
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
  }

  toggleAnimation() {
    this.animate = !this.animate;
  }

  _onResize() {
    const wrapper = this.canvas.parentElement;
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  _loop() {
    requestAnimationFrame(() => this._loop());

    if (this.autoRotate) this.rotationY += 0.008;
    this.model.rotation.y = this.rotationY;
    this.model.rotation.x = this.rotationX;

    if (this.animate) {
      this._animTime += 0.05;
      const swing = Math.sin(this._animTime) * 0.5;
      this.armL.rotation.x = swing;
      this.armR.rotation.x = -swing;
      this.legL.rotation.x = -swing;
      this.legR.rotation.x = swing;
    } else {
      this.armL.rotation.x = 0;
      this.armR.rotation.x = 0;
      this.legL.rotation.x = 0;
      this.legR.rotation.x = 0;
    }

    this.renderer.render(this.scene, this.camera);
  }
      }
