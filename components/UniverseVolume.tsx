import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, Color, CubicBezierCurve3, Vector3 } from "three";

type Particle = {
  position: Vector3;
  size: number;
  color: Color;
  opacity: number;
  flatten?: number;
  angle?: number;
};

// A composed, illustrative volume, not a galaxy survey or an outer shell.
// Keep its seed fixed so navigating away and back preserves spatial landmarks.
function createWeb() {
  let seed = 824741;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const normal = () =>
    Math.sqrt(-2 * Math.log(Math.max(random(), 0.000001))) *
    Math.cos(2 * Math.PI * random());
  const cool = new Color("#81b2c6");
  const white = new Color("#e1e8df");
  const warm = new Color("#efd9b8");
  const nodes = [
    [-1.65, 0.74, -0.52],
    [-1.02, 1.01, 0.17],
    [-0.26, 0.78, -0.6],
    [0.45, 1.03, -0.16],
    [1.24, 0.82, 0.43],
    [1.66, 0.16, -0.38],
    [0.95, 0.16, -0.88],
    [0.22, 0.34, 0.54],
    [-0.53, 0.15, 0.95],
    [-1.34, 0.12, 0.45],
    [-1.59, -0.6, -0.28],
    [-0.85, -0.83, 0.29],
    [-0.2, -0.49, -0.7],
    [0.39, -0.96, -0.21],
    [1.07, -0.63, 0.68],
    [1.62, -0.89, -0.48],
    [-0.92, 0.39, -1.03],
    [-0.3, -0.1, -1.07],
    [0.63, -0.18, 1.05],
    [-1.15, -0.38, 1.02],
    [0.28, 0.78, 1.02],
    [1.55, 0.69, -1.02],
  ].map((position) => new Vector3(...position));
  const links = [
    [0, 1], [0, 9], [0, 16], [1, 2], [1, 9], [1, 20],
    [2, 3], [2, 16], [2, 17], [3, 4], [3, 6], [3, 21],
    [4, 5], [4, 7], [4, 20], [4, 21], [5, 6], [5, 15],
    [6, 12], [6, 17], [6, 21], [7, 8], [7, 18], [7, 20],
    [8, 9], [8, 19], [8, 20], [9, 10], [9, 19], [10, 11],
    [10, 16], [11, 12], [11, 19], [12, 13], [12, 17],
    [13, 14], [13, 15], [14, 15], [14, 18], [16, 17],
  ];
  const particles: Particle[] = [];
  const lines: number[] = [];
  for (const [index, [from, to]] of links.entries()) {
    const start = nodes[from];
    const end = nodes[to];
    const bow = new Vector3(normal(), normal(), normal())
      .normalize()
      .multiplyScalar(0.12 + random() * 0.16);
    const curve = new CubicBezierCurve3(
      start,
      start.clone().lerp(end, 0.33).add(bow),
      start.clone().lerp(end, 0.68).addScaledVector(bow, 0.65),
      end,
    );
    // Soft particulate strands have thickness and depth, with real empty voids.
    for (let i = 0; i < 125; i++) {
      const t = random();
      const spread = 0.018 + Math.sin(t * Math.PI) * 0.028;
      const position = curve.getPoint(t).add(
        new Vector3(normal(), normal(), normal()).multiplyScalar(spread),
      );
      const bright = random() > 0.95;
      particles.push({
        position,
        size: bright ? 0.021 + random() * 0.023 : 0.022 + random() * 0.031,
        color: bright ? white : cool,
        opacity: bright ? 0.55 : 0.08 + random() * 0.1,
      });
    }
    // A few almost invisible spines make the underlying web legible on mobile.
    if (index % 2 === 0) {
      const points = curve.getPoints(28);
      for (let i = 0; i < points.length - 1; i++)
        lines.push(...points[i].toArray(), ...points[i + 1].toArray());
    }
  }
  for (const [index, node] of nodes.entries()) {
    const radius = 0.07 + random() * 0.055;
    for (let i = 0; i < 100; i++) {
      // Bound the tails so the volume stays within the shared camera framing.
      const offset = new Vector3(normal(), normal(), normal());
      if (offset.length() > 2.6) offset.setLength(2.6);
      particles.push({
        position: node.clone().add(offset.multiplyScalar(radius)),
        size: 0.016 + random() * 0.025,
        color: random() > 0.72 ? warm : white,
        opacity: 0.15 + random() * 0.5,
      });
    }
    particles.push({
      position: node,
      size: 0.25 + random() * 0.14,
      color: index % 3 === 0 ? warm : cool,
      opacity: 0.15,
    });
    // A luminous galactic core and a small tilted disk at each concentration.
    particles.push({
      position: node,
      size: 0.07 + random() * 0.055,
      color: warm,
      opacity: 0.95,
      flatten: 1.6 + random() * 1.5,
      angle: random() * Math.PI,
    });
  }
  // Sparse isolated galaxies break the silhouette without filling the voids.
  for (let i = 0; i < 90; i++) {
    particles.push({
      position: new Vector3(
        (random() - 0.5) * 3.9,
        (random() - 0.5) * 2.7,
        (random() - 0.5) * 2.65,
      ),
      size: i < 8 ? 0.085 : 0.013 + random() * 0.018,
      color: i < 8 ? warm : white,
      opacity: i < 8 ? 0.65 : 0.32,
      flatten: i < 8 ? 2.2 : 1,
      angle: random() * Math.PI,
    });
  }
  return {
    positions: new Float32Array(particles.flatMap((point) => point.position.toArray())),
    colors: new Float32Array(particles.flatMap((point) => point.color.toArray())),
    sizes: new Float32Array(particles.map((point) => point.size)),
    opacities: new Float32Array(particles.map((point) => point.opacity)),
    shapes: new Float32Array(particles.flatMap((point) => [point.flatten ?? 1, point.angle ?? 0])),
    lines: new Float32Array(lines),
  };
}

const vertexShader = `
  attribute float aSize;
  attribute float aOpacity;
  attribute vec2 aShape;
  attribute vec3 color;
  uniform float viewportHeight;
  varying vec3 vColor;
  varying float vOpacity;
  varying vec2 vShape;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float sizeBoost = aSize < 0.2 ? 1.7 : 1.1;
    gl_PointSize = clamp(aSize * sizeBoost * viewportHeight / max(0.5, -viewPosition.z), 1.0, 90.0);
    vColor = color;
    vOpacity = aOpacity * 2.35 * (1.0 - smoothstep(3.0, 13.0, -viewPosition.z));
    vShape = aShape;
  }
`;
const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  varying vec2 vShape;
  void main() {
    vec2 uv = (gl_PointCoord - 0.5) * 2.0;
    float c = cos(vShape.y), s = sin(vShape.y);
    uv = mat2(c, -s, s, c) * uv;
    uv.y *= vShape.x;
    float radius = length(uv);
    if (radius > 1.0) discard;
    float glow = exp(-radius * radius * 6.0) * 0.42;
    float core = exp(-radius * radius * 45.0) * 0.58;
    float alpha = (glow + core) * (1.0 - smoothstep(0.65, 1.0, radius)) * vOpacity;
    gl_FragColor = vec4(vColor, alpha);
    #include <colorspace_fragment>
  }
`;

export default function UniverseVolume({ onReady }: { onReady: () => void }) {
  const invalidate = useThree((state) => state.invalidate);
  const height = useThree((state) => state.size.height);
  const dpr = useThree((state) => state.viewport.dpr);
  const web = useMemo(createWeb, []);
  const uniforms = useMemo(
    () => ({ viewportHeight: { value: height * dpr } }),
    [height, dpr],
  );
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
    <group name="Illustrative cosmic web" scale={1.23}>
      {/* Declarative resources are disposed by R3F when this scene unmounts. */}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[web.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[web.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[web.sizes, 1]} />
          <bufferAttribute attach="attributes-aOpacity" args={[web.opacities, 1]} />
          <bufferAttribute attach="attributes-aShape" args={[web.shapes, 2]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[web.lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#85b8cc"
          transparent
          opacity={0.085}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}
