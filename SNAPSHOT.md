# SNAPSHOT — Rifas Pacoreños
_Actualizado: 2026-11-26_

## Stack
React 19 + Vite 7 + CSS puro + canvas-confetti — SPA sin backend, deploy en GitHub Pages vía pnpm

## Propósito
App de rifas digitales en vivo para la comunidad Pacoreños en Medellín. Sortea números con animación, cuenta regresiva configurable y celebración con confetti/fuegos.

## Arquitectura
**Estado global**: Context API (`src/context/RaffleContext.jsx`) — toda la lógica de rifa vive aquí  
**Persistencia**: `useLocalStorage` hook — 5 claves `raffle_*` en localStorage  
**Celebración**: `runWinnerCelebration()` llamada desde `App.jsx` cuando `winner && revealedCount === digitCount`

## Archivos críticos
| Archivo | Responsabilidad |
|---------|----------------|
| `src/context/RaffleContext.jsx` | Estado global + lógica de sorteo (generateWinner, executeRaffle, runWithCountdown, runDigitRaffleStep) |
| `src/App.jsx` | Raíz: orquesta layout, dispara celebración, maneja settings open/close |
| `src/components/RaffleDisplay.jsx` | Cajas de dígitos: barajado animado → revelación → glow ganador |
| `src/components/RaffleHistory.jsx` | Sidebar: historial completo (sin límite), nombres editables, timestamp |
| `src/components/SettingsPanel.jsx` | Modal: dígitos (1-5, default 3), countdown (3-10s, default activo/3s), modo manual |
| `src/components/CountdownOverlay.jsx` | Fullscreen countdown → "¡MATRACA!" en verde |
| `src/utils/confettiEffects.js` | `runWinnerCelebration()`: blast + bucle rAF de cañones, globos y fuegos (5s) |
| `src/hooks/useLocalStorage.js` | Deserialización según el tipo del default, fallback al default |
| `src/index.css` | ~850 líneas: variables CSS, animaciones, glass morphism, responsive |

## Convenciones
- Componentes con `memo` + `displayName`, `useMemo`/`useCallback` para evitar re-renders
- Handlers del contexto siempre con `useCallback`
- CSS: kebab-case, variables en `:root` (`--primary-gold`, `--bg-dark`…), `@keyframes` junto a su sección
- Un componente por archivo, PascalCase

## Colores de marca
- Dorado: `#fbbf24` / `#b45309` — acento principal
- Verde Pacoreños: `#58892B` — ganador y "¡MATRACA!"
- Fondo: `#0f0f13`

## Estado actual del trabajo
- Documentación sincronizada con el código (2026-11-26): `README.md`, `docs/*.md`, `CLAUDE.md`
- Sin suite de tests
- Skills de optimización de tokens instalados: `project-snapshot`, `token-optimizer`, `session-compact`
- Hooks automáticos configurados en `~/.claude/settings.json` (SessionStart + Stop)
- Deploy activo en GitHub Pages bajo `/Rifas-Pacorenos/` (push a `main` o `feature/ux-pacorenos-medellin`)
