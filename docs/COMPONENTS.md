# Componentes — Gran Rifa

Referencia de todos los componentes React del proyecto.

---

## RaffleContext

`src/context/RaffleContext.jsx`

Proveedor de estado global (`RaffleProvider`). Exporta el hook `useRaffle()` para consumir el contexto; lanza un error si se usa fuera del proveedor.

### Valores expuestos

| Valor | Tipo | Descripción |
|-------|------|-------------|
| `winner` | `string \| null` | Número ganador actual (con ceros a la izquierda) |
| `isRaffling` | `boolean` | Animación de barajado en curso |
| `revealedCount` | `number` | Dígitos revelados (en modo tradicional pasa directo a `digitCount`) |
| `currentCount` | `number \| '¡MATRACA!' \| null` | Valor del countdown; `null` cuando no hay countdown activo |
| `history` | `array` | Historial de ganadores (más reciente primero) |
| `digitCount` | `number` | Cantidad de dígitos configurada |
| `isManualRevealEnabled` | `boolean` | Modo manual activo |
| `isCountdownEnabled` | `boolean` | Countdown activo |
| `countdownDuration` | `number` | Duración del countdown en segundos |
| `isNoRepeatEnabled` | `boolean` | Excluir números ya sorteados |
| `isSoundEnabled` | `boolean` | Sonidos activos |
| `availableCount` | `number` | Números que aún pueden salir (con no-repetir activo) |
| `totalNumbers` | `number` | `10 ** digitCount` |
| `runTraditionalRaffle()` | `function` | Rifa completa (todos los dígitos de golpe) |
| `runDigitRaffleStep()` | `function` | Un paso del modo manual (genera o revela el siguiente dígito) |
| `resetRaffle()` | `function` | Cancela el countdown y limpia ganador/revelación |
| `updateWinnerName(id, name)` | `function` | Edita el nombre de un ganador en el historial |
| `clearHistory()` | `function` | Borra todo el historial y resetea la rifa |
| `deleteHistoryEntry(id)` | `function` | Borra una entrada (su número vuelve a estar disponible) |
| `restoreHistoryEntry(entry, index)` | `function` | Vuelve a poner una entrada borrada en su posición (deshacer) |
| `setDigitCount()` | `function` | Cambia la cantidad de dígitos |
| `setIsManualRevealEnabled()` | `function` | Activa/desactiva modo manual |
| `setIsCountdownEnabled()` | `function` | Activa/desactiva countdown |
| `setCountdownDuration()` | `function` | Cambia la duración del countdown |
| `setIsNoRepeatEnabled()` | `function` | Activa/desactiva no repetir |
| `setIsSoundEnabled()` | `function` | Activa/desactiva sonido |

También exporta constantes: límites (`MIN_DIGITS`, `MAX_DIGITS`, `MIN_COUNTDOWN`, `MAX_COUNTDOWN`), tiempos (`TRADITIONAL_SHUFFLE_MS`, `DIGIT_STEP_MS`, `POST_COUNTDOWN_SHUFFLE_MS`, `GO_MESSAGE_MS`, `SUSPENSE_MS`) y `GO_MESSAGE` (`'¡MATRACA!'`).

### Entrada del historial

```js
{
  id: '3f2b…',                         // crypto.randomUUID()
  number: '042',
  winnerName: '',
  createdAt: '2026-11-26T19:05:33.000Z', // ISO
  timestamp: '14:05:33'                // toLocaleTimeString('es-CL'), 24h
}
```

Las entradas creadas antes de esta versión pueden tener `id` numérico (`Date.now()`) y no tener `createdAt`; se siguen mostrando (sin fecha).

---

## App

`src/App.jsx`

Componente raíz. Envuelve todo en `RaffleProvider`, maneja el estado `isSettingsOpen` del panel de configuración y muestra en el header el aviso "Sin conexión" (`OfflineBadge`, con `useOnlineStatus`), `FullscreenButton` y el botón de configuración (solo icono en pantallas ≤ 640 px).

Define internamente `RaffleContent` (memoizado, no exportado), que:

- Calcula `isFinished = winner && revealedCount === digitCount`
- Llama `runWinnerCelebration()` en un `useEffect` cuando `isFinished` pasa a `true`
- Si el sonido está activo: `playWinnerSound()` al completarse el número (golpe final grabado + aplausos) y `playReveal()` en cada dígito intermedio del modo manual; detiene el redoble si la rifa se cancela o se apaga el sonido
- Decide qué acción ejecuta el botón según `isManualRevealEnabled` (`runDigitRaffleStep` o `runTraditionalRaffle`)
- Atajo de teclado: Espacio o Enter ejecutan esa acción. Se desactiva con la configuración abierta (prop `shortcutsEnabled`) y se ignora si el foco está en un input, botón o enlace
- Calcula el texto del botón: `Rifando...`, `Sin números disponibles`, `Rifar de Nuevo`, `Revelar Dígito`, `Revelar Siguiente` o `Iniciar Rifa`
- El botón se deshabilita durante la rifa, el countdown o si no quedan números
- Debajo del botón muestra cuántos números quedan (con no-repetir activo) y la pista del atajo (oculta en pantallas ≤ 640 px)
- La tarjeta del resultado es una región `aria-live="polite"`: los lectores de pantalla anuncian al ganador. Antes del sorteo muestra un marcador punteado ("Aquí aparecerá el ganador", `aria-hidden`) del mismo tamaño que el anuncio, para que el diseño no salte
- El atajo y los sonidos usan `useLatestCallback` para leer siempre el estado actual
- Muestra la tarjeta "¡Tenemos un Ganador!" / "Próximo Ganador"

---

## RaffleDisplay

`src/components/RaffleDisplay.jsx`

Muestra las cajas de dígitos del número sorteado.

### Props

Ninguna — consume `useRaffle()` directamente.

### Comportamiento

| Estado | Visual |
|--------|--------|
| Sin rifa iniciada | Dígitos enmascarados (`*`) |
| `isRaffling === true` | Números aleatorios rotando cada 60 ms (los dígitos ya revelados se mantienen) |
| Modo manual, dígito no revelado | `*` |
| Dígito revelado | Número real |
| Ganador completo | Clase `winner` en el contenedor: borde dorado + animación `float` |

Las cajas se calculan con `useMemo`. El contenedor recibe `--digits` (usado por el CSS para dimensionar las cajas) y `role="img"` con un `aria-label` que describe el estado ("Número oculto de 3 dígitos", "Dígitos revelados: 4. Faltan 2", "Número ganador: 4 2 7"); las cajas individuales son `aria-hidden`. El `*` de los dígitos ocultos va en `.digit-mask` para centrarlo ópticamente.

---

## RaffleHistory

`src/components/RaffleHistory.jsx`

Panel lateral con el registro de ganadores. Muestra el historial completo (no tiene límite de entradas).

### Comportamiento

- El ganador más reciente (`index === 0`) se destaca con la clase `latest` (fondo verde)
- Cada entrada muestra: número ganador, fecha y hora (`dd/mm/aaaa · HH:MM:SS`; solo hora en entradas antiguas) y nombre opcional
- Botón **⬇ CSV** en la cabecera: descarga `rifa-historial-AAAA-MM-DD.csv` (columnas Número, Nombre, Fecha, Hora; UTF-8 con BOM para Excel). Deshabilitado si no hay historial
- Lista ordenada (`<ol>`) con un contador de entradas junto al título
- Botón **✕** en cada entrada (44×44 px; con ratón aparece al pasar por encima, en pantallas táctiles siempre visible): elimina la entrada al instante y muestra `UndoToast` con "Deshacer" durante 6 s
- El nombre es un botón (accesible con teclado); al pulsarlo se abre un input inline
- `Enter` o perder el foco guarda el nombre; `Escape` cancela
- Muestra "Aún no hay resultados" si el historial está vacío

---

## SettingsPanel

`src/components/SettingsPanel.jsx`

Usa `Modal` (diálogo accesible). Esc, clic fuera o "Guardar" lo cierran (los cambios ya se aplican en vivo). En pantallas ≤ 640 px se muestra como hoja inferior.

### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `isOpen` | `boolean` | Controla visibilidad del modal |
| `onClose` | `function` | Callback para cerrar el modal |

### Opciones configurables

| Opción | Tipo | Rango |
|--------|------|-------|
| Cantidad de dígitos | número | 1 – 5 (cambiarlo resetea la rifa actual) |
| Activar conteo regresivo | checkbox | Activado / Desactivado |
| Segundos del countdown | número | 3 – 10 (solo visible si el countdown está activo) |
| Revelación por dígito (manual) | checkbox | Activado / Desactivado |
| No repetir números ya sorteados | checkbox | Activado (default) / Desactivado |
| Activar sonido | checkbox | Activado / Desactivado (default) |
| Borrar historial | botón | Abre `ConfirmDialog` ("Borrar todo" / "Cancelar"); deshabilitado si el historial está vacío |
| Borrar caché y datos | botón | Abre `ConfirmDialog` ("Borrar y recargar"); llama a `clearAppData()`. Deshabilitado durante una rifa |

Los valores fuera de rango no se aplican. Los inputs y checkboxes se deshabilitan mientras `isRaffling === true`, salvo el de sonido.

---

## CountdownOverlay

`src/components/CountdownOverlay.jsx`

Overlay a pantalla completa que muestra la cuenta regresiva.

### Comportamiento

- Se renderiza solo cuando `currentCount !== null`
- Muestra `currentCount` con animación `countdown-pop` (se re-monta en cada número vía `key`)
- **Suspenso creciente:** `countdownTension()` (`src/utils/countdown.js`) va de 0 en el primer número a 1 en el último y se pasa como `--tension`. Con ella el número crece (`scale`), pasa de dorado a rojo (`color-mix`) y el pulso se acelera (de 1 s a 0,45 s)
- Últimos 3 números (`.is-final`): un anillo de latido se expande en cada pulso. Último número (`.is-last`): la escena tiembla
- **Pausa dramática** (`currentCount === 'suspense'`, 1,2 s): la pantalla queda casi a oscuras y una luz se "carga" (`.countdown-charge`); los lectores de pantalla oyen "Atentos…"
- Luego `currentCount` vale `'¡MATRACA!'` durante 800 ms con la clase `countdown-ya` (verde, animación `countdown-ya-burst`)
- El fondo se intensifica progresivamente (`viewport-progressive-intensity`) durante toda la secuencia
- Si el sonido está activo: `playHeartbeat(tension)` en cada número (latido más agudo y fuerte al final), `startDrumRoll()` al empezar la pausa (el redoble sigue hasta que se revela el número) ; `'¡MATRACA!'` no tiene sonido propio (el redoble sigue)

---

## FullscreenButton

`src/components/FullscreenButton.jsx`

Botón del header que activa o sale de pantalla completa (`requestFullscreen` / `exitFullscreen`) y se sincroniza con `fullscreenchange` (también si se sale con Esc). No se renderiza si el navegador no soporta la Fullscreen API (p. ej. Safari en iPhone). En pantallas ≤ 640 px solo muestra el icono.

---

## Modal

`src/components/Modal.jsx`

Diálogo reutilizable: `role="dialog"`, `aria-modal`, etiquetado por su título. Al abrir mueve el foco dentro (al primer control o a `initialFocusRef`), atrapa Tab/Shift+Tab, se cierra con Esc o clic en el fondo y devuelve el foco al elemento que lo abrió.

Props: `isOpen`, `onClose`, `title`, `className`, `initialFocusRef`.

---

## ConfirmDialog

`src/components/ConfirmDialog.jsx`

Reemplazo con estilo propio de `window.confirm()` sobre `Modal`. El foco empieza en "Cancelar" para que Enter nunca confirme una acción destructiva por accidente.

Props: `isOpen`, `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel`.

---

## UndoToast

`src/components/UndoToast.jsx`

Aviso fijo abajo (`role="status"`) con botones "Deshacer" y cerrar. Se descarta solo tras `UNDO_TIMEOUT_MS` (6 s); se vuelve a montar con `key` para reiniciar el tiempo.

---

## SoundCredits

`src/components/SoundCredits.jsx`

Botón "Créditos de sonido" del pie de página. Abre un `Modal` con el título, enlace a la fuente, licencia y cambios hechos a cada grabación (`SOUND_CREDITS` en `src/utils/soundCredits.js`).

---

## Layout

`src/components/Layout.jsx`

Contenedor simple (`.app-container > main`) que envuelve el contenido principal. No tiene lógica propia.

---

## Footer

`src/components/Footer.jsx`

Pie de página con el año actual calculado dinámicamente, copyright de Pacoreños en Medellín y Antioquia y enlace al desarrollador.

---

## useLatestCallback / useOnlineStatus

`src/hooks/useLatestCallback.js` — devuelve una función estable que siempre llama a la última versión del callback (ref actualizada en `useLayoutEffect`). Se usa para listeners registrados en efectos; reemplaza a `useEffectEvent`, que en esta app dejaba listeners con estado antiguo.

`src/hooks/useOnlineStatus.js` — `navigator.onLine` con `useSyncExternalStore` y los eventos `online`/`offline`.

---

## useLocalStorage

`src/hooks/useLocalStorage.js`

Hook personalizado que sincroniza un estado de React con `localStorage`.

```js
const [value, setValue] = useLocalStorage('clave', valorDefault, { validate });
```

- Detecta el tipo del `valorDefault`: boolean → solo `'true'`/`'false'`, number → `Number` (debe ser finito), object/array → `JSON.parse` con la misma forma (array vs objeto), otro → string
- Opcional `{ validate }`: si devuelve `false`, se usa el default (p. ej. rangos de dígitos y segundos)
- Un valor corrupto o inválido no rompe la app: se usa el default y se sobrescribe
- Al escribir: objetos con `JSON.stringify`, el resto con `String()`
- Ante errores de lectura/escritura emite `console.warn`
- Actualiza `localStorage` en cada cambio del estado

---

## random

`src/utils/random.js`

- `randomInt(max)` — entero uniforme en `[0, max)` con `crypto.getRandomValues()` y muestreo por rechazo (sin sesgo de módulo)
- `pickWinner(digitCount, excluded?)` — número con ceros a la izquierda que no esté en el `Set` `excluded`; `null` si no queda ninguno
- `generateId()` — `crypto.randomUUID()` con respaldo basado en `getRandomValues()`

---

## historyExport

`src/utils/historyExport.js`

- `formatEntryDate(entry)` — fecha `dd/mm/aaaa` a partir de `createdAt` (`''` si no existe)
- `historyToCsv(history)` — CSV con BOM, todos los campos entre comillas; los nombres que empiezan con `=`, `+`, `-` o `@` se prefijan con `'` para evitar fórmulas en Excel
- `downloadHistoryCsv(history)` — descarga el CSV

---

## resetApp

`src/utils/resetApp.js`

`clearAppData({ reload })` borra `localStorage` y `sessionStorage` y, solo si hay conexión, desregistra el service worker y vacía la Cache Storage (sin conexión se conserva la copia offline para que la app siga abriendo). Después recarga la página. Devuelve qué se borró (usado por los tests).

---

## sound

`src/utils/sound.js`

Mezcla grabaciones reales (reproducidas con **howler.js**) y tonos sintetizados con la Web Audio API.

| Momento | Función | Sonido |
|---|---|---|
| Cada número del conteo | `playHeartbeat(tension)` | Latido "lub-dub" sintetizado; más agudo, fuerte y rápido al final |
| Pausa a oscuras | `startDrumRoll()` | `public/sounds/drum-roll.mp3` en bucle; **sigue sonando** hasta que aparece el número |
| "¡MATRACA!" | — | Sin sonido propio: el redoble sigue debajo |
| Número completo | `playWinnerSound()` | Corta el redoble y suena `drum-hit.mp3` (golpe final); 150 ms después, `applause.mp3` |
| Dígito intermedio (manual) | `playReveal()` | Corta el redoble con un "blip" sintetizado |

`preloadSounds()` crea los reproductores al activar el sonido para que el primer redoble no espere la descarga. `stopDrumRoll()` es seguro de llamar siempre; `App.jsx` lo llama si la rifa se cancela, si no queda nada en curso o si se apaga el sonido. Las fuentes se muestran en **Créditos de sonido** (`SoundCredits.jsx`, datos en `src/utils/soundCredits.js`).

---

## confettiEffects

`src/utils/confettiEffects.js`

Exporta `runWinnerCelebration()` (y `prefersReducedMotion()`). Si el sistema pide reducir movimiento no hace nada; si no, lanza una celebración de 5 segundos (`CELEBRATION_DURATION`) con los colores de marca (`BRAND_COLORS`):

1. **Blast inicial** — 250 partículas desde el centro
2. **Cañones laterales** — 4 partículas por frame desde los bordes izquierdo y derecho
3. **Globos flotantes** — círculos grandes que suben (20 % de probabilidad por frame)
4. **Fuegos artificiales** — explosiones circulares en posiciones aleatorias (5 % de probabilidad por frame)

Los efectos continuos corren en un bucle `requestAnimationFrame` que se detiene solo al cumplirse los 5 segundos.
