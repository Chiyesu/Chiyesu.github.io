"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  MathUtils,
  Object3D as Transform,
  type Group,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
  type PerspectiveCamera as PerspectiveCameraType,
  type ShaderMaterial,
} from "three";
import { bridgeState } from "./bridgeState";
import { useKit } from "./materials";

const TUNNEL = 76;
const SEGMENTS = 18;
const GATE_RADIUS = 3.3;
const smooth = MathUtils.smoothstep;

const flowHead = /* glsl */ `
  uniform float uTravel;
  uniform float uSpeed;
  uniform float uVisible;
  uniform float uTime;
  varying float vAlpha;
  varying float vHeat;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
`;

export const streakVertex =/* glsl */ `
  ${flowHead}
  void main() {
    float id = float(gl_InstanceID);
    float a = hash(id * 12.9898);
    float b = hash(id * 78.233);
    float c = hash(id * 39.425);
    float z = mod(c * ${TUNNEL.toFixed(1)} + uTravel * (0.75 + a * 0.5) + uTime * 0.5, ${TUNNEL.toFixed(1)}) - ${(TUNNEL - 3).toFixed(1)};
    float radius = 2.1 + b * b * 8.5;
    float angle = a * 6.28318 + z * 0.018 * uSpeed;
    float width = 0.012 + b * 0.016;
    float len = 0.14 + uSpeed * (3.5 + a * 9.0);
    vec3 p = vec3(cos(angle) * radius, sin(angle) * radius, z) + position * vec3(width, width, len);
    vAlpha = uVisible * smoothstep(-70.0, -38.0, z) * smoothstep(3.0, -0.5, z) * (0.2 + uSpeed * 0.8);
    vHeat = a * uSpeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const ringVertex = /* glsl */ `
  ${flowHead}
  void main() {
    float id = float(gl_InstanceID);
    float z = mod(id / 18.0 * ${TUNNEL.toFixed(1)} + uTravel, ${TUNNEL.toFixed(1)}) - ${(TUNNEL - 3).toFixed(1)};
    float turn = z * 0.045 + id * 0.26;
    vec2 q = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * position.xy;
    vAlpha = uVisible * smoothstep(-72.0, -28.0, z) * smoothstep(2.5, -2.0, z) * (0.1 + uSpeed * 0.55);
    vHeat = 0.25 * uSpeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(q, z, 1.0);
  }
`;

export const flowFragment =/* glsl */ `
  varying float vAlpha;
  varying float vHeat;
  void main() {
    gl_FragColor = vec4(mix(vec3(0.5, 0.86, 0.95), vec3(1.0), vHeat), vAlpha);
  }
`;

export const glowVertex =/* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glowFragment =/* glsl */ `
  uniform float uPower;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float halo = pow(max(1.0 - d, 0.0), 3.0);
    float core = pow(max(1.0 - d * 3.2, 0.0), 2.0);
    vec3 color = min((vec3(0.5, 0.86, 0.95) * halo + vec3(1.0) * core) * uPower, vec3(1.0));
    // The canvas is transparent, so alpha must fade with brightness or the quad shows as a black box.
    float alpha = max(color.r, max(color.g, color.b));
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color / alpha, alpha);
  }
`;

function Scene({ streaks }: { streaks: number }) {
  const kit = useKit();
  const root = useRef<Group>(null);
  const gate = useRef<Group>(null);
  const segments = useRef<InstancedMesh>(null);
  const halo = useRef<Mesh>(null);
  const nodes = useRef<(Mesh | null)[]>([]);
  const glow = useRef<Mesh>(null);
  const glowMaterial = useRef<ShaderMaterial>(null);
  const flowMaterial = useRef<ShaderMaterial>(null);
  const current = useRef(0);
  const clock = useRef(0);
  const dummy = useMemo(() => new Transform(), []);
  const flow = useMemo(() => ({ uTravel: { value: 0 }, uSpeed: { value: 0 }, uVisible: { value: 0 }, uTime: { value: 0 } }), []);
  const glowUniforms = useMemo(() => ({ uPower: { value: 0 } }), []);

  useLayoutEffect(() => {
    if (segments.current) segments.current.frustumCulled = false;
  }, []);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    current.current = MathUtils.damp(current.current, bridgeState.value, 9, delta);
    const p = current.current;
    if (!root.current) return;
    root.current.visible = p > 0.004 && p < 0.97;
    if (!root.current.visible) return;
    clock.current += delta;

    const aspect = (camera as PerspectiveCameraType).aspect || 1;
    const t = MathUtils.clamp((p - 0.28) / 0.56, 0, 1);
    const travel = 120 * t * t * (3 - 2 * t);
    const speed = 4 * t * (1 - t);
    const appear = smooth(p, 0.03, 0.14);
    const vanish = 1 - smooth(p, 0.84, 0.93);

    // Both flow materials share one uniforms object, so writing through either updates the two.
    if (flowMaterial.current) {
      const values = flowMaterial.current.uniforms;
      values.uTravel.value = travel;
      values.uSpeed.value = speed;
      values.uVisible.value = appear * vanish;
      values.uTime.value = clock.current;
    }

    // The gate races past the camera as the jump begins.
    const pass = smooth(p, 0.3, 0.47);
    const gateZ = -20 + pass * pass * 26;
    if (gate.current) {
      gate.current.visible = gateZ < 4.5;
      gate.current.position.z = gateZ;
      gate.current.scale.setScalar(Math.min(1, aspect * 1.7));
    }

    if (segments.current) {
      for (let i = 0; i < SEGMENTS; i += 1) {
        const lock = smooth(p, 0.13 + i * 0.005, 0.24 + i * 0.005);
        const eased = 1 - Math.pow(1 - lock, 3);
        const angle = (i / SEGMENTS) * Math.PI * 2 + (1 - eased) * 1.7 + clock.current * 0.08 + pass * 2.2;
        const radius = GATE_RADIUS + (1 - eased) * 6;
        dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, (1 - eased) * (i % 2 ? 4 : -4));
        dummy.rotation.set(0, 0, angle);
        dummy.scale.setScalar(Math.max(eased, 0.001));
        dummy.updateMatrix();
        segments.current.setMatrixAt(i, dummy.matrix);
      }
      segments.current.instanceMatrix.needsUpdate = true;
    }

    const locked = smooth(p, 0.22, 0.3);
    if (halo.current) (halo.current.material as MeshBasicMaterial).opacity = locked * 0.9;

    // The five areas of expertise fall inward and power the gate.
    const converge = smooth(p, 0.05, 0.24);
    nodes.current.forEach((node, index) => {
      if (!node) return;
      const angle = Math.PI / 2 + (index / 5) * Math.PI * 2 + converge * converge * 3.4;
      const radius = 2.5 * (1 - converge * converge);
      node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      node.scale.setScalar(Math.max(smooth(p, 0.09, 0.14) * (1 - smooth(converge, 0.86, 1)) * 0.2, 0.0001));
    });

    const coreGlow = smooth(p, 0.16, 0.29) * (1 - smooth(p, 0.33, 0.43));
    const exitGlow = smooth(p, 0.835, 0.885) * (1 - smooth(p, 0.885, 0.95));
    const exiting = exitGlow > coreGlow;
    if (glow.current && glowMaterial.current) {
      const power = Math.max(coreGlow * 0.85, exitGlow * 1.5);
      glow.current.visible = power > 0.003;
      glow.current.position.z = exiting ? -8 : gateZ;
      glow.current.scale.setScalar(exiting ? 2 + exitGlow * 9 : 1 + coreGlow * 2.2);
      glowMaterial.current.uniforms.uPower.value = power;
    }

    const camera3D = camera as PerspectiveCameraType;
    camera3D.fov = 38 + speed * 46;
    camera3D.position.set(0, 0, 0);
    camera3D.rotation.set(0, 0, Math.sin(t * Math.PI * 2) * 0.32 * speed);
    camera3D.updateProjectionMatrix();
  });

  return (
    <group ref={root} visible={false}>
      <instancedMesh args={[undefined, undefined, streaks]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <shaderMaterial ref={flowMaterial} vertexShader={streakVertex} fragmentShader={flowFragment} uniforms={flow} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>

      <instancedMesh args={[undefined, undefined, 18]} frustumCulled={false}>
        <ringGeometry args={[5.6, 5.66, 6, 1]} />
        <shaderMaterial vertexShader={ringVertex} fragmentShader={flowFragment} uniforms={flow} transparent blending={AdditiveBlending} depthWrite={false} side={DoubleSide} toneMapped={false} />
      </instancedMesh>

      <group ref={gate} position={[0, 0, -20]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 5, 6]} intensity={2.4} color="#e8f6ff" />
        <directionalLight position={[-5, -3, 3]} intensity={1.1} color="#7fd3e8" />
        <instancedMesh ref={segments} args={[undefined, kit.metal, SEGMENTS]}>
          <boxGeometry args={[0.34, 0.92, 0.5]} />
        </instancedMesh>
        <mesh ref={halo}>
          <ringGeometry args={[GATE_RADIUS - 0.34, GATE_RADIUS - 0.3, 128]} />
          <meshBasicMaterial color="#a8e9f7" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} toneMapped={false} />
        </mesh>
        {[0, 1, 2, 3, 4].map((index) => (
          <mesh
            key={index}
            material={kit.signal}
            ref={(node) => {
              nodes.current[index] = node;
            }}
          >
            <icosahedronGeometry args={[1, 1]} />
          </mesh>
        ))}
      </group>

      <mesh ref={glow} visible={false} renderOrder={6}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={glowMaterial}
          vertexShader={glowVertex}
          fragmentShader={glowFragment}
          uniforms={glowUniforms}
          transparent
          blending={AdditiveBlending}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default function WarpScene({ streaks }: { streaks: number }) {
  return (
    <View className="absolute inset-0">
      <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={38} near={0.05} far={120} />
      <Scene streaks={streaks} />
    </View>
  );
}
