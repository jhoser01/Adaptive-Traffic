# Adaptive Traffic

Prototipo de control semafórico adaptativo mediante visión artificial y gemelo digital.

Adaptive Traffic representa una intersección de dos aproximaciones en un entorno 3D. El sistema combina una simulación vehicular, un controlador adaptativo y un backend que analiza videos de tráfico para estimar la demanda de cada avenida.

Es un proyecto personal y una prueba de concepto. La visión artificial funciona como un sensor virtual: entrega métricas de tráfico al sistema, mientras que el controlador semafórico aplica las reglas de operación y la máquina de estados segura.

## Problema

La demanda vehicular cambia con el tiempo y entre aproximaciones. Un control semafórico que no responda a esas variaciones puede producir tiempos de espera innecesarios y una distribución poco equilibrada del tiempo verde.

## Objetivo

El objetivo es explorar una estrategia adaptativa en una intersección simulada. La IA no toma directamente decisiones semafóricas: YOLO11n y ByteTrack producen observaciones sobre el tráfico, y el controlador usa la tasa de llegada estimada para calcular la siguiente asignación de verde.

## Qué construí

- Gemelo digital 3D de una intersección.
- Simulación vehicular con demanda baja, media y alta.
- Máquina de estados con transiciones seguras entre fases.
- Controlador adaptativo basado en la demanda medida.
- Backend de visión artificial con FastAPI.
- Detección de vehículos con YOLO11n.
- Seguimiento de identidades con ByteTrack.
- Línea virtual de conteo configurable por dirección.
- Cálculo de tasa de llegada e índice de congestión en el gemelo digital.
- Integración del flujo Video IA → gemelo digital.

## Arquitectura

```text
Video A / Video B
        ↓
YOLO11n
        ↓
ByteTrack
        ↓
Conteo y tasa de llegada
        ↓
Controlador adaptativo
        ↓
Gemelo digital
```

Los vehículos del gemelo digital representan tráfico equivalente a las métricas observadas. No son copias uno-a-uno de los vehículos que aparecen en los videos.

## Modos

### Simulación

Permite probar escenarios de demanda Baja, Media y Alta sin cargar videos externos.

### Video IA

Permite cargar un video para cada avenida, analizarlos con el backend y utilizar las tasas de llegada resultantes como entrada del gemelo digital.

## Visión artificial

YOLO11n detecta las clases de vehículos seleccionadas. ByteTrack mantiene la identidad de cada objeto entre fotogramas. Una línea virtual registra los cruces en la dirección configurada y calcula la tasa de llegada:

```text
q = N / Δt × 60   [veh/min]
```

El resultado `vehicle_count` corresponde a los vehículos que cruzaron la línea de conteo. El número de detecciones por fotograma no equivale al número de vehículos.

El análisis acepta videos `.mp4`, `.mov`, `.avi` y `.mkv`, y procesa como máximo 60 segundos por video en la demo.

## Control adaptativo

La asignación del siguiente verde usa las tasas de llegada de ambas aproximaciones:

```text
qTotal = qA + qB
ri = qi / qTotal
Gi = Gmin + (Gmax - Gmin)ri
```

Si no hay demanda medida, ambas aproximaciones reciben el verde mínimo. En este MVP los parámetros son:

| Parámetro | Valor |
| --- | ---: |
| `Gmin` | 8 s |
| `Gmax` | 30 s |
| Amarillo | 3 s |
| Todo-rojo | 1 s |

Son parámetros del prototipo, no normativa universal ni valores certificados para una intersección real.

## Congestión estimada

La interfaz muestra un índice normalizado construido a partir de la densidad y la proporción de vehículos detenidos:

```text
D = vehiclesInZone / referenceCapacity
S = stoppedVehicles / vehiclesInZone   (si vehiclesInZone > 0; en otro caso, 0)
IC = (D + S) / 2
```

El índice se acota y se interpreta dentro del modelo del MVP. No es una medida oficial de nivel de servicio ni reemplaza un estudio de tránsito.

## Stack

Frontend:

- React
- TypeScript
- Vite
- Three.js / React Three Fiber
- Zustand
- Recharts

Backend:

- Python
- FastAPI
- Ultralytics YOLO11n
- ByteTrack
- OpenCV
- FFmpeg
- PyTorch

## Instalación

### Ejecución rápida en Windows

Desde la raíz del repositorio:

1. Ejecuta `INSTALAR.bat` para preparar Python, el entorno virtual, las dependencias y el frontend.
2. Ejecuta `INICIAR.bat` para iniciar backend y frontend.
3. Ejecuta `DETENER.bat` para cerrar los servicios iniciados por el proyecto.

El modelo `yolo11n.pt` se busca en `backend/models/`. Si no está disponible, Ultralytics puede descargarlo durante el primer análisis; el archivo está excluido de Git por su tamaño.

### Instalación manual

Backend, desde la raíz del proyecto:

```powershell
py -3.11 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\.venv\Scripts\python.exe -m uvicorn backend.app:app --reload --port 8001
```

Frontend, en otra terminal:

```powershell
npm ci
npm run dev
```

La interfaz queda disponible en `http://localhost:5173` y la API local en `http://127.0.0.1:8001`. El contrato del backend está resumido en [backend/README.md](backend/README.md).

## Estado del proyecto

### IMPLEMENTADO

- Simulación vehicular.
- Control adaptativo.
- Detección YOLO.
- Tracking con ByteTrack.
- Conteo mediante línea virtual.
- Video procesado con anotaciones.
- Integración del flujo de visión con el gemelo digital.

### FUERA DEL ALCANCE ACTUAL

- Control de semáforos físicos.
- Despliegue urbano.
- Coordinación multi-intersección.
- Infraestructura Edge/Cloud real.
- Ciberseguridad operacional.

## Documentación

- [Modelo matemático](docs/modelo-matematico.md)
- [Fundamento técnico y referencias](docs/fundamento-tecnico.md)

## Limitaciones

- MVP de una intersección.
- Dos aproximaciones controladas.
- Videos pregrabados.
- Máximo de 60 segundos por análisis en la demo.
- Parámetros de control simplificados.
- No es un controlador certificado para uso vial real.

## Autor

Jhoser Simeon

Proyecto personal orientado a visión artificial, simulación y sistemas inteligentes de transporte.
