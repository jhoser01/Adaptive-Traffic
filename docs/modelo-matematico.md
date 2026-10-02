# Modelo matemático del MVP

## Resumen defendible

La tasa de llegada se obtiene contando vehículos que ingresan en una ventana temporal. La cantidad de vehículos en zona mide presencia instantánea dentro de la zona de análisis. La congestión mostrada es un índice normalizado del prototipo basado en densidad y proporción de vehículos detenidos. El controlador distribuye el verde según la proporción de demanda medida, con límites mínimo y máximo. Amarillo y todo-rojo son parámetros fijos de la demostración.

## Definiciones y ecuaciones

### Vehículos en zona

`vehiclesInZone` es el número de vehículos virtuales activos con posición dentro de la ROI de su avenida. No es acumulado, flujo por minuto ni cola. En Video IA futuro equivaldrá al número de track IDs activos dentro de una ROI.

### Tasa de llegada

Los eventos reales de spawn/entrada se conservan en una ventana móvil de 60 s. Si `N` eventos ocurrieron en `Δt` segundos:

```text
q = N / Δt · 60   [veh/min]
```

Antes de completar 60 s se usa el tiempo realmente transcurrido, con resultado 0 si `Δt = 0`. `targetArrivalRate` controla el generador de demanda; `arrivalRate` es la medición que se muestra y usa el controlador.

### Historial de llegadas

La tarjeta superior muestra 12 buckets consecutivos de 5 s dentro de la misma ventana de 60 s. Izquierda es el intervalo más antiguo y derecha el más reciente. Las barras y `arrivalRate` usan exactamente los mismos eventos.

### Densidad normalizada y detención

```text
D = clamp(vehiclesInZone / VEHICLE_REFERENCE_CAPACITY, 0, 1)
S = stoppedVehicles / vehiclesInZone, si vehiclesInZone > 0; de otro modo 0
```

Un vehículo cuenta como detenido solo si su velocidad se mantiene igual o menor al umbral configurado durante la duración mínima configurada. Así no se clasifica como detenido por un único frame lento.

### Índice de congestión del prototipo

```text
IC = (D + S) / 2
```

`IC` está acotado entre 0 y 1 y se presenta como “Congestión estimada”. Es un índice descriptivo del prototipo, no una magnitud oficial universal. La tasa de llegada no forma parte de `IC`: una llegada alta puede operar fluidamente.

### Reparto de verde sensible a demanda

```text
qTotal = qA + qB
rA = qA / qTotal
rB = qB / qTotal
Gi = Gmin + (Gmax - Gmin) · ri
```

Si `qTotal` es prácticamente cero, ambos verdes toman `Gmin`. Con tráfico, `greenA + greenB = 38 s` para los límites actuales. La asignación se prepara solo al iniciar una nueva fase verde; no se redimensiona una fase en curso.

Ejemplo: `qA = 38 veh/min`, `qB = 6 veh/min`.

```text
rA = 38 / 44 = 0.8636;  greenA = 8 + 22 · 0.8636 ≈ 27 s
rB =  6 / 44 = 0.1364;  greenB = 8 + 22 · 0.1364 ≈ 11 s
```

El controlador no utiliza `IC` para calcular verde en esta versión. La visión o simulación estima condiciones y flujo; el reparto responde a la demanda de llegada medida.

## Parámetros configurables del MVP

| Parámetro | Valor actual | Alcance |
|---|---:|---|
| `MIN_GREEN` | 8 s | Límite de demostración para evitar verdes demasiado cortos |
| `MAX_GREEN` | 30 s | Límite de demostración para evitar verdes demasiado largos |
| `YELLOW_TIME` | 3 s | Simplificación del MVP |
| `ALL_RED_TIME` | 1 s | Despeje breve de demostración |
| `VEHICLE_REFERENCE_CAPACITY` | 20 vehículos | Normalización de ocupación visual alta de la ROI; no capacidad universal |
| `STOPPED_SPEED_THRESHOLD` | 0.01 unidades normalizadas/s | Umbral de vehículo detenido en el gemelo |
| `STOPPED_MIN_DURATION` | 1 s | Persistencia mínima para clasificar una detención |
| ventana de llegadas | 60 s | Medición de tasa y barras |

Los valores de amarillo, todo-rojo y límites de verde no son reglas universales. En una aplicación vial real dependen de velocidad, percepción-reacción, desaceleración, geometría, flujos y normativa local.

## Evolución futura

`VideoTrafficProvider` podrá entregar el mismo contrato de métricas desde YOLO + tracking: vehículos en zona, eventos de entrada, tasa de llegada, proporción detenida, densidad e índice. El controlador no necesita conocer el origen de esos datos. Una evolución posterior podría incorporar capacidad, flujo de saturación, tiempos perdidos y modelos de ciclo como Webster; no están implementados en este MVP.
