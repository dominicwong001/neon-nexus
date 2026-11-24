# Lumen Pit

A black infinite arena. The core stays in the middle of the screen. WASD drifts the lattice, and white rounds fire toward the cursor.

Hostile shapes wander in from the dark. Triangles and the small circles that split off have 100 health. Squares have 200. Big circles have 300, then split into smaller circles. A red hex shows up rarely, and it has 1000 health. Every shape drops a small glowing square. Circles drop a larger lilac square worth more. Orbs fill the bar at the top of the screen. Each level asks for more than the last. When the bar fills, the pit holds still and you pick one of three upgrades. The cards are a fresh mix of whatever is still unfinished. Drone hovers nearby, locks a square reticle, and pours rectangular rockets into it for a few seconds before reloading. Its fifth rank, Bulletstorm, turns the drone red and barely pauses. Black Hole is always among the three upgrade cards while it still has ranks left. It opens a pitch-black well with a blazing photon ring and thick clockwise spiral arms that pull hostiles in and burn them; its fifth rank, Singularity, turns the swirl crimson and detonates a blast that grows with the damage it absorbed. Bouncy Ball ricochets inside the screen. Its last rank, Quantum Core, is red, and a hit splits each ball into two smaller ones.

Contact cracks the hull. The bar on the left shows what is left. Five cracks and the core is lost.

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
- On a phone or iPad, the **left stick** drifts and the **right stick** aims. Each stick follows the finger, so it is not locked to where the touch started.
- **R** or **Reform** starts another run after the core is lost.
- **Audio** toggles the synth. **Full screen** fills the display.
