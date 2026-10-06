# Recovered 3D assets

All eight required models were found in `C:/Users/Danial/Desktop/cosmic/public/models` on October 5, 2026. Danial subsequently provided nine files in `C:/Users/Danial/Downloads`. Seven supply active scenes; the Molecule still comes from the Desktop checkout. The Desktop checkout was clean at `920501a`; its Git ignore rules excluded GLB files. The working branch reconciles that checkout with upstream `ddb0626` without changing the original Desktop checkout.

The files are copied, not moved. Numbered Download filenames are normalized in the working copy. Six supplied scene files exactly match the Desktop copies. The supplied Solar System includes an additional rotation channel on node `3`, the third planet's orbit pivot; it replaces the Desktop version. All eight active files are GLB 2.0, contain their image/buffer data, and have no external asset dependencies. The verification script checks container length, SHA-256, and external references for active and supplementary assets.

## Recovery from the original folders

```powershell
npm run assets:import -- "C:\Users\Danial"
npm run assets:check
```

The import argument is the root containing the manifest's relative `Downloads/` and `Desktop/` paths. `assets.json` records byte counts, checksums and original filenames. Total active model bytes: 17,347,640. Animation clips are present in Atom, Beaver, Earth, and Solar System. DNA, Molecule, Milky Way, and Universe have no animation clip and still support orbiting.

Two supplementary exports are preserved in `source-assets/`, outside the served scene assets:

- `electron.glb` (2,056 bytes, supplied as `electron (1).glb`): a separate emissive mesh. Atom already includes its electrons, so this remains available for future authoring.
- `earthLight.glb` (132 bytes): a valid but empty scene export containing no nodes, geometry, or lights. It cannot supply Earth lighting; the viewer uses its existing local lights.

## Team attribution and packaging

Danial confirmed on October 5, 2026 that the team made these models. They are credited to the original Cosmic Zoom nwHacks 2025 team and included in the repository through an explicit allowlist for eight active models and two supplementary exports. A fresh checkout includes the required assets; the import command is retained for recovery. Each GLB identifies Blender as its exporter but contains no individual author or license metadata. Team authorship is based on Danial’s confirmation, not inferred from the exporter. No individual modeling contribution is reassigned to this improvement iteration.

The original `moonlit_night.exr` is 96,639,156 bytes. The improved renderer uses local lights and makes no request for it; the unused file is removed from this release's public directory and remains available in the original Desktop checkout and Git history. The original background photograph is retained. Model framing uses normalized visual bounds independently of the physical measurements in `lib/scenes.ts`.
