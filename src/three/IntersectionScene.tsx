// ============================================================
// INTERSECTION SCENE v2 — Better framing, tone mapping
// ============================================================

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

import { Road } from './Road';
import { TrafficLight } from './TrafficLight';
import { VehicleSpawner } from './VehicleSpawner';
import { CameraRig } from './CameraRig';
import { Lighting } from './Lighting';

// Signals sit on the upstream side of each stop line, close to the controlled route.
const SIGNAL_A_POSITION: [number, number, number] = [-6.0, 0, 3.15];
const SIGNAL_B_POSITION: [number, number, number] = [3.15, 0, 5.8];

export function IntersectionScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [21, 17, 24], fov: 48, near: 0.1, far: 250 }}
      gl={{
        antialias: true,
        toneMapping: 5,           // ACESFilmicToneMapping
        toneMappingExposure: 1.1, // slightly brighter than before
      }}
      style={{ width: '100%', height: '100%', background: '#1B2B33' }}
    >
      <Suspense fallback={null}>
        <CameraRig />
        <Lighting />
        <Road />

        {/* Exactly two visible signals: one representative for each avenue. */}
        <TrafficLight
          avenue="A"
          position={SIGNAL_A_POSITION}
        />
        <TrafficLight
          avenue="B"
          position={SIGNAL_B_POSITION}
        />

        <VehicleSpawner />

        {/* Bloom — selective on signal lights and headlights */}
        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.65}
            luminanceSmoothing={0.25}
            mipmapBlur
            radius={0.5}
          />
        </EffectComposer>

        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI * 0.12}
          maxPolarAngle={Math.PI * 0.42}
          minDistance={10}
          maxDistance={45}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.4}
          zoomSpeed={0.6}
        />
      </Suspense>
    </Canvas>
  );
}
