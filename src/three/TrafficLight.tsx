// ============================================================
// 3D TRAFFIC LIGHT
// ============================================================

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { SignalColor, AvenueId } from '../types/traffic';
import { useTrafficStore } from '../store/trafficStore';
import { ROUTES, type Vector3Tuple } from '../simulation/RouteDefinitions';

interface TrafficLightProps {
  avenue: AvenueId;
  position: [number, number, number];
}

function opposite(vector: Vector3Tuple): Vector3Tuple { return [-vector[0], -vector[1], -vector[2]]; }
function housingYawForFaceDirection(faceDirection: Vector3Tuple): number {
  // Housing lenses are on local +X; convert that local axis to the route-derived face direction.
  return Math.atan2(-faceDirection[2], faceDirection[0]);
}

const SIGNAL_COLORS: Record<SignalColor, THREE.Color> = {
  RED:    new THREE.Color('#E85050'),
  YELLOW: new THREE.Color('#F0B83F'),
  GREEN:  new THREE.Color('#2FC66D'),
};

const OFF_COLOR    = new THREE.Color('#20323B');
const POLE_COLOR   = '#5D6B6F';
const HOUSING_COLOR = '#18262E';

const STATE_LABEL: Record<SignalColor, string> = {
  RED: 'ROJO',
  YELLOW: 'AMARILLO',
  GREEN: 'VERDE',
};

interface LightIntensities {
  r: number;
  y: number;
  g: number;
}

export function TrafficLight({
  avenue,
  position,
}: TrafficLightProps) {
  const signalColor        = useTrafficStore((s) => avenue === 'A' ? s.signalA : s.signalB);
  const phaseTimeRemaining = useTrafficStore((s) => s.phaseTimeRemaining);
  const phase              = useTrafficStore((s) => s.phase);
  const controlledRoute = avenue === 'A' ? ROUTES.ROUTE_A : ROUTES.ROUTE_B;
  const faceDirection = opposite(controlledRoute.forwardVector);
  const housingYaw = housingYawForFaceDirection(faceDirection);
  const indicatorColor = signalColor === 'GREEN' ? '#2FC66D' : signalColor === 'YELLOW' ? '#F0B83F' : '#E85050';

  const redMatRef    = useRef<THREE.MeshStandardMaterial>(null!);
  const yellowMatRef = useRef<THREE.MeshStandardMaterial>(null!);
  const greenMatRef  = useRef<THREE.MeshStandardMaterial>(null!);
  const redLightRef  = useRef<THREE.PointLight>(null!);
  const yelLightRef  = useRef<THREE.PointLight>(null!);
  const grnLightRef  = useRef<THREE.PointLight>(null!);

  const cur = useRef<LightIntensities>({ r: 1, y: 0, g: 0 });

  useFrame((_, delta) => {
    const tgt: LightIntensities = {
      r: signalColor === 'RED'    ? 1 : 0,
      y: signalColor === 'YELLOW' ? 1 : 0,
      g: signalColor === 'GREEN'  ? 1 : 0,
    };
    // Smooth transition ~300ms
    const t = 1 - Math.pow(0.008, delta);
    cur.current.r += (tgt.r - cur.current.r) * t;
    cur.current.y += (tgt.y - cur.current.y) * t;
    cur.current.g += (tgt.g - cur.current.g) * t;

    const { r, y, g } = cur.current;

    if (redMatRef.current) {
      redMatRef.current.emissive.lerpColors(OFF_COLOR, SIGNAL_COLORS.RED, r);
      redMatRef.current.emissiveIntensity = 0.25 + r * 3.0;
    }
    if (yellowMatRef.current) {
      yellowMatRef.current.emissive.lerpColors(OFF_COLOR, SIGNAL_COLORS.YELLOW, y);
      yellowMatRef.current.emissiveIntensity = 0.25 + y * 3.0;
    }
    if (greenMatRef.current) {
      greenMatRef.current.emissive.lerpColors(OFF_COLOR, SIGNAL_COLORS.GREEN, g);
      greenMatRef.current.emissiveIntensity = 0.25 + g * 3.0;
    }
    if (redLightRef.current)  redLightRef.current.intensity  = r * 2.5;
    if (yelLightRef.current)  yelLightRef.current.intensity  = y * 2.0;
    if (grnLightRef.current)  grnLightRef.current.intensity  = g * 2.5;
  });

  const timeStr  = phaseTimeRemaining > 0 ? phaseTimeRemaining.toFixed(1) + 's' : '—';
  const isActive = (phase.startsWith('A') && avenue === 'A')
                 || (phase.startsWith('B') && avenue === 'B');

  return (
    <group position={position} rotation={[0, housingYaw, 0]} scale={1.1}>
      {/* Pole */}
      <mesh castShadow position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 3.6, 8]} />
        <meshStandardMaterial color={POLE_COLOR} roughness={0.65} metalness={0.6} />
      </mesh>

      {/* Horizontal arm */}
      <mesh castShadow position={[0.5, 3.6, 0]} rotation={[0, 0, -Math.PI / 10]}>
        <cylinderGeometry args={[0.045, 0.045, 1.1, 8]} />
        <meshStandardMaterial color={POLE_COLOR} roughness={0.65} metalness={0.6} />
      </mesh>

      {/* Housing */}
      <mesh castShadow position={[0, 4.2, 0]}>
        <boxGeometry args={[0.52, 1.8, 0.42]} />
        <meshStandardMaterial color={HOUSING_COLOR} roughness={0.82} metalness={0.25} />
      </mesh>

      {/* Individual light visors */}
      {[0.5, 0, -0.5].map((yOff, i) => (
        <mesh key={i} castShadow position={[0.25, 4.45 + yOff, 0]}>
          <boxGeometry args={[0.32, 0.06, 0.38]} />
          <meshStandardMaterial color={HOUSING_COLOR} roughness={0.9} />
        </mesh>
      ))}

      {/* RED */}
      <mesh position={[0.28, 4.75, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial ref={redMatRef} color="#250810" roughness={0.25} metalness={0.1} />
      </mesh>
      <pointLight ref={redLightRef} position={[0.5, 4.75, 0]} color="#E85050" intensity={0} distance={5} decay={2} />

      {/* YELLOW */}
      <mesh position={[0.28, 4.25, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial ref={yellowMatRef} color="#251800" roughness={0.25} metalness={0.1} />
      </mesh>
      <pointLight ref={yelLightRef} position={[0.5, 4.25, 0]} color="#F0B83F" intensity={0} distance={5} decay={2} />

      {/* GREEN */}
      <mesh position={[0.28, 3.75, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial ref={greenMatRef} color="#001508" roughness={0.25} metalness={0.1} />
      </mesh>
      <pointLight ref={grnLightRef} position={[0.5, 3.75, 0]} color="#2FC66D" intensity={0} distance={5} decay={2} />

      {/* Labels — only on primary lights */}
      <>
          <Text
            position={[0, 2.9, 0.25]}
            fontSize={0.32}
            color={isActive ? '#F3F6F7' : '#A8B7BE'}
            anchorX="center"
            anchorY="middle"
          >
            {avenue}
          </Text>
          <Text
            position={[0, 2.5, 0.25]}
            fontSize={0.22}
            color={
              signalColor === 'GREEN' ? '#2FC66D' :
              signalColor === 'YELLOW' ? '#F0B83F' : '#E85050'
            }
            anchorX="center"
            anchorY="middle"
          >
            {signalColor}
          </Text>
          <Text
            position={[0, 2.18, 0.25]}
            fontSize={0.24}
            color="#A8B7BE"
            anchorX="center"
            anchorY="middle"
          >
            {timeStr}
          </Text>
      </>

      {/* Secondary state indicator: same signalColor as the physical lenses. */}
      <Billboard position={[0, 1.35, 0.34]} follow>
        <Text
          fontSize={0.3}
          color="#F3F6F7"
          outlineColor="#13242C"
          outlineWidth={0.025}
          anchorX="center"
          anchorY="middle"
        >
          {avenue}
        </Text>
        <Text position={[0.28, 0, 0]} fontSize={0.3} color={indicatorColor} outlineColor="#13242C" outlineWidth={0.025} anchorX="left" anchorY="middle">
          {`• ${STATE_LABEL[signalColor]}`}
        </Text>
      </Billboard>
    </group>
  );
}
