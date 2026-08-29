# Proyecto Final - GalacticApp - Frontend

Descripción
-
Frontend desarrollado con React y Vite como parte del Proyecto Final (UNAHUR C2). Esta carpeta contiene la aplicación web, la configuración de Vite y los recursos estáticos.

Tecnologías
-
- React
- Vite
- JavaScript (ESNext)
- CSS
- ESLint

Instalación y ejecución
-
1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar en desarrollo (servidor con HMR):

```bash
npm run dev
```

3. Generar build para producción:

```bash
npm run build
```

4. Previsualizar el build:

```bash
npm run preview
```

Estructura del proyecto
-
- `index.html` - punto de entrada HTML
- `src/` - código fuente de la aplicación
	- `main.jsx` - arranque de la app
	- `App.jsx` - componente raíz
	- `assets/` - imágenes y recursos
- `public/` - archivos estáticos servidos tal cual
- `package.json` - scripts y dependencias
- `vite.config.js` - configuración de Vite

Comandos disponibles (definidos en `package.json`)
-
- `npm run dev` - inicia servidor de desarrollo
- `npm run build` - crea la versión de producción
- `npm run preview` - sirve la versión de producción localmente

Cómo contribuir
-
- Crear una rama nueva para cada feature o fix: `git checkout -b feat/nombre`
- Hacer commits claros y atómicos
- Abrir un Pull Request cuando la funcionalidad esté lista

Notas
-
- Actualiza este README con detalles del despliegue, variables de entorno y dependencias específicas cuando estén disponibles.

Licencia
-
Proyecto bajo licencia (añadir la licencia correspondiente).
