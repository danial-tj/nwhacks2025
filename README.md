# Cosmic Zoom · nwHacks 2025

An interactive journey from atoms to the observable universe, built originally by the nwHacks 2025 team. This local improvement release preserves the team's eight recovered 3D models and adds explicit scale navigation, reviewed science notes, accessible feature exploration, and a scene-aware AI endpoint.

## Run locally

Use Node.js 22 LTS (tested with 22.13.0) and npm. No AI key is needed to explore.

```powershell
npm ci
npm run assets:check
npm run build
npm start
```

Open http://localhost:3000. Use `npm run dev` while developing. The original Desktop checkout is preserved; the working checkout is `C:/Users/Danial/Documents/ChatGPT/personal website/cosmic-zoom`, branch `codex/cosmic-zoom-release`.

The eight required models are included and credited to the original Cosmic Zoom nwHacks 2025 team. Danial confirmed that the team made them. [Asset recovery and manifest](docs/ASSETS.md) records checksums and original locations, including a recovery command if a local file is lost.

## Explore

The journey starts at Atom and proceeds through Molecule → DNA Helix → Beaver → Earth → Solar System → Milky Way → Observable Universe. Choose any scene using its button, or use Smaller/Larger. Scrolling never changes scenes. Click or focus the 3D view to use the wheel for bounded zoom; Escape releases the view so the page scrolls normally. Drag or use arrow keys to orbit, pinch on touchscreens, and use the +/− buttons or keys to zoom. Reset view restores camera framing and clears the selected feature.

The universe now uses an open procedural cosmic web with luminous galaxy clusters, filaments, and voids. It is explicitly an illustration, not a survey or a physical outer shell. The original star-textured sphere GLB is preserved but not rendered. The Solar System reuses the team's individual planet meshes in a Sun-centered atlas with orbit guides, selection, and optional continuous illustrative motion. Planet sizes, spacing, phases, and speeds are not physical measurements or current ephemerides.

DNA and Earth each have three numbered feature markers with equivalent HTML buttons. Solar System adds eight planet buttons and a label that follows the selected planet. Feature markers are teaching regions, not precise atomic/geographic measurements. Original clips in Atom, Beaver, and Earth and illustrative orbits in Solar System can be played or paused; animation is off initially and disabled for reduced-motion preferences.

The ruler uses logarithmic physical lengths. The scene buttons use equal spacing for legibility. Model framing is independent of physical size: the ruler does not imply a continuous literal zoom. Each measurement identifies what is being measured, with caveats and sources. The small-molecule width is explicitly a teaching estimate. Scene links such as `/#earth` support reload and browser history. Old `/earth` and `/1`–`/8` routes redirect into the journey; unknown routes return 404.

## Optional AI guide

Copy `.env.example` to `.env.local`, set `OPENAI_API_KEY`, and deliberately enable `AI_ENABLED=true` when ready to use the paid provider. `OPENAI_MODEL` defaults to `gpt-4.1-mini` and is configurable. Set `APP_ORIGIN` to the exact public origin before deployment. Restart the server after changing environment variables.

The single Next.js `/api/ask` route replaces the separate Express service and old mock. The browser sends a question, scene ID and selected feature ID. The server resolves these to curated facts and sources, bounds inputs and output, and rejects unknown scenes or mismatched features. Switching context cancels the request and discards the previous panel state. No credentials are sent to the browser.

Requests use the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses), structured output and `store: false`. Source links come from the registry rather than model-written URLs. Factual grounding still requires evaluation; source filtering does not guarantee accurate answers. [AI evaluation cases and deployment limits](docs/AI-EVALUATION.md).

## Checks

```powershell
npm run typecheck
npm run lint
npm test
npm run assets:check
npm run build
npm run test:e2e
```

Browser tests use the installed Google Chrome in a separate test session, software WebGL, and desktop plus mobile emulation. Install Chrome or change the Playwright channel and install its Chromium browser for other environments. Mobile emulation does not replace physical device testing. Provider tests are mocked and do not make paid calls.

## Implementation

- `lib/scenes.ts`: typed registry, lengths, model framing, sources, prompts and feature IDs.
- `components/Explorer.tsx`: one navigation state, URL synchronization and responsive UI.
- `components/Scene.tsx` / `Model.tsx`: active-model loading, persistent canvas, orbiting, optional animation, error recovery and on-demand rendering.
- `lib/assistant.ts`: validated context, provider boundary, bounded requests and curated citations.
- `scripts/assets.mjs`: imports and checks the original GLBs.

Dependencies are pinned, including aligned React 18 types and a compatible Three.js version. Next.js stays on the 15 maintenance line with its [September 2026 security patch](https://nextjs.org/blog/september-2026-security-release). There are no new hosted services.

## Deployment status

This is a working local release, not a public deployment. It needs a Next.js Node/serverless host because the AI route is server-side. AI defaults off. Before publicly enabling anonymous AI, replace the process-local request limits with a durable shared quota or gateway, establish trusted proxy handling, configure provider spend limits, and run the live evaluation cases. Public hosting destination and costs have not been selected.

See [verification notes](docs/VERIFICATION.md) for measured evidence and remaining limits.

## Team attribution and this iteration

Cosmic Zoom is a collaborative nwHacks 2025 project. The original team built the interactive concept, 3D scene experience and initial AI panel; existing Git history preserves contributor attribution. This October 2026 iteration for Danial adds asset recovery tooling, a reproducible build, the typed scene registry and ruler, responsive/keyboard controls, DNA/Earth feature annotations, and the scene-aware API with tests. Do not describe the original team's entire project as a new individual contribution.

The original package declared MIT for application code. No separate license file or per-model licenses were present in the recovered checkout. The included models are credited to the original nwHacks team, with team authorship confirmed by Danial during recovery.
