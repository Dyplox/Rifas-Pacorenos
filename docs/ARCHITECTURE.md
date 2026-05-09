# Arquitectura — Gran Rifa

## Visión general

Gran Rifa es una SPA (Single Page Application) construida con React 19 y Vite. No usa servidor backend; todo el estado vive en el cliente y se persiste en `localStorage`.

```
┌─────────────────────────────────────────────────────┐
│                      App.jsx                         │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │ SettingsPanel│  │        RaffleContent          │ │
│  │   (modal)    │  │  ┌────────────┐  ┌─────────┐ │ │
│  └──────────────┘  │  │RaffleDisplay│ │ Raffle  │ │ │
│                    │  │ (dígitos)  │  │ History │ │ │
│  ┌──────────────┐  │  └────────────┘  └─────────┘ │ │
│  │  Countdown   │  └──────────────────────────────┘ │
│  │  Overlay     │                                    │
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

### Estado principal

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `winner` | `string \| null` | Número ganador actual con ceros a la izquierda |
| `isRaffling` | `boolean` | `true` durante la animación de barajado (800 ms) |
| `revealedCount` | `number` | Dígitos revelados en modo manual |
| `isCountingDown` | `boolean` | `true` mientras el overlay de cuenta regresiva está activo |
| `currentCount` | `number` | Valor actual del countdown |
| `history` | `array` | Lista de ganadores anteriores |

### Configuración persistida

| Clave localStorage | Tipo | Default |
|-------------------|------|---------|
| `raffle_digitCount` | `number` | `4` |
| `raffle_isManualRevealEnabled` | `boolean` | `false` |
| `raffle_isCountdownEnabled` | `boolean` | `false` |
| `raffle_countdownDuration` | `number` | `5` |
| `raffle_history` | `array` | `[]` |

## Flujos principales

### Rifa tradicional

```
click "Iniciar Rifa"
  └─ runWithCountdown()        ← si countdown activo, muestra overlay
       └─ executeRaffle()      ← setIsRaffling(true), genera número
            └─ setTimeout(800ms)
                 └─ setWinner(), agrega a history
                      └─ triggerSuperCelebration() en App.jsx
```

### Rifa manual (paso a paso)

```
click "Revelar Dígito"
  └─ runWithCountdown()
       └─ runDigitRaffleStep()
            ├─ Si winner null → generateWinner() + revelar primer dígito
            └─ Si winner existe → revealedCount++
                 └─ Si todos revelados → agrega a history + celebración
```

## Optimizaciones de rendimiento

- `React.memo` en `RaffleDisplay` y `RaffleHistory` para evitar re-renders innecesarios
- `useMemo` para calcular los digit boxes y el texto del botón
- `useCallback` en todos los handlers del contexto
- `canvas-confetti` usa `requestAnimationFrame` para animaciones a 60fps
- Limpieza de intervalos en el unmount del contexto para evitar memory leaks

## Persistencia

El hook `useLocalStorage` detecta el tipo del valor inicial (boolean, number, object/array) y serializa/deserializa automáticamente con `JSON.parse`/`JSON.stringify`. Ante cualquier error de lectura, retorna el valor por defecto y emite un `console.warn`.

## Despliegue

La app se despliega como sitio estático en GitHub Pages. El `base` de Vite se configura a `/Rifas-Pacorenos/` para que los assets se resuelvan correctamente bajo ese subpath.
