# Modelo actual encontrado

Esta sección registra la auditoría previa a la corrección matemática.

- `MockTrafficProvider` definía perfiles LOW/MEDIUM/HIGH con una tasa objetivo, ocupación, proporción detenida y conteo de vehículos base; luego aplicaba variación sinusoidal a todas esas variables.
- `TrafficSimulation` usaba la tasa entregada por el proveedor para programar spawns y ya registraba eventos de llegada para las barras superiores.
- `vehicleCount` mostrado por la UI venía del proveedor, no del conteo de vehículos virtuales presentes en la zona 3D.
- `arrivalRate` mostrado por la UI venía del valor objetivo variable del preset, no de los eventos reales de spawn en una ventana temporal.
- El índice de congestión se calculaba como `0.35·occupancy + 0.30·stoppedRatio + 0.20·arrivalNorm + 0.15·vehicleNorm`. Los pesos no tenían justificación explícita en el MVP.
- La cola ya se contaba desde vehículos simulados antes de la línea de parada y con velocidad baja.
- El controlador aplicaba un EMA y construía una presión `0.40·occupancy + 0.30·stoppedRatio + 0.20·arrivalNorm + 0.10·queueNorm`; después asignaba verde según la proporción de presiones.
- Los límites vigentes eran verde mínimo 8 s, verde máximo 30 s, amarillo 3 s y todo-rojo 1 s. La máquina de estados ya imponía la secuencia segura sin verdes simultáneos.

## Modelo reemplazado

El modelo vigente está documentado en [modelo-matematico.md](modelo-matematico.md). Las métricas se obtienen ahora desde eventos reales y estado del gemelo digital; el índice es `IC = (D + S) / 2`; y el reparto de verde depende únicamente de la tasa de llegada medida en su ventana móvil.
