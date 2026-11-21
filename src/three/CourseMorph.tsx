"use client";

import { PerspectiveCamera, View } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  DataTexture,
  FloatType,
  MathUtils,
  NearestFilter,
  RGBAFormat,
  type Group,
  type PerspectiveCamera as PerspectiveCameraType,
  type ShaderMaterial,
} from "three";
import type { CourseShape } from "@/content/coursework";
import { courseState } from "./courseState";
import { buildTargets } from "./courseShapes";
import { sceneState } from "./sceneState";

const FOV = 30;
const FOV_TANGENT = Math.tan(MathUtils.degToRad(FOV / 2));

// Every particle reads its position in each shape from a texture, so morphing costs no CPU per particle.
const vertexShader = /* glsl */ `
  precision highp sampler2D;
  uniform sampler2D uTargets;
  uniform int uFrom;
  uniform int uTo;
  uniform float uMix;
  uniform float uTime;
  uniform float uSize;
  varying vec3 vNormalView;
  varying vec3 vViewDirection;
  varying float vAccent;
  varying float vTravel;

  mat3 spin(vec3 axis, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float o = 1.0 - c;
    return mat3(
      o * axis.x * axis.x + c, o * axis.x * axis.y + axis.z * s, o * axis.z * axis.x - axis.y * s,
      o * axis.x * axis.y - axis.z * s, o * axis.y * axis.y + c, o * axis.y * axis.z + axis.x * s,
      o * axis.z * axis.x + axis.y * s, o * axis.y * axis.z - axis.x * s, o * axis.z * axis.z + c
    );
  }

  void main() {
    float id = float(gl_InstanceID);
    float seed = fract(sin(id * 12.9898) * 43758.5453);
    float seedB = fract(sin(id * 78.233) * 24634.6345);
    vec4 from = texelFetch(uTargets, ivec2(gl_InstanceID, uFrom), 0);
    vec4 to = texelFetch(uTargets, ivec2(gl_InstanceID, uTo), 0);

    // Particles leave at staggered moments, so each shape dissolves and assembles like a wave.
    float t = smoothstep(seed * 0.48, seed * 0.48 + 0.52, uMix);
    float travel = sin(3.14159265 * t);
    vec3 p = mix(from.xyz, to.xyz, t);
    float swirl = travel * (1.1 + seedB * 1.5);
    float cs = cos(swirl);
    float sn = sin(swirl);
    p.xz = mat2(cs, -sn, sn, cs) * p.xz;
    p += normalize(p + vec3(0.001)) * travel * (0.28 + seed * 0.75);
    p.y += travel * sin(seedB * 40.0) * 0.32;
    p += vec3(sin(uTime * 0.7 + seed * 30.0), cos(uTime * 0.6 + seedB * 30.0), sin(uTime * 0.5 + seed * 17.0)) * 0.012;

    vec3 axis = normalize(vec3(seed - 0.5, seedB - 0.5, 0.35));
    mat3 rotation = spin(axis, seed * 6.28 + uTime * 0.35 + travel * 3.0);
    float accent = mix(from.w, to.w, t);
    float scale = uSize * (0.72 + seedB * 0.62) * (1.0 + accent * 0.12) * (1.0 - travel * 0.25);
    vec4 view = modelViewMatrix * vec4(p + rotation * position * scale, 1.0);

    vNormalView = normalize(normalMatrix * (rotation * normal));
    vViewDirection = normalize(-view.xyz);
    vAccent = accent;
    vTravel = travel;
    gl_Position = projectionMatrix * view;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDirection;
  varying float vAccent;
  varying float vTravel;

  void main() {
    vec3 n = normalize(vNormalView);
    vec3 v = normalize(vViewDirection);
    vec3 keyLight = normalize(vec3(0.55, 0.75, 0.6));
    vec3 fillLight = normalize(vec3(-0.75, -0.2, 0.45));
    float key = max(dot(n, keyLight), 0.0);
    float fill = max(dot(n, fillLight), 0.0);
    float shine = pow(max(dot(n, normalize(keyLight + v)), 0.0), 34.0);
    float rim = pow(1.0 - max(dot(n, v), 0.0), 2.6);
    vec3 signal = vec3(0.50, 0.86, 0.95);
    vec3 base = mix(vec3(0.62, 0.67, 0.74), signal, vAccent);
    vec3 color = base * (0.2 + key * 0.72) + signal * fill * 0.2 + vec3(1.0) * shine * 0.85 + signal * rim * 0.3;
    color += signal * (vAccent * 0.28 + vTravel * 0.2);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function Morph({ shapes, count, size, animated }: { shapes: CourseShape[]; count: number; size: number; animated: boolean }) {
  const group = useRef<Group>(null);
  const material = useRef<ShaderMaterial>(null);
  const ringA = useRef<Group>(null);
  const current = useRef(0);
  const time = useRef(0);

  const uniforms = useMemo(() => {
    const texture = new DataTexture(buildTargets(shapes, count), count, shapes.length, RGBAFormat, FloatType);
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;
    texture.needsUpdate = true;
    return {
      uTargets: { value: texture },
      uFrom: { value: 0 },
      uTo: { value: 0 },
      uMix: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: size },
    };
  }, [shapes, count, size]);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const last = shapes.length - 1;
    current.current = animated ? MathUtils.damp(current.current, courseState.value, 5, delta) : courseState.value;
    if (animated) time.current += delta;
    const v = MathUtils.clamp(current.current, 0, last);
    const from = Math.min(Math.floor(v), last);

    if (material.current) {
      const values = material.current.uniforms;
      values.uFrom.value = from;
      values.uTo.value = Math.min(from + 1, last);
      values.uMix.value = v - from;
      values.uTime.value = time.current;
    }
    if (group.current) {
      // One full turn per morph, so each new object always settles facing the visitor.
      const sway = animated ? Math.sin(time.current * 0.4) * 0.34 : 0.2;
      group.current.rotation.y = v * Math.PI * 2 + sway + sceneState.pointer.x * 0.24;
      group.current.rotation.x = 0.06 - sceneState.pointer.y * 0.14;
    }
    if (ringA.current) ringA.current.rotation.y = time.current * 0.12 + v * 0.9;

    const aspect = (camera as PerspectiveCameraType).aspect || 1;
    const distance = Math.max(10.8, 3.2 / (FOV_TANGENT * Math.min(aspect, 1)));
    camera.position.set(0, 0.55, distance);
    camera.lookAt(0, -0.05, 0);
  });

  return (
    <>
      <group ref={group}>
        <instancedMesh args={[undefined, undefined, count]} frustumCulled={false}>
          <octahedronGeometry args={[1, 0]} />
          <shaderMaterial ref={material} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} toneMapped={false} />
        </instancedMesh>
      </group>
      <group ref={ringA} position={[0, -2.42, 0]}>
        {[2.2, 2.5].map((radius, i) => (
          <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.008, radius + 0.008, 128, 1, 0, i ? Math.PI * 1.55 : Math.PI * 2]} />
            <meshBasicMaterial color="#7fd3e8" transparent opacity={i ? 0.5 : 0.2} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </>
  );
}

interface CourseMorphProps {
  shapes: CourseShape[];
  animated: boolean;
  count: number;
  size: number;
}

export default function CourseMorph({ shapes, animated, count, size }: CourseMorphProps) {
  return (
    <View className="absolute inset-0">
      <PerspectiveCamera makeDefault position={[0, 0.55, 11]} fov={FOV} near={0.1} far={40} />
      <Morph shapes={shapes} count={count} size={size} animated={animated} />
    </View>
  );
}
