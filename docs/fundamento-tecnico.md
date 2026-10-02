# Fundamento técnico y referencias

## Base conceptual

El MVP usa conceptos habituales de ingeniería de tránsito: flujo o volumen de llegada, presencia/ocupación en una zona de análisis, vehículos detenidos, cola, fases semafóricas, reparto de verde y despeje entre movimientos conflictivos.

La referencia principal es la **Federal Highway Administration (FHWA), Traffic Signal Timing Manual**. Sus temas relevantes incluyen flujo de tránsito, ocupación, cola, tiempos de señal, green splits, control sensible al tránsito, intervalo amarillo, intervalo de despeje rojo y startup lost time.

## Alcance de la simplificación

El modelo implementado no pretende reemplazar un diseño de señalización vial. Usa una ventana móvil de llegadas y un split proporcional para hacer explícita la relación entre demanda detectada y tiempo verde. Los valores amarillo de 3 s y todo-rojo de 1 s son parámetros de demostración. En una intersección real se definirían con estudios de velocidad, geometría, comportamiento del conductor, normativa y seguridad.

## Webster como trabajo futuro

Webster es una referencia clásica de temporización semafórica. No se implementa aquí. Una evolución futura podría estimar ciclo y splits con flujo de saturación, tiempos perdidos y relaciones críticas volumen/capacidad, además de validación de ingeniería y regulación local.
