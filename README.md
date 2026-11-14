# Lumen Pit

A black infinite arena. The core stays in the middle of the screen. WASD drifts the lattice, and white rounds fire toward the cursor.

Hostile shapes wander in from the dark. Triangles are fast and break in one hit. Squares take two. Circles split into smaller circles. Every shape drops a glowing orb. Circles drop a larger lilac orb worth more. Orbs fill the bar at the top of the screen. When it fills, the pit holds still and you pick one of three upgrades.

Contact cracks the hull. Five cracks and the core is lost. Reform keeps your best score on this browser.

## Run

```bash
npm install
npm run dev
```

Vite prints a local URL. The dev server uses port **4731**.

```bash
npm run check
npm run build
```

## Controls

- **W A S D** or the arrow keys drift. The core stays centered.
- The **cursor** aims each shot. It fires on its own.
- Walk over **orbs** to fill the bar. **1**, **2**, or **3** picks an upgrade when it fills.
- On a touch screen, **drag the left side** to drift and **touch the right side** to aim.
- **R** or **Reform** starts another run after the core is lost.
- **Audio** toggles the synth. **Full screen** fills the display.
