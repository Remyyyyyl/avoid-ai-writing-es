# Glosario de anglicismos técnicos

Decisión de glosario, no de estilo: estos términos se mantienen y **no son
hallazgos** de la auditoría. En un documento académico van en `\texttt{}` o en
cursiva cuando la plantilla lo pida; en un README pueden ir sin marca.

## Anglicismos técnicos permitidos

- **Arquitectura y web:** `frontend`, `backend`, `API`, `API REST`, `endpoint`, `gateway`, `microservicio`, `framework`, `stack`, `deploy` / `despliegue`, `login`, `logout`, `mockup`, `wireframe`, `widget`, `dashboard` / `tablero`.
- **Seguridad:** `token`, `JWT`, `refresh token`, `hash`, `2FA`, `challenge`, `seed`, `backup`, `firewall`, `WAF`, `role` → se prefiere `rol` o `perfil`.
- **Datos e infraestructura:** `Big Data`, `MySQL`, `PostgreSQL`, `Docker`, `container` → `contenedor`, `VM`, `Blob Storage`, `CDN`, `cache` / `caché`.
- **Metodología:** `STRIDE`, `DREAD`, `OWASP Top 10`, `ISO/IEC 27005`, `triage` (término asistencial consolidado) y los nombres propios de marcos y normas.

La regla no es "todo anglicismo se queda": es "el término técnico con sentido
propio se queda; el adjetivo ornamental se traduce o se borra".

## Equivalencias que conviene fijar por documento

Cuando un documento alterna dos términos para el mismo referente, se elige uno
y se mantiene. Ejemplos de criterio, no de obligación:

| Usar siempre | No alternar con |
|---|---|
| servicio de urgencias | emergencias, urgencias médicas (como nombre del servicio) |
| personal de triage | operador de triage, triagista |
| episodio de triage | caso, evento de triage |
| lista de espera | cola de priorización |
| datos sintéticos | datos simulados (elegir uno por documento) |
| prototipo académico | producto, sistema en producción |
| plataforma / sistema | aplicación (salvo nombre propio) |
| registro de auditoría | bitácora (salvo cita textual) |

## Cómo adaptar el glosario a un proyecto

Crea un archivo aparte con tres columnas:

1. **Término permitido**: el que se usa en el documento.
2. **Equivalente prohibido o desaconsejado**: el que no se debe alternar.
3. **Motivo**: norma, nombre propio, decisión de producto o cita.

El detector no lee ese archivo: el glosario es una instrucción para el modelo.
Si un término del glosario aparece en el texto, no se marca como IA-ismo.

## Lo que no se traduce

Nombres de repositorio, módulos, tablas, columnas, rutas, variables de entorno
y comandos. Se dejan exactamente como están, aunque parezcan anglicismos.
