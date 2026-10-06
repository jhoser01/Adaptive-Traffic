# Backend de visión

API local para analizar un video por avenida y devolver métricas de llegada junto con un video anotado.

## Pipeline

```text
video → YOLO11n → ByteTrack → línea virtual → conteo por track ID → tasa de llegada → video anotado
```

Se analizan las clases COCO `car`, `motorcycle`, `bus` y `truck`. Cada identidad se cuenta una sola vez cuando cruza la línea en la dirección configurada.

## Endpoint

`POST /analyze` recibe `multipart/form-data`:

```text
file: <video>
avenue: A | B
direction: down | up | left | right
```

La respuesta incluye `vehicle_count`, `arrival_rate`, `class_counts` y la ruta del video procesado. El análisis está limitado a los primeros 60 segundos y la salida se escala como máximo a 1280×720.

## Modelo

El analizador utiliza `yolo11n.pt`, buscándolo primero en `backend/models/`. Si el archivo no existe, Ultralytics puede descargarlo al inicializar el modelo.

## Ejecución local

Desde la raíz del proyecto:

```powershell
backend\.venv\Scripts\python.exe -m uvicorn backend.app:app --reload --port 8001
```

La API expone `GET /health`, `POST /analyze` y los videos anotados mediante `/outputs/`.

## Formatos aceptados

`.mp4`, `.mov`, `.avi` y `.mkv`.
