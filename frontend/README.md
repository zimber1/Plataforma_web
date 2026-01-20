# Frontend – Plataforma Web

## 1. Descripción General
Este módulo constituye la capa de presentación (**Frontend**) del proyecto **Plataforma Web**, desarrollado bajo los estándares de la asignatura **Desarrollo Web Profesional**. 

La aplicación ha sido diseñada siguiendo principios de **Arquitectura Basada en Componentes**, asegurando una interfaz de usuario reactiva, modular y de alto rendimiento. Se enfoca en la separación de intereses (*Separation of Concerns*), facilitando la escalabilidad y el mantenimiento a largo plazo.

---

## 2. Stack Tecnológico
Se han seleccionado herramientas modernas que garantizan un flujo de desarrollo ágil y un producto final optimizado:

* **React.js**: Biblioteca principal para la construcción de interfaces de usuario declarativas.
* **Vite**: Herramienta de próxima generación para el empaquetado y servidor de desarrollo (HMR).
* **JavaScript (ES6+)**: Estándar de lenguaje para lógica de negocio robusta.
* **HTML5 & CSS3**: Estructura y diseño responsivo avanzado.
* **Node.js**: Entorno de ejecución para la gestión de dependencias.

---

## 3. Arquitectura del Proyecto
La estructura de directorios sigue un patrón organizado por responsabilidades técnicas:

```text
frontend/
├── public/           # Activos estáticos (imágenes, favicons)
├── src/
│   ├── components/   # Componentes de UI reutilizables
│   ├── services/     # Capa de abstracción para consumo de APIs
│   ├── store/        # Gestión del estado global
│   ├── utils/        # Funciones auxiliares y validadores
│   ├── App.jsx       # Componente raíz y definición de rutas
│   └── main.jsx      # Punto de entrada de la aplicación
├── index.html        # Plantilla base del DOM
├── package.json      # Configuración de dependencias y scripts
├── vite.config.js    # Configuración del motor de compilación
└── README.md         # Documentación técnica

## 4. Instalación y Configuración

### Requisitos Previos
* **Node.js**: Versión `18.0.0` o superior.
* **npm**: Gestor de paquetes (incluido con Node.js).

### Configuración del Entorno
1.  **Clonar el repositorio.**
2.  **Acceder al directorio del proyecto:**
    ```bash
    cd frontend
    ```
3.  **Instalar las dependencias necesarias:**
    ```bash
    npm install
    ```

### Ejecución en Desarrollo
Para levantar el servidor local con recarga en tiempo real (**HMR - Hot Module Replacement**):
```bash
npm run dev