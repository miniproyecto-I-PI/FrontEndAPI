# Plan de Implementación: US-06, US-07, US-08 y US-12 (Gestión de Reprogramación y Sobrecarga)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar en el frontend el flujo completo de reprogramación de gestiones logísticas con detección y resolución de sobrecarga diaria (US-06, US-07, US-08) y la configuración del límite diario de horas de gestión (US-12), integrándose con las APIs existentes de Django sin necesidad de alterar el backend y respetando el sistema de diseño visual de Convoka.

**Architecture:**
El backend actual en `miniproyecto-1-convoka` ya provee:
1. `GET` y `PATCH /api/settings/daily-limit` (persistencia del límite diario 1-16h por usuario autenticado).
2. `PATCH /api/subtasks/:id` (actualización parcial de `target_date`, `estimated_hours`, `status`).
3. `GET /api/today` y `GET /api/events` (datos de gestiones y eventos con sus duraciones).

Por tanto, **no se requieren cambios en el backend**. El frontend encapsulará el motor de cálculo y validación de sobrecarga diaria en un servicio modular (`workloadService.js`), gestionará el estado global del límite diario con un hook reactivo (`useDailyLimit.js`), y coordinará los flujos de interfaz mediante componentes modulares y accesibles en `src/components/reschedule/`, adaptados a los tokens y estética de Tailwind del proyecto (Outfit, Plus Jakarta Sans, Space Mono, paleta de colores editorial cálida: Terracotta, Sepia, Crimson, Sage).

**Tech Stack:** React 19, Vite, Tailwind CSS 3.4, React Router DOM 7.

**Spec / Referencias de Diseño:**
- Especificaciones de HUs: US-06, US-07, US-08, US-12.
- Capturas de referencia visual proporcionadas:
  - `Estado 1`: Modal 540px con días sugeridos y disponibilidad libre (US-08: Mover a otro día).
  - `Estado 2`: Modal sin días sugeridos (selección manual accesible con datepicker).
  - `Estado 3`: Pantalla de error de API con conservación de datos y reintento (tolerancia a fallos).
  - `Estado 4`: Confirmación de éxito (Conflicto resuelto, comparativa anterior vs nueva).
  - `Estado 5`: Modal de advertencia por sobrecarga (US-07: 560px, barra de capacidad, opciones de resolución).
  - `Estado 6`: Modal stepper de reducción de horas con recálculo en vivo (US-08: 1.5h excedido vs 1.0h óptimo).
  - `Estado 7`: Validación de error 0h y pantalla de fallo con valor retenido.

---

## Global Constraints

- **No modificar el backend:** Todo el cálculo de sobrecarga, sugerencia de días alternativos y resolución se realiza con los endpoints existentes (`/settings/daily-limit`, `/subtasks/:id`, `/events`, `/today`).
- **Sistema de diseño y tokens existentes:** Usar estrictamente las clases de Tailwind definidas en `tailwind.config.js`:
  - Fuentes: `font-heading` (`Outfit`), `font-body` (`Plus Jakarta Sans`), `font-stamp` (`Space Mono`).
  - Colores: `paper-base`, `paper-card`, `paper-linen`, `paper-accent`, `ink-charcoal`, `ink-muted`, `terracotta`, `crimson-urgent`, `sage-wax`, `sepia-border`.
  - Bordes y radios: `rounded-sharp` (`3px`), sombras `warm-card-shadow`.
- **Accesibilidad (a11y):**
  - Modales con `role="dialog"` o `role="alertdialog"` (para advertencia de conflicto US-07).
  - Captura y retorno de foco (`focus trap`), cierre con tecla `Escape`.
  - Atributos `aria-describedby`, `aria-labelledby`, `aria-invalid` en formularios e inputs.
- **Tolerancia a fallos (Offline/API retry):** Ningún fallo de red debe resetear el valor ingresado por el usuario (fecha u horas). El botón de reintento debe reusar la selección retenida.

---

## Review Focus

1. **Persistencia y reactividad del límite diario (US-12):** Si el usuario cambia su límite de 6h a 4h en el modal de configuración, la detección de conflicto en US-07 debe evaluar inmediatamente con 4h sin requerir recargar la página.
2. **Cálculo preciso de carga diaria (US-07):** Al sumar horas de un día, no se deben contar gestiones con `status === 'EJECUTADA'`, y si se está reprogramando una gestión que ya pertenecía a ese mismo día, sus horas no deben duplicarse.
3. **Validación contra fecha del evento (US-06):** Si la gestión pertenece a un evento, la nueva fecha objetivo no puede ser posterior a la fecha del evento (`validateTargetDateAgainstEvent`).
4. **Recálculo en tiempo real en reducción de horas (US-08):** El stepper interactivo `[-]` `[+]` con incrementos de 0.5h debe recalcular al instante si el conflicto persiste (Estado 1) o se resuelve (Estado 2), y bloquear valores `< 0.5h` (Estado 3).
5. **Preservación de estado ante error de API:** Si el request `PATCH /subtasks/:id` falla, la pantalla de reintento debe conservar intactos la fecha u horas seleccionadas.

---

## Task Structure

### Task 1: Reforzar y validar US-12 (Configurar límite diario de horas)

**Objetivo:** Asegurar que la configuración del límite diario cumpla con todos los criterios de aceptación de US-12: valor por defecto 6h, rango estricto de 1 a 16 horas con mensaje `"El límite debe estar entre 1 y 16 horas"`, validación en cliente, manejo de errores de API sin perder el input, y feedback accesible.

**Archivos involucrados:**
- Modificar: `src/hooks/useDailyLimit.js`
- Modificar: `src/components/common/DailyLimitModal.jsx`
- Modificar: `src/services/api.js`

**Pasos de ejecución:**
- [x] 1.1 Verificar y afinar en `src/services/api.js` el método `dailyLimitApi`:
  - `get()`: obtener `{ dailyLimitHours }`. Si la API falla o responde sin valor, usar fallback a `6`.
  - `update(hours)`: validar número antes de enviar `PATCH /settings/daily-limit`.
- [x] 1.2 Actualizar `src/hooks/useDailyLimit.js`:
  - Exponer `hours`, `isLoaded`, `update`, `MIN_HOURS: 1`, `MAX_HOURS: 16`.
  - Crear un evento personalizado o listener global (ej. `convoka:daily-limit-updated`) para que cualquier componente que use el límite diario se entere inmediatamente cuando cambie.
- [x] 1.3 Perfeccionar `src/components/common/DailyLimitModal.jsx`:
  - Agregar `role="dialog"`, `aria-modal="true"`, `aria-labelledby="daily-limit-title"`.
  - Input numérico con `min="1"`, `max="16"`, `step="0.5"`.
  - Mensaje de validación exacto: `"El límite debe estar entre 1 y 16 horas"` cuando el valor sea `< 1` o `> 16`.
  - Si ocurre error de red o backend, mostrar mensaje descriptivo manteniendo el valor ingresado en `inputValue` para permitir reintento sin borrarlo.
  - Al guardar con éxito: invocar `onClose()` y disparar toast de éxito `"Límite actualizado"`.

---

### Task 2: Servicio de Cálculo de Carga y Detección de Conflictos (`workloadService.js`)

**Objetivo:** Crear un módulo centralizado que calcule la carga horaria por día, identifique conflictos de sobrecarga (US-07) y sugiera días alternativos con disponibilidad (US-08).

**Archivos involucrados:**
- Crear: `src/services/workloadService.js`

**Pasos de ejecución:**
- [x] 2.1 Definir función `computeDayWorkload(gestiones, targetDateISO, excludeGestionId = null)`:
  - Filtrar gestiones que coincidan en fecha (`target_date === targetDateISO`), con `status !== 'EJECUTADA'` y cuyo `id !== excludeGestionId`.
  - Sumar sus `estimated_hours` acumuladas.
- [x] 2.2 Definir función `evaluateConflict({ gestiones, targetDateISO, taskHours, dailyLimitHours, excludeGestionId })`:
  - Obtener `currentHours = computeDayWorkload(gestiones, targetDateISO, excludeGestionId)`.
  - Calcular `totalHours = currentHours + Number(taskHours)`.
  - Determinar `hasConflict = totalHours > dailyLimitHours`.
  - Calcular `excessHours = hasConflict ? (totalHours - dailyLimitHours) : 0`.
  - Retornar objeto: `{ hasConflict, currentHours, totalHours, limitHours: dailyLimitHours, excessHours }`.
- [x] 2.3 Definir función `findSuggestedAvailableDays({ gestiones, taskHours, fromDateISO, dailyLimitHours, eventDateISO = null, maxDaysToScan = 14, limitResults = 3 })`:
  - Iterar desde el día siguiente a `fromDateISO` (o desde hoy si está vencida) hasta `maxDaysToScan` días adelante, sin sobrepasar `eventDateISO` si existe.
  - Para cada día: calcular `currentHours = computeDayWorkload(...)`.
  - Si `currentHours + taskHours <= dailyLimitHours`:
    - Agregar a la lista de días sugeridos con: `dateISO`, `freeHours` (`dailyLimitHours - currentHours`), `remainingHoursAfter` (`dailyLimitHours - (currentHours + taskHours)`), `label` ("Vie 10 oct"), `description` (ej. "Tu día con menor saturación").
  - Retornar los mejores `limitResults` días ordenados por cercanía o menor carga.
- [x] 2.4 Definir función `findNextAvailableDay(...)`:
  - Devuelve el primer día con espacio suficiente para la acción de "Posponer" rápida.

---

### Task 3: Modal de Conflicto por Sobrecarga (US-07 - Estado 5)

**Objetivo:** Construir el componente de alerta accesible para lectores de pantalla (`role="alertdialog"`) que se despliega cuando la nueva fecha excede el límite diario (conforme a la imagen de referencia `Estado 5`).

**Archivos involucrados:**
- Crear: `src/components/reschedule/ConflictOverloadModal.jsx`

**Pasos de ejecución:**
- [x] 3.1 Estructurar diálogo accesible:
  - `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby="conflict-title"`, `aria-describedby="conflict-desc"`.
  - Ancho `max-w-[560px]`, fondo `bg-paper-card`, bordes y sombras de Convoka.
  - Gestión de foco: foco inicial en la primera opción de resolución o botón cerrar; trampa de foco y cierre con `Escape`.
- [x] 3.2 Construir encabezado y tarjeta de capacidad:
  - Badge de encabezado: ícono de advertencia + `"CAPACIDAD DIARIA EXCEDIDA"`.
  - Título dinámico: `"Quedarías con {totalHours}h de gestión planificadas (límite {limitHours}h)"`.
  - Subtítulo: `"El {nombreDía} ya tiene {currentHours}h planificadas y esta gestión suma {taskHours}h."`.
  - Tarjeta de barra visual:
    - Etiqueta del día y badge de exceso `"Total: {totalHours}h (+{excessHours}h de exceso)"`.
    - Barra horizontal segmentada: tramo gris (`currentHours`), tramo terracota/naranja (`taskHours`) superando la línea de límite.
    - Leyenda inferior: puntos indicadores de horas en agenda y horas en exceso.
- [x] 3.3 Construir opciones accionables de resolución:
  - Opción 1: `"Mover a otro día"` — Subtítulo `"Elige una fecha concreta"` — Flecha `"Elegir fecha →"`.
  - Opción 2: `"Reducir horas estimadas"` — Subtítulo `"Ajusta cuánto tiempo tomará esta gestión"` — Flecha `"Ajustar →"`.
  - Opción 3: `"Posponer"` — Subtítulo `"La enviamos al próximo día con espacio"` — Detalle con el día sugerido detectado (ej. `"Viernes 10 →"`).
- [x] 3.4 Construir botones del pie:
  - Botón `"Cancelar"`.
  - Botón `"Mantener de todos modos"` (permite guardar y asumir la sobrecarga si el usuario así lo decide).

---

### Task 4: Flujo de Resolución — Mover a otro día y Días Sugeridos (US-08 - Estados 1, 2, 3 y 4)

**Objetivo:** Implementar la interfaz para seleccionar entre días recomendados con disponibilidad o fecha manual, con tolerancia a fallos de red y confirmación de balance óptimo.

**Archivos involucrados:**
- Crear: `src/components/reschedule/SuggestedDaysSelector.jsx`
- Crear: `src/components/reschedule/RescheduleSuccessModal.jsx`
- Crear: `src/components/reschedule/ApiErrorRetryView.jsx`

**Pasos de ejecución:**
- [x] 4.1 Crear `SuggestedDaysSelector.jsx` (adaptado a Imágenes 1 y 2):
  - Encabezado: `"RESOLUCIÓN DE CARGA"` | `"Gestión: {taskHours}h requeridas"`.
  - Título: `"Elige otro día"`.
  - **Estado 1 (con días disponibles):**
    - Lista de radio-cards con días sugeridos (`Vie 10 oct`, `Lun 13 oct`, etc.).
    - Badge en cada tarjeta: `"● {freeHours}h libres / Quedarían {remainingHours}h libres"`.
    - Desplegable / botón `"Elegir otra fecha"` para desplegar datepicker alternativo.
  - **Estado 2 (sin días disponibles en ventana de 7 días):**
    - Banner informativo: `"No encontramos días con espacio. Elige una fecha. Tu agenda para los próximos 7 días ya ha alcanzado el límite diario de {limitHours} horas..."`.
    - Campo de selección manual con `input type="date"` accesible, validado contra la fecha del evento.
    - Mensaje auxiliar: `"Día seleccionado: {fechaCompleta}"` y nota informativa sobre comprobación automática.
- [x] 4.2 Crear `ApiErrorRetryView.jsx` (adaptado a Imagen 3 y 7):
  - Encabezado: línea de acento `crimson-urgent` + `"FALLO DE COMUNICACIÓN"`.
  - Título: `"No se pudo aplicar el cambio"`.
  - Bloque de retención de datos:
    - `"TU SELECCIÓN GUARDADA:"` con badge `"✓ Fecha retenida"`.
    - Muestra la fecha u horas seleccionadas listas para reintento.
  - Texto explicativo: `"No tienes que volver a seleccionar el día ni reconfigurar la gestión. Al pulsar reintentar enviaremos la solicitud de nuevo."`.
  - Botones: `"Volver"` y `"Reintentar"` (con ícono giratorio en carga).
- [x] 4.3 Crear `RescheduleSuccessModal.jsx` (adaptado a Imagen 4):
  - Ícono circular con checkmark verde.
  - Encabezado: `"ACTUALIZACIÓN EXITOSA"`.
  - Título: `"Conflicto resuelto"`.
  - Comparativa en 2 columnas:
    - Columna izquierda: `{Día anterior} (ANTERIOR): {horas}h programadas | ✓ Dentro del límite`.
    - Columna derecha: `{Nuevo día} (NUEVA FECHA): {nuevasHoras}h en total | ✓ {libres}h libres restantes`.
  - Botón: `"Entendido, ir a la agenda de hoy"` (o cerrar y refrescar).

---

### Task 5: Flujo de Resolución — Reducir Horas Estimadas (US-08 - Estados 1, 2, 3 y 4 de Horas)

**Objetivo:** Implementar el modal de reducción de horas con stepper interactivo, validación mínima de 0.5h y recálculo visual en vivo del conflicto (conforme a las imágenes de referencia 6 y 7).

**Archivos involucrados:**
- Crear: `src/components/reschedule/ReduceHoursModal.jsx`

**Pasos de ejecución:**
- [x] 5.1 Crear estructura y stepper de horas:
  - Título: `"Reduce las horas de esta gestión"`.
  - Subtítulo: `"{nombreGestion} · Estimación actual: {originalHours}h"`.
  - Stepper con botones accesibles: `[-]` y `[+]`, paso `0.5h`, valor visible formateado (ej. `1,5 h`).
- [x] 5.2 Implementar recálculo dinámico en vivo:
  - Al cambiar horas, evaluar inmediatamente: `nuevoTotal = horasPreviasDelDia + horasSeleccionadas`.
  - **Estado 1 (Sigue excediendo el límite):**
    - Alerta cálida: `"Aún quedarías con {nuevoTotal}h (límite {limitHours}h)"`.
    - Badge de exceso `"+{exceso} H EXCESO"`.
    - Botón primario: `"Confirmar con aviso →"`.
  - **Estado 2 (Conflicto resuelto · Carga óptima):**
    - Badge `"AJUSTE RECOMENDADO"` y `"✓ Valor óptimo detectado"`.
    - Banner verde: `"✓ Conflicto resuelto | 0,0 H EXCESO"`.
    - Barra de progreso verde al 100% de la capacidad.
    - Botón primario: `"Confirmar cambio →"`.
  - **Estado 3 (Error de valor 0h o < 0.5h):**
    - Borde rojo en el stepper, mensaje `"Ingresa al menos 0,5 horas"`.
    - Banner informativo de cálculo de carga pausado.
    - Botón confirmar deshabilitado.
- [x] 5.3 Conectar persistencia y reintento:
  - Llamar a `PATCH /subtasks/:id` con `{ estimated_hours: nuevoValor }`.
  - Si falla la API: mostrar vista de error reteniendo el valor editado para reintento directo (Estado 4).

---

### Task 6: Integración del Coordinador del Flujo de Reprogramación (`RescheduleModal.jsx`)

**Objetivo:** Unificar los modales y pasos en un único coordinador de flujo (`RescheduleModal.jsx`) que gestione la máquina de estados del diálogo y se conecte limpiamente a `/hoy` y `/evento/:id`.

**Archivos involucrados:**
- Modificar: `src/components/common/RescheduleModal.jsx`

**Pasos de ejecución:**
- [x] 6.1 Definir los estados del flujo en `RescheduleModal.jsx`:
  - `INITIAL_PICKER`: Datepicker estándar (US-06) o selector de días sugeridos.
  - `CONFLICT_ALERT`: Detección de sobrecarga (US-07, modal de advertencia).
  - `SUGGESTED_DAYS`: Resolver moviendo a otro día (US-08).
  - `REDUCE_HOURS`: Resolver reduciendo horas estimadas (US-08).
  - `API_ERROR`: Fallo de conexión con retención de datos y reintento.
  - `SUCCESS`: Modal de éxito y resumen antes de cerrar.
- [x] 6.2 Integrar validación de conflicto antes de guardar (US-07):
  - Al seleccionar una nueva fecha en `INITIAL_PICKER`:
    - Consultar `evaluateConflict(...)`.
    - Si no hay conflicto: proceder a guardar inmediatamente mediante `PATCH /subtasks/:id`.
    - Si hay conflicto: cambiar estado a `CONFLICT_ALERT`.
- [x] 6.3 Mantener soporte para el modo `bulk` existente ("Reprogramar todas las vencidas" en `/hoy`).

---

### Task 7: Conexión y Refresco en `/hoy` y `/evento/:id` (US-06 / US-08)

**Objetivo:** Conectar el flujo completo de reprogramación a las vistas de la aplicación, garantizando que tras guardar se actualicen los datos, la gestión se reubique en su grupo correspondiente, y se emitan los toasts o modales de confirmación adecuados.

**Archivos involucrados:**
- Modificar: `src/pages/HoyPage.jsx`
- Modificar: `src/pages/EventoDetallePage.jsx`
- Modificar: `src/hooks/useTodayGestiones.js`
- Modificar: `src/hooks/useEventSubtasks.js`

**Pasos de ejecución:**
- [x] 7.1 En `HoyPage.jsx`:
  - Proveer al `RescheduleModal` todas las gestiones activas y la fecha del evento para el cálculo de sobrecarga.
  - Tras reprogramar o resolver conflicto: invocar `reload()` o refresco optimista de `useTodayGestiones`.
  - Verificar que la gestión se mueve al grupo correcto (`vencidas`, `hoy`, o `proximas`).
  - Mostrar toast o modal de éxito con el mensaje `"Fecha actualizada"` o `"Conflicto resuelto"`.
- [x] 7.2 En `EventoDetallePage.jsx`:
  - Pasar la fecha del evento (`event.event_datetime`) y la lista de gestiones al modal de reprogramación.
  - Tras confirmar la reprogramación o el ajuste de horas, refrescar `useEventSubtasks(id)`.
  - Asegurar que la lista de subtareas refleje inmediatamente la nueva fecha y hora estimada.

---

### Task 8: Verificación Manual y Pruebas de Criterios de Aceptación (Gherkin)

**Objetivo:** Verificar rigurosamente cada uno de los escenarios descritos en las HUs (US-06, US-07, US-08, US-12).

**Pasos de ejecución:**
- [x] 8.1 Probar **US-12**:
  - Escenario 1: Abrir modal de configuración desde el ícono del header. Verificar que muestre el límite actual (6h por defecto).
  - Escenario 2: Cambiar a 4h y guardar. Verificar que persista y que el nuevo valor sea utilizado en la detección de conflictos.
  - Escenario 3: Intentar ingresar 0 o 17. Verificar que no guarde y muestre `"El límite debe estar entre 1 y 16 horas"` sin borrar el input.
- [x] 8.2 Probar **US-06**:
  - Reprogramar una gestión a una fecha válida sin sobrecarga. Verificar que se guarde y se actualice su ubicación en `/hoy`.
  - Intentar asignar una fecha posterior al evento. Verificar mensaje de error.
- [x] 8.3 Probar **US-07**:
  - Escenario 1: Con límite de 6h y un día con 5h planificadas, reprogramar una gestión de 2h para ese día. Verificar que salte el modal de sobrecarga anunciando `"Quedarías con 7h de gestión planificadas (límite 6h)"` con `role="alertdialog"`.
  - Escenario 2: Con límite de 6h y un día con 4h, reprogramar gestión de 2h. Verificar que guarde sin conflicto.
- [x] 8.4 Probar **US-08**:
  - Escenario 1: Resolver conflicto eligiendo uno de los días sugeridos con disponibilidad. Verificar que la gestión se mueva y el conflicto desaparezca.
  - Escenario 2: Resolver reduciendo horas con el stepper. Probar valor intermedio (1.5h - Estado 1 con aviso), valor óptimo (1.0h - Estado 2 resuelto) y valor inválido (0h - Estado 3 bloqueado).
  - Escenario 3: Simular error de red. Verificar que se muestre la pantalla de fallo conservando la fecha u horas elegidas y permitiendo reintentar con un clic.
- [x] 8.5 Ejecutar linter del frontend (`npm run lint` / `npm run build`) para certificar que no haya errores de compilación ni dependencias faltantes.
