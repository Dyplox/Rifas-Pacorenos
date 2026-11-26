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
| `runTraditionalRaffle()` | `function` | Rifa completa (todos los dígitos de golpe) |
| `runDigitRaffleStep()` | `function` | Un paso del modo manual (genera o revela el siguiente dígito) |
| `resetRaffle()` | `function` | Cancela el countdown y limpia ganador/revelación |
| `updateWinnerName(id, name)` | `function` | Edita el nombre de un ganador en el historial |
| `clearHistory()` | `function` | Borra todo el historial y resetea la rifa |
| `setDigitCount()` | `function` | Cambia la cantidad de dígitos |
| `setIsManualRevealEnabled()` | `function` | Activa/desactiva modo manual |
| `setIsCountdownEnabled()` | `function` | Activa/desactiva countdown |
| `setCountdownDuration()` | `function` | Cambia la duración del countdown |

### Entrada del historial

```js
{
  id: 1732630000000,       // Date.now()
  number: '042',
  winnerName: '',
  timestamp: '14:05:33'    // toLocaleTimeString('es-CL'), 24h
}
```

---

## App

`src/App.jsx`

Componente raíz. Envuelve todo en `RaffleProvider` y maneja el estado `isSettingsOpen` del panel de configuración.

Define internamente `RaffleContent` (memoizado, no exportado), que:

- Calcula `isFinished = winner && revealedCount === digitCount`
- Llama `runWinnerCelebration()` en un `useEffect` cuando `isFinished` pasa a `true`
- Decide qué acción ejecuta el botón según `isManualRevealEnabled` (`runDigitRaffleStep` o `runTraditionalRaffle`)
- Calcula el texto del botón: `Rifando...`, `Rifar de Nuevo`, `Revelar Dígito`, `Revelar Siguiente` o `Iniciar Rifa`
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
- Cada entrada muestra: número ganador, timestamp (HH:MM:SS) y nombre opcional
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
| Borrar historial | botón | Requiere confirmación (`window.confirm`) |

Los valores fuera de rango no se aplican. Los inputs y checkboxes se deshabilitan mientras `isRaffling === true`; el botón de borrar historial no.

---

## CountdownOverlay

`src/components/CountdownOverlay.jsx`

Overlay a pantalla completa que muestra la cuenta regresiva.

### Comportamiento

- Se renderiza solo cuando `currentCount !== null`
- Muestra `currentCount` con animación `countdown-pop` (se re-monta en cada número vía `key`)
- Al terminar la cuenta, `currentCount` vale `'¡MATRACA!'` durante 800 ms y se aplica la clase `countdown-ya` (verde, animación `countdown-ya-burst`)
- El fondo se intensifica progresivamente (`viewport-progressive-intensity`) durante `countdownDuration + 0.5` s

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
const [value, setValue] = useLocalStorage('clave', valorDefault, parser?);
```

- Si se pasa `parser`, se usa para leer el valor guardado
- Si no, detecta el tipo del `valorDefault`: boolean → `saved === 'true'`, number → `parseInt`, object/array → `JSON.parse`, otro → string
- Al escribir: objetos con `JSON.stringify`, el resto con `String()`
- Ante errores de lectura/escritura emite `console.warn` (y al leer usa el default)
- Actualiza `localStorage` en cada cambio del estado

---

## confettiEffects

`src/utils/confettiEffects.js`

Exporta `runWinnerCelebration()`, que lanza una celebración de 5 segundos (`CELEBRATION_DURATION`) con los colores de marca (`BRAND_COLORS`):

1. **Blast inicial** — 250 partículas desde el centro
2. **Cañones laterales** — 4 partículas por frame desde los bordes izquierdo y derecho
3. **Globos flotantes** — círculos grandes que suben (20 % de probabilidad por frame)
4. **Fuegos artificiales** — explosiones circulares en posiciones aleatorias (5 % de probabilidad por frame)

Los efectos continuos corren en un bucle `requestAnimationFrame` que se detiene solo al cumplirse los 5 segundos.
