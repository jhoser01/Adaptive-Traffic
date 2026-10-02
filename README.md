# Adaptive Traffic AI
### Smart Intersection Control — MVP v1.0

A real-time 3D traffic simulation system with an adaptive signal controller and a premium cinematic interface.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🏗 Architecture

```
src/
├── types/
│   └── traffic.ts              # Core data contracts
├── providers/
│   ├── TrafficProvider.ts      # Interface
│   ├── MockTrafficProvider.ts  # Simulated demand target (current)
│   └── VideoTrafficProvider.ts # Stub for YOLO integration
├── simulation/
│   ├── CongestionModel.ts      # D, S, IC and moving-arrival equations
│   ├── VehicleAgent.ts         # Individual vehicle physics
│   ├── QueueModel.ts           # Queue counter
│   └── TrafficSimulation.ts   # Main simulation orchestrator
├── control/
│   ├── TrafficSignalStateMachine.ts  # Phase transitions
│   └── AdaptiveTrafficController.ts  # Green time calculator
├── store/
│   └── trafficStore.ts         # Zustand global state
├── hooks/
│   └── useSimulationLoop.ts    # RAF simulation loop
├── three/
│   ├── IntersectionScene.tsx   # R3F Canvas
│   ├── Road.tsx                # Intersection geometry
│   ├── TrafficLight.tsx        # 3D signal with bloom
│   ├── Vehicle.tsx             # Low-poly Car/SUV/Truck
│   ├── RouteDefinitions.ts     # Route, direction and signal-group source of truth
│   ├── VehicleSpawner.tsx      # Route-derived vehicle renderer
│   ├── CameraRig.tsx           # Cinematic camera
│   └── Lighting.tsx            # Scene lighting
└── components/
    ├── Header/
    ├── TrafficVideoPanel/
    ├── KPICard/
    ├── AIDecisionPanel/
    ├── SimulationControl/
    └── charts/
        ├── CongestionChart/
        ├── QueueChart/
        └── PhaseTimeline/
```

---

## 🧠 Controller Logic

**Signal Phase Sequence:**
```
A_GREEN → A_YELLOW → ALL_RED → B_GREEN → B_YELLOW → ALL_RED → (repeat)
```

**Green Time Formula:**
```
qTotal = qA + qB
rA = qA / qTotal
greenA = MIN_GREEN + (MAX_GREEN − MIN_GREEN) × rA
```

**Constraints:** `MIN_GREEN = 8s`, `MAX_GREEN = 30s`, `YELLOW = 3s`, `ALL_RED = 1s`

---

## 🧪 Test Scenarios

| Test | A Level | B Level | Expected |
|------|---------|---------|---------|
| 1 | HIGH | LOW | A gets longer green |
| 2 | LOW | HIGH | B gets longer green |
| 3 | MEDIUM | MEDIUM | Similar green times |
| 4 | HIGH | HIGH | Balanced, queues visible |
| 5 | LOW | LOW | Near-minimum greens |

---

## 🎥 Video IA (YOLO + ByteTrack)

El selector `Video IA` conserva los dos módulos 16:9 existentes: `VIDEO AVENIDA A` y `VIDEO AVENIDA B`. Al cargar ambos archivos y pulsar **Analizar videos**, cada archivo se envía al backend FastAPI. YOLO11n detecta vehículos y ByteTrack mantiene IDs persistentes; el video resultante incluye cajas, clase, ID y línea virtual de conteo. La interfaz muestra conteo, tasa de llegada y desglose por clase.

La conexión futura queda separada del gemelo digital:

```text
video Avenida A/B → YOLO + Tracking → TrafficMetrics → AdaptiveTrafficController → Digital Twin
```

Los videos son sensores de entrada, no una réplica uno-a-uno de los vehículos renderizados. Tras analizar ambos videos, **Iniciar simulación** entrega sus tasas de llegada a `VideoTrafficProvider`; el controlador existente reparte los verdes y el gemelo genera demanda equivalente.

### Ejecutar la visión artificial local

En una terminal, iniciar el backend:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn backend.app:app --reload --port 8000
```

En otra, iniciar el frontend:

```powershell
npm run dev
```

Abrir `http://localhost:5173`, seleccionar **Video IA**, subir un video para cada avenida, pulsar **Analizar videos** y finalmente **Iniciar simulación**. Ver [backend/README.md](backend/README.md) para el contrato del endpoint.

## 🔮 Integración futura

To integrate YOLO video detection, replace `MockTrafficProvider` with `VideoTrafficProvider`:

```typescript
// When YOLO + tracking sends measured metrics via WebSocket:
videoProvider.ingestMetrics('A', {
  timestamp: Date.now(),
  vehiclesInZone: 12,
  arrivalRate: 14.2,
  normalizedDensity: 0.60,
  stoppedRatio: 0.55,
  congestionIndex: 0.575,
});
```

El controlador, store y UI consumen el mismo contrato de métricas sin conocer si la fuente es simulación o video.

---

## 📦 Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Three.js** + **@react-three/fiber** + **@react-three/drei**
- **@react-three/postprocessing** (Bloom)
- **Zustand** (state management)
- **Recharts** (charts)

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#10191F` | Application background |
| `--surface` | `#1B2D36` | Primary panel |
| `--header` | `#122A33` | Header surface |
| `--avenue-a` | `#1CB7A7` | Avenue A |
| `--avenue-b` | `#4D82E8` | Avenue B |
| `--signal-green` | `#2FC66D` | Traffic green |
| `--signal-yellow` | `#F0B83F` | Traffic yellow |
| `--signal-red` | `#DF4C4C` | Traffic red |

## Runtime connection audit (current implementation)

`MockTrafficProvider` entrega únicamente `targetArrivalRate` para cada preset de demanda. No inventa presencia, detención ni congestión. `TrafficSimulation` mide esas variables desde el gemelo digital.

`TrafficSimulation` usa `targetArrivalRate` como entrada del spawner. `vehiclesInZone`, `stoppedRatio`, `normalizedDensity`, `congestionIndex` y `arrivalRate` son salidas medidas. La tasa cuenta eventos reales de spawn dentro de una ventana móvil; no muestra el objetivo del preset.

Cada spawn también registra su tiempo simulado. `getArrivalBins()` mantiene una ventana móvil de 60 segundos y genera 12 intervalos de 5 segundos, ordenados del más antiguo al más reciente. Las barras de “Llegadas — últimos 60 s” representan exclusivamente esos eventos reales. El mismo contrato queda disponible para que `VideoTrafficProvider` lo alimente en el futuro con entradas detectadas por visión.

`AdaptiveTrafficController` reparte el siguiente verde según las tasas de llegada medidas relativas y solo confirma esa asignación al iniciar una nueva fase verde. `TrafficSignalStateMachine` es la autoridad de fases y aplica `A_GREEN → A_YELLOW → ALL_RED_AB → B_GREEN → B_YELLOW → ALL_RED_BA`.

`RouteDefinitions` is the single source of truth for the two MVP routes: `ROUTE_A` (west → east on world X) and `ROUTE_B` (positive Z → negative Z on world Z). Vehicle yaw is derived from the route forward vector; the renderer has no independent per-vehicle direction convention. Each route also owns its stop line, spawn point, exit point, and signal group.

Set `?debugTraffic=1` in the browser URL to temporarily show route IDs, motion arrows, and queued state for visual orientation checks.

Run `npm run test:simulation` to validate route geometry, vehicle orientation, stop-line behavior, safe phase order, and LOW/MEDIUM/HIGH spawn rates.

La explicación completa, ecuaciones, parámetros y ejemplo numérico están en [docs/modelo-matematico.md](docs/modelo-matematico.md). La auditoría anterior al reemplazo está en [docs/modelo-control.md](docs/modelo-control.md) y las referencias conceptuales en [docs/fundamento-tecnico.md](docs/fundamento-tecnico.md).
