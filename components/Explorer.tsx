import dynamic from "next/dynamic";
import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { clampIndex, logPosition, sceneMeters, scenes } from "../lib/scenes";
import AIPanel from "./AIPanel";
import ViewBoundary from "./ViewBoundary";
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="viewer skeleton" role="status">
      Preparing the 3D view…
    </div>
  ),
});

export default function Explorer() {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const [selected, setSelected] = useState<string>();
  const [resetVersion, setResetVersion] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [playing, setPlaying] = useState(false);
  const scene = scenes[index];
  const annotation = scene.annotations.find((item) => item.id === selected);
  const activate = useCallback((next: number, writeUrl = true) => {
    const safe = clampIndex(next);
    indexRef.current = safe;
    setIndex(safe);
    setSelected(undefined);
    setPlaying(false);
    setResetVersion((value) => value + 1);
    if (writeUrl && window.location.hash !== `#${scenes[safe].id}`)
      window.history.pushState(window.history.state, "", `#${scenes[safe].id}`);
  }, []);
  const step = useCallback(
    (delta: number) => activate(indexRef.current + delta),
    [activate],
  );
  useEffect(() => {
    const sync = () => {
      const found = scenes.findIndex(
        (item) => item.id === window.location.hash.slice(1),
      );
      activate(found >= 0 ? found : 0, false);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReducedMotion(media.matches);
    motion();
    media.addEventListener("change", motion);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      media.removeEventListener("change", motion);
    };
  }, [activate]);
  const select = useCallback(
    (id: string) => setSelected((current) => (current === id ? undefined : id)),
    [],
  );
  return (
    <>
      <Head>
        <title>{`${scene.label} · Cosmic Zoom`}</title>
        <meta
          name="description"
          content="Explore eight scales of our universe with original 3D models, a scientific scale ruler, and guided explanations."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <a
        className="skipLink"
        href="#scene-notes"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("scene-notes")?.focus();
        }}
      >
        Skip to science notes
      </a>
      <div className="appShell">
        <header className="topbar">
          <a
            href="#atom"
            className="brand"
            aria-label="Cosmic Zoom, return to Atom"
          >
            <span className="brandOrbit" aria-hidden="true">
              ✳
            </span>{" "}
            COSMIC<span>ZOOM</span>
          </a>
          <span className="edition">AN EXPLORATION OF SCALE</span>
          <a
            className="aboutLink"
            href="https://github.com/danial-tj/nwhacks2025"
            target="_blank"
            rel="noreferrer"
          >
            nwHacks 2025 ↗
          </a>
        </header>
        <main>
          <div className="workspace">
            <section
              className="scienceNotes"
              id="scene-notes"
              tabIndex={-1}
              aria-labelledby="scene-title"
            >
              <p className="eyebrow">
                <span>{String(index + 1).padStart(2, "0")} / 08</span>{" "}
                {scene.category}
              </p>
              <h1 id="scene-title">{scene.label}</h1>
              <div className="measurement">
                <strong>{scene.size.display}</strong>
                <span>{scene.size.measurement}</span>
              </div>
              <p className="description">{scene.description}</p>
              {scene.annotations.length > 0 && (
                <div className="features">
                  <h2>{scene.id === "solar-system" ? "Meet the planets" : "Look a little closer"}</h2>
                  <p>{scene.id === "solar-system" ? "Choose a world to pick it out in the system." : "Choose a numbered feature."}</p>
                  <div className={`featureButtons ${scene.id === "solar-system" ? "planetButtons" : ""}`}>
                    {scene.annotations.map((item, i) => (
                      <button
                        key={item.id}
                        aria-pressed={selected === item.id}
                        onClick={() => select(item.id)}
                      >
                        <span>{i + 1}</span>
                        {item.title}
                      </button>
                    ))}
                  </div>
                  <div className="annotationText" aria-live="polite">
                    {annotation && (
                      <>
                        <h3>{annotation.title}</h3>
                        <p>{annotation.text}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              <details className="scienceDetails">
                <summary>About this scale & model</summary>
                <p>{scene.size.note}</p>
                <p>{scene.caveat}</p>
                <ul>
                  {scene.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
              <AIPanel
                key={`${scene.id}:${selected || ""}`}
                scene={scene}
                annotation={annotation}
              />
            </section>
            <section className="modelStage" aria-label="Explore the model">
              <ViewBoundary>
                <Scene
                  definition={scene}
                  selected={selected}
                  onSelect={select}
                  resetVersion={resetVersion}
                  reducedMotion={reducedMotion}
                  playing={playing}
                />
              </ViewBoundary>
              <div className="viewToolbar">
                <p>{scene.id === "universe" ? "An open volume of galaxies and the space between them." : scene.id === "solar-system" ? "Planet sizes, spacing, and motion are illustrative." : "Models are enlarged or reduced to fit the view."}</p>
                <div>
                  {["atom", "beaver", "earth", "solar-system"].includes(
                    scene.id,
                  ) && (
                    <button
                      disabled={reducedMotion}
                      aria-pressed={playing}
                      onClick={() => setPlaying((value) => !value)}
                    >
                      {reducedMotion
                        ? "Motion reduced"
                        : playing
                          ? "Pause animation"
                          : "Play animation"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setResetVersion((value) => value + 1);
                      setSelected(undefined);
                      setPlaying(false);
                    }}
                  >
                    Reset view ↺
                  </button>
                </div>
              </div>
            </section>
          </div>
          <section className="scaleSection" aria-label="Scale navigation">
            <div className="scaleHeading">
              <div>
                <h2>A universe of perspective</h2>
                <p>Choose your next scale. Scrolling stays in this scene.</p>
              </div>
              <div className="stepButtons">
                <button
                  onClick={() => step(-1)}
                  disabled={index === 0}
                  aria-label="Previous smaller scale"
                >
                  ← Smaller
                </button>
                <button
                  onClick={() => step(1)}
                  disabled={index === scenes.length - 1}
                  aria-label="Next larger scale"
                >
                  Larger →
                </button>
              </div>
            </div>
            <div
              className="logRuler"
              role="img"
              aria-label={`Logarithmic size ruler. ${scene.label}: ${scene.size.display}. Equal distances represent equal size ratios.`}
            >
              {Array.from({ length: 38 }, (_, i) => (
                <i key={i} style={{ left: `${(i / 37) * 100}%` }} />
              ))}
              {scenes.map((item) => (
                <b
                  key={item.id}
                  className={item.id === scene.id ? "currentDot" : ""}
                  style={{ left: `${logPosition(sceneMeters(item))}%` }}
                />
              ))}
            </div>
            <div className="rulerCaption">
              <span>10⁻¹⁰ m</span>
              <span>LOGARITHMIC SIZE · NOT SCREEN SIZE</span>
              <span>10²⁷ m</span>
            </div>
            <nav className="sceneNav" aria-label="Choose a scale">
              {scenes.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => activate(i)}
                  aria-current={item.id === scene.id ? "step" : undefined}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <strong>{item.label}</strong>
                  <small>{item.size.display}</small>
                </button>
              ))}
            </nav>
          </section>
        </main>
        <footer>
          <span>One journey. Eight scales. A new perspective.</span>
          <span>Original nwHacks team project · 2025</span>
        </footer>
        <p className="srOnly" role="status">
          {scene.label}. {scene.size.display}. {scene.size.measurement}.
        </p>
      </div>
    </>
  );
}
