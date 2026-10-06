// ============================================================
// PROCEDURAL LOW-POLY VEHICLE
// ============================================================

type VehicleType = 'CAR' | 'SUV' | 'TRUCK';

// Brighter, more realistic vehicle colors for dark asphalt
const VEHICLE_COLORS = [
  '#E6ECEE', // ice white
  '#A0AEB5', // silver
  '#4A6B82', // petroleum blue
  '#324350', // slate
  '#8E3B46', // subtle dark red (rare accent)
];

interface VehicleMeshProps {
  type: VehicleType;
  colorIndex: number;
}

function WheelSet({ positions }: { positions: [number, number, number][] }) {
  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.12, 12]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

export function CarMesh({ colorIndex }: { colorIndex: number }) {
  const bodyColor = VEHICLE_COLORS[colorIndex % VEHICLE_COLORS.length];
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.62, 0.22, 1.15]} />
        <meshStandardMaterial color={bodyColor} roughness={0.35} metalness={0.65} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.42, 0.05]} castShadow>
        <boxGeometry args={[0.52, 0.22, 0.58]} />
        <meshStandardMaterial color={bodyColor} roughness={0.35} metalness={0.65} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.42, 0.34]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.48, 0.2, 0.04]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Rear window */}
      <mesh position={[0, 0.42, -0.24]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.48, 0.18, 0.04]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Headlights */}
      <mesh position={[0.2, 0.22, 0.57]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.2, 0.22, 0.57]}>
        <boxGeometry args={[0.12, 0.08, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
      {/* Taillights */}
      <mesh position={[0.2, 0.24, -0.57]}>
        <boxGeometry args={[0.14, 0.06, 0.04]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff1111" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.2, 0.24, -0.57]}>
        <boxGeometry args={[0.14, 0.06, 0.04]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff1111" emissiveIntensity={0.8} />
      </mesh>
      {/* Wheels */}
      <WheelSet positions={[
        [0.34, 0.13, 0.38],
        [-0.34, 0.13, 0.38],
        [0.34, 0.13, -0.38],
        [-0.34, 0.13, -0.38],
      ]} />
    </group>
  );
}

export function SUVMesh({ colorIndex }: { colorIndex: number }) {
  const bodyColor = VEHICLE_COLORS[colorIndex % VEHICLE_COLORS.length];
  return (
    <group>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.7, 0.3, 1.25]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.54, 0]} castShadow>
        <boxGeometry args={[0.64, 0.28, 0.95]} />
        <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.54, 0.48]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.6, 0.24, 0.04]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0.24, 0.28, 0.63]}>
        <boxGeometry args={[0.14, 0.1, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.24, 0.28, 0.63]}>
        <boxGeometry args={[0.14, 0.1, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.24, 0.3, -0.63]}>
        <boxGeometry args={[0.1, 0.12, 0.04]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff1111" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.24, 0.3, -0.63]}>
        <boxGeometry args={[0.1, 0.12, 0.04]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff1111" emissiveIntensity={0.8} />
      </mesh>
      <WheelSet positions={[
        [0.4, 0.13, 0.45],
        [-0.4, 0.13, 0.45],
        [0.4, 0.13, -0.45],
        [-0.4, 0.13, -0.45],
      ]} />
    </group>
  );
}

export function TruckMesh({ colorIndex }: { colorIndex: number }) {
  const bodyColor = VEHICLE_COLORS[colorIndex % VEHICLE_COLORS.length];
  return (
    <group>
      {/* Cargo body */}
      <mesh position={[0, 0.42, -0.3]} castShadow>
        <boxGeometry args={[0.76, 0.55, 1.3]} />
        <meshStandardMaterial color="#E6ECEE" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Cab */}
      <mesh position={[0, 0.36, 0.6]} castShadow>
        <boxGeometry args={[0.76, 0.42, 0.56]} />
        <meshStandardMaterial color={bodyColor} roughness={0.45} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.65, 0.55]} castShadow>
        <boxGeometry args={[0.66, 0.2, 0.45]} />
        <meshStandardMaterial color={bodyColor} roughness={0.45} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.54, 0.9]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.66, 0.28, 0.04]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0.26, 0.32, 0.88]}>
        <boxGeometry args={[0.16, 0.12, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.26, 0.32, 0.88]}>
        <boxGeometry args={[0.16, 0.12, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.3, 0.3, -0.95]}>
        <boxGeometry args={[0.1, 0.1, 0.04]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff1111" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.3, 0.3, -0.95]}>
        <boxGeometry args={[0.1, 0.1, 0.04]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff1111" emissiveIntensity={0.8} />
      </mesh>
      <WheelSet positions={[
        [0.42, 0.13, 0.55],
        [-0.42, 0.13, 0.55],
        [0.42, 0.13, -0.2],
        [-0.42, 0.13, -0.2],
        [0.42, 0.13, -0.65],
        [-0.42, 0.13, -0.65],
      ]} />
    </group>
  );
}

export function VehicleMesh({ type, colorIndex }: VehicleMeshProps) {
  switch (type) {
    case 'CAR': return <CarMesh colorIndex={colorIndex} />;
    case 'SUV': return <SUVMesh colorIndex={colorIndex} />;
    case 'TRUCK': return <TruckMesh colorIndex={colorIndex} />;
  }
}
