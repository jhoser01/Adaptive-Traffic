# Adaptive Traffic

**Control semafórico adaptativo con visión artificial y gemelo digital 3D.**

Prototipo personal que combina análisis de video, simulación de vehículos y un controlador sensible a la demanda en una intersección de dos avenidas. El objetivo es explorar cómo usar tasas de llegada estimadas para distribuir el tiempo de verde; no es un sistema vial certificado.

**Tecnologías:** React · TypeScript · Three.js / React Three Fiber · Python · FastAPI · YOLO11n · ByteTrack

> **Estado:** MVP local y prueba de concepto. No controla semáforos físicos ni está validado para despliegue urbano.

## Vista general

| Componente | Función |
| --- | --- |
| Gemelo digital 3D | Representa una intersección con dos aproximaciones (avenidas A y B). |
| Modo Simulación | Genera vehículos virtuales con demanda baja, media o alta. |
| Modo Video IA | Analiza un video por avenida para estimar tasas de llegada. |
| Controlador adaptativo | Ajusta la asignación del siguiente verde a partir de la demanda. |
| Panel de métricas | Presenta llegadas, congestión del gemelo, colas y fases semafóricas. |

**Diferencia importante:** en modo Video IA, las métricas de congestión y cola mostradas en la interfaz proceden del **gemelo digital**, no son mediciones directas del video. Los vehículos 3D no son copias uno a uno de los filmados.

## Arquitectura

~~~mermaid
flowchart TD
    S["Simulación<br/>Generador virtual"] --> D["Tasas de llegada A / B"]
    V["Video IA<br/>Videos pregrabados"] --> Y["YOLO11n<br/>Detección"]
    Y --> T["ByteTrack<br/>Seguimiento"]
    T --> C["Cruces de línea virtual<br/>Conteo por ID y dirección"]
    C --> D
    D --> K["Controlador adaptativo<br/>Reparto proporcional del verde"]
    K --> M["Máquina de estados<br/>Verde / amarillo / todo-rojo"]
    M --> G["Gemelo digital 3D<br/>Visualización y métricas simuladas"]
~~~

La visión artificial actúa como **sensor virtual**. YOLO11n detecta vehículos; ByteTrack mantiene identidades entre fotogramas; el conteo registra cruces de la línea virtual. **La IA no decide directamente los estados semafóricos:** entrega datos que usa el controlador.

## Funcionalidades implementadas

- Simulación vehicular con niveles de demanda variable.
- Visualización 3D de una intersección.
- Fases semafóricas A/B con transiciones de amarillo y todo-rojo.
- Asignación de verde sensible a la tasa de llegada.
- Procesamiento secuencial de dos videos, uno por avenida.
- Detección con YOLO11n, seguimiento con ByteTrack y conteo de cruces.
- Salida de video anotado y panel con indicadores, gráficos y línea de tiempo.

### Modos de uso

**Simulación:** no requiere videos. El gemelo genera los vehículos, las llegadas y las métricas a partir de su propio estado.

**Video IA:** el usuario carga un video por avenida y configura la dirección de conteo. Tras el análisis, las tasas de llegada obtenidas alimentan el gemelo digital.

## Control y métricas

### Tasa de llegada

~~~text
q = (N / Δt) × 60   [veh/min]
~~~

En **Simulación**, N es el número de eventos de entrada virtual en el intervalo. En **Video IA**, N es el número de IDs únicos que cruzan la línea de conteo en la dirección configurada. Un ID no se cuenta repetidamente por aparecer en varios fotogramas.

### Reparto de verde

~~~text
qTotal = qA + qB
ri = qi / qTotal
Gi = Gmin + (Gmax - Gmin) × ri
~~~

Si no hay demanda medida, ambos verdes toman el mínimo. La asignación se actualiza **al comenzar una nueva fase verde**, no durante un verde que ya está transcurriendo.

| Parámetro del MVP | Valor |
| --- | ---: |
| Verde mínimo | 8 s |
| Verde máximo | 30 s |
| Amarillo | 3 s |
| Todo-rojo | 1 s |

Los valores son parámetros de demostración; no equivalen a tiempos certificados ni a normativa universal.

### Congestión del gemelo digital

~~~text
D = clamp(vehiclesInZone / referenceCapacity, 0, 1)
S = stoppedVehicles / vehiclesInZone  (si hay vehículos; en otro caso, 0)
IC = (D + S) / 2
~~~

IC es un índice normalizado del prototipo, no una medida oficial de nivel de servicio. La tasa de llegada se usa para calcular el reparto del verde, **no** entra directamente en IC. Las definiciones y supuestos se desarrollan en el [modelo matemático](docs/modelo-matematico.md).

## Instalación y ejecución local

### Opción rápida (Windows)

Desde la raíz del repositorio:

1. Ejecutar **INSTALAR.bat** para preparar dependencias y entorno.
2. Ejecutar **INICIAR.bat** para iniciar frontend y backend.
3. Ejecutar **DETENER.bat** para detener los servicios.

El analizador busca el modelo yolo11n.pt en backend/models. Si no está disponible, Ultralytics puede descargarlo al inicializarse.

### Opción manual (Windows)

**Backend** (requiere Python 3.11):

~~~powershell
py -3.11 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe -m uvicorn backend.app:app --reload --port 8001
~~~

**Frontend**, en otra terminal (requiere Node.js y npm compatibles con Vite):

~~~powershell
npm ci
npm run dev
~~~

- Frontend de desarrollo: http://localhost:5173 (Vite puede elegir otro puerto).
- API local: http://127.0.0.1:8001.
- Comprobación del servicio: **GET /health**.

Para Video IA, el backend debe estar activo. Se aceptan videos MP4, MOV, AVI y MKV; la demo analiza como máximo **60 segundos por video**. Más información en la [documentación del backend](backend/README.md).

### Comprobaciones disponibles

~~~powershell
npm run build
npm run lint
npm run test:simulation
~~~

Estos comandos están definidos en el proyecto, pero **no se ejecutaron** como parte de esta actualización documental.

## Alcance y limitaciones

- Una sola intersección con dos aproximaciones.
- Videos pregrabados, no cámaras de tráfico en directo.
- El backend no mide directamente las colas ni la congestión desde el video.
- Control por demanda simplificado, sin estimación certificada de capacidad vial.
- Sin control físico de semáforos, coordinación multi-intersección ni despliegue urbano.
- No es un controlador apto para regular tráfico real sin ingeniería y validación adicionales.

## Documentación técnica

- [Modelo matemático: métricas y reparto de verde](docs/modelo-matematico.md).
- [Fundamento técnico y referencias](docs/fundamento-tecnico.md).
- [Backend: detección, seguimiento y API](backend/README.md).

## Evidencia visual pendiente

Este README **todavía no contiene capturas o GIFs reales** de la aplicación. Una siguiente iteración debería incorporar imágenes verificadas de la escena 3D, los indicadores y el análisis de videos; no se han fabricado capturas para aparentar resultados.

---

**Autor:** Jhoser Simeon · Proyecto personal sobre visión artificial, simulación y control de tráfico adaptativo.
