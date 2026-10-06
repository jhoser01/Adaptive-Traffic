// ============================================================
// SCENE LIGHTING
// ============================================================

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DirectionalLight } from 'three';

export function Lighting() {
  const dirRef = useRef<DirectionalLight>(null!);

  useFrame(({ clock }) => {
    if (dirRef.current) {
      const t = clock.getElapsedTime() * 0.04;
      dirRef.current.position.x = Math.sin(t) * 15 + 12;
    }
  });

  return (
    <>
      {/* Ambient — brighter than before, warm tech tone */}
      <ambientLight intensity={0.82} color="#d5e0df" />

      {/* Main directional — key light from upper-left */}
      <directionalLight
        ref={dirRef}
        intensity={1.35}
        color="#f1ead9"
        position={[12, 20, 8]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.001}
        shadow-radius={2}
      />

      {/* Fill light — blue-tinted from opposite side */}
      <directionalLight
        intensity={0.42}
        color="#6f98a1"
        position={[-12, 10, -10]}
      />

      {/* Ground hemisphere — stops the road from going pitch black */}
      <hemisphereLight
        args={['#48675a', '#18252a', 0.7]}
      />

      {/* Street lamps — four corner point lights */}
      <pointLight position={[10, 5, 10]}  color="#e7c987" intensity={0.9} distance={18} decay={2} />
      <pointLight position={[-10, 5, 10]} color="#e7c987" intensity={0.9} distance={18} decay={2} />
      <pointLight position={[10, 5, -10]} color="#e7c987" intensity={0.9} distance={18} decay={2} />
      <pointLight position={[-10, 5, -10]} color="#e7c987" intensity={0.9} distance={18} decay={2} />
    </>
  );
}
