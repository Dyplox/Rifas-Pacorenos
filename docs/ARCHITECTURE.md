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
| `raffle_history` | `array` | `[]` |

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
  └─ runTraditionalRaffle()          ← ignora el click si isRaffling o hay countdown
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
       ├─ Si no hay winner o ya está completo:
       │    runWithCountdown → setTimeout(500ms) → generateWinner(), revealedCount = 1
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
- El intervalo del countdown se guarda en un `ref` y se limpia al iniciar otro countdown o al llamar `resetRaffle()`

## Persistencia

El hook `useLocalStorage` detecta el tipo del valor inicial (boolean, number, object/array) y deserializa en consecuencia (`'true'`, `parseInt`, `JSON.parse`). Al escribir usa `JSON.stringify` para objetos y `String()` para el resto. Ante cualquier error de lectura, retorna el valor por defecto y emite un `console.warn`.

## Despliegue

La app se despliega como sitio estático en GitHub Pages. El `base` de Vite se configura a `/Rifas-Pacorenos/` para que los assets se resuelvan correctamente bajo ese subpath. Ver [DEPLOYMENT.md](DEPLOYMENT.md).
