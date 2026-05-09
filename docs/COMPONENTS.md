# Componentes — Gran Rifa

Referencia de todos los componentes React del proyecto.

---

## RaffleContext

`src/context/RaffleContext.jsx`

Proveedor de estado global. Exporta el hook `useRaffle()` para consumir el contexto.

### Valores expuestos

| Valor | Tipo | Descripción |
|-------|------|-------------|
| `winner` | `string \| null` | Número ganador actual |
| `isRaffling` | `boolean` | Animación de barajado en curso |
| `revealedCount` | `number` | Dígitos revelados (modo manual) |
| `isCountingDown` | `boolean` | Overlay de countdown activo |
| `currentCount` | `number` | Número del countdown |
| `history` | `array` | Historial de ganadores |
| `digitCount` | `number` | Cantidad de dígitos configurada |
| `isManualRevealEnabled` | `boolean` | Modo manual activo |
| `isCountdownEnabled` | `boolean` | Countdown activo |
| `countdownDuration` | `number` | Duración del countdown en segundos |
| `handleRaffle()` | `function` | Dispara la rifa según el modo activo |
| `updateHistory()` | `function` | Edita el nombre de un ganador en el historial |
| `clearHistory()` | `function` | Borra todo el historial |
| `setDigitCount()` | `function` | Cambia la cantidad de dígitos |
| `setIsManualRevealEnabled()` | `function` | Activa/desactiva modo manual |
| `setIsCountdownEnabled()` | `function` | Activa/desactiva countdown |
| `setCountdownDuration()` | `function` | Cambia la duración del countdown |

---

## App

`src/App.jsx`

Componente raíz. Orquesta el layout y dispara la celebración cuando aparece un ganador.

- Escucha cambios en `winner` con `useEffect` para llamar `triggerSuperCelebration()`
- Maneja el estado `isSettingsOpen` del panel de configuración
- Exporta `RaffleContent` como sub-componente memoizado para aislar los re-renders del botón de settings

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
| `isRaffling === true` | Números aleatorios rotando cada ~80ms |
| Modo manual, dígito no revelado | `*` |
| Dígito revelado | Número real con animación `slideIn` |
| Ganador completo | Glow dorado + animación `float` |

Cada caja de dígito está optimizada con `useMemo` para no recalcular si el estado no cambió.

---

## RaffleHistory

`src/components/RaffleHistory.jsx`

Panel lateral con el registro de los últimos 20 ganadores.

### Comportamiento

- El ganador más reciente se destaca con fondo verde
- Cada entrada muestra: número ganador, timestamp (HH:MM:SS) y nombre opcional
- Al hacer clic en "Agregar nombre" se abre un input inline
- `Enter` guarda el nombre, `Escape` cancela
- El historial es scrollable con scrollbar personalizado

---

## SettingsPanel

`src/components/SettingsPanel.jsx`

Modal de configuración con overlay oscuro.

### Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `isOpen` | `boolean` | Controla visibilidad del modal |
| `onClose` | `function` | Callback para cerrar el modal |

### Opciones configurables

| Opción | Tipo | Rango |
|--------|------|-------|
| Cantidad de dígitos | número | 1 – 5 |
| Modo de revelación | toggle | Tradicional / Manual |
| Cuenta regresiva | toggle | Activado / Desactivado |
| Duración del countdown | número | 3 – 10 segundos |
| Limpiar historial | botón | Requiere confirmación |

Todos los controles se deshabilitan mientras hay una rifa en curso (`isRaffling === true`).

---

## CountdownOverlay

`src/components/CountdownOverlay.jsx`

Overlay a pantalla completa que muestra la cuenta regresiva.

### Comportamiento

- Se renderiza solo cuando `isCountingDown === true`
- Muestra `currentCount` con animación `countdown-pop`
- Cuando `currentCount === 0` muestra `¡MATRACA!` en verde con animación explosiva
- El fondo se vuelve progresivamente más intenso a medida que baja el countdown

---

## Layout

`src/components/Layout.jsx`

Contenedor simple que envuelve el contenido principal. No tiene lógica propia.

---

## Footer

`src/components/Footer.jsx`

Pie de página con el año actual calculado dinámicamente, copyright de Pacoreños y enlace al desarrollador.

---

## useLocalStorage

`src/hooks/useLocalStorage.js`

Hook personalizado que sincroniza un estado de React con `localStorage`.

```js
const [value, setValue] = useLocalStorage('clave', valorDefault);
```

- Detecta el tipo del `valorDefault` para serializar correctamente
- Ante errores de lectura/escritura emite `console.warn` y usa el default
- Actualiza `localStorage` en cada cambio del estado

---

## confettiEffects

`src/utils/confettiEffects.js`

Función `triggerSuperCelebration()` que lanza cuatro efectos simultáneos durante 5 segundos:

1. **Blast inicial** — 250 partículas desde el centro
2. **Cañones laterales** — streams continuos desde los bordes izquierdo y derecho
3. **Globos flotantes** — círculos grandes con física de gravedad negativa
4. **Fuegos artificiales** — explosiones circulares en posiciones aleatorias del viewport

Usa `requestAnimationFrame` para sincronizar los efectos continuos y limpia todos los `setTimeout`/`requestAnimationFrame` al terminar.
