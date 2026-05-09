# SNAPSHOT — Rifas Pacoreños
_Actualizado: 2026-05-09_

## Stack
React 19 + Vite 7 + CSS puro + canvas-confetti — SPA sin backend, deploy en GitHub Pages vía pnpm

## Propósito
App de rifas digitales en vivo para la comunidad Pacoreños en Medellín. Sortea números con animación, cuenta regresiva configurable y celebración con confetti/fuegos.

## Arquitectura
**Estado global**: Context API (`src/context/RaffleContext.jsx`) — toda la lógica de rifa vive aquí  
**Persistencia**: `useLocalStorage` hook — 5 claves `raffle_*` en localStorage  
**Celebración**: `triggerSuperCelebration()` llamada desde `App.jsx` al cambiar `winner`

## Archivos críticos
| Archivo | Responsabilidad |
|---------|----------------|
| `src/context/RaffleContext.jsx` | Estado global + lógica de sorteo (generateWinner, executeRaffle, countdown) |
| `src/App.jsx` | Raíz: orquesta layout, dispara celebración, maneja settings open/close |
| `src/components/RaffleDisplay.jsx` | Cajas de dígitos: barajado animado → revelación → glow ganador |
| `src/components/RaffleHistory.jsx` | Sidebar: últimos 20 ganadores, nombres editables, timestamp |
| `src/components/SettingsPanel.jsx` | Modal: dígitos (1-5), modo manual, countdown (3-10s) |
| `src/components/CountdownOverlay.jsx` | Fullscreen countdown → "¡MATRACA!" en verde |
| `src/utils/confettiEffects.js` | 4 efectos simultáneos: blast, cañones, globos, fuegos (5s) |
| `src/hooks/useLocalStorage.js` | Serialización automática por tipo, fallback al default |
| `src/index.css` | ~850 líneas: variables CSS, animaciones, glass morphism, responsive |

## Convenciones
- Componentes con `React.memo` + `useMemo`/`useCallback` para evitar re-renders
- Handlers del contexto siempre con `useCallback`
- CSS: kebab-case, variables en `:root`, `@keyframes` al final del archivo
- Un componente por archivo, PascalCase

## Colores de marca
- Dorado: `#fbbf24` / `#b45309` — acento principal
- Verde Pacoreños: `#58892B` — ganador y "¡MATRACA!"
- Fondo: `#0f0f13`

## Estado actual del trabajo
- Documentación completa generada: `README.md`, `docs/ARCHITECTURE.md`, `docs/COMPONENTS.md`, `docs/DEVELOPMENT.md`, `docs/DEPLOYMENT.md`
- Skills de optimización de tokens instalados: `project-snapshot`, `token-optimizer`, `session-compact`
- Hooks automáticos configurados en `~/.claude/settings.json` (SessionStart + Stop)
- Deploy activo en GitHub Pages bajo `/Rifas-Pacorenos/`
