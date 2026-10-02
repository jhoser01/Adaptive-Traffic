# Modelos locales

El backend utiliza el modelo preentrenado `yolo11n.pt` de Ultralytics.

No se versiona el peso binario. Puede colocarse localmente en esta carpeta o dejar que Ultralytics lo descargue automáticamente durante la primera ejecución.

El nombre esperado por el analizador es:

```text
yolo11n.pt
```

Los pesos (`*.pt`, `*.onnx`, etc.) están excluidos mediante `.gitignore`.
