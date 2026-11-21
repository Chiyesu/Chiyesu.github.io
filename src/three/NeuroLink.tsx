"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
  Object3D,
  QuadraticBezierCurve3,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type Group,
  type InstancedMesh,
  type LineSegments,
  type Mesh,
  type MeshBasicMaterial,
  type Points,
  type PointsMaterial,
  type PerspectiveCamera as PerspectiveCameraType,
  type Sprite,
} from "three";
import type { StackNode } from "@/content/stack";
import { seeded } from "./Dust";
import { useKit } from "./materials";
import { sceneState } from "./sceneState";
import { stackState } from "./stackState";

const TUBE_SEGMENTS = 44;
const TUBE_SIDES = 6;
const CURVE_STEPS = 12;
const DENDRITES_PER_NODE = 9;
const FOV = 38;
const FOV_TANGENT = Math.tan(MathUtils.degToRad(FOV / 2));
const DIM = new Color("#39414c");
const LIT = new Color("#7fd3e8");
const HOT = new Color("#f2fcff");

/** A bend above 1 hugs the outer shell. A bend below 1 cuts through the interior. */
function arc(a: Vector3, b: Vector3, bend: number) {
  const control = a.clone().add(b).multiplyScalar(0.5 * bend);
  return new QuadraticBezierCurve3(a, control, b);
}

function buildGraph(stack: StackNode[], dustCount: number) {
  const random = seeded(6143);
  const count = stack.length;
  const nodes = stack.map((_, i) => {
    const y = MathUtils.lerp(1.95, -1.95, i / (count - 1));
    const radius = 2.45 * Math.sqrt(Math.max(0.16, 1 - (y / 2.5) ** 2));
    // A steady spiral keeps each node close to the next, so links read as one growing path.
    const angle = i * 1.08;
    return new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius * 0.82);
  });

  const curves = nodes.slice(0, -1).map((node, i) => arc(node, nodes[i + 1], 1.16));
  const tubes = curves.map((curve) => new TubeGeometry(curve, TUBE_SEGMENTS, 0.017, TUBE_SIDES, false));

  // Faint synapses between tools that share a project, revealed once both ends are reached.
  const pairs: { a: number; b: number }[] = [];
  stack.forEach((node, a) => {
    stack.slice(a + 2).forEach((other, offset) => {
      if (node.usedIn.some((slug) => other.usedIn.includes(slug))) pairs.push({ a, b: a + 2 + offset });
    });
  });
  pairs.sort((x, y) => x.b - y.b);
  const crossPositions: number[] = [];
  pairs.forEach(({ a, b }) => {
    const points = arc(nodes[a], nodes[b], 0.42).getPoints(CURVE_STEPS);
    points.slice(0, -1).forEach((point, i) => crossPositions.push(...point.toArray(), ...points[i + 1].toArray()));
  });
  const cross = new BufferGeometry();
  cross.setAttribute("position", new Float32BufferAttribute(crossPositions, 3));

  // Short branching dendrites give every node the look of a neuron.
  const dendritePositions: number[] = [];
  nodes.forEach((node) => {
    for (let branch = 0; branch < 3; branch += 1) {
      const direction = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
      const elbow = node.clone().addScaledVector(direction, 0.24 + random() * 0.2);
      dendritePositions.push(...node.toArray(), ...elbow.toArray());
      for (let tip = 0; tip < 2; tip += 1) {
        const spread = direction.clone().add(new Vector3(random() - 0.5, random() - 0.5, random() - 0.5)).normalize();
        dendritePositions.push(...elbow.toArray(), ...elbow.clone().addScaledVector(spread, 0.14 + random() * 0.22).toArray());
      }
    }
  });
  const dendrites = new BufferGeometry();
  dendrites.setAttribute("position", new Float32BufferAttribute(dendritePositions, 3));

  const dustPositions: number[] = [];
  for (let i = 0; i < dustCount; i += 1) {
    const direction = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
    dustPositions.push(...direction.multiplyScalar(1.2 + random() * 3.6).toArray());
  }
  const dust = new BufferGeometry();
  dust.setAttribute("position", new Float32BufferAttribute(dustPositions, 3));

  return { nodes, curves, tubes, pairs, cross, dendrites, dust };
}

const CORE_VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDirection;
  void main() {
    vNormalView = normalize(normalMatrix * normal);
    vec4 position4 = modelViewMatrix * vec4(position, 1.0);
    vViewDirection = normalize(-position4.xyz);
    gl_Position = projectionMatrix * position4;
  }
`;

const CORE_FRAGMENT = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDirection;
  void main() {
    float rim = pow(1.0 - max(dot(normalize(vNormalView), normalize(vViewDirection)), 0.0), 2.4);
    gl_FragColor = vec4(mix(vec3(0.97, 1.0, 1.0), vec3(0.30, 0.78, 0.92), rim), 1.0);
  }
`;

function radialGlow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(190, 240, 252, 0.95)");
    gradient.addColorStop(0.22, "rgba(127, 211, 232, 0.42)");
    gradient.addColorStop(0.55, "rgba(70, 150, 180, 0.1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function labelTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (context) {
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-jetbrains-mono").trim();
    context.font = `500 40px ${family || "ui-monospace"}, ui-monospace, monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#eceff2";
    context.shadowColor = "#08090b";
    context.shadowBlur = 14;
    context.fillText(text, 320, 50);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

interface NetworkProps {
  stack: StackNode[];
  animated: boolean;
  dustCount: number;
}

function Network({ stack, animated, dustCount }: NetworkProps) {
  const kit = useKit();
  const graph = useMemo(() => buildGraph(stack, dustCount), [stack, dustCount]);
  const labels = useMemo(() => stack.map((node) => labelTexture(node.label)), [stack]);
  const somaMaterial = useMemo(
    () => new MeshStandardMaterial({ color: "#ffffff", metalness: 0.55, roughness: 0.26, envMap: kit.metal.envMap, envMapIntensity: 1.2 }),
    [kit],
  );

  const soma = useRef<InstancedMesh>(null);
  const halo = useRef<Mesh>(null);
  const pulse = useRef<Mesh>(null);
  const crossLines = useRef<LineSegments>(null);
  const dendriteLines = useRef<LineSegments>(null);
  const tubes = useRef<(Mesh | null)[]>([]);
  const sprites = useRef<(Sprite | null)[]>([]);
  const current = useRef(0);
  const orbit = useRef(0);
  const focus = useRef(new Vector3());
  const placedLabels = useRef<{ x: number; y: number; halfWidth: number; halfHeight: number }[]>([]);
  const rig = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const glow = useRef<Sprite>(null);
  const glowTexture = useMemo(() => radialGlow(), []);
  const dustCloud = useRef<Points>(null);
  const shockwaves = useRef<(Mesh | null)[]>([]);
  const finaleValue = useRef(0);
  const scratch = useRef({ dummy: new Object3D(), color: new Color(), point: new Vector3(), goal: new Vector3() });

  useLayoutEffect(() => {
    if (!soma.current) return;
    const color = new Color();
    graph.nodes.forEach((_, i) => soma.current?.setColorAt(i, color.copy(DIM)));
    if (soma.current.instanceColor) soma.current.instanceColor.needsUpdate = true;
    soma.current.frustumCulled = false;
  }, [graph]);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const last = graph.nodes.length - 1;
    current.current = animated ? MathUtils.damp(current.current, stackState.value, 4.2, delta) : stackState.value;
    const v = current.current;
    const { dummy, color, point, goal } = scratch.current;

    // Closing cinematic: a signal fires down the chain, the network spirals into a core, the core bursts.
    finaleValue.current = animated ? MathUtils.damp(finaleValue.current, stackState.finale, 7, delta) : stackState.finale;
    const f = finaleValue.current;
    const wave = MathUtils.smoothstep(f, 0.02, 0.27);
    const wavePosition = wave * (last + 2.4) - 1.2;
    const collapse = MathUtils.smoothstep(f, 0.26, 0.62);
    const burst = MathUtils.smoothstep(f, 0.61, 0.86);
    const labelFade = 1 - MathUtils.smoothstep(f, 0.08, 0.22);

    if (rig.current) {
      rig.current.visible = collapse < 0.995;
      rig.current.scale.setScalar(Math.max(0.001, 1 - collapse));
      rig.current.rotation.y = collapse * collapse * 7.5;
      rig.current.rotation.z = collapse * collapse * 1.6;
    }
    if (core.current) {
      const grow = MathUtils.smoothstep(f, 0.3, 0.6);
      const breathe = animated ? 1 + Math.sin(orbit.current * 90) * 0.04 : 1;
      // The core implodes just as the shockwave launches.
      const implode = 1 - MathUtils.smoothstep(burst, 0, 0.3);
      core.current.visible = grow > 0.001 && implode > 0.001;
      core.current.scale.setScalar(Math.max(0.001, grow * 0.44 * breathe * implode));
      if (glow.current) {
        glow.current.visible = grow > 0.001 && burst < 0.999;
        const size = grow * 2.5 * breathe + burst * 9;
        glow.current.scale.set(Math.max(0.001, size), Math.max(0.001, size), 1);
        glow.current.material.opacity = grow * 0.9 * (1 - burst) ** 2;
      }
    }
    shockwaves.current.forEach((ring, i) => {
      if (!ring) return;
      const local = MathUtils.clamp((f - 0.62 - i * 0.045) / 0.27, 0, 1);
      const eased = 1 - (1 - local) ** 3;
      ring.visible = local > 0 && local < 1;
      ring.quaternion.copy(camera.quaternion);
      ring.scale.setScalar(Math.max(0.001, eased * (10 + i * 2.5)));
      (ring.material as MeshBasicMaterial).opacity = (1 - local) ** 1.6 * (0.85 - i * 0.2);
    });
    if (dustCloud.current) {
      dustCloud.current.scale.setScalar(1 + burst * burst * 4.2);
      const material = dustCloud.current.material as PointsMaterial;
      material.opacity = (0.5 + burst * 0.45) * (1 - MathUtils.smoothstep(f, 0.82, 0.97));
      material.size = 0.018 + burst * 0.03;
    }

    graph.nodes.forEach((node, i) => {
      const arrived = i === 0 ? 1 : MathUtils.clamp(v - (i - 1), 0, 1);
      const reached = MathUtils.smoothstep(arrived, 0.82, 1);
      const active = 1 - MathUtils.clamp(Math.abs(v - i) * 1.7, 0, 1) ;
      const flash = f > 0 ? 1 - MathUtils.clamp(Math.abs(i - wavePosition) / 1.5, 0, 1) : 0;
      dummy.position.copy(node);
      dummy.scale.setScalar(0.075 + reached * 0.05 + active * 0.11 * (1 - wave) + flash * 0.13);
      dummy.updateMatrix();
      soma.current?.setMatrixAt(i, dummy.matrix);
      color.copy(DIM).lerp(LIT, reached).lerp(HOT, Math.max(active * 0.8 * (1 - wave), flash));
      soma.current?.setColorAt(i, color);
    });

    // Labels keep a constant on-screen size. Only reached nodes are named, and none may crowd the active one.
    const lead = Math.round(MathUtils.clamp(v, 0, last));
    const labelAspect = (camera as PerspectiveCameraType).aspect || 1;
    const placed = placedLabels.current;
    placed.length = 0;
    // Nearest nodes claim their label space first, so the labels around the active node survive.
    for (let distance = 0; distance <= last; distance += 1) {
      for (const i of distance === 0 ? [lead] : [lead - distance, lead + distance]) {
        const node = graph.nodes[i];
        const sprite = sprites.current[i];
        if (!node || !sprite) continue;
        const arrived = i === 0 ? 1 : MathUtils.clamp(v - (i - 1), 0, 1);
        const reached = MathUtils.smoothstep(arrived, 0.82, 1);
        const active = 1 - MathUtils.clamp(Math.abs(v - i) * 1.7, 0, 1);
        sprite.position.set(node.x, node.y + 0.26 + active * 0.08, node.z);
        const depth = sprite.position.distanceTo(camera.position);
        const size = depth * (0.026 + active * 0.012);
        sprite.scale.set(size * 6.67, size, 1);
        point.copy(sprite.position).project(camera);
        const emphasis = 1 + active * 0.46;
        const halfWidth = (stack[i].label.length * 0.0098 * emphasis) / labelAspect;
        const halfHeight = 0.05 * emphasis;
        const crowded = placed.some(
          (box) => Math.abs(point.x - box.x) < halfWidth + box.halfWidth && Math.abs(point.y - box.y) < halfHeight + box.halfHeight,
        );
        if (!crowded && reached > 0.05) placed.push({ x: point.x, y: point.y, halfWidth, halfHeight });
        sprite.material.opacity = (crowded ? 0 : reached * 0.42 + active * 0.58) * labelFade;
        sprite.renderOrder = i === lead ? 12 : 10;
      }
    }
    if (soma.current) {
      soma.current.instanceMatrix.needsUpdate = true;
      if (soma.current.instanceColor) soma.current.instanceColor.needsUpdate = true;
    }

    graph.tubes.forEach((geometry, i) => {
      const fraction = MathUtils.clamp(v - i, 0, 1);
      geometry.setDrawRange(0, Math.floor(fraction * TUBE_SEGMENTS) * TUBE_SIDES * 6);
      const tube = tubes.current[i];
      if (tube) tube.visible = fraction > 0.001;
    });

    const index = Math.min(Math.floor(v), last - 1);
    const fraction = MathUtils.clamp(v - index, 0, 1);
    if (pulse.current) {
      const firing = f > 0.005 && wavePosition >= 0 && wavePosition < last;
      pulse.current.visible = firing || (v < last && fraction > 0.01 && fraction < 0.99);
      if (pulse.current.visible) {
        const segment = firing ? Math.floor(wavePosition) : index;
        graph.curves[segment].getPoint(firing ? wavePosition - segment : fraction, point);
        pulse.current.position.copy(point);
      }
    }
    if (halo.current) {
      const nearest = Math.round(MathUtils.clamp(v, 0, last));
      halo.current.position.copy(graph.nodes[nearest]);
      halo.current.quaternion.copy(camera.quaternion);
      const closeness = (1 - MathUtils.clamp(Math.abs(v - nearest) * 2.4, 0, 1)) * (1 - MathUtils.smoothstep(f, 0, 0.1));
      halo.current.scale.setScalar(Math.max(0.001, closeness * (0.42 + (animated ? Math.sin(orbit.current * 22) * 0.025 : 0))));
    }

    const synapses = graph.pairs.filter((pair) => pair.b <= v + 0.02).length;
    crossLines.current?.geometry.setDrawRange(0, synapses * CURVE_STEPS * 2);
    dendriteLines.current?.geometry.setDrawRange(0, (Math.floor(v + 0.04) + 1) * DENDRITES_PER_NODE * 2);

    // The camera travels along the chain, then pulls back to reveal the finished network.
    if (animated) orbit.current += delta * 0.035;
    const finale = MathUtils.smoothstep(v, last - 0.7, last);
    goal.copy(graph.nodes[index]).lerp(graph.nodes[index + 1], fraction).multiplyScalar(0.3 * (1 - finale));
    focus.current.copy(goal);
    const angle = v * 0.3 + orbit.current + sceneState.pointer.x * 0.16 + wave * 0.5 + collapse * 0.9;
    // Keeps the whole network inside the panel at any aspect ratio.
    const aspect = (camera as PerspectiveCameraType).aspect || 1;
    const distance = (Math.max(7.6, 3.08 / (FOV_TANGENT * Math.min(aspect, 1.3))) + finale * 0.5) * (1 - collapse * 0.2 - burst * 0.2);
    camera.position.set(
      Math.sin(angle) * distance,
      0.55 + focus.current.y * 0.6 + sceneState.pointer.y * 0.4,
      Math.cos(angle) * distance,
    );
    camera.lookAt(focus.current);
  });

  return (
    <group>
      <points ref={dustCloud} geometry={graph.dust}>
        <pointsMaterial color="#8fc6d6" size={0.018} transparent opacity={0.5} depthWrite={false} sizeAttenuation />
      </points>
      <sprite ref={glow} visible={false} renderOrder={18}>
        <spriteMaterial map={glowTexture} transparent opacity={0} blending={AdditiveBlending} depthTest={false} depthWrite={false} toneMapped={false} />
      </sprite>
      <mesh ref={core} visible={false} renderOrder={19}>
        <sphereGeometry args={[1, 64, 48]} />
        <shaderMaterial vertexShader={CORE_VERTEX} fragmentShader={CORE_FRAGMENT} toneMapped={false} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(node) => {
            shockwaves.current[i] = node;
          }}
          visible={false}
          renderOrder={20}
        >
          <ringGeometry args={[0.994, 1, 160]} />
          <meshBasicMaterial color="#9fe6f7" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
        </mesh>
      ))}
      <group ref={rig}>
      <instancedMesh ref={soma} args={[undefined, somaMaterial, graph.nodes.length]}>
        <icosahedronGeometry args={[1, 2]} />
      </instancedMesh>
      {graph.tubes.map((geometry, i) => (
        <mesh
          key={i}
          ref={(node) => {
            tubes.current[i] = node;
          }}
          geometry={geometry}
          material={kit.signal}
          frustumCulled={false}
        />
      ))}
      <lineSegments ref={crossLines} geometry={graph.cross} frustumCulled={false}>
        <lineBasicMaterial color="#7fd3e8" transparent opacity={0.2} depthWrite={false} />
      </lineSegments>
      <lineSegments ref={dendriteLines} geometry={graph.dendrites} frustumCulled={false}>
        <lineBasicMaterial color="#9fb7c4" transparent opacity={0.42} depthWrite={false} />
      </lineSegments>
      <mesh ref={pulse} visible={false} material={kit.signal}>
        <sphereGeometry args={[0.075, 16, 16]} />
      </mesh>
      <mesh ref={halo}>
        <ringGeometry args={[0.86, 1, 56]} />
        <meshBasicMaterial color="#7fd3e8" transparent opacity={0.65} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      {labels.map((map, i) => (
        <sprite
          key={stack[i].id}
          ref={(node) => {
            sprites.current[i] = node;
          }}
          renderOrder={10}
        >
          <spriteMaterial map={map} transparent depthTest={false} depthWrite={false} />
        </sprite>
      ))}
      </group>
    </group>
  );
}

interface NeuroLinkProps {
  stack: StackNode[];
  animated: boolean;
  dustCount: number;
}

export default function NeuroLink({ stack, animated, dustCount }: NeuroLinkProps) {
  return (
    <View className="absolute inset-0">
      <PerspectiveCamera makeDefault position={[0, 0.5, 9]} fov={FOV} near={0.1} far={40} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 5]} intensity={2} color="#e8f6ff" />
      <directionalLight position={[-5, -3, -2]} intensity={0.9} color="#7fd3e8" />
      <Network stack={stack} animated={animated} dustCount={dustCount} />
    </View>
  );
}
