import { ArrowHelper, Vector3 } from 'three';
import { Text } from '@react-three/drei';
import { useTrafficStore } from '../store/trafficStore';
import { VehicleMesh } from './Vehicle';
import { ROUTES, headingFromForward, MODEL_FORWARD_OFFSET, routeWorldPosition } from '../simulation/RouteDefinitions';
import type { VehicleAgent } from '../simulation/VehicleAgent';

const DEBUG_ROUTES = false;

function VehicleInstance({ vehicle, debug }: { vehicle: VehicleAgent; debug: boolean }) {
  const route = ROUTES[vehicle.routeId];
  // Agent position is the front bumper; meshes are modelled around their centre.
  const position = routeWorldPosition(route, vehicle.position - vehicle.length / 2);
  const yaw = headingFromForward(vehicle.forwardVector) + MODEL_FORWARD_OFFSET;
  const scaleY = vehicle.type === 'TRUCK' ? 1.15 : 1;
  const routeColor = vehicle.avenue === 'A' ? '#19B7A5' : '#4D86E8';
  const arrowDirection = new Vector3(...vehicle.forwardVector).normalize();

  return (
    <group position={position} rotation={[0, yaw, 0]} scale={[1, scaleY, 1]}>
      <VehicleMesh type={vehicle.type} colorIndex={vehicle.colorIndex} />
      {debug && (
        <>
          <primitive object={new ArrowHelper(arrowDirection, new Vector3(0, 0.9, 0), 1.4, routeColor)} />
          <Text position={[0, 1.3, 0]} fontSize={0.18} color={routeColor} anchorX="center" anchorY="middle">
            {`${vehicle.routeId} · ${vehicle.hasCrossedStopLine ? 'in route' : 'queued'}`}
          </Text>
        </>
      )}
    </group>
  );
}

export function VehicleSpawner() {
  const vehicles = useTrafficStore((s) => s.vehicles);
  const debug = DEBUG_ROUTES || new URLSearchParams(window.location.search).get('debugTraffic') === '1';
  return <>{vehicles.map((vehicle) => <VehicleInstance key={vehicle.id} vehicle={vehicle} debug={debug} />)}</>;
}
