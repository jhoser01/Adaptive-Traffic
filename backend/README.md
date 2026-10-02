# Backend de visión

API local para análisis offline de videos por avenida.

## Pipeline

`video → YOLO11n preentrenado → ByteTrack persistente → línea virtual direccional → conteo único por track ID → tasa veh/min → video anotado`

Solo se consideran las clases COCO `car`, `motorcycle`, `bus` y `truck`. La línea de conteo se ubica en el 55 % de la altura del frame. Un ID se cuenta una sola vez al cruzarla en la dirección configurada.

## Ejecutar

Desde la raíz del proyecto en PowerShell:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn backend.app:app --reload --port 8001
```

El primer análisis descarga automáticamente `yolo11n.pt` si todavía no existe. Se requiere acceso a internet solo para esa descarga inicial.

## Endpoint

`POST /analyze` recibe un `multipart/form-data`. El análisis se limita a los primeros 60 segundos y la salida se reduce manteniendo aspecto a un máximo de 1280×720:

```text
file: <MP4 | MOV | AVI | MKV>
avenue: A | B
direction: down | up | left | right
```

Respuesta:

```json
{
  "avenue": "A",
  "vehicle_count": 18,
  "arrival_rate": 27.5,
  "duration": 39.2,
  "processed_video": "/outputs/processed-<id>.mp4",
  "class_counts": { "car": 14, "motorcycle": 2, "bus": 1, "truck": 1 }
}
```

Los archivos subidos son temporales. Los videos anotados se exponen por `/outputs/` para que la interfaz Video IA los pueda reproducir.
