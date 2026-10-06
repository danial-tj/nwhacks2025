import { Html, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, type Group, type Object3D } from "three";

type Props = {
  onReady: () => void;
  selected?: string;
  onSelect: (id: string) => void;
  animate: boolean;
};

// The team's model already separates each planet into its own orbit pivot.
// These phases, body enlargements, and speeds form an illustrative atlas;
// they do not represent an epoch, physical scale, or orbital periods.
const planetDefinitions = [
  { id: "mercury", name: "Mercury", pivot: "1", phase: 40, boost: 3, speed: 0.3 },
  { id: "venus", name: "Venus", pivot: "2", phase: 155, boost: 3, speed: 0.25 },
  { id: "earth", name: "Earth", pivot: "3", phase: 265, boost: 2.8, speed: 0.21 },
  { id: "mars", name: "Mars", pivot: "4", phase: 315, boost: 2.8, speed: 0.18 },
  { id: "jupiter", name: "Jupiter", pivot: "5", phase: 105, boost: 1.65, speed: 0.145 },
  { id: "saturn", name: "Saturn", pivot: "6", phase: 220, boost: 1.8, speed: 0.12 },
  { id: "uranus", name: "Uranus", pivot: "7", phase: 5, boost: 2.1, speed: 0.1 },
  { id: "neptune", name: "Neptune", pivot: "8", phase: 65, boost: 2.25, speed: 0.085 },
] as const;

const MODEL_SCALE = 1 / 12;

type Planet = {
  id: string;
  name: string;
  object: Object3D;
  radius: number;
  bodyRadius: number;
  phase: number;
  speed: number;
  track: Float32Array;
};

function PlanetBody({
  planet,
  selected,
  onSelect,
  animate,
}: {
  planet: Planet;
  selected: boolean;
  onSelect: Props["onSelect"];
  animate: boolean;
}) {
  const orbit = useRef<Group>(null);
  useFrame((_, delta) => {
    if (animate && orbit.current) {
      // Cap tab-resume gaps so opting into motion never produces a jump.
      orbit.current.rotation.y += Math.min(delta, 0.05) * planet.speed;
    }
  });

  return (
    <group ref={orbit} rotation={[0, planet.phase, 0]}>
      <group position={[0, 0, -planet.radius]}>
        <primitive
          object={planet.object}
          dispose={null}
          onClick={(event: { stopPropagation: () => void }) => {
            event.stopPropagation();
            onSelect(planet.id);
          }}
        />
        {selected && (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry
                args={[planet.bodyRadius * 1.45, planet.bodyRadius * 1.56, 48]}
              />
              <meshBasicMaterial
                color="#f6cb8b"
                side={DoubleSide}
                transparent
                opacity={0.8}
                depthWrite={false}
              />
            </mesh>
            <Html
              position={[0, planet.bodyRadius + 0.16, 0]}
              center
              zIndexRange={[10, 0]}
              style={{ pointerEvents: "none" }}
            >
              <span className="planetLabel">{planet.name}</span>
            </Html>
          </>
        )}
      </group>
    </group>
  );
}

export default function SolarSystemAtlas({
  onReady,
  selected,
  onSelect,
  animate,
}: Props) {
  const loaded = useGLTF("/models/solarsystem.glb");
  const invalidate = useThree((state) => state.invalidate);
  const { sun, planets } = useMemo(() => {
    // Clone transforms while retaining the cached GLB geometry/materials.
    const local = loaded.scene.clone(true);
    const sun = local.getObjectByName("Sphere");
    if (!sun) throw new Error("Solar System model is missing its Sun.");
    sun.position.set(0, 0, 0);
    sun.scale.multiplyScalar(MODEL_SCALE * 1.3);

    const planets: Planet[] = planetDefinitions.map((definition) => {
      const object = local.getObjectByName(definition.pivot);
      const body = object?.children.find((child) => child.name.startsWith("Sphere"));
      if (!object || !body)
        throw new Error(`Solar System model is missing ${definition.name}.`);

      const radius = Math.abs(body.position.z * object.scale.x) * MODEL_SCALE;
      const bodyRadius = body.scale.x * object.scale.x * MODEL_SCALE * definition.boost;
      object.position.set(0, 0, 0);
      object.scale.multiplyScalar(MODEL_SCALE * definition.boost);
      // Saturn's body and its ring share the same center; preserve both.
      object.children.forEach((child) => child.position.set(0, 0, 0));

      const track = new Float32Array(128 * 3);
      for (let i = 0; i < 128; i++) {
        const angle = (i / 128) * Math.PI * 2;
        track[i * 3] = Math.cos(angle) * radius;
        track[i * 3 + 2] = Math.sin(angle) * radius;
      }
      return {
        id: definition.id,
        name: definition.name,
        object,
        radius,
        bodyRadius,
        phase: (definition.phase * Math.PI) / 180,
        speed: definition.speed,
        track,
      };
    });
    return { sun, planets };
  }, [loaded.scene]);

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

  useEffect(() => invalidate(), [animate, selected, invalidate]);

  return (
    <>
      <primitive object={sun} dispose={null} />
      <Html
        position={[0, 0.28, 0]}
        center
        zIndexRange={[9, 0]}
        style={{ pointerEvents: "none" }}
      >
        <span className="sunLabel">SUN</span>
      </Html>
      {planets.map((planet, index) => (
        <group key={planet.id}>
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[planet.track, 3]} />
            </bufferGeometry>
            <lineBasicMaterial
              color={selected === planet.id ? "#e4ba78" : index < 4 ? "#b29470" : "#6887b0"}
              transparent
              opacity={selected === planet.id ? 0.7 : 0.24}
              depthWrite={false}
            />
          </lineLoop>
          <PlanetBody
            planet={planet}
            selected={selected === planet.id}
            onSelect={onSelect}
            animate={animate}
          />
        </group>
      ))}
    </>
  );
}
