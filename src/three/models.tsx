"use client";

import { RoundedBox } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef, type ComponentProps, type ReactNode } from "react";
import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry, Object3D, type InstancedMesh } from "three";
import { useKit, type SurfaceName } from "./materials";
import type { ModelName } from "./modelNames";

type Vec3 = [number, number, number];
type MeshProps = Omit<ComponentProps<"mesh">, "material"> & { m?: SurfaceName };

const TAU = Math.PI * 2;
const range = (length: number) => Array.from({ length }, (_, index) => index);

function P({ m = "metal", children, ...props }: MeshProps) {
  const kit = useKit();
  return <mesh material={kit[m]} {...props}>{children}</mesh>;
}

/** Draws many copies of one shape in a single draw call. */
function Scatter({ points, m = "metal", size = 1, children }: { points: Vec3[]; m?: SurfaceName; size?: number; children: ReactNode }) {
  const kit = useKit();
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new Object3D();
    points.forEach((point, index) => {
      dummy.position.set(...point);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [points, size]);
  return <instancedMesh key={points.length} ref={mesh} args={[undefined, kit[m], points.length]}>{children}</instancedMesh>;
}

function Lines({ pairs }: { pairs: [Vec3, Vec3][] }) {
  const kit = useKit();
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute("position", new Float32BufferAttribute(pairs.flat(2), 3));
    return result;
  }, [pairs]);
  return <lineSegments geometry={geometry} material={kit.line} />;
}

function Mobile() {
  const kit = useKit();
  return (
    <group rotation={[0.1, -0.45, 0.08]}>
      {range(3).map((i) => (
        <RoundedBox key={i} args={[1.2, 2.35, 0.05]} radius={0.025} material={kit.glass} position={[0.2 * (i + 1), 0.1 * (i + 1), -0.34 * (i + 1)]} />
      ))}
      <RoundedBox args={[1.28, 2.5, 0.12]} radius={0.05} material={kit.dark} />
      <P m="signal" position={[0, 0.58, 0.07]}><boxGeometry args={[1.02, 0.72, 0.01]} /></P>
      {range(5).map((i) => (
        <P key={i} m={i === 1 ? "signal" : "metal"} position={[i % 2 ? -0.14 : 0, 0.02 - i * 0.2, 0.07]}>
          <boxGeometry args={[i % 2 ? 0.74 : 1.02, 0.07, 0.01]} />
        </P>
      ))}
    </group>
  );
}

function Backend() {
  const kit = useKit();
  const leds = useMemo(() => range(5).flatMap((y) => range(6).map((x): Vec3 => [-0.82 + x * 0.14, -1 + y * 0.5, 0.47])), []);
  return (
    <group rotation={[0.28, -0.6, 0]}>
      {range(5).map((i) => (
        <group key={i} position={[0, -1 + i * 0.5, 0]}>
          <RoundedBox args={[2.2, 0.4, 0.9]} radius={0.03} material={kit.dark} />
          <P position={[0.62, 0, 0.455]}><boxGeometry args={[0.7, 0.16, 0.01]} /></P>
        </group>
      ))}
      <Scatter points={leds} m="signal"><sphereGeometry args={[0.035, 8, 8]} /></Scatter>
    </group>
  );
}

function Neural() {
  const { nodes, pairs } = useMemo(() => {
    const layers = [3, 5, 6, 5, 3].map((count, layer) =>
      range(count).map((i): Vec3 => {
        const angle = (i / count) * TAU;
        const radius = 0.25 + count * 0.13;
        return [-1.5 + layer * 0.75, Math.cos(angle) * radius, Math.sin(angle) * radius];
      }),
    );
    const pairs = layers.slice(0, -1).flatMap((layer, index) =>
      layer.flatMap((a) => layers[index + 1].map((b): [Vec3, Vec3] => [a, b])),
    );
    return { nodes: layers.flat(), pairs };
  }, []);
  return (
    <group rotation={[0.15, -0.35, 0]}>
      <Lines pairs={pairs} />
      <Scatter points={nodes} m="signal"><icosahedronGeometry args={[0.095, 1]} /></Scatter>
    </group>
  );
}

function Cloud() {
  const blobs: [Vec3, number][] = [[[0, 0.3, 0], 0.72], [[-0.75, 0.05, 0.1], 0.5], [[0.78, 0.05, 0], 0.54], [[0.28, 0.72, -0.1], 0.42], [[-0.34, 0.62, 0.2], 0.36]];
  const packets = useMemo(() => range(9).map((i): Vec3 => [-0.8 + (i % 3) * 0.8, -0.72 - Math.floor(i / 3) * 0.32, 0]), []);
  return (
    <group rotation={[0.1, -0.3, 0]} position={[0, 0.3, 0]}>
      {blobs.map(([position, radius]) => <P key={radius} m="glass" position={position}><icosahedronGeometry args={[radius, 2]} /></P>)}
      <P m="signal" position={[0, 0.3, 0]}><icosahedronGeometry args={[0.24, 0]} /></P>
      <Scatter points={packets} m="metal"><boxGeometry args={[0.2, 0.2, 0.2]} /></Scatter>
    </group>
  );
}

function Data() {
  return (
    <group rotation={[0.42, 0, 0.12]}>
      {range(4).map((i) => (
        <group key={i} position={[0, -1.05 + i * 0.7, 0]}>
          <P m={i === 3 ? "metal" : "dark"}><cylinderGeometry args={[1.05, 1.05, 0.48, 48]} /></P>
          <P m="signal" rotation={[Math.PI / 2, 0, 0]} position={[0, 0.26, 0]}><torusGeometry args={[1.05, 0.016, 8, 64]} /></P>
        </group>
      ))}
    </group>
  );
}

function Learning() {
  const kit = useKit();
  return (
    <group rotation={[0.4, -0.55, 0]} position={[0, -0.3, 0]}>
      {range(6).map((i) => (
        <RoundedBox
          key={i}
          args={[2.2 - i * 0.1, 0.24, 1.6 - i * 0.06]}
          radius={0.03}
          material={i % 3 === 1 ? kit.signal : i % 2 ? kit.metal : kit.dark}
          position={[Math.sin(i * 2.1) * 0.1, -0.7 + i * 0.27, 0]}
          rotation={[0, i * 0.16, 0]}
        />
      ))}
      <P m="glass" position={[0.1, 1.15, 0]}><octahedronGeometry args={[0.42, 0]} /></P>
    </group>
  );
}

function Agents() {
  const satellites = useMemo(() => range(7).map((i): Vec3 => {
    const angle = (i / 7) * TAU;
    return [Math.cos(angle) * 1.7, Math.sin(angle * 2) * 0.42, Math.sin(angle) * 1.7];
  }), []);
  const pairs = useMemo(() => satellites.map((point): [Vec3, Vec3] => [[0, 0, 0], point]), [satellites]);
  return (
    <group rotation={[0.35, 0, 0.1]}>
      <Lines pairs={pairs} />
      <P m="glass"><icosahedronGeometry args={[0.72, 1]} /></P>
      <P m="signal"><icosahedronGeometry args={[0.3, 0]} /></P>
      <Scatter points={satellites} m="metal"><octahedronGeometry args={[0.2, 0]} /></Scatter>
      <P m="dark" rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.7, 0.012, 8, 96]} /></P>
    </group>
  );
}

/** A parcel at the centre of a delivery route. */
function Commerce() {
  const kit = useKit();
  const parcels = useMemo(() => range(9).map((i): Vec3 => {
    const angle = (i / 9) * TAU;
    return [Math.cos(angle) * 1.95, 0, Math.sin(angle) * 1.95];
  }), []);
  return (
    <group rotation={[0.42, -0.6, 0.06]}>
      <RoundedBox args={[1.6, 1.25, 1.6]} radius={0.05} material={kit.dark} />
      <P m="signal" position={[0, 0, 0]}><boxGeometry args={[1.63, 1.28, 0.2]} /></P>
      <P m="signal" position={[0, 0, 0]}><boxGeometry args={[0.2, 1.28, 1.63]} /></P>
      <P m="metal" position={[0.48, 0.2, 0.81]}><boxGeometry args={[0.42, 0.3, 0.02]} /></P>
      <P m="metal" rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.95, 0.016, 8, 112]} /></P>
      <P m="dark" rotation={[Math.PI / 2, 0.35, 0]}><torusGeometry args={[2.2, 0.01, 8, 112]} /></P>
      <Scatter points={parcels} m="metal"><boxGeometry args={[0.2, 0.16, 0.2]} /></Scatter>
    </group>
  );
}

function Pipeline() {
  return (
    <group rotation={[0.3, -0.5, 0]}>
      <P m="dark" rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.1, 0.1, 4.1, 20]} /></P>
      {range(5).map((i) => {
        const size = 1.05 - i * 0.14;
        return (
          <group key={i} position={[-1.7 + i * 0.85, 0, 0]}>
            <P m={i === 2 ? "signal" : i % 2 ? "glass" : "metal"}><boxGeometry args={[0.5, size, size]} /></P>
            <P m="metal" rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[size * 0.76, 0.014, 8, 40]} /></P>
          </group>
        );
      })}
    </group>
  );
}

function Ledger() {
  const heights = [0.5, 1, 0.7, 1.5, 0.9, 1.3, 0.6, 1.8, 1.1, 0.8, 1.6, 0.6, 1.4, 0.7, 1.2, 2];
  return (
    <group rotation={[0.58, -0.72, 0]} position={[0, -0.45, 0]}>
      <P m="dark" position={[0, -0.04, 0]}><boxGeometry args={[2.75, 0.06, 2.75]} /></P>
      {heights.map((height, i) => (
        <P key={i} m={i === 15 || i === 7 ? "signal" : "metal"} position={[-0.99 + (i % 4) * 0.66, height / 2, -0.99 + Math.floor(i / 4) * 0.66]}>
          <boxGeometry args={[0.42, height, 0.42]} />
        </P>
      ))}
    </group>
  );
}

function ClusterModel() {
  const shapes: [Vec3, number, SurfaceName, number][] = [
    [[0, 0.1, 0], 0.82, "glass", 0], [[-1.05, 0.95, -0.3], 0.34, "metal", 1], [[1.05, 0.8, 0.25], 0.42, "dark", 2],
    [[-0.95, -0.85, 0.3], 0.46, "metal", 3], [[0.92, -0.95, -0.2], 0.3, "signal", 0], [[0.05, 1.42, 0.25], 0.2, "signal", 1],
    [[-1.48, 0.04, 0.2], 0.2, "dark", 2], [[1.52, -0.1, -0.2], 0.17, "metal", 3], [[0.05, -1.45, 0.1], 0.24, "metal", 2],
  ];
  return (
    <group>
      <P m="signal" position={[0, 0.1, 0]}><icosahedronGeometry args={[0.32, 0]} /></P>
      {shapes.map(([position, radius, m, kind]) => (
        <P key={`${position}`} m={m} position={position} rotation={[radius * 4, radius * 7, 0]}>
          {kind === 0 && <icosahedronGeometry args={[radius, 0]} />}
          {kind === 1 && <octahedronGeometry args={[radius, 0]} />}
          {kind === 2 && <dodecahedronGeometry args={[radius, 0]} />}
          {kind === 3 && <tetrahedronGeometry args={[radius, 0]} />}
        </P>
      ))}
    </group>
  );
}

function Gyroscope() {
  return (
    <group>
      <P m="signal"><sphereGeometry args={[0.3, 32, 32]} /></P>
      {[1.6, 1.22, 0.84].map((radius, i) => (
        <P key={radius} m={i === 1 ? "dark" : "metal"} rotation={[0.9 + i * 0.85, i * 0.8, 0]}><torusGeometry args={[radius, 0.055, 12, 96]} /></P>
      ))}
    </group>
  );
}

function Prism() {
  return (
    <group rotation={[0.3, 0.4, 0]}>
      <P m="metal"><cylinderGeometry args={[1.15, 1.15, 2, 3]} /></P>
      <P m="signal" position={[0, 1.25, 0]}><octahedronGeometry args={[0.28, 0]} /></P>
    </group>
  );
}

function Helix() {
  const { strands, rungs } = useMemo(() => {
    const strands: Vec3[] = [];
    const rungs: [Vec3, Vec3][] = [];
    range(26).forEach((i) => {
      const angle = i * 0.48;
      const y = -1.75 + i * 0.14;
      const a: Vec3 = [Math.cos(angle) * 0.85, y, Math.sin(angle) * 0.85];
      const b: Vec3 = [-a[0], y, -a[2]];
      strands.push(a, b);
      if (i % 2 === 0) rungs.push([a, b]);
    });
    return { strands, rungs };
  }, []);
  return (
    <group rotation={[0, 0, 0.28]}>
      <Lines pairs={rungs} />
      <Scatter points={strands} m="metal"><sphereGeometry args={[0.105, 12, 12]} /></Scatter>
    </group>
  );
}

function Lattice() {
  const points = useMemo(() => range(64).map((i): Vec3 => [
    -1.05 + (i % 4) * 0.7,
    -1.05 + (Math.floor(i / 4) % 4) * 0.7,
    -1.05 + Math.floor(i / 16) * 0.7,
  ]), []);
  return (
    <group rotation={[0.55, 0.65, 0]}>
      <Scatter points={points} m="metal"><boxGeometry args={[0.36, 0.36, 0.36]} /></Scatter>
      <P m="signal"><boxGeometry args={[0.9, 0.9, 0.9]} /></P>
    </group>
  );
}

function Portal() {
  const ring = useMemo(() => range(48).map((i): Vec3 => {
    const angle = (i / 48) * TAU;
    return [Math.cos(angle) * 1.95, Math.sin(angle) * 1.95, Math.sin(angle * 4) * 0.2];
  }), []);
  return (
    <group rotation={[0.1, -0.45, 0]}>
      {range(5).map((i) => (
        <P key={i} m={i === 0 ? "metal" : "dark"} position={[0, 0, -i * 0.5]}><torusGeometry args={[1.6 - i * 0.2, 0.055 - i * 0.006, 12, 96]} /></P>
      ))}
      <P m="signal" position={[0, 0, -2.3]}><sphereGeometry args={[0.32, 32, 32]} /></P>
      <Scatter points={ring} m="signal"><octahedronGeometry args={[0.055, 0]} /></Scatter>
    </group>
  );
}

function Knot() {
  return <P m="metal"><torusKnotGeometry args={[1.05, 0.3, 180, 24, 2, 3]} /></P>;
}

function Temple() {
  return (
    <group rotation={[0.28, -0.5, 0]} position={[0, -0.1, 0]}>
      <P m="dark" position={[0, -1.08, 0]}><boxGeometry args={[3, 0.22, 1.9]} /></P>
      {range(5).map((i) => <P key={i} m="metal" position={[-1.14 + i * 0.57, 0, 0.5]}><cylinderGeometry args={[0.13, 0.15, 2, 16]} /></P>)}
      {range(5).map((i) => <P key={i} m="dark" position={[-1.14 + i * 0.57, 0, -0.5]}><cylinderGeometry args={[0.13, 0.15, 2, 16]} /></P>)}
      <P m="signal" position={[0, 1.42, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[2.05, 0.65, 4]} /></P>
    </group>
  );
}

function Cap() {
  return (
    <group rotation={[0.46, 0.5, 0]}>
      <P m="dark" position={[0, -0.34, 0]}><cylinderGeometry args={[0.92, 1.02, 0.72, 32]} /></P>
      <P m="metal" rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[2.7, 0.07, 2.7]} /></P>
      <P m="signal" position={[0, 0.07, 0]}><sphereGeometry args={[0.11, 16, 16]} /></P>
      <P m="signal" position={[1.25, -0.42, 0]}><cylinderGeometry args={[0.025, 0.025, 0.9, 8]} /></P>
      <P m="signal" position={[1.25, -0.92, 0]}><coneGeometry args={[0.11, 0.3, 12]} /></P>
    </group>
  );
}

function Links() {
  return (
    <group rotation={[0.25, 0.3, 0]}>
      <P m="metal" position={[-1, 0, 0]}><torusGeometry args={[0.82, 0.15, 16, 64]} /></P>
      <P m="signal" rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.82, 0.15, 16, 64]} /></P>
      <P m="dark" position={[1, 0, 0]}><torusGeometry args={[0.82, 0.15, 16, 64]} /></P>
    </group>
  );
}

function Tower() {
  return (
    <group rotation={[0.24, 0.5, 0]} position={[0, -0.15, 0]}>
      {range(7).map((i) => (
        <P key={i} m={i === 6 ? "signal" : i % 2 ? "dark" : "metal"} position={[0, -1.35 + i * 0.46, 0]} rotation={[0, i * 0.3, 0]}>
          <boxGeometry args={[1.9 - i * 0.24, 0.34, 1.9 - i * 0.24]} />
        </P>
      ))}
    </group>
  );
}

function Globe() {
  const kit = useKit();
  const shell = useMemo(() => new IcosahedronGeometry(1.42, 2), []);
  const pins = useMemo(() => range(26).map((i): Vec3 => {
    const y = 1 - ((i + 0.5) / 26) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = i * 2.399963;
    return [Math.cos(angle) * radius * 1.42, y * 1.42, Math.sin(angle) * radius * 1.42];
  }), []);
  return (
    <group rotation={[0.3, 0, 0.3]}>
      <lineSegments material={kit.line}>
        <wireframeGeometry args={[shell]} />
      </lineSegments>
      <P m="dark"><icosahedronGeometry args={[1.32, 3]} /></P>
      <Scatter points={pins} m="signal"><sphereGeometry args={[0.07, 10, 10]} /></Scatter>
      <P m="metal" rotation={[Math.PI / 2, 0.2, 0]}><torusGeometry args={[1.82, 0.022, 8, 96]} /></P>
    </group>
  );
}

export const models: Record<ModelName, () => ReactNode> = {
  mobile: Mobile, backend: Backend, ai: Neural, cloud: Cloud, data: Data,
  commerce: Commerce, learning: Learning, agents: Agents, pipeline: Pipeline, ledger: Ledger,
  cluster: ClusterModel, gyroscope: Gyroscope, prism: Prism, helix: Helix, lattice: Lattice, portal: Portal,
  knot: Knot, temple: Temple, cap: Cap, links: Links, tower: Tower, globe: Globe,
};
