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

- **Cyberpunk 3D Environment** — Futuristic buildings, neon signs, rain, holograms, and urban skyline
- **Player Controller** — Movement, dash with cyan trail, shooting, melee, and energy shield
- **Enemy AI** — Multiple grunt archetypes with line-of-sight, attack windows, and stun-resist
- **Boss AI** — Multi-phase cyberpsycho with dedicated FSM and death cutscene
- **Combat System** — Object-pooled projectiles, damage numbers, kill-cam slow-mo
- **Cinematic Intro** — In-engine 19s sequence: hologram close-up → camera dive → agent materialization (converging sparks) → 4-line OPERATOR/AGENT chat
- **Cinematic Outro** — Mirror sequence on victory: settle → 4-line debrief → dematerialization (dispersing sparks) → camera pull-up to hologram, leading into the credits modal
- **Dialogue HUD** — Terminal-style chat bubbles with corner brackets, telemetry header, and skip controller
- **Pause / Victory Modals** — Both include portfolio credits with links to [edoedoedo.it](https://www.edoedoedo.it) and GitHub
- **Audio Manager** — Web Audio API for gapless rain loop (mp3 tail trim), pause-aware, plus music + SFX via HTMLAudio
- **Symmetric Level Bounds** — Player can fall off both ends of the walkway (death respawn) for added platforming risk
- **Tunable Boss Combat** — BURST / DASH_SHOT / SINGLE combos with phase-2 probability shifts and global cooldown multipliers
- **UI Overlay** — In-game HUD (agent + shield + boss bars) and overlays
- **Mobile Controls** — Virtual joystick + action buttons, landscape lock
- **Camera Follow System** — Decoupled from React reactivity (writes in-place during cinematic phases) for stutter-free playback
- **State Management** — Zustand with `subscribeWithSelector`; gameplay systems read state via `getState()` inside `useFrame` to avoid 60 fps re-renders

---

## 🎬 Cinematics

The intro and outro are fully in-engine, scripted via timeline managers that drive the camera and player materialization through the global store.

| Phase         | Window       | What happens                                              |
| ------------- | ------------ | --------------------------------------------------------- |
| Holo close-up | 0 – 4.0 s    | Tight shot on the hologram dancer, micro drift            |
| Dolly down    | 4.0 – 7.5 s  | Camera dives down + pulls back, revealing the street      |
| Street settle | 7.5 – 8.0 s  | Low ground framing, sparks ramp                           |
| Materialize   | 8.0 – 10.0 s | Agent fades in with glitch flicker + scale.y collapse     |
| Dialogue      | 11 – 17 s    | 4 OPERATOR / AGENT beats over a stable, materialized hero |
| Settle        | 17 – 18.5 s  | Zoom out to gameplay framing                              |
| Hand-off      | 18.5 – 19 s  | `endIntro()` → `GAME_PHASES.PLAYING`                      |

The outro mirrors this sequence with dispersing sparks, dematerialization, and a slow camera pull-up to the hologram before the VICTORY modal appears.

---

## 🛠️ Tech Stack

- React 18 — Application structure and UI
- Three.js 0.158 — 3D rendering
- React Three Fiber 8 — React + Three.js integration
- @react-three/drei 9 — 3D helpers and utilities
- @react-three/postprocessing — Bloom + glitch effects
- Zustand 4 (`subscribeWithSelector`) — State management
- Web Audio API — Gapless rain loop
- Vite 5 — Dev server and build tool

---

## 🎮 Controls

### Desktop

| Action | Keys                              |
| ------ | --------------------------------- |
| Move   | `A` / `D` or `←` / `→`            |
| Jump   | `W` / `↑` / `Space`               |
| Shoot  | `X` / `J`                         |
| Shield | `Z` / `K`                         |
| Dash   | `Shift` / `C`                     |
| Pause  | `Esc` / `P`                       |
| Skip   | `Space` / `Enter` (during scenes) |

### Mobile

- **Left side** — Virtual joystick for movement
- **Right side** — `DASH`, `JUMP`, `SHOOT`, `SHIELD` action buttons
- Landscape orientation required (auto-prompt on portrait)

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
│   ├── AudioManager.jsx           # Web Audio rain + HTMLAudio music/SFX
│   ├── CutsceneManager.jsx        # Boss intro & death cutscenes
│   ├── IntroManager.jsx           # In-engine intro timeline (lazy)
│   ├── IntroUI.jsx                # Intro chat + HUD chrome
│   ├── OutroManager.jsx           # In-engine outro timeline (lazy)
│   ├── OutroUI.jsx                # Outro chat + HUD chrome
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
│   ├── useInputSystem.js
│   ├── particlePool.js            # sparks / converging / dispersing
│   └── projectilePool.js
├── store/
│   └── gameStore.js               # Zustand store + intro/outro slices
└── constants/
    ├── gameplayConstants.js       # GAME_PHASES (incl. INTRO / OUTRO)
    ├── introMessages.js
    └── outroMessages.js
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
http://localhost:5173

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

- **Gameplay** — Edit values in `constants/gameplayConstants.js` (HP, level bounds, platform layout, boss combo probabilities, etc.)
- **Enemy AI** — Extend `useEnemyAI.js` or `useBossAI.js`
- **Environment** — Add new elements inside `backgroundElements/`
- **UI** — Customize `UIOverlay.jsx`, `IntroUI.jsx`, `OutroUI.jsx`
- **Cinematic dialogue** — Edit `constants/introMessages.js` and `constants/outroMessages.js` (timestamps in seconds, sender = `operator | agent`)
- **Cinematic timing** — Tweak the `T_*` beat constants at the top of `IntroManager.jsx` / `OutroManager.jsx`

---

## 🎨 Credits & Assets

Some 3D models, textures and audio used in this demo were sourced from
royalty-free repositories (Sketchfab, Poly Pizza, Quaternius, etc.) during
prototyping, and original attribution data was not preserved in every case.

If you are the author of any asset and would like proper attribution — or its
removal — please open an issue and the credits will be updated, or the asset
swapped, immediately.

Cyber City is a non-commercial portfolio demo.

---

## 📄 License

MIT License - feel free to use and modify!

---

## 👨‍💻 Author

**Edoardo** - [edoedoedo.it](https://www.edoedoedo.it)
