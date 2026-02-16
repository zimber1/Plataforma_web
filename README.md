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






