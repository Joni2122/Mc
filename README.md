# 🎮 Minecraft Pixeler - Professional Skin Editor

> Eine moderne Webseite zum Erstellen, Bearbeiten und Exportieren von Minecraft-Skins mit vollständiger Java & Bedrock Kompatibilität.

## 🌟 Features

### Editor
- ✅ Vollständiger 64×64 Pixel-Editor
- ✅ Präzise Pixelzeichnung und -bearbeitung
- ✅ Zoom ohne Qualitätsverlust (bis 20x)
- ✅ Ein-/Ausschaltbares Raster
- ✅ Undo/Redo mit voller History

### Werkzeuge
- 🖌️ Pinsel
- 🧹 Radierer
- 🪣 Farbeimer
- 🔍 Pipette
- 📏 Linie
- ▭ Rechteck
- ●  Kreis
- ⊞ Auswahl
- ↔️ Spiegeln
- 📋 Kopieren/Einfügen

### Farben
- Farbrad (HSV)
- RGB-Eingabe
- HEX-Eingabe
- Transparenzregler
- Minecraft-Farbpalette
- Zuletzt verwendete Farben

### Ebenen
- Base Layer
- Overlay Layer
- Umschalten zwischen Ebenen
- Ein-/Ausblenden

### 3D-Vorschau
- Echtzeit-Vorschau der Änderungen
- Frei drehbar
- Automatische Rotation
- Bewegungen (Arme/Beine)
- 60 FPS Performance

### Import/Export
- PNG-Import
- Drag & Drop Unterstützung
- Zwischenablage-Paste
- 64×64 PNG mit Transparenz
- Minecraft Java & Bedrock kompatibel

### Startanimation
- Minecraft-Grasblock
- Abbau-Animation
- Partikle-Explosion
- Leuchtender Titel

### Design
- Glassmorphism UI
- Minecraft-inspiriert
- Grüne Akzentfarben
- Weiche Animationen
- Responsive (Mobile-ready)

## 🎮 Tastenkürzel

| Taste | Funktion |
|-------|----------|
| `Ctrl+Z` | Rückgängig |
| `Ctrl+Y` | Wiederholen |
| `B` | Pinsel |
| `E` | Radierer |
| `F` | Füllen |
| `I` | Pipette |
| `G` | Gitter |

## 📁 Projektstruktur

```
src/
├── js/
│   ├── main.js                 # App-Einstiegspunkt
│   ├── animations/
│   │   └── startAnimation.js   # Startanimation
│   ├── editor/
│   │   └── pixelEditor.js      # Pixel-Editor-Logik
│   ├── 3d/
│   │   └── previewRenderer.js  # 3D-Vorschau (Three.js)
│   ├── manager/
│   │   └── skinManager.js      # Skin-Management & Storage
│   ├── ui/
│   │   └── uiManager.js        # UI-Komponenten
│   └── input/
│       └── keyboardShortcuts.js # Tastenkürzel
├── styles/
│   └── main.css                # Gesamte Styling
index.html                       # HTML-Struktur
package.json                     # Dependencies
```

## 🚀 Installation & Start

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Production Build
npm run build
```

## 🛠️ Technologie-Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Rendering**: Canvas API
- **3D**: Three.js (optional)
- **Styling**: CSS3 mit Glassmorphism
- **Build**: Vite
- **Storage**: LocalStorage für Auto-Save

## 📋 Minecraft Skin-Struktur

Der Editor unterstützt die vollständige Minecraft-Skin-Struktur:

- **Kopf** (8×8 pro Seite)
- **Körper** (8×12)
- **Arme** (4×12 pro Arm)
- **Beine** (4×12 pro Bein)
- **Overlay-Schichten** für alle Teile
- **Slim Arms** Support
- **Classic** Support

## 🎨 Minecraft-Kompatibilität

Alle exportierten Skins sind zu 100% kompatibel mit:
- ✅ Minecraft Java Edition
- ✅ Minecraft Bedrock Edition
- ✅ Alle Plattformen (PC, Konsole, Mobile)

## 📱 Mobile Unterstützung

- ✅ Touch-Drawing
- ✅ Pinch-to-Zoom
- ✅ Touch-Gesten
- ✅ Vollbildmodus
- ✅ Responsive Layout

## 🎯 Performance

- 60 FPS Canvas-Rendering
- Optimierte Zeichenoperationen
- Effiziente Layer-Verwaltung
- Performanter 3D-Vorschau
- Performant auf allen Browsern

## 🔐 Datensicherheit

- Auto-Save im Browser (LocalStorage)
- Keine Server-Speicherung
- Alle Daten lokal auf dem Gerät
- Volle Privatsphäre der Nutzer

## 📝 Lizenz

MIT License - Frei verwendbar

## 🤝 Beiträge

Beiträge sind willkommen! Bitte erstelle einen Pull Request mit deinen Änderungen.

---

**Erstellt mit ❤️ für die Minecraft-Community**
