import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Model from "./Model";
import UniverseVolume from "./UniverseVolume";
import SolarSystemAtlas from "./SolarSystemAtlas";
import type { SceneDefinition } from "../lib/scenes";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

class AssetBoundary extends Component<
  { children: ReactNode; retry: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <Html center>
          <div className="loadMessage" role="alert">
            <strong>Model couldn’t load</strong>
            <p>The science notes and scale navigation still work.</p>
            <button onClick={this.props.retry}>Retry model</button>
          </div>
        </Html>
      );
    return this.props.children;
  }
}
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loadMessage" role="status">
        Loading model… {Math.round(progress)}%
      </div>
    </Html>
  );
}
function CameraReset({
  definition,
  version,
}: {
  definition: SceneDefinition;
  version: number;
}) {
  const { camera, controls, invalidate } = useThree();
  useEffect(() => {
    const orbit = controls as OrbitControlsImpl | undefined;
    // Flush in-flight damping before placing the camera, so reset stays put.
    const damping = orbit?.enableDamping;
    if (orbit) {
      orbit.enableDamping = false;
      orbit.update();
      orbit.reset();
    }
    camera.position.set(...definition.camera);
    camera.lookAt(0, 0, 0);
    orbit?.update();
    if (orbit && damping !== undefined) orbit.enableDamping = damping;
    camera.updateMatrixWorld(true);
    invalidate();
  }, [camera, controls, definition, version, invalidate]);
  return null;
}
export default function Scene({
  definition,
  selected,
  onSelect,
  reducedMotion,
  resetVersion,
  playing,
}: {
  definition: SceneDefinition;
  selected?: string;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
  resetVersion: number;
  playing: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const activeCanvas = useRef<HTMLCanvasElement>();
  const [interacting, setInteracting] = useState(false);
  const [magnification, setMagnification] = useState(100);
  const defaultDistance = Math.hypot(...definition.camera);
  const [attempt, setAttempt] = useState(0);
  const [readyToken, setReadyToken] = useState("");
  const [contextLost, setContextLost] = useState(false);
  const token = `${definition.id}:${attempt}:${resetVersion}`;
  const onReady = useCallback(() => {
    setReadyToken(token);
    performance.mark(`cosmic-ready:${definition.id}`);
  }, [definition.id, token]);
  useEffect(() => {
    setContextLost(false);
  }, [definition.id, attempt]);
  const zoom = (closer: boolean) => {
    if (closer) controls.current?.dollyIn(1 / 1.2);
    else controls.current?.dollyOut(1 / 1.2);
  };
  const retry = () => {
    useGLTF.clear(`/models/${definition.asset}`);
    setAttempt((value) => value + 1);
  };
  return (
    <div
      className="viewer"
      data-scene={definition.id}
      ref={container}
      tabIndex={0}
      role="region"
      aria-label={`${definition.label} 3D view`}
      data-ready={readyToken === token && !contextLost}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setInteracting(false);
      }}
      onWheelCapture={(event) => {
        // Preserve browser pinch-to-zoom and horizontal page gestures.
        if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
          event.stopPropagation();
      }}
      onPointerDown={(event) => {
        if (!(event.target as HTMLElement).closest("button"))
          container.current?.focus({ preventScroll: true });
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const orbit = controls.current;
        if (!orbit) return;
        if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "+", "=", "-", "Escape"].includes(event.key)) event.preventDefault();
        if (event.key === "ArrowRight" || event.key === "ArrowLeft")
          orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + (event.key === "ArrowRight" ? -0.15 : 0.15));
        if (event.key === "ArrowUp" || event.key === "ArrowDown")
          orbit.setPolarAngle(orbit.getPolarAngle() + (event.key === "ArrowUp" ? -0.15 : 0.15));
        if (event.key === "+" || event.key === "=") zoom(true);
        if (event.key === "-") zoom(false);
        if (event.key === "Escape") container.current?.blur();
      }}
    >
      <span className="viewLabel">{definition.id === "universe" ? "THE COSMIC WEB" : "INTERACTIVE MODEL"} / {definition.label}</span>
      <Canvas
        key={attempt}
        camera={{ position: [0, 0, 6.4], fov: 42 }}
        dpr={[1, 1.5]}
        frameloop={playing && !reducedMotion ? "always" : "demand"}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          activeCanvas.current = gl.domElement;
          gl.domElement.addEventListener(
            "webglcontextlost",
            () => {
              if (
                activeCanvas.current === gl.domElement &&
                gl.domElement.isConnected
              )
                setContextLost(true);
            },
            { once: true },
          );
        }}
        fallback={
          <div className="loadMessage">
            3D is unavailable in this browser. Explore using the scale and
            science notes.
          </div>
        }
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[3, 5, 5]} intensity={3} />
        <directionalLight
          position={[-4, 1, -2]}
          intensity={1.8}
          color="#8ab7ff"
        />
        <OrbitControls
          ref={controls}
          makeDefault
          enablePan={false}
          enableZoom={interacting}
          minDistance={defaultDistance * 0.4}
          maxDistance={defaultDistance * 2}
          zoomSpeed={0.7}
          enableDamping={!reducedMotion}
          onChange={() => {
            const distance = controls.current?.getDistance();
            if (distance) setMagnification(Math.round(defaultDistance / distance * 100));
          }}
        />
        <CameraReset definition={definition} version={resetVersion} />
        <AssetBoundary key={`${definition.id}:${attempt}`} retry={retry}>
          <Suspense fallback={<Loader />}>
            {definition.id === "universe" ? <UniverseVolume onReady={onReady} /> : definition.id === "solar-system" ? <SolarSystemAtlas onReady={onReady} selected={selected} onSelect={onSelect} animate={playing && !reducedMotion} /> : <Model
              key={definition.id}
              definition={definition}
              selected={selected}
              onSelect={onSelect}
              onReady={onReady}
              animate={playing && !reducedMotion}
            />}
          </Suspense>
        </AssetBoundary>
      </Canvas>
      <div className="viewZoom" aria-label="View zoom controls">
        <button aria-label="Zoom out" disabled={magnification <= 50} onClick={() => zoom(false)}>−</button>
        <output aria-label="View magnification">{magnification}%</output>
        <button aria-label="Zoom in" disabled={magnification >= 250} onClick={() => zoom(true)}>+</button>
      </div>
      {definition.id === "universe" && <div className="cosmicLegend"><span>Galaxy clusters</span><span>Filaments</span><span>Voids</span><small>Illustrative structure · not a survey or an outer edge</small></div>}
      {contextLost && (
        <div className="contextMessage" role="alert">
          3D rendering paused. <button onClick={retry}>Reload view</button>
        </div>
      )}
      <p className="viewHint">
        <span className="pointerHint">{interacting ? "Scroll to zoom · Drag or use arrow keys to orbit · Esc releases" : "Drag to orbit · Click the view to use scroll zoom"}</span>
        <span className="touchHint">Drag to orbit · Pinch to zoom</span>
      </p>
    </div>
  );
}
