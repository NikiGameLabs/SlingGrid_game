# SlingGrid 🚀🪐

An original, minimalist orbital physics-puzzle game built with **Phaser** and **Vite**, designed for high-performance instant loading on web portals and **YouTube Playables**.

---

## 🎮 Gameplay & Mechanics

1. **Slingshot Drag & Launch**: Click or touch and drag backward on the energy orb to aim a predictive trajectory arc. Release to launch.
2. **Gravitational Anchor Nodes**: Fixed gravity anchors radiate an orbital aura. Enter an anchor's radius and **hold** to lock into a circular orbit.
3. **Slingshot Pivot**: **Release** while in orbit to fling the orb tangentially at high speed.
4. **Target Core**: Navigate around deflector barriers and moving hazards to synchronize with the energetic collection core.
5. **Star Ratings**: Complete each sector in minimal moves to earn up to 3 stars!

---

## 🛠️ Architecture & Tech Stack

- **Game Engine**: [Phaser](https://phaser.io/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Audio**: Procedural Web Audio API sound synthesizer (zero external audio file dependencies)
- **Art**: Procedural vector & geometric canvas rendering (zero external image dependencies)
- **SDK Compatibility**: Pre-configured with the **YouTube Playables SDK** lifecycle hooks (`firstFrameReady`, `gameReady`, audio pause/resume, and cloud saves)
- **CI/CD**: GitHub Actions workflow deploying automatically to GitHub Pages

---

## 📁 Project Structure

```
SlingGrid_game/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages CI/CD workflow
├── README.md
└── orbit-pivot/                # Game source and build directory
    ├── index.html              # Responsive canvas mount
    ├── package.json
    ├── vite.config.js          # Vite configuration
    └── src/
        ├── main.js             # Phaser Game initialization
        ├── style.css           # Responsive layout & theme
        ├── config/
        │   └── gameConfig.js   # Level definitions & theme colors
        ├── audio/
        │   └── SoundManager.js # Synthesized Web Audio FX
        ├── sdk/
        │   └── PlayablesSDK.js # YouTube Playables SDK wrapper
        ├── objects/
        │   ├── Ball.js         # Slingshot drag, orbit & trajectory
        │   ├── GravityNode.js  # Gravity anchor & aura physics
        │   └── TargetCore.js   # Rotating goal hexagon & win detection
        └── scenes/
            ├── BootScene.js    # Preloader & firstFrameReady hook
            ├── MenuScene.js    # Title, sector select & audio toggle
            └── GameScene.js    # Physics loop, collisions & victory modal
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Run Locally
```bash
cd orbit-pivot
npm install
npm run dev
```

The game will be available at `http://localhost:5173/`.

### Build for Production (or YouTube Playables .zip bundle)
```bash
cd orbit-pivot
npm run build
```
The output directory will be in `orbit-pivot/dist/`. For YouTube Playables submission or web portals, simply zip the contents of `dist/`.
