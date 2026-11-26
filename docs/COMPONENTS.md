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
| `setDigitCount()` | `function` | Cambia la cantidad de dígitos |
| `setIsManualRevealEnabled()` | `function` | Activa/desactiva modo manual |
| `setIsCountdownEnabled()` | `function` | Activa/desactiva countdown |
| `setCountdownDuration()` | `function` | Cambia la duración del countdown |
| `setIsNoRepeatEnabled()` | `function` | Activa/desactiva no repetir |
| `setIsSoundEnabled()` | `function` | Activa/desactiva sonido |

También exporta constantes: límites (`MIN_DIGITS`, `MAX_DIGITS`, `MIN_COUNTDOWN`, `MAX_COUNTDOWN`), tiempos (`TRADITIONAL_SHUFFLE_MS`, `DIGIT_STEP_MS`, `GO_MESSAGE_MS`) y `GO_MESSAGE` (`'¡MATRACA!'`).

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

Componente raíz. Envuelve todo en `RaffleProvider`, maneja el estado `isSettingsOpen` del panel de configuración y muestra en el header `FullscreenButton` y el botón de configuración.

Define internamente `RaffleContent` (memoizado, no exportado), que:

- Calcula `isFinished = winner && revealedCount === digitCount`
- Llama `runWinnerCelebration()` en un `useEffect` cuando `isFinished` pasa a `true`
- Si el sonido está activo: `playFanfare()` al completarse el número y `playReveal()` en cada dígito intermedio del modo manual
- Decide qué acción ejecuta el botón según `isManualRevealEnabled` (`runDigitRaffleStep` o `runTraditionalRaffle`)
- Atajo de teclado: Espacio o Enter ejecutan esa acción. Se desactiva con la configuración abierta (prop `shortcutsEnabled`) y se ignora si el foco está en un input, botón o enlace
- Calcula el texto del botón: `Rifando...`, `Sin números disponibles`, `Rifar de Nuevo`, `Revelar Dígito`, `Revelar Siguiente` o `Iniciar Rifa`
- El botón se deshabilita durante la rifa, el countdown o si no quedan números
- Debajo del botón muestra cuántos números quedan (con no-repetir activo) y la pista del atajo (oculta en pantallas ≤ 640 px)
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

Las cajas se calculan con `useMemo`.

---

## RaffleHistory

`src/components/RaffleHistory.jsx`

Panel lateral con el registro de ganadores. Muestra el historial completo (no tiene límite de entradas).

### Comportamiento

- El ganador más reciente (`index === 0`) se destaca con la clase `latest` (fondo verde)
- Cada entrada muestra: número ganador, fecha y hora (`dd/mm/aaaa · HH:MM:SS`; solo hora en entradas antiguas) y nombre opcional
- Botón **⬇ CSV** en la cabecera: descarga `rifa-historial-AAAA-MM-DD.csv` (columnas Número, Nombre, Fecha, Hora; UTF-8 con BOM para Excel). Deshabilitado si no hay historial
- Botón **✕** en cada entrada (visible al pasar el ratón; siempre visible en pantallas táctiles): elimina esa entrada tras confirmar
- Al hacer clic en el nombre (o en "+ Agregar nombre") se abre un input inline
- `Enter` o perder el foco guarda el nombre; `Escape` cancela
- Muestra "Aún no hay resultados" si el historial está vacío

---

## SettingsPanel

`src/components/SettingsPanel.jsx`

Modal de configuración con overlay oscuro. Clic fuera del modal o en "Guardar" lo cierra (los cambios ya se aplican en vivo).

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
| Borrar historial | botón | Requiere confirmación (`window.confirm`) |

Los valores fuera de rango no se aplican. Los inputs y checkboxes se deshabilitan mientras `isRaffling === true`, salvo el de sonido y el botón de borrar historial.

---

## CountdownOverlay

`src/components/CountdownOverlay.jsx`

Overlay a pantalla completa que muestra la cuenta regresiva.

### Comportamiento

- Se renderiza solo cuando `currentCount !== null`
- Muestra `currentCount` con animación `countdown-pop` (se re-monta en cada número vía `key`)
- Al terminar la cuenta, `currentCount` vale `'¡MATRACA!'` durante 800 ms y se aplica la clase `countdown-ya` (verde, animación `countdown-ya-burst`)
- El fondo se intensifica progresivamente (`viewport-progressive-intensity`) durante `countdownDuration + 0.5` s
- Si el sonido está activo, suena `playTick()` en cada número y `playGo()` en `'¡MATRACA!'`

---

## FullscreenButton

`src/components/FullscreenButton.jsx`

Botón del header que activa o sale de pantalla completa (`requestFullscreen` / `exitFullscreen`) y se sincroniza con `fullscreenchange` (también si se sale con Esc). No se renderiza si el navegador no soporta la Fullscreen API (p. ej. Safari en iPhone). En pantallas ≤ 640 px solo muestra el icono.

---

## Layout

`src/components/Layout.jsx`

Contenedor simple (`.app-container > main`) que envuelve el contenido principal. No tiene lógica propia.

---

## Footer

`src/components/Footer.jsx`

Pie de página con el año actual calculado dinámicamente, copyright de Pacoreños en Medellín y Antioquia y enlace al desarrollador.

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

## sound

`src/utils/sound.js`

Sonidos sintetizados con la Web Audio API (sin archivos). El `AudioContext` se crea en el primer uso, que siempre ocurre tras un clic o tecla. Exporta `playTick`, `playGo`, `playReveal` y `playFanfare`; los errores se registran con `console.warn` y no interrumpen la rifa.

---

## confettiEffects

`src/utils/confettiEffects.js`

Exporta `runWinnerCelebration()` (y `prefersReducedMotion()`). Si el sistema pide reducir movimiento no hace nada; si no, lanza una celebración de 5 segundos (`CELEBRATION_DURATION`) con los colores de marca (`BRAND_COLORS`):

1. **Blast inicial** — 250 partículas desde el centro
2. **Cañones laterales** — 4 partículas por frame desde los bordes izquierdo y derecho
3. **Globos flotantes** — círculos grandes que suben (20 % de probabilidad por frame)
4. **Fuegos artificiales** — explosiones circulares en posiciones aleatorias (5 % de probabilidad por frame)

Los efectos continuos corren en un bucle `requestAnimationFrame` que se detiene solo al cumplirse los 5 segundos.
