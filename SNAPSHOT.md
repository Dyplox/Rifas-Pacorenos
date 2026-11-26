# SNAPSHOT — Rifas Pacoreños
_Actualizado: 2026-11-26_

## Stack
React 19 + Vite 7 + CSS puro + canvas-confetti + Web Audio — SPA sin backend, tests con Vitest, deploy en GitHub Pages vía pnpm

## Propósito
App de rifas digitales en vivo para la comunidad Pacoreños en Medellín. Sortea números con animación, cuenta regresiva configurable y celebración con confetti/fuegos.

## Arquitectura
**Estado global**: Context API (`src/context/RaffleContext.jsx`) — toda la lógica de rifa vive aquí  
**Persistencia**: `useLocalStorage` hook (con validación) — 7 claves `raffle_*` en localStorage  
**Celebración**: `runWinnerCelebration()` llamada desde `App.jsx` cuando `winner && revealedCount === digitCount`

## Archivos críticos
| Archivo | Responsabilidad |
|---------|----------------|
| `src/context/RaffleContext.jsx` | Estado global + lógica de sorteo (generateWinner, executeRaffle, runWithCountdown, runDigitRaffleStep) |
| `src/App.jsx` | Raíz: orquesta layout, dispara celebración, maneja settings open/close |
| `src/components/RaffleDisplay.jsx` | Cajas de dígitos: barajado animado → revelación → glow ganador |
| `src/components/RaffleHistory.jsx` | Sidebar: historial completo, nombres editables, fecha+hora, borrar entrada, exportar CSV |
| `src/components/SettingsPanel.jsx` | Modal: dígitos (1-5, default 3), countdown (3-10s, default activo/3s), modo manual, no repetir (default sí), sonido (default no) |
| `src/components/CountdownOverlay.jsx` | Fullscreen countdown → "¡MATRACA!" en verde |
| `src/utils/confettiEffects.js` | `runWinnerCelebration()`: blast + bucle rAF de cañones, globos y fuegos (5s) |
| `src/hooks/useLocalStorage.js` | Deserialización según el tipo del default + `validate`, fallback al default |
| `src/utils/random.js` | `randomInt` con crypto, `pickWinner` sin repetidos, `generateId` |
| `src/utils/historyExport.js` | Fecha de las entradas y exportación CSV |
| `src/utils/sound.js` | Sonidos sintetizados (tick, ¡MATRACA!, revelación, fanfarria) |
| `src/components/FullscreenButton.jsx` | Botón de pantalla completa |
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
- Tests con Vitest (`pnpm test`); CI en PRs y lint+tests antes de cada deploy
- Skills de optimización de tokens instalados: `project-snapshot`, `token-optimizer`, `session-compact`
- Hooks automáticos configurados en `~/.claude/settings.json` (SessionStart + Stop)
- Deploy activo en GitHub Pages bajo `/Rifas-Pacorenos/` (push a `main` o `feature/ux-pacorenos-medellin`)
