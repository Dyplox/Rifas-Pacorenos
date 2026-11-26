# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Gran Rifa" — a client-only React 19 + Vite 7 SPA for running live number raffles for the *Pacoreños en Medellín* community. No backend; all state lives in the browser and is persisted to `localStorage`. UI text and docs are in Spanish.

## Commands

Package manager is **pnpm** (CI uses pnpm 9, Node 20).

```bash
pnpm install       # install deps
pnpm dev           # dev server at http://localhost:5173/Rifas-Pacorenos/
pnpm build         # production build to dist/
pnpm preview       # serve the built dist/
pnpm lint          # ESLint 9 flat config (react-hooks + react-refresh)
```

There is no test suite. Verify changes with `pnpm lint` and `pnpm build`, and manually in the browser.

## Architecture

- **All raffle logic lives in `src/context/RaffleContext.jsx`** (`RaffleProvider` + `useRaffle()` hook). Components are thin views over this context. Two raffle modes:
  - `runTraditionalRaffle` → `runWithCountdown(executeRaffle)`: shuffles for 800 ms, then sets the full winner and appends to history.
  - `runDigitRaffleStep` (manual mode): first call generates the winner and reveals digit 1; each subsequent call increments `revealedCount`; history is appended only when the last digit is revealed.
  - `runWithCountdown(cb)` wraps either path: if countdown is enabled it ticks `currentCount` down each second, shows `'¡MATRACA!'` for 800 ms, then runs `cb`. `currentCount !== null` doubles as the "countdown active" flag and blocks new raffles.
- **"Finished" is derived, not stored**: `winner && revealedCount === digitCount`. `App.jsx` (`RaffleContent`) watches this and fires `runWinnerCelebration()` from `src/utils/confettiEffects.js`.
- **Persistence**: `src/hooks/useLocalStorage.js` infers (de)serialization from the type of the default value (boolean → `'true'`, number → `parseInt`, object/array → JSON). Keys: `raffle_digitCount`, `raffle_isManualRevealEnabled`, `raffle_isCountdownEnabled`, `raffle_countdownDuration`, `raffle_history`. Changing a key's default type will break parsing of existing stored values.
- **Styling**: a single global stylesheet `src/index.css` (CSS variables in `:root`, kebab-case classes, `@keyframes`, responsive breakpoints at 1024px and 640px). No CSS modules or CSS-in-JS; some inline styles in `App.jsx`.
- **Conventions**: context handlers are wrapped in `useCallback` and the context value in `useMemo`; heavier components use `React.memo`. One component per file, PascalCase.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to `main` (and `feature/ux-pacorenos-medellin`). `vite.config.js` sets `base: '/Rifas-Pacorenos/'` — it must match the repo name or assets will 404 on Pages.

## Docs

`README.md`, `SNAPSHOT.md` and `docs/*.md` (Spanish) document architecture, components and deployment in detail. When changing context API, defaults, localStorage keys or the workflow, update `docs/COMPONENTS.md` / `docs/ARCHITECTURE.md` accordingly.
