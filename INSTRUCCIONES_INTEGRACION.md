# Cómo integrar esto en tu proyecto `frontend/`

Este paquete contiene el frontend del prototipo "Hoy" v1 (Sprint 0), construido
sobre React + Vite + Tailwind + React Router, siguiendo la Arquitectura de
Información (C5) y el Backlog Refinado (C4). Está pensado para **fusionarse**
con la carpeta que ya creaste con `npm create vite`, no para reemplazarla
completa.

## 1. Instala las dependencias nuevas

Desde la raíz de tu proyecto (`frontend/`):

```bash
npm install react-router-dom
npm install -D tailwindcss@3 postcss autoprefixer
```

(Ya tienes `react` y `react-dom` porque los trae el template de Vite).

## 2. Archivos a AGREGAR o REEMPLAZAR

Copia estos archivos y carpetas dentro de tu `frontend/`, respetando las rutas:

| Archivo/carpeta                  | Acción      | Notas                                                            |
| --------------------------------- | ----------- | ----------------------------------------------------------------- |
| `tailwind.config.js`              | Agregar     | Nuevo — no existía en tu proyecto.                                |
| `postcss.config.js`               | Agregar     | Nuevo.                                                             |
| `.env.example`                    | Agregar     | Cópialo también como `.env` y ajusta `VITE_API_URL`.               |
| `index.html`                      | Reemplazar  | Agrega las fuentes (Google Fonts) y el título de la app.           |
| `src/main.jsx`                    | Reemplazar  | Ahora envuelve `<App />` en `<BrowserRouter>`.                     |
| `src/App.jsx`                     | Reemplazar  | Define las rutas SPA (ver Arquitectura de Información, C5).        |
| `src/index.css`                   | Reemplazar  | Directivas de Tailwind + estilos base del prototipo.               |
| `src/App.css`                     | Eliminar    | Ya no se usa (Tailwind reemplaza el CSS por componente).           |
| `src/assets/react.svg`            | Eliminar    | Ya no se usa (opcional).                                           |
| `src/components/`                 | Agregar     | Todos los componentes de UI (ver estructura abajo).                |
| `src/pages/`                      | Agregar     | Una página por ruta SPA.                                           |
| `src/hooks/`                      | Agregar     | Lógica de estado reutilizable (`useTodayGestiones`, `useDailyLimit`). |
| `src/services/`                   | Agregar     | **Punto único de integración con el backend** (`api.js`).          |
| `src/utils/`                      | Agregar     | Funciones puras: fechas y la regla de priorización (US-04).        |
| `src/data/`                       | Agregar     | Datos de ejemplo — se elimina cuando exista `GET /today` real.     |

No toques `package.json`, `package-lock.json`, `.gitignore` ni
`eslint.config.js` — son tuyos y no necesitan cambios (más allá de las
dependencias del paso 1).

## 3. Verifica que corre

```bash
npm run dev
```

Abre `http://localhost:5173/hoy` (la ruta raíz `/` redirige automáticamente
ahí). Deberías ver el prototipo "Hoy" con datos de ejemplo, idéntico al
mockup HTML original.

Abajo a la derecha hay una barra de "Simulación" (solo visible en `npm run
dev`, nunca en producción) para forzar los estados vacío / error / carga
exigidos por la rúbrica de Sprint 0 (criterio C6).

## 4. Estructura final de `src/`

```
src/
├── main.jsx                 # Punto de entrada, monta <BrowserRouter>
├── App.jsx                  # Tabla de rutas (mapea 1:1 con C5 §3)
├── index.css                # Tailwind + estilos base del prototipo
├── components/
│   ├── layout/
│   │   ├── Header.jsx        # Barra superior (nav, buscador, "Crear evento")
│   │   ├── Footer.jsx
│   │   └── MainLayout.jsx    # Shell para /crear, /evento/:id, /progreso
│   ├── common/
│   │   ├── StatCard.jsx
│   │   ├── PriorityRuleBanner.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorState.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   ├── Toast.jsx
│   │   ├── RescheduleModal.jsx
│   │   ├── DailyLimitModal.jsx      # US-12
│   │   └── ComingSoonPlaceholder.jsx
│   ├── tasks/
│   │   └── TaskCard.jsx      # Una gestión — 4 variantes visuales
│   └── dev/
│       └── SimulationToolbar.jsx   # Solo en desarrollo
├── pages/
│   ├── HoyPage.jsx           # /hoy — implementación completa (Sprint 0)
│   ├── CrearPage.jsx         # /crear — stub (Sprint 1)
│   ├── EventoDetallePage.jsx # /evento/:id — stub (Sprint 1–3)
│   ├── ProgresoPage.jsx      # /progreso — stub (Sprint 4)
│   ├── LoginPage.jsx         # /login — formulario funcional (Sprint 2)
│   └── NotFoundPage.jsx
├── hooks/
│   ├── useTodayGestiones.js  # Estado + lógica de negocio de /hoy
│   └── useDailyLimit.js      # US-12
├── services/
│   └── api.js                # ⭐ ÚNICO punto de integración con el backend
├── utils/
│   ├── dateUtils.js           # Formateo/clasificación de fechas
│   └── sortGestiones.js       # Regla de priorización (US-04), documentada
└── data/
    └── mockGestiones.js       # Datos de ejemplo (borrar cuando haya backend)
```

## 5. Conectar con el backend cuando esté listo

Todo pasa por **`src/services/api.js`**. Cada función ahí (`getToday`,
`createEvent`, `markGestionAsDone`, `rescheduleGestion`, `dailyLimitApi`,
`login`) tiene un comentario `TODO(backend): ...` con el `fetch` real que la
reemplaza, incluyendo el endpoint y el verbo HTTP esperados según el Backlog
Refinado (C4). Ningún componente ni página importa datos mock directamente
— todos pasan por este archivo, así que es el único que cambia.

`VITE_API_URL` (en tu `.env`) apunta al backend Django. Ajusta el valor por
entorno (local/staging/prod) sin tocar código.
