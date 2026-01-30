# Backend – Plataforma Web

##  Descripción General

Este directorio contiene el **backend del proyecto Plataforma Web**, el cual está diseñado bajo una **arquitectura de microservicios** con el objetivo de ofrecer una solución escalable, mantenible y desacoplada.

El backend es responsable de manejar la lógica del sistema, la comunicación entre servicios y el acceso a los datos necesarios para el correcto funcionamiento de la aplicación web.

---

##  Objetivo del Backend

El backend tiene como objetivo principal proporcionar servicios que permitan:

- Gestión de usuarios y autenticación
- Consulta de un catálogo de videojuegos
- Gestión de reseñas y predicción de rendimiento
- Comunicación centralizada entre frontend y microservicios mediante un API Gateway

---

##  Arquitectura del Sistema

El backend sigue una **arquitectura de microservicios**, donde cada servicio cumple una responsabilidad específica y se comunica de forma independiente.


---

##  Descripción de Microservicios

###  API Gateway

Responsable de actuar como el **punto único de entrada** al backend.

Funciones principales:
- Enrutamiento de peticiones desde el frontend
- Comunicación con los microservicios
- Centralización del acceso al backend
- Aplicación de middleware (seguridad, logs, validaciones)

---

###  Users Service

Responsable de la gestión de usuarios.

Funciones previstas:
- Registro de usuarios
- Autenticación y autorización
- Gestión de perfiles
- Almacenamiento de información de hardware del usuario

---

###  Catalog Service

Responsable del catálogo de videojuegos.

Funciones previstas:
- Consulta de videojuegos
- Obtención de información técnica y general
- Integración con APIs externas (por ejemplo, IGDB)

---

###  Reviews Service

Responsable de las reseñas y análisis de rendimiento.

Funciones previstas:
- Gestión de reseñas de usuarios
- Predicción de rendimiento (FPS)
- Análisis de compatibilidad de videojuegos según hardware

---

##  Tecnologías Previstas

Las tecnologías que se utilizarán durante la implementación del backend son:

- **Node.js**
- **Express.js**
- **JavaScript (ES6+)**
- **Docker**
- **Docker Compose**
- **Arquitectura REST**

*(La implementación de estas tecnologías se realizará en fases posteriores del proyecto.)*

---

##  Estado del Proyecto

- Fase actual: **Diseño y definición de la estructura base**
- Implementación de lógica de negocio: **Pendiente**
- Microservicios funcionales: **No implementados aún**
- Integración con frontend: **Pendiente**

##  Buenas Prácticas

- Cada microservicio será desarrollado y probado de manera independiente.
- Se seguirá GitHub Flow para el control de versiones.
- Los cambios al backend se integrarán mediante Pull Requests.
- La implementación se realizará por fases para facilitar la validación.



