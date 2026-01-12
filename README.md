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
- **Tech Lead:** Ariel Abimael Chacón Herrera
- **Frontend:** Carlos Andrés Arriaga Márquez
- **Backend:** Germán Yair Martínez Bolaños
- **DevOps:** Claudia Espíndola López
- **QA:** Jesús Emanuel Vega Medina


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
docker compose up -d






