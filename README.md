# GalacticApp · Frontend

Aplicación web de GalacticApp para administradores, coordinadores y técnicos. Consume la API del [backend](https://github.com/SebaBranda/Proyecto_Final_UNAHUR_C2-Backend).

## Stack

| | |
|---|---|
| UI | React 19 y Material UI 9 (`@mui/material`, `@mui/icons-material`, Emotion) |
| Build | Vite 8 |
| Ruteo | React Router 7 |
| HTTP | Axios (`axios-mock-adapter` para trabajar sin backend) |
| Mapas | Leaflet con `react-leaflet` y mosaicos de OpenStreetMap |
| Calidad | ESLint 10 con las reglas de React Hooks |
| Producción | nginx 1.27 en Docker |

## Estructura

```
src/
  main.jsx, App.jsx        arranque, tema, rutas protegidas por rol y manejo de sesión
  components/
    AppLayout.jsx          estructura común: barra superior, menú lateral y contenido
    Login.jsx
    admin/                 panel del administrador: usuarios y clientes
    coordinador/           reclamos, técnicos, vehículos y mapa de técnicos
    tecnico/               asignaciones, servicio en curso, jornada y vehículo
    reportes/              generador de reportes (fuente, columnas, filtros, resumen y CSV)
    comunes/               piezas reutilizables: paginación, selectores, galería de imágenes, etc.
    errors/                páginas de error (400, 403, 404, 500 y 503)
  context/                 estado compartido (DataContext) y hooks de datos: paginado, carga diferida
  services/
    apiClient.js           instancia de Axios, token y renovación de sesión
    api.js                 una función por cada ruta de la API, agrupadas por recurso
    mockApi.js             respuestas simuladas cuando VITE_USE_MOCKS=true
  theme/theme.js           tema de MUI (colores de marca y tipografía)
  utils/                   compresión de imágenes, subida de fotos, combustible
```

## Rutas

| Ruta | Rol |
|---|---|
| `/` | Login |
| `/adminHome` | Administrador |
| `/coordinadorHome` | Coordinador |
| `/tecnicoHome` y `/tecnicoHome/servicio-en-curso` | Técnico |
| `/error/400`, `/403`, `/404`, `/500` y `/503` | Páginas de error |

Cada panel tiene sus secciones dentro de la misma ruta. Sin sesión, cualquier ruta de panel redirige al login. Al ingresar, cada usuario va al panel de su rol, y los permisos por rol los hace cumplir la API.

## Aspectos técnicos

- **Sesión:** el JWT se guarda en `sessionStorage`. Las pestañas abiertas comparten una única sesión a través de un `BroadcastChannel`. Cuando la API responde `401` (token vencido o sesión reemplazada desde otro dispositivo), se cierra la sesión en todas las pestañas y se vuelve al login con un aviso.
- **Datos:** los listados se paginan en el servidor (`usePaginado`) y las secciones cargan sus datos recién al abrirse (`useCargaDiferida`).
- **Imágenes:** se comprimen en el navegador antes de subirlas (hasta unos 550 KB) y se envían a la API como data URL.
- **Mapa:** muestra la última ubicación de cada técnico y se actualiza cada 5 minutos. Al seleccionar un técnico, dibuja su recorrido del día elegido.
- **Ubicación del técnico:** con la jornada activa, la web envía la posición del técnico cada 5 minutos usando la geolocalización del navegador.
- **Responsive:** las tablas pasan a tarjetas en pantallas de menos de 900 px y ocultan columnas secundarias en tamaños intermedios.

## Variables de entorno

Se leen en tiempo de build (Vite). Partir de [.env.example](.env.example):

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API, terminada en `/api` (por defecto `/api`) |
| `VITE_USE_MOCKS` | `true` para usar datos simulados sin backend |

## Ejecución

### Desarrollo

Requiere Node.js 20 o superior.

```bash
npm install
cp .env.example .env    # p. ej. VITE_API_URL=http://localhost:3000/api
npm run dev             # http://localhost:5173
```

El backend tiene que permitir el origen `http://localhost:5173` en su variable `CORS_ORIGIN`.

### Docker

El [Dockerfile](Dockerfile) compila la app con Node 20 y la sirve con nginx. El [nginx.conf](nginx.conf):

- devuelve `index.html` en cualquier ruta, para que funcione el ruteo de la aplicación;
- reenvía `/api/` al contenedor `backend:3000`, así web y API comparten el mismo origen;
- guarda en caché por un año los archivos de `/assets` (llevan un hash en el nombre) y nunca guarda `index.html`, para que cada despliegue se vea enseguida.

Se levanta junto con el resto desde el `docker-compose.yml` del repositorio principal, en `http://localhost:8080`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | Revisa el código con ESLint |
