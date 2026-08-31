# GalacticApp Frontend

Frontend del proyecto final desarrollado con React + Vite para la UNAHUR.

## Tecnologías

- React
- Vite
- JavaScript
- CSS
- ESLint
- Docker

## Requisitos previos

Antes de levantar el proyecto, asegurate de tener instalado:

- Node.js 20+
- npm
- Git
- Docker Desktop (si vas a usar contenedores)

## 1) Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Proyecto_Final_UNAHUR_C2-Frontend
```

## 2) Instalar dependencias

```bash
npm install
```

## 3) Variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Luego editá el archivo `.env` según tu entorno:

```env
VITE_PORT=5173
VITE_API_URL=http://localhost:3000
VITE_APP_ENV=development
```

## 4) Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación quedará disponible en:

```text
http://localhost:5173
```

## 5) Build de producción

```bash
npm run build
```

Para previsualizar el build:

```bash
npm run preview
```

## 6) Ejecutar con Docker

### Desarrollo

```bash
docker compose up --build
```

La app queda disponible en:

```text
http://localhost:5173
```

### Producción

```bash
docker build -f Dockerfile.prod -t galacticapp-frontend-prod .
docker run -p 80:80 galacticapp-frontend-prod
```

Luego abrí:

```text
http://localhost
```

## 7) Estructura del proyecto

```text
.
├── .dockerignore
├── .env.example
├── Dockerfile
├── Dockerfile.prod
├── docker-compose.yml
├── nginx.conf
├── index.html
├── package.json
├── public/
├── src/
├── vite.config.js
├── README.md
└── eslint.config.js
```

## 8) Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## 9) Troubleshooting

### Error de Docker en Windows

Si aparece un error como:

```text
The system cannot find the file specified
```

eso normalmente significa que Docker Desktop no está ejecutándose o no está instalado en tu máquina. Verificá que Docker Desktop esté activo y luego volvé a ejecutar:

```bash
docker version
docker compose up --build
```

## 10) Contribución

- Crear una rama por funcionalidad
- Hacer commits claros
- Realizar pull requests para revisión

## Licencia

Este proyecto aún no define una licencia específica.
