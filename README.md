# 🌃 Cyber City

A **cyberpunk-style 3D action game demo** built with **React**, **Three.js**, and **React Three Fiber**, set in a futuristic neon-lit city featuring combat, enemies, advanced visual effects, and mobile-optimized controls.

---

## 🎮 Overview

**Cyber City** is an action demo set in a futuristic metropolis.  
The player controls an armed character fighting enemies in a 3D environment filled with **neon lights, rain, holograms, and sci-fi architecture**.

The project is designed as a **proof of concept** for:

- Combat systems
- Enemy AI
- Global game state management
- Cinematic scenes and intro sequences

---

## ✨ Features

- **Cyberpunk 3D Environment** — Futuristic buildings, neon signs, rain, and urban skyline
- **Player Controller** — Movement, combat, and input handling
- **Enemy AI** — Enemies with dedicated behaviors
- **Boss AI** — Separate logic for special enemies
- **Combat System** — Projectiles, damage handling, and damage numbers
- **Cutscenes & Intro** — Cinematic intro management
- **UI Overlay** — In-game HUD and interface
- **Audio Manager** — Centralized audio handling
- **Mobile Controls** — Optimized controls for mobile devices
- **Camera Follow System** — Dynamic third-person camera
- **State Management** — Global state handled with Zustand

---

## 🛠️ Tech Stack

- React — Application structure and UI
- Three.js — 3D rendering
- React Three Fiber — React + Three.js integration
- @react-three/drei — 3D helpers and utilities
- Zustand — State management
- Vite — Dev server and build tool

---

## 🎮 Controls

### Desktop

- **W / A / S / D** — Movement
- **X** — Shoot
- **Z** — Shield

### Mobile

- **Virtual Joystick** — Movement
- **Touch Buttons** — Attack and actions

---

## 🧱 Project Structure

```
src/
├── App.jsx
├── index.jsx
├── index.css
├── components/
│   ├── Game.jsx
│   ├── Player.jsx
│   ├── Enemy.jsx
│   ├── Level.jsx
│   ├── UIOverlay.jsx
│   ├── AudioManager.jsx
│   ├── LoadingScreen.jsx
│   ├── CutsceneManager.jsx
│   ├── IntroUI.jsx
│   ├── MobileControls.jsx
│   └── backgroundElements/
│       ├── NeonSigns.jsx
│       ├── Rain.jsx
│       ├── Hologram.jsx
│       ├── ScifiBuilding.jsx
│       └── FuturisticPlaza.jsx
├── systems/
│   ├── usePlayerController.js
│   ├── useEnemyAI.js
│   ├── useBossAI.js
│   ├── useCombatSystem.js
│   ├── useCameraFollow.js
│   └── useInputSystem.js
├── store/
│   └── gameStore.js
└── constants/
    └── gameplayConstants.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/yourusername/cyber-city.git
cd cyber-city
npm install
```

### Development

```bash
npm run dev
```

Open your browser at:  
http://localhost:3000

### Production Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

---

## 🌐 Deploy

If you are using static hosting (e.g. Apache):

1. Set the correct base path in `vite.config.js`
2. Use the included `.htaccess` file for SPA routing
3. Upload the contents of the `dist/` folder

---

## 🎨 Customization

- **Gameplay** — Edit values in `constants/gameplayConstants.js`
- **Enemy AI** — Extend `useEnemyAI.js` or `useBossAI.js`
- **Environment** — Add new elements inside `backgroundElements/`
- **UI** — Customize `UIOverlay.jsx` and `IntroUI.jsx`

---

## 📄 License

MIT License - feel free to use and modify!

---

## 👨‍💻 Author

**Edoardo** - [edoedoedo.it](https://www.edoedoedo.it)
