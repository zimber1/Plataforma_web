# Plataforma Web  
## PC Game Compatibility Platform

Repositorio del proyecto en equipo de la materia **Desarrollo Web Profesional**.

<p align="center">
  <img src="Imagenes/Imagen_1.png" alt="Plataforma Web" width="600"/>
</p>



### Estado del proyecto
**Fase:** Definición del proyecto


### Objetivo
Desarrollar una aplicación web que permita registrar los componentes de una computadora y consultar la compatibilidad con videojuegos a partir de sus requisitos técnicos.


## Problema identificado
Los usuarios no siempre conocen si su computadora cumple con los requisitos necesarios para ejecutar un videojuego, lo que puede provocar problemas de rendimiento o compras innecesarias.


## Roles del equipo
- **Tech Lead:** Carlos Andrés Arriaga Márquez
- **Frontend:** Jesús Emanuel Vega Medina
- **Backend:** Ariel Abimael Chacón Herrera
- **DevOps:** Germán Yair Martínez Bolaños
- **QA:** Claudia Espíndola López


## Carpeta Investigaciones
La carpeta **Investigaciones** contiene los aportes individuales de cada integrante del equipo, organizados por actividades.

## Arquitectura general del sistema
La plataforma se plantea como una **aplicación web** con una arquitectura cliente-servidor, diseñada desde su fase inicial para ser escalable, mantenible y alineada con prácticas profesionales de desarrollo de software.

- **Frontend:** Interfaz web donde el usuario registra los componentes de su computadora y consulta la compatibilidad con videojuegos.
- **Backend:** Encargado de la lógica de negocio, análisis de requisitos técnicos y validación de compatibilidad.
- **Infraestructura (DevOps):** Uso de contenedores Docker para garantizar portabilidad y consistencia entre entornos de desarrollo.
- **Integración Continua (CI):** Pipeline automatizado con GitHub Actions que valida la correcta construcción del proyecto en cada push.


## Docker
El proyecto cuenta con una configuración de **Docker** que permite ejecutar la aplicación en un entorno aislado y reproducible, facilitando el desarrollo y preparando el sistema para futuras fases de despliegue.

### Archivos principales
- **Dockerfile:** Define la imagen base y los pasos necesarios para construir el contenedor de la aplicación.
- **docker-compose.yml:** Permite la ejecución del contenedor y la gestión de servicios de manera sencilla.

### Ejecución local
Para construir y ejecutar el proyecto localmente se utiliza el siguiente comando:
```bash
# Construir y levantar con docker-compose
docker compose build
docker compose up -d

# Alternativamente construir solo la imagen del frontend y ejecutar
# desde la raíz del repositorio:
docker build -t plataforma-frontend .
docker run --rm -p 3000:3000 plataforma-frontend

```

### Pruebas (tests)

Para ejecutar los tests localmente (en la carpeta `frontend`):

```bash
cd frontend
npm ci --legacy-peer-deps
npm test
```

Nota: el contenedor Docker está configurado para usar `npm ci --legacy-peer-deps` durante la etapa de build para evitar conflictos de peer-dependencies introducidos por las dependencias de testing o herramientas de desarrollo.

### CI / GitHub Actions

Hay un workflow de CI en `.github/workflows/ci.yml` que instala dependencias y ejecuta los tests del `frontend`. El pipeline fallará si los tests no pasan.

## Cambios recientes (E2E / CI / Infraestructura)

He añadido varias mejoras para soportar pruebas E2E reproducibles y un pipeline de integración que valida el comportamiento asincrónico y de tolerancia a fallos:

- **Infraestructura / docker-compose**: se actualizó `docker-compose.yml` para incluir:
  - Servicio `mongo` (imagen `mongo:6`) y volumen `mongo-data`.
  - Mapear puertos consistentes para los microservicios y exponer el API Gateway en el puerto `3000` (el pipeline CI hace check en `http://localhost:3000/health`).
  - Inyección de variables de entorno esperadas: `MONGO_URI` en servicios que usan MongoDB y `OPENAI_API_KEY` para `catalog-service`.

- **Variables de entorno**: añadí `.env.example` en la raíz con las variables mínimas:
  - `MONGO_URI` (ej. `mongodb://mongo:27017/plataforma`)
  - `OPENAI_API_KEY` (si aplica)
  - `VITE_API_URL` (URL del API para el build del frontend)

- **API Gateway** (`backend/api-gateway/index.js`):
  - Uso de `USERS_SERVICE_URL`, `CATALOG_SERVICE_URL` y `REVIEWS_SERVICE_URL` desde variables de entorno.
  - Middleware opcional de simulación (`SIMULATE_LATENCY_MS`, `SIMULATE_FAIL_RATE`) para probar loaders y reintentos en la UI.
  - Health endpoint `/health` que intenta chequear downstream services sin fallar si no están disponibles.

- **Frontend**:
  - Cliente central `frontend/src/api/index.js` (`apiFetch`) para llamadas con timeout/abort y manejo de errores.
  - `GameDetails` y `Login` actualizados para mostrar `loading`, `error` con botón `Reintentar` y usar `apiFetch`.
  - E2E Playwright aislado en `frontend/e2e` para evitar conflictos con Jest/JSDOM:
    - `frontend/e2e/playwright.config.mjs` (config y `webServer` que hace `npm run build && npm run preview`).
    - `frontend/e2e/tests/loader-retry.spec.js` prueba determinística que mockea `/api/games/*` para validar loader/error/retry.
    - `frontend/e2e/package.json` mantiene Playwright aislado y en ESM.
  - Script CI para E2E: `frontend/package.json` contiene `e2e:ci` que ejecuta el runner aislado.

- **Fallback E2E**: agregué un runner ligero con Puppeteer en `tools/e2e` (`run.js` y `package.json`) para ejecuciones rápidas o entornos donde Playwright no sea viable.

- **Simtests**: `tools/simtests/test.js` (script que simula llamadas a la API con latencia/fallas y genera `tools/simtests/simtests-report.json`).

- **CI / GitHub Actions** (`.github/workflows/ci.yml`):
  - Paso en el job `frontend` para ejecutar `npm run e2e:ci` y subir el reporte de Playwright.
  - Nuevo job `e2e-integration` que arranca `docker compose up -d --build`, espera el `/health` del gateway en `http://localhost:3000/health`, ejecuta Playwright E2E contra la pila levantada y sube el reporte. Finalmente hace `docker compose down --volumes`.

## Archivos añadidos o modificados (resumen rápido)
- Modificados: `docker-compose.yml`, `frontend/package.json`, `backend/api-gateway/index.js`, `frontend/src/api/index.js`, `frontend/src/pages/GameDetails/GameDetails.jsx`, `frontend/src/pages/Login/Login.jsx`, `.github/workflows/ci.yml`
- Añadidos: `frontend/e2e/*` (Playwright), `tools/e2e/*` (Puppeteer), `tools/simtests/*`, `.env.example`, `docs/e2e-screenshot.png` (generado), `tools/simtests/simtests-report.json` (generado)

## Ejecutar localmente (quickstart)

1) Build frontend (apunta VITE_API_URL al gateway si quieres tests integrados):
```bash
cd frontend
export VITE_API_URL='http://localhost:3000'   # PowerShell: $env:VITE_API_URL='http://localhost:3000'
npm ci --legacy-peer-deps
npm run build
```

2) Levantar stack con Docker Compose:
```bash
# desde la raíz del repo
docker compose up -d --build

# esperar health (o usa el job CI que lo hace automáticamente)
for i in {1..60}; do curl -sSf http://localhost:3000/health && break || sleep 2; done
```

3) Ejecutar Playwright E2E localmente (usa runner aislado):
```bash
cd frontend/e2e
npm ci
npm run install-browsers
npm test
```

4) Alternativa rápida (Puppeteer smoke):
```bash
cd tools/e2e
npm ci
node run.js
```

## Recomendaciones para CI
- Añadir los siguientes Secrets en GitHub Settings para que el job `e2e-integration` funcione:
  - `MONGO_URI` (si no quieres usar el mongo local del compose)
  - `OPENAI_API_KEY` (si `catalog-service` lo requiere)
  - `VITE_API_URL` (URL del gateway para el build del frontend)

## Notas finales
- Los tests E2E se diseñaron para ser determinísticos: la prueba principal mockea la respuesta del backend para validar la UI (loader/error/retry). Esto facilita ejecuciones en CI sin depender de todos los microservicios.
- Si prefieres que las E2E apunten siempre a la pila real en CI, configura los secrets y permite que `docker compose` arranque la base de datos y servicios en el job `e2e-integration`.

Si quieres que genere un `ci/E2E.md` con pasos detallados (comandos, sección de troubleshooting y ejemplos de logs), lo preparo ahora.






