"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { Object3D, type Group, type InstancedMesh } from "three";
import { seeded } from "./Dust";

/** A debris ring of metal and signal fragments, drawn in two instanced calls. */
export function Shards({ count, animated }: { count: number; animated: boolean }) {
  const group = useRef<Group>(null);
  const metal = useRef<InstancedMesh>(null);
  const signal = useRef<InstancedMesh>(null);
  const accents = Math.floor(count * 0.09);

  useLayoutEffect(() => {
    const random = seeded(9127);
    const dummy = new Object3D();
    const place = (mesh: InstancedMesh | null, total: number) => {
      if (!mesh) return;
      for (let i = 0; i < total; i += 1) {
        const angle = random() * Math.PI * 2;
        const radius = 2.95 + Math.pow(random(), 1.6) * 2.5;
        dummy.position.set(Math.cos(angle) * radius, (random() - 0.5) * 0.85 * (radius - 2.2), Math.sin(angle) * radius);
        dummy.rotation.set(random() * 6.28, random() * 6.28, random() * 6.28);
        dummy.scale.setScalar(0.012 + Math.pow(random(), 3) * 0.075);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };
    place(metal.current, count - accents);
    place(signal.current, accents);
  }, [count, accents]);

  useFrame((_, delta) => {
    if (animated && group.current) group.current.rotation.y -= Math.min(delta, 0.05) * 0.045;
  });

  return (
    <group ref={group} rotation={[0.42, 0, 0.14]}>
      <instancedMesh key={`m${count}`} ref={metal} args={[undefined, undefined, count - accents]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#c6cdd6" metalness={1} roughness={0.25} envMapIntensity={1.5} flatShading />
      </instancedMesh>
      <instancedMesh key={`s${count}`} ref={signal} args={[undefined, undefined, accents]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#7fd3e8" emissive="#2f8ba5" emissiveIntensity={1.1} metalness={0.5} roughness={0.3} flatShading />
      </instancedMesh>
    </group>
  );
}
