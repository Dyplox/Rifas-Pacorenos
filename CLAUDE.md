# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Gran Rifa" — a client-only React 19 + Vite 7 SPA for running live number raffles for the *Pacoreños en Medellín* community. No backend; all state lives in the browser and is persisted to `localStorage`. UI text and docs are in Spanish.

## Commands

Package manager is **pnpm** (CI uses pnpm 9, Node 22 — Vitest 5/jsdom need Node ≥ 22). Keep `pnpm-lock.yaml` at `lockfileVersion: '9.0'`.

```bash
pnpm install       # install deps
pnpm dev           # dev server at http://localhost:5173/Rifas-Pacorenos/
pnpm build         # production build to dist/
pnpm preview       # serve the built dist/
pnpm lint          # ESLint 9 flat config (react-hooks + react-refresh)
pnpm test          # Vitest (jsdom), run once
pnpm test src/context/RaffleContext.test.jsx   # single file
pnpm test -t "no-repeat"                        # tests matching a name
```

Tests live next to the code (`*.test.js[x]`); config is the `test` block in `vite.config.js`, setup in `src/test/setup.js` (clears DOM + localStorage). Context tests use fake timers with the exported timing constants (`TRADITIONAL_SHUFFLE_MS`, `DIGIT_STEP_MS`, `GO_MESSAGE_MS`). `App.test.jsx` mocks `canvas-confetti` (jsdom has no canvas).

CI: `.github/workflows/ci.yml` runs lint + test + build on PRs; `deploy.yml` runs lint + test before building and deploying.

## Architecture

- **All raffle logic lives in `src/context/RaffleContext.jsx`** (`RaffleProvider` + `useRaffle()` hook). Components are thin views over this context. Two raffle modes:
  - `runTraditionalRaffle` → `runWithCountdown(executeRaffle)`: shuffles for 800 ms, then sets the full winner and appends to history.
  - `runDigitRaffleStep` (manual mode): first call generates the winner and reveals digit 1; each subsequent call increments `revealedCount`; history is appended only when the last digit is revealed.
  - `runWithCountdown(cb)` wraps either path: if countdown is enabled it ticks `currentCount` down each second, shows `'¡MATRACA!'` for 800 ms, then runs `cb`. `currentCount !== null` doubles as the "countdown active" flag and blocks new raffles.
  - Every raffle timeout goes through the context's `schedule()` helper so `resetRaffle()` / unmount can cancel it — don't call `setTimeout` directly there.
  - Winners come from `pickWinner()` in `src/utils/random.js` (`crypto.getRandomValues`, rejection sampling). With no-repeat on (default), numbers already in `history` with the current digit count are excluded; `availableCount === 0` disables raffling. Deleting a history entry makes that number available again.
- **"Finished" is derived, not stored**: `winner && revealedCount === digitCount`. `App.jsx` (`RaffleContent`) watches this and fires `runWinnerCelebration()` from `src/utils/confettiEffects.js`.
- **"Finished" side effects** (confetti, sounds) run in `App.jsx`; sounds are synthesized in `src/utils/sound.js` (Web Audio, gated by `isSoundEnabled`). Space/Enter shortcut is a window listener in `RaffleContent`, disabled while settings are open and ignored when focus is on an interactive element.
- **Persistence**: `src/hooks/useLocalStorage.js` infers deserialization from the type of the default value (boolean, number, object/array → JSON) and accepts `{ validate }`; invalid/corrupted values fall back to the default. Keys: `raffle_digitCount`, `raffle_isManualRevealEnabled`, `raffle_isCountdownEnabled`, `raffle_countdownDuration`, `raffle_isNoRepeatEnabled`, `raffle_isSoundEnabled`, `raffle_history`. Changing a key's default type invalidates existing stored values. History entries: `{ id (UUID), number, winnerName, createdAt (ISO), timestamp }` — older entries may lack `createdAt` and have numeric ids.
- **Styling**: a single global stylesheet `src/index.css` (CSS variables in `:root`, kebab-case classes, `@keyframes`, responsive breakpoints at 1024px and 640px, a global `prefers-reduced-motion` override at the end; confetti also skips itself under reduced motion). No CSS modules or CSS-in-JS; some inline styles in `App.jsx`.
- **Conventions**: context handlers are wrapped in `useCallback` and the context value in `useMemo`; heavier components use `React.memo`. One component per file, PascalCase.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to `main` (and `feature/ux-pacorenos-medellin`). `vite.config.js` sets `base: '/Rifas-Pacorenos/'` — it must match the repo name or assets will 404 on Pages.

## Docs

`README.md`, `SNAPSHOT.md` and `docs/*.md` (Spanish) document architecture, components and deployment in detail. When changing context API, defaults, localStorage keys or the workflow, update `docs/COMPONENTS.md` / `docs/ARCHITECTURE.md` accordingly.
