# Polla Mundialista — Aragón Aluminio

Aplicación web (SPA) para gestionar la polla mundialista interna de **Aragón Aluminio**, organizada por el **Comité de Convivencia Laboral**.

## Stack

- **Frontend:** React (SPA) + Vite + Hooks + SheetJS (xlsx)
- **Backend:** Node.js + Express (REST API)
- **Base de datos:** PostgreSQL
- **Tiempo real:** WebSocket para chat

## Requisitos

- Node.js 18+
- PostgreSQL 14+

## Instalación

### 1. Base de datos

```bash
createdb polla_mundialista
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Editar DATABASE_URL y ADMIN_PASSWORD si es necesario
npm install
npm run db:init
npm run dev
```

El API corre en `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La app corre en `http://localhost:5173`.

## Acceso

| Rol | Método |
|-----|--------|
| **Participante** | Login con nombre completo (sin contraseña). Requiere registro y aprobación del admin. |
| **Admin** | Contraseña: `aragon2026` |

## Pantallas

- **Posiciones** — Ranking en tiempo real, bolsa y próximos partidos
- **Predicciones** — Formulario por partido de la fase activa
- **Historial** — Predicciones jugadas con puntos (admin puede filtrar)
- **Premios** — Podio y bolsa en COP por fase, exportar Excel
- **Chat** — Mensajes en tiempo real (admin solo lectura)
- **Alertas** — Notificaciones con badge en navegación
- **Admin** — Panel de gestión completo

## Puntuación

| Resultado | Puntos |
|-----------|--------|
| Marcador exacto | 3 |
| Resultado correcto (ganador/empate) | 1 |
| Incorrecto | 0 |

## Premios

- Inscripción: $50.000 COP por participante por fase
- Distribución: 1° 50% · 2° 30% · 3° 20%

## Endpoints REST

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/users
PATCH  /api/users/:id/approve
PATCH  /api/users/:id/points
GET    /api/matches
POST   /api/matches/:id/result
PATCH  /api/matches/:id/teams
GET    /api/predictions
POST   /api/predictions
GET    /api/predictions/export
GET    /api/chat
POST   /api/chat
GET    /api/notifs
GET    /api/admin/settings
POST   /api/admin/unlock-round
POST   /api/admin/activate-phase
GET    /api/admin/premios
GET    /api/admin/pending-users
WS     /ws (chat en tiempo real)
```

## Estructura

```
PollaMundialista/
├── backend/
│   └── src/
│       ├── db/          # Schema, seed, init
│       ├── routes/      # REST endpoints
│       ├── services/    # Lógica de puntuación
│       └── middleware/  # Autenticación
└── frontend/
    └── src/
        ├── pages/       # Pantallas
        ├── components/  # Layout, UI
        ├── context/     # Auth
        └── api/         # Cliente HTTP
```
