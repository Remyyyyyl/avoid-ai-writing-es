# Resultados de la validación

El sistema registra cada cambio en la tabla de auditoría y valida el token JWT en el gateway. En la prueba de carga se enviaron 50.000 solicitudes sintéticas durante 10 minutos; el percentil 95 fue de 120 ms. La categoría de triage la asigna el personal de urgencias y queda en el registro de auditoría.

Según Rodríguez-Páez et al. (2018), la priorización reduce la espera en urgencias. En este prototipo se usó MySQL para los datos sintéticos y Spring Boot para el backend. La validación se documentó en el capítulo 3 y se recompiló con latexmk sin errores.
