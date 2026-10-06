// ============================================================
// ROAD GEOMETRY
// ============================================================

import { useMemo } from 'react';
import type { ReactElement } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

export const ROAD_WIDTH = 8;
export const ROAD_LENGTH = 46;
export const ROAD_HALF = ROAD_LENGTH / 2;
const ROAD_Y = 0;
const SIDEWALK_H = 0.18;
const SIDEWALK_W = 2.0;
const LINE_W = 0.15;
const LINE_H = 0.006;

function RoadMarkings({ axis }: { axis: 'x' | 'z' }) {
  const markings = useMemo(() => {
    const items: ReactElement[] = [];
    const isX = axis === 'x';
    const INTERSECT_HALF = ROAD_WIDTH / 2 + 0.6;

    // --- Center dashes (double yellow ÷ line) ---
    const dashCount = 22;
    for (let i = 0; i < dashCount; i++) {
      const t = (i / dashCount) * ROAD_LENGTH - ROAD_HALF;
      if (Math.abs(t) < INTERSECT_HALF) continue;
      const key = `dash-${axis}-${i}`;
      const pos: [number, number, number] = isX
        ? [t, ROAD_Y + 0.025, 0]
        : [0, ROAD_Y + 0.025, t];
      items.push(
        <mesh key={key} position={pos} receiveShadow>
          <boxGeometry args={[isX ? 1.4 : LINE_W, LINE_H, isX ? LINE_W : 1.4]} />
          <meshStandardMaterial color="#D3A93C" roughness={0.55} />
        </mesh>
      );
    }

    // --- Lane dividers (dashes, white) ---
    const LANE_DIV = ROAD_WIDTH * 0.22;
    const divDashCount = 20;
    for (let i = 0; i < divDashCount; i++) {
      const t = (i / divDashCount) * ROAD_LENGTH - ROAD_HALF;
      if (Math.abs(t) < INTERSECT_HALF) continue;
      const key = `ldiv-${axis}-${i}`;
      const pos: [number, number, number] = isX
        ? [t, ROAD_Y + 0.022, LANE_DIV]
        : [LANE_DIV, ROAD_Y + 0.022, t];
      items.push(
        <mesh key={key} position={pos} receiveShadow>
          <boxGeometry args={[isX ? 0.8 : LINE_W * 0.7, LINE_H, isX ? LINE_W * 0.7 : 0.8]} />
          <meshStandardMaterial color="#EDF1F1" roughness={0.5} opacity={0.88} transparent />
        </mesh>
      );
      // Mirror lane
      const pos2: [number, number, number] = isX
        ? [t, ROAD_Y + 0.022, -LANE_DIV]
        : [-LANE_DIV, ROAD_Y + 0.022, t];
      items.push(
        <mesh key={key + 'm'} position={pos2} receiveShadow>
          <boxGeometry args={[isX ? 0.8 : LINE_W * 0.7, LINE_H, isX ? LINE_W * 0.7 : 0.8]} />
          <meshStandardMaterial color="#EDF1F1" roughness={0.5} opacity={0.88} transparent />
        </mesh>
      );
    }

    // --- Stop lines ---
    const stopOffset = ROAD_WIDTH / 2 + 0.4;
    [-1, 1].forEach((side) => {
      const key = `stop-${axis}-${side}`;
      const pos: [number, number, number] = isX
        ? [side * stopOffset, ROAD_Y + 0.027, 0]
        : [0, ROAD_Y + 0.027, side * stopOffset];
      items.push(
        <mesh key={key} position={pos} receiveShadow>
          <boxGeometry args={[isX ? 0.25 : ROAD_WIDTH - 0.4, LINE_H, isX ? ROAD_WIDTH - 0.4 : 0.25]} />
          <meshStandardMaterial color="#EDF1F1" roughness={0.4} />
        </mesh>
      );
    });

    // --- Pedestrian crosswalk zebra lines (near intersection) ---
    const crossOffset = ROAD_WIDTH / 2 + 1.0;
    const stripeCount = 5;
    [-1, 1].forEach((side) => {
      for (let s = 0; s < stripeCount; s++) {
        const stripe = (s - (stripeCount - 1) / 2) * 0.7;
        const key = `cross-${axis}-${side}-${s}`;
        const pos: [number, number, number] = isX
          ? [side * crossOffset, ROAD_Y + 0.024, stripe]
          : [stripe, ROAD_Y + 0.024, side * crossOffset];
        items.push(
          <mesh key={key} position={pos} receiveShadow>
            <boxGeometry args={[isX ? 0.9 : 0.45, LINE_H, isX ? 0.45 : 0.9]} />
          <meshStandardMaterial color="#EDF1F1" roughness={0.5} opacity={0.7} transparent />
          </mesh>
        );
      }
    });

    return items;
  }, [axis]);

  return <>{markings}</>;
}

function Sidewalk({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#8E9A99" roughness={0.88} metalness={0.04} />
    </mesh>
  );
}

export function Road() {
  const asphaltMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#303B3F',
      roughness: 0.88,
      metalness: 0.05,
    }),
    []
  );

  const intersectionMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#303B3F',
      roughness: 0.84,
      metalness: 0.07,
    }),
    []
  );

  const groundMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#426C3E',
      roughness: 1,
    }),
    []
  );

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ROAD_Y - 0.015, 0]} receiveShadow material={groundMat}>
        <planeGeometry args={[120, 120]} />
      </mesh>

      {[[-16, -16, '#365C35'], [16, -16, '#507D49'], [-16, 16, '#507D49'], [16, 16, '#365C35']].map(([x, z, color], index) => (
        <mesh key={`grass-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[Number(x), ROAD_Y - 0.004, Number(z)]} receiveShadow>
          <planeGeometry args={[13, 13]} />
          <meshStandardMaterial color={String(color)} roughness={1} />
        </mesh>
      ))}

      {/* Avenue A — horizontal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ROAD_Y, 0]} receiveShadow material={asphaltMat}>
        <planeGeometry args={[ROAD_LENGTH, ROAD_WIDTH]} />
      </mesh>

      {/* Avenue B — vertical */}
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, ROAD_Y, 0]} receiveShadow material={asphaltMat}>
        <planeGeometry args={[ROAD_LENGTH, ROAD_WIDTH]} />
      </mesh>

      {/* Intersection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ROAD_Y + 0.001, 0]} receiveShadow material={intersectionMat}>
        <planeGeometry args={[ROAD_WIDTH, ROAD_WIDTH]} />
      </mesh>

      {/* Road markings */}
      <RoadMarkings axis="x" />
      <RoadMarkings axis="z" />

      {/* Sidewalk corners */}
      {[1, -1].map((sx) =>
        [1, -1].map((sz) => (
          <Sidewalk
            key={`corner-${sx}-${sz}`}
            position={[sx * (ROAD_WIDTH / 2 + SIDEWALK_W / 2), SIDEWALK_H / 2, sz * (ROAD_WIDTH / 2 + SIDEWALK_W / 2)]}
            size={[SIDEWALK_W, SIDEWALK_H, SIDEWALK_W]}
          />
        ))
      )}

      {/* Sidewalks along Avenue A */}
      {[-1, 1].map((side) => (
        <mesh
          key={`sw-a-${side}`}
          position={[0, SIDEWALK_H / 2, side * (ROAD_WIDTH / 2 + SIDEWALK_W / 2)]}
          receiveShadow
        >
          <boxGeometry args={[ROAD_LENGTH, SIDEWALK_H, SIDEWALK_W]} />
          <meshStandardMaterial color="#8E9A99" roughness={0.92} />
        </mesh>
      ))}

      {/* Sidewalks along Avenue B */}
      {[-1, 1].map((side) => (
        <mesh
          key={`sw-b-${side}`}
          position={[side * (ROAD_WIDTH / 2 + SIDEWALK_W / 2), SIDEWALK_H / 2, 0]}
          receiveShadow
        >
          <boxGeometry args={[SIDEWALK_W, SIDEWALK_H, ROAD_LENGTH]} />
          <meshStandardMaterial color="#8E9A99" roughness={0.92} />
        </mesh>
      ))}

      {/* Curb edges — raised edge strips for depth */}
      {[-1, 1].map((side) => (
        <mesh
          key={`curb-a-${side}`}
          position={[0, SIDEWALK_H * 0.6, side * (ROAD_WIDTH / 2 + 0.08)]}
        >
          <boxGeometry args={[ROAD_LENGTH, SIDEWALK_H * 0.5, 0.16]} />
          <meshStandardMaterial color="#B2B9B8" roughness={0.8} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={`curb-b-${side}`}
          position={[side * (ROAD_WIDTH / 2 + 0.08), SIDEWALK_H * 0.6, 0]}
        >
          <boxGeometry args={[0.16, SIDEWALK_H * 0.5, ROAD_LENGTH]} />
          <meshStandardMaterial color="#B2B9B8" roughness={0.8} />
        </mesh>
      ))}

      <Text position={[-6.0, 0.045, 2.7]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.68} color="#19B7A5" depthOffset={-2} anchorX="center" anchorY="middle">
        AVENIDA A
      </Text>
      <Text position={[2.7, 0.045, 5.8]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} fontSize={0.68} color="#4D86E8" depthOffset={-2} anchorX="center" anchorY="middle">
        AVENIDA B
      </Text>
    </group>
  );
}
