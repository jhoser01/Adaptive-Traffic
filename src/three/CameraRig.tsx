// ============================================================
// CAMERA RIG
// ============================================================

import { useFrame, useThree } from '@react-three/fiber';

// Tighter framing: intersection fills 70-80% of viewport
// Camera sits in the upstream quadrant for both MVP routes:
// A approaches from -X and B approaches from +Z.
const BASE_THETA = Math.PI * 0.62;
const BASE_PHI = Math.PI * 0.28;
const RADIUS = 31;
const IDLE_SPEED = 0.006;
const IDLE_AMPLITUDE = 0.03;

export function CameraRig() {
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const theta = BASE_THETA + Math.sin(t * IDLE_SPEED) * IDLE_AMPLITUDE;

    const x = RADIUS * Math.sin(BASE_PHI) * Math.cos(theta);
    const y = RADIUS * Math.cos(BASE_PHI);
    const z = RADIUS * Math.sin(BASE_PHI) * Math.sin(theta);

    camera.position.set(x, y, z);
    camera.lookAt(0, 0.5, 0);  // look slightly above center
    camera.updateProjectionMatrix();
  });

  return null;
}
