# Local release verification · October 5, 2026

## Build and assets

- The recovered source failed its baseline Next.js 15.1.5 production build on an implicit `any` in `Model.tsx`. Installation also exposed incompatible Three.js peer requirements and React 19 types alongside React 18.
- A clean `npm ci` with the updated lockfile and `npm run build` passed using Node 22.13.0. Next.js is pinned to 15.5.27, React/types to 18, and Three.js/types to 0.172.0.
- `npm run lint`, `npm run typecheck`, seven unit/API tests, and checksum/container checks for eight active models plus two supplementary exports passed. The recovery import was verified against the user-supplied Downloads files and the recovered Molecule.
- Sixteen production-browser checks passed across the full run and a focused animation rerun: eight flows in desktop Chrome and eight in mobile emulation. These cover all eight model loads, navigation endpoints, keyboard/wheel input, reduced motion, annotation parity and placement, reset, offline AI, delayed responses across scene changes, model retry, legacy routes, WebGL-unavailable recovery, and Solar System play/pause without resetting. The pause comparison ignores RGB channel differences of at most 2/255 to avoid insignificant background compositing roundoff; meaningful model motion must occur before pausing, and then stop.
- No paid AI call or public deployment occurred. Live model quality is not evaluated; see `AI-EVALUATION.md`.

## Measured loading

Measurements are in `loading-measurements.json`. Conditions: Windows, installed Chrome, software WebGL (SwiftShader), 1440 × 1000, local HTTP, no artificial network/CPU throttle, and a fresh browser context per run. Baseline is the recovered renderer from merge commit `593b42a` running on the patched dependencies in development mode because the original source does not production-build. Improved is the production build. Readiness is marked two browser animation frames after the active model mounts. The first baseline run also includes development compilation.

| Measurement | Recovered baseline | Improved local release |
| --- | --- | --- |
| Initial model + lighting transfer | 97,557,657 bytes | 918,201 bytes |
| Initial requested 3D assets | `atom.glb` + `moonlit_night.exr` | `atom.glb` only |
| Ready time, run 1 | 18,977 ms | 1,028 ms |
| Ready time, run 2 | 6,530 ms | 1,406 ms |
| Ready time, run 3 | 16,948 ms | 805 ms |
| Browser animation-frame median during orbit, across runs | 264–322 ms | 56–61 ms |
| Browser animation-frame p95 during orbit, across runs | 300–403 ms | 64–67 ms |

Transfer counts are browser Resource Timing values including response overhead; the Atom's decoded file size is 1,592,528 bytes. The 96,639,156-byte EXR is no longer requested. The rendering code uses simple lights. Only the active scene loads initially; other models load on selection and remain cached for revisits. Model animation is opt-in; idle rendering is on demand.

These numbers demonstrate the removed lighting request and observed behavior in this test environment. Development versus production, renderer/layout changes, software graphics and local resource contention prevent interpreting the timing difference as an isolated percentage speedup. Animation-frame intervals are browser scheduling measurements during a 60-step horizontal orbit, not GPU frame timings or a 60 FPS guarantee. Hardware-accelerated device and real-network measurements are still useful follow-ups.

To reproduce the comparison, recover the baseline source at `593b42a` into a separate local app, use the patched lockfile, include the original models and EXR, and add the `cosmic-baseline-ready` performance mark two animation frames after `Model` mounts. Start it on port 3011 and the improved production build on 3012, then run `node scripts/measure-loading.mjs`. The temporary `.baseline` copy used here is ignored by Git. The original EXR remains in the Desktop checkout and Git history.

## Visual evidence and scope

### Revision after visual feedback

The Universe presentation is now a deterministic, open cosmic web with 7,334 glow particles, curved filaments, and voids. The original opaque sphere asset is preserved but is not requested by the view. Its legend and science notes explicitly distinguish the illustration from an observed survey or physical edge. The Solar System uses the original Sun/planet meshes as a selectable atlas with continuous illustrative motion and orbit guides.

Wheel input and arrow keys no longer navigate between scenes. Focused wheel input zooms within the current view; Escape releases focus, and normal page scrolling remains available. Arrow keys orbit, and visible +/− controls provide zoom alternatives. Zoom direction, bounds, and reset during in-flight orbit movement are verified. Build, typecheck, lint, seven unit/API tests, and twenty production-browser tests passed across the full run and a focused animation rerun after these changes, including desktop/mobile checks of the new scenes and retained error handling. Browser screenshots below document the new presentation; the loading measurements above apply to the preceding release, not a new performance benchmark.

- [Cosmic web, desktop](screenshots/desktop-universe.png)
- [Planet atlas, desktop](screenshots/desktop-solar-atlas.png)
- [Cosmic web, mobile emulation](screenshots/mobile-universe.png)

- [Earth, desktop](screenshots/desktop-earth.png)
- [DNA, desktop](screenshots/desktop-dna.png)
- [Atom, mobile emulation](screenshots/mobile-atom.png)

All scenes were visually reviewed in the generated captures. DNA markers follow illustrative backbone/base-pair regions. Earth markers introduce systems rather than exact locations. Button alternatives preserve access without 3D pointing. The team's original meshes are retained in the planet atlas; the Universe presentation is newly generated.

Mobile checks use Chrome with an iPhone-sized viewport and touch capability emulated; no physical phone or screen reader was used. The tests are functional checks, not a formal accessibility certification. A configurable AI key and live answer evaluation remain follow-ups, as do public hosting selection and durable shared limits before anonymous public AI use.
