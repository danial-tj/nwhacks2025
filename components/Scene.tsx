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
    orbit?.reset();
    camera.position.set(...definition.camera);
    camera.lookAt(0, 0, 0);
    orbit?.update();
    camera.updateMatrixWorld(true);
    invalidate();
  }, [camera, controls, definition, version, invalidate]);
  return null;
}
export default function Scene({
  definition,
  selected,
  onSelect,
  onStep,
  reducedMotion,
  resetVersion,
  playing,
}: {
  definition: SceneDefinition;
  selected?: string;
  onSelect: (id: string) => void;
  onStep: (delta: number) => void;
  reducedMotion: boolean;
  resetVersion: number;
  playing: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const activeCanvas = useRef<HTMLCanvasElement>();
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
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let total = 0,
      last = 0;
    const wheel = (event: WheelEvent) => {
      if (
        document.activeElement !== element ||
        event.ctrlKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return;
      event.preventDefault();
      const now = performance.now();
      if (now - last < 700) return;
      const amount =
        event.deltaY *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 300 : 1);
      if (Math.sign(amount) !== Math.sign(total)) total = 0;
      total += amount;
      if (Math.abs(total) >= 90) {
        onStep(Math.sign(total));
        total = 0;
        last = now;
      }
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [onStep]);
  const retry = () => {
    useGLTF.clear(`/models/${definition.asset}`);
    setAttempt((value) => value + 1);
  };
  return (
    <div
      className="viewer"
      ref={container}
      tabIndex={0}
      role="region"
      aria-label={`${definition.label} 3D view`}
      data-ready={readyToken === token && !contextLost}
      onPointerDown={(event) => {
        if (!(event.target as HTMLElement).closest("button"))
          container.current?.focus({ preventScroll: true });
      }}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "ArrowRight" || event.key === "ArrowLeft")
        ) {
          event.preventDefault();
          onStep(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <span className="viewLabel">INTERACTIVE MODEL / {definition.label}</span>
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
          makeDefault
          enablePan={false}
          enableZoom={false}
          enableDamping={!reducedMotion}
        />
        <CameraReset definition={definition} version={resetVersion} />
        <AssetBoundary key={`${definition.id}:${attempt}`} retry={retry}>
          <Suspense fallback={<Loader />}>
            <Model
              key={definition.id}
              definition={definition}
              selected={selected}
              onSelect={onSelect}
              onReady={onReady}
              animate={playing && !reducedMotion}
            />
          </Suspense>
        </AssetBoundary>
      </Canvas>
      {contextLost && (
        <div className="contextMessage" role="alert">
          3D rendering paused. <button onClick={retry}>Reload view</button>
        </div>
      )}
      <p className="viewHint">
        Drag to orbit <span>·</span> Focus the view, then scroll or use ← →
      </p>
    </div>
  );
}
