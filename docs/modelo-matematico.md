# Modelo matemático del MVP

Este documento separa las métricas producidas por la simulación del gemelo digital de las métricas calculadas por el backend de Video IA.

## Métricas de Simulación

En modo Simulación, el gemelo digital genera vehículos virtuales y calcula sus métricas a partir de su estado:

- `vehiclesInZone` es la cantidad de vehículos virtuales activos dentro de la zona de análisis.
- `stoppedRatio` es la proporción de esos vehículos que permanecen detenidos según el umbral y la duración mínima configurados.
- `congestionIndex` se calcula en el gemelo digital a partir de densidad normalizada y proporción de vehículos detenidos.
- `arrivalRate` se obtiene contando eventos reales de spawn en una ventana móvil de 60 segundos.
- Las 12 barras de llegadas representan 12 buckets consecutivos de 5 segundos formados por esos eventos simulados.

La tasa de llegada no es el objetivo del preset LOW/MEDIUM/HIGH. El preset controla la demanda del generador; `arrivalRate` mide los eventos de spawn que ocurrieron realmente.

### Tasa de llegada simulada

Si `N` eventos de spawn ocurrieron en `Δt` segundos:

```text
q = N / Δt · 60   [veh/min]
```

Antes de completar 60 segundos se utiliza el tiempo realmente transcurrido. Si `Δt = 0`, el resultado es 0.

### Densidad, detención y congestión simuladas

```text
D = clamp(vehiclesInZone / VEHICLE_REFERENCE_CAPACITY, 0, 1)
S = stoppedVehicles / vehiclesInZone, si vehiclesInZone > 0; de otro modo 0
IC = (D + S) / 2
```

`IC` es un índice normalizado del prototipo y se presenta como “Congestión estimada”. No es una magnitud oficial universal. La tasa de llegada no forma parte de `IC`: una llegada alta puede operar fluidamente.

Un vehículo cuenta como detenido solo si su velocidad se mantiene igual o menor al umbral configurado durante la duración mínima configurada. Así no se clasifica como detenido por un único frame lento.

## Métricas de Video IA

En modo Video IA, el backend analiza los videos cargados para obtener demanda de entrada:

- YOLO11n detecta vehículos de las clases seleccionadas.
- ByteTrack mantiene los IDs entre fotogramas.
- `vehicle_count` cuenta los IDs únicos que cruzan la línea virtual en la dirección configurada.
- `arrival_rate` se calcula como `vehicle_count / duración_analizada × 60`, en vehículos por minuto.

El backend actualmente no calcula directamente desde el video `vehiclesInZone`, `stoppedRatio` ni `congestionIndex`. La tasa de llegada obtenida del análisis se utiliza como demanda de entrada del gemelo digital.

Después de iniciar la simulación basada en Video IA, `vehiclesInZone`, la cola y la congestión que aparecen en la interfaz son métricas generadas por el estado del gemelo digital. El backend no entrega esas métricas como mediciones directas del video.

El número de detecciones por frame tampoco equivale al número de vehículos: un mismo ID puede aparecer en muchos frames, pero solo se cuenta una vez al cruzar la línea.

## Reparto de verde sensible a demanda

El controlador calcula la siguiente asignación a partir de las tasas de llegada disponibles para las dos aproximaciones:

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

El controlador no utiliza `IC` para calcular el verde en esta versión. La visión entrega una demanda de entrada y el gemelo digital genera sus propias métricas de estado; el reparto responde a la tasa de llegada disponible.

## Parámetros del MVP

| Parámetro | Valor | Alcance |
|---|---:|---|
| `MIN_GREEN` | 8 s | Límite de demostración para evitar verdes demasiado cortos |
| `MAX_GREEN` | 30 s | Límite de demostración para evitar verdes demasiado largos |
| `YELLOW_TIME` | 3 s | Simplificación del MVP |
| `ALL_RED_TIME` | 1 s | Despeje breve de demostración |
| `VEHICLE_REFERENCE_CAPACITY` | 20 vehículos | Normalización de ocupación visual de la ROI; no capacidad universal |
| `STOPPED_SPEED_THRESHOLD` | 0.01 unidades normalizadas/s | Umbral de vehículo detenido en el gemelo |
| `STOPPED_MIN_DURATION` | 1 s | Persistencia mínima para clasificar una detención |
| ventana de llegadas simuladas | 60 s | Medición de tasa y barras |

Los valores de amarillo, todo-rojo y límites de verde son parámetros del prototipo, no reglas universales. En una aplicación vial real dependerían de velocidad, percepción-reacción, desaceleración, geometría, flujos y normativa local.

## Evolución del modelo

El controlador consume el mismo contrato de demanda sin depender de si la entrada proviene de un preset de simulación o de un análisis de video. Una ampliación posterior podría incorporar capacidad, flujo de saturación, tiempos perdidos y modelos de ciclo como Webster; no están implementados en este MVP.
