# Despliegue del servicio

El servicio se despliega con Docker y escucha en el puerto 8080. Para ejecutarlo en local, usa `docker compose up` y abre `http://localhost:8080/health`. El endpoint `/api/v1/triage` requiere un token JWT válido.

El backend usa Spring Boot y el frontend se sirve con Caddy. La configuración está en `infra/config/app.yml`; no cambies `APP_JWT_SECRET` en el repositorio. El despliegue en producción se hace con `deploy.sh` y tarda unos 3 minutos.
