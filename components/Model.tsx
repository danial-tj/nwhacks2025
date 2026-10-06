import { Html, useAnimations, useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Box3, Vector3 } from "three";
import type { SceneDefinition } from "../lib/scenes";

type Props = {
  definition: SceneDefinition;
  selected?: string;
  onSelect: (id: string) => void;
  onReady: () => void;
  animate: boolean;
};
export default function Model({
  definition,
  selected,
  onSelect,
  onReady,
  animate,
}: Props) {
  const invalidate = useThree((state) => state.invalidate);
  const loaded = useGLTF(`/models/${definition.asset}`);
  // Local transforms, shared cached geometry: don't dispose the loader's resources.
  const model = useMemo(() => loaded.scene.clone(true), [loaded.scene]);
  const framing = useMemo(() => {
    model.updateMatrixWorld(true);
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const scale = 3 / Math.max(size.x, size.y, size.z, 0.001);
    return {
      scale,
      offset: box.getCenter(new Vector3()).multiplyScalar(-scale),
    };
  }, [model]);
  const { actions, names } = useAnimations(loaded.animations, model);
  useEffect(() => {
    const action = actions[names[0]];
    if (!action) return;
    action.play();
    return () => {
      action.stop();
    };
  }, [actions, names]);
  useEffect(() => {
    const action = actions[names[0]];
    if (action) action.paused = !animate;
    invalidate();
  }, [actions, names, animate, invalidate]);
  useEffect(() => {
    let second = 0;
    invalidate();
    const first = requestAnimationFrame(() => {
      invalidate();
      second = requestAnimationFrame(onReady);
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [onReady, invalidate]);
  return (
    <>
      <group position={framing.offset} scale={framing.scale} dispose={null}>
        <primitive object={model} />
      </group>
      {definition.annotations.map((annotation, i) => (
        <Html
          key={annotation.id}
          position={annotation.position}
          center
          zIndexRange={[10, 0]}
        >
          <button
            className="hotspot"
            aria-label={annotation.title}
            aria-pressed={selected === annotation.id}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(annotation.id);
            }}
          >
            {i + 1}
          </button>
        </Html>
      ))}
    </>
  );
}
