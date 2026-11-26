# Arquitectura — Gran Rifa

## Visión general

Gran Rifa es una SPA (Single Page Application) construida con React 19 y Vite. No usa servidor backend; todo el estado vive en el cliente y se persiste en `localStorage`.

```
┌─────────────────────────────────────────────────────┐
│                      App.jsx                         │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │ SettingsPanel│  │ RaffleHistory │ RaffleContent │ │
│  │   (modal)    │  │   (sidebar)   │ ┌───────────┐ │ │
│  └──────────────┘  │               │ │RaffleDisp.│ │ │
│                    │               │ │ (dígitos) │ │ │
│  ┌──────────────┐  │               │ └───────────┘ │ │
│  │  Countdown   │  └──────────────────────────────┘ │
│  │  Overlay     │            Footer                  │
│  └──────────────┘                                    │
└─────────────────────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │    RaffleContext      │
              │  (estado + lógica)    │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │   useLocalStorage     │
              │   (persistencia)      │
              └───────────────────────┘
```

## Gestión de estado

El estado global se maneja con **Context API** (`RaffleContext.jsx`). No se usa Redux ni Zustand dado que el dominio es acotado.

### Estado transitorio (no persistido)

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `winner` | `string \| null` | Número ganador actual con ceros a la izquierda |
| `isRaffling` | `boolean` | `true` durante la animación de barajado (800 ms tradicional, 500 ms por paso manual) |
| `revealedCount` | `number` | Dígitos revelados |
| `currentCount` | `number \| '¡MATRACA!' \| null` | Valor del countdown; distinto de `null` mientras el overlay está activo |

No existe un flag `isCountingDown`: `currentCount !== null` cumple esa función y bloquea iniciar otra rifa. "Ganador completo" tampoco se guarda: se deriva como `winner && revealedCount === digitCount`.

### Configuración persistida

| Clave localStorage | Tipo | Default |
|-------------------|------|---------|
| `raffle_digitCount` | `number` | `3` |
| `raffle_isManualRevealEnabled` | `boolean` | `false` |
| `raffle_isCountdownEnabled` | `boolean` | `true` |
| `raffle_countdownDuration` | `number` | `3` |
| `raffle_isNoRepeatEnabled` | `boolean` | `true` |
| `raffle_isSoundEnabled` | `boolean` | `false` |
| `raffle_history` | `array` | `[]` |

`raffle_digitCount` (1–5), `raffle_countdownDuration` (3–10) y `raffle_history` (array de entradas con `number` string) se validan al leerse; un valor inválido se reemplaza por el default.

## Generación del ganador

`generateWinner()` llama a `pickWinner()` (`src/utils/random.js`), que usa `crypto.getRandomValues()` con muestreo por rechazo para que todos los números sean igual de probables.

Con **no repetir** activo, se excluyen los números del historial que tienen la cantidad de dígitos actual (un `042` sorteado con 3 dígitos no excluye nada con 4). `availableCount` es `10 ** digitCount` menos los excluidos; cuando llega a 0 no se puede iniciar otra rifa. Borrar una entrada del historial devuelve su número al sorteo.

## Temporizadores

Todos los `setTimeout` de la rifa (barajado, pasos manuales, mensaje `'¡MATRACA!'`) se crean con `schedule()`, que guarda los IDs en un `ref`. `cancelPendingTimers()` limpia esos timeouts y el intervalo del countdown; se llama al iniciar otro countdown, en `resetRaffle()` (por ejemplo al cambiar los dígitos o borrar el historial) y al desmontar el proveedor. Así un reinicio en plena animación no deja aparecer un ganador "fantasma".

## Flujos principales

### Countdown (común a ambos modos)

```
runWithCountdown(callback)
  ├─ Si countdown desactivado → callback()
  └─ Si activo → currentCount = countdownDuration
       └─ setInterval(1s): currentCount--
            └─ al llegar a 0 → currentCount = '¡MATRACA!'
                 └─ setTimeout(800ms) → currentCount = null, callback()
```

### Rifa tradicional

```
click "Iniciar Rifa"
  └─ runTraditionalRaffle()          ← ignora el click si isRaffling, hay countdown o no quedan números
       └─ runWithCountdown(executeRaffle)
            └─ executeRaffle(): isRaffling = true, winner = null
                 └─ setTimeout(800ms)
                      └─ winner = generateWinner(), revealedCount = digitCount,
                         agrega a history
                           └─ App.jsx detecta isFinished → runWinnerCelebration()
```

### Rifa manual (paso a paso)

```
click "Revelar Dígito" / "Revelar Siguiente"
  └─ runDigitRaffleStep()
       ├─ Si no hay winner o ya está completo (y quedan números):
       │    runWithCountdown → setTimeout(500ms) → generateWinner(), revealedCount = 1
       │    (con 1 solo dígito, se agrega al historial aquí)
       └─ Si faltan dígitos:
            runWithCountdown → setTimeout(500ms) → revealedCount++
                 └─ Si era el último → agrega a history (+ celebración en App.jsx)
```

El countdown se ejecuta antes de **cada** paso del modo manual, si está activado.

## Optimizaciones de rendimiento

- `memo` en todos los componentes visuales salvo `Layout`
- `useMemo` para las cajas de dígitos, el texto del botón y el valor del contexto
- `useCallback` en todos los handlers del contexto
- `canvas-confetti` + bucle `requestAnimationFrame` para la celebración
- Los temporizadores se cancelan al reiniciar y al desmontar (ver "Temporizadores")

## Persistencia

El hook `useLocalStorage` detecta el tipo del valor inicial (boolean, number, object/array) y deserializa en consecuencia, rechazando valores que no encajan (p. ej. `'abc'` para un número). Acepta una función `validate` opcional. Al escribir usa `JSON.stringify` para objetos y `String()` para el resto. Ante cualquier error de lectura o validación, retorna el valor por defecto y emite un `console.warn`.

## Efectos del ganador

`RaffleContent` (en `App.jsx`) reacciona a los cambios de `winner`/`revealedCount`: confetti (`runWinnerCelebration`, que no hace nada con `prefers-reduced-motion`) y, si el sonido está activo, fanfarria o sonido de revelación. `CountdownOverlay` reproduce los sonidos del countdown. `src/index.css` termina con un override global de `prefers-reduced-motion` que anula animaciones y transiciones.

## PWA

`vite-plugin-pwa` genera el manifest y un service worker (Workbox) que precachea todo el build. Como no hay backend y todo el estado está en `localStorage`, la app funciona completa sin conexión tras la primera visita. Ver [DEPLOYMENT.md](DEPLOYMENT.md#pwa-y-caché).

## Diseño responsive

Una sola hoja de estilos (`src/index.css`) con tamaños fluidos (`clamp`, `dvh`, `vmin`) y *container queries*: los dígitos se dimensionan según el ancho de `.card-raffle` y la cantidad de dígitos, limitados por la altura disponible para que el botón y el mensaje del ganador quepan sin scroll. Escritorio/proyector: historial a la izquierda; ≤ 1024 px: historial debajo en cuadrícula; ≤ 640 px: una columna, botones solo con icono y configuración como hoja inferior. Playwright verifica el resultado en 6 tamaños de pantalla.

## Despliegue

La app se despliega como sitio estático en GitHub Pages. El `base` de Vite se configura a `/Rifas-Pacorenos/` para que los assets se resuelvan correctamente bajo ese subpath. Ver [DEPLOYMENT.md](DEPLOYMENT.md).
