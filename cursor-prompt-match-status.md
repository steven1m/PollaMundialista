# Cursor Prompt — PollaMundialista: Botón para iniciar partido desde el admin

## Contexto del proyecto

Aplicación web SPA de polla mundialista. Frontend en React + Vite, backend en Node.js + Express, base de datos PostgreSQL desplegado en Render.

Los partidos tienen un campo `status` en la tabla `matches` con tres valores posibles: `upcoming`, `locked` y `played`. Actualmente el admin solo puede registrar resultados. Se necesita que el admin pueda cambiar manualmente el estado de un partido a `locked` cuando este inicia, para que los usuarios ya no puedan modificar sus predicciones pero sí puedan verlas.

## Necesidad

Agregar un botón en el panel de administración que permita al admin marcar un partido como "En curso" (estado `locked`) en el momento en que el partido comienza. Esto bloquea las predicciones de todos los usuarios para ese partido. Si el admin se equivoca, debe poder revertirlo a `upcoming`. El flujo de estados es: `upcoming → locked → played`.

Los usuarios con estado `locked` deben poder seguir viendo su predicción guardada, pero sin poder modificarla.

## Archivos a modificar

### 1. `backend/src/routes/matches.js`

Agregar un nuevo endpoint `PATCH /api/matches/:id/status` antes del `module.exports`. Este endpoint debe:
- Requerir autenticación de admin (`authMiddleware`, `adminMiddleware` ya existen en el archivo)
- Recibir en el body el campo `status`
- Validar que el valor sea uno de: `upcoming`, `locked`, `played`
- Actualizar el campo `status` del partido en la base de datos
- Retornar el partido actualizado
- Retornar error 400 si el status es inválido, 404 si el partido no existe

### 2. `frontend/src/api/client.js`

Agregar un nuevo método `setMatchStatus` dentro del objeto `api` exportado, junto a los métodos existentes de partidos (`getMatches`, `setResult`, `updateTeams`). Este método debe hacer un `PATCH` a `/matches/:id/status` enviando el `status` en el body.

### 3. `frontend/src/pages/Admin.jsx`

Hay tres cambios en este archivo:

**a) Agregar handler `handleStatus`** junto a los demás handlers existentes (`handleResult`, `handleApprove`, etc.). Este handler debe:
- Pedir confirmación al usuario antes de ejecutar
- Llamar a `api.setMatchStatus(matchId, status)`
- Mostrar notificación de éxito o error usando `notify()` y `setMsg()` que ya existen

**b) Pasar el nuevo handler como prop `onStatus` al componente `ResultRow`** dentro de la tab `resultados`. Actualmente se renderiza así:
```
<ResultRow key={m.id} match={m} onSave={handleResult} />
```
Debe quedar:
```
<ResultRow key={m.id} match={m} onSave={handleResult} onStatus={handleStatus} />
```

**c) Modificar el componente `ResultRow`** que está al final del archivo para que:
- Reciba la nueva prop `onStatus`
- Muestre el estado actual del partido con una etiqueta visual: `🟢 Próximo` si es `upcoming`, `🔴 En curso` si es `locked`
- Muestre un botón `🔒 Iniciar partido` (estilo danger) cuando el partido está en `upcoming`, que al hacer clic llame a `onStatus(match.id, 'locked')`
- Muestre un botón `↩ Revertir` (estilo outline) cuando el partido está en `locked`, que al hacer clic llame a `onStatus(match.id, 'upcoming')`
- Mantenga intacto el formulario de inputs y botón para guardar resultado que ya existe

## Lo que NO se debe tocar

- El schema de la base de datos no requiere cambios, el campo `status` con sus valores ya existe
- La lógica de puntuación, exportación, chat, notificaciones y demás rutas no se modifican
- Los demás componentes del admin (`ResultRow` de equipos, handlers existentes) no se tocan
- La lógica de `can_predict` y `effectively_locked` en el GET de matches no se modifica
