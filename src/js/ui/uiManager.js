export class UIManager {
  constructor(editor, skinManager) {
    this.editor = editor;
    this.skinManager = skinManager;
  }

  init() {
    console.log('Initializing UI Manager...');
    this.setupToolGrid();
    this.setupLayerUI();
    this.setupSkinPartsUI();
    this.setupEventHandlers();
  }

  setupToolGrid() {
    const tools = [
      { id: 'brush', icon: '🖌️', label: 'Pinsel' },
      { id: 'eraser', icon: '🧹', label: 'Radierer' },
      { id: 'bucket', icon: '🪣', label: 'Füllen' },
      { id: 'pipette', icon: '🔍', label: 'Pipette' },
      { id: 'line', icon: '📏', label: 'Linie' },
      { id: 'rect', icon: '▭', label: 'Rechteck' },
      { id: 'circle', icon: '●', label: 'Kreis' },
      { id: 'select', icon: '⊞', label: 'Auswahl' }
    ];

    const grid = document.getElementById('toolGrid');
    grid.innerHTML = '';

    tools.forEach(tool => {
      const btn = document.createElement('button');
      btn.className = 'tool-btn' + (tool.id === 'brush' ? ' active' : '');
      btn.innerHTML = tool.icon;
      btn.title = tool.label;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.editor.setTool(tool.id);
      });
      grid.appendChild(btn);
    });
  }

  setupLayerUI() {
    const layers = [
      { id: 'base', name: 'Base Layer' },
      { id: 'overlay', name: 'Overlay Layer' }
    ];

    const container = document.getElementById('layersContainer');
    container.innerHTML = '';

    layers.forEach(layer => {
      const item = document.createElement('div');
      item.className = 'layer-item' + (layer.id === 'base' ? ' active' : '');
      item.innerHTML = `
        <span>${layer.name}</span>
        <input type="checkbox" ${layer.id === 'base' ? '' : 'checked'} class="layer-visibility">
      `;
      item.addEventListener('click', () => {
        document.querySelectorAll('.layer-item').forEach(l => l.classList.remove('active'));
        item.classList.add('active');
        this.editor.setLayer(layer.id);
      });
      container.appendChild(item);
    });
  }

  setupSkinPartsUI() {
    const parts = [
      'Kopf', 'Körper', 'R. Arm', 'L. Arm',
      'R. Bein', 'L. Bein', 'Hut', 'Jacke'
    ];

    const container = document.getElementById('skinParts');
    container.innerHTML = '';

    parts.forEach(part => {
      const btn = document.createElement('button');
      btn.className = 'skin-part-btn';
      btn.textContent = part;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.skin-part-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      container.appendChild(btn);
    });
  }

  setupEventHandlers() {
    // Color Picker
    document.getElementById('colorInput').addEventListener('change', (e) => {
      this.editor.setColor(e.target.value);
      document.getElementById('hexInput').value = e.target.value;
    });

    // Brush Size
    document.getElementById('brushSize').addEventListener('input', (e) => {
      this.editor.setBrushSize(parseInt(e.target.value));
      document.getElementById('brushSizeDisplay').textContent = e.target.value + 'px';
    });

    // Zoom
    document.getElementById('zoomSlider').addEventListener('input', (e) => {
      this.editor.setZoom(parseInt(e.target.value));
      document.getElementById('zoomDisplay').textContent = e.target.value + 'x';
    });

    // Alpha
    document.getElementById('alphaSlider').addEventListener('input', (e) => {
      this.editor.setAlpha(parseInt(e.target.value));
    });

    // Toolbar
    document.getElementById('undoBtn').addEventListener('click', () => this.editor.undo());
    document.getElementById('redoBtn').addEventListener('click', () => this.editor.redo());
    document.getElementById('clearBtn').addEventListener('click', () => {
      if (confirm('Wirklich alles löschen?')) {
        this.editor.clear();
      }
    });
    document.getElementById('gridToggle').addEventListener('click', () => this.editor.toggleGrid());

    // Import/Export
    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const img = await this.skinManager.importSkin(file);
        console.log('Skin imported:', img);
      }
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      const filename = prompt('Dateiname:', 'skin');
      if (filename) {
        this.skinManager.exportSkin(this.editor.getSkinData(), filename);
      }
    });
  }
}
