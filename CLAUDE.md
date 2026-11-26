# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Gran Rifa" — a client-only React 19 + Vite 7 SPA for running live number raffles for the *Pacoreños en Medellín* community. No backend; all state lives in the browser and is persisted to `localStorage`. UI text and docs are in Spanish.

## Commands

Package manager is **pnpm 12**, pinned via `packageManager` in `package.json` (CI's `pnpm/action-setup` reads it). Node ≥ 22.12 (Vitest 5/jsdom). In this environment the shell's lazy nvm wrapper can fail; `source "$NVM_DIR/nvm.sh"` first if `pnpm` is not found.

```bash
pnpm install       # install deps
pnpm dev           # dev server at http://localhost:5173/Rifas-Pacorenos/
pnpm build         # production build to dist/
pnpm preview       # serve the built dist/
pnpm lint          # ESLint 9 flat config (react-hooks + react-refresh)
pnpm test          # Vitest (jsdom), run once
pnpm test src/context/RaffleContext.test.jsx   # single file
pnpm test -t "no-repeat"                        # tests matching a name
pnpm test:e2e                                   # Playwright vs. production build, 6 viewports
pnpm test:e2e --project=phone layout            # one viewport / one spec file
SCREENSHOTS=1 pnpm test:e2e screenshots         # review captures in e2e-screens/ (gitignored)
```

First e2e run needs `pnpm exec playwright install chromium`.

Tests live next to the code (`*.test.js[x]`); config is the `test` block in `vite.config.js`, setup in `src/test/setup.js` (clears DOM + localStorage). Context tests use fake timers with the exported timing constants (`TRADITIONAL_SHUFFLE_MS`, `DIGIT_STEP_MS`, `POST_COUNTDOWN_SHUFFLE_MS`, `GO_MESSAGE_MS`, `SUSPENSE_MS`). `App.test.jsx` mocks `canvas-confetti` (jsdom has no canvas).

E2E (`e2e/`, `playwright.config.js`) runs against `pnpm build && pnpm preview` on port 4173, so the service worker is real. `layout.spec.js` asserts per viewport: no horizontal or page scroll (footer visible), digits filling their space, raffle button and winner message on screen, ≥ 44px touch targets, countdown/“¡MATRACA!” within the viewport. Functional (`raffle.spec.js`) and PWA (`pwa.spec.js`) specs run only on the `laptop` project. Use `seedSettings()` / `waitForAnimations()` from `e2e/helpers.js`; measure after entrance animations or the 20px slide-in skews boxes.

CI: `.github/workflows/ci.yml` runs `verify` (lint + test + build) and `e2e` (Playwright, uploads report on failure) on PRs; `deploy.yml` runs lint + test before building and deploying. Dependabot: `.github/dependabot.yml`.

## Architecture

- **All raffle logic lives in `src/context/RaffleContext.jsx`** (`RaffleProvider` + `useRaffle()` hook). Components are thin views over this context. Two raffle modes:
  - `runTraditionalRaffle` → `runWithCountdown(executeRaffle)`: shuffles for 800 ms (only 300 ms, `POST_COUNTDOWN_SHUFFLE_MS`, right after a countdown — the suspense is already built), then sets the full winner and appends to history.
  - `runDigitRaffleStep` (manual mode): first call generates the winner and reveals digit 1; each subsequent call increments `revealedCount`; history is appended only when the last digit is revealed.
  - `runWithCountdown(cb)` wraps either path: if countdown is enabled it ticks `currentCount` down each second, then a dramatic pause (`currentCount === SUSPENSE`, `SUSPENSE_MS` 1200), then `'¡MATRACA!'` for 800 ms, then runs `cb(afterCountdown = true)` (`cb(false)` when the countdown is off). `CountdownOverlay` derives `--tension` (0→1) from the number via `countdownTension()` to drive size, color, pulse speed and heartbeat sound. `currentCount !== null` doubles as the "countdown active" flag and blocks new raffles.
  - Every raffle timeout goes through the context's `schedule()` helper so `resetRaffle()` / unmount can cancel it — don't call `setTimeout` directly there.
  - Winners come from `pickWinner()` in `src/utils/random.js` (`crypto.getRandomValues`, rejection sampling). With no-repeat on (default), numbers already in `history` with the current digit count are excluded; `availableCount === 0` disables raffling. Deleting a history entry makes that number available again.
- **"Finished" is derived, not stored**: `winner && revealedCount === digitCount`. `App.jsx` (`RaffleContent`) watches this and fires `runWinnerCelebration()` from `src/utils/confettiEffects.js`.
- **"Finished" side effects** (confetti, sounds) run in `App.jsx`; sounds are synthesized in `src/utils/sound.js` (Web Audio, gated by `isSoundEnabled`). Space/Enter shortcut is a window listener in `RaffleContent`, disabled while settings are open and ignored when focus is on an interactive element.
- **Sound** (`src/utils/sound.js`): recorded clips in `public/sounds/` played with **howler.js** (`drum-roll.mp3` loops from the dark pause until the reveal, then `drum-hit.mp3` + `applause.mp3` 150 ms later) plus synthesized Web Audio tones (heartbeat per countdown number, manual-mode blip). `App.jsx` calls `stopDrumRoll()` whenever nothing is in progress or sound is off, and `preloadSounds()` when sound is enabled. Clip sources, cut points and levels are in `docs/DEVELOPMENT.md` → "Sonidos"; credits in `src/utils/soundCredits.js` (shown via the footer's "Créditos de sonido"). `App.sound.test.jsx` mocks the module and asserts the sequence (advance fake timers one phase at a time, or React batches the phases away).
- **Listeners registered in effects must use `useLatestCallback`** (`src/hooks/`), not React 19.2's `useEffectEvent`: with `useEffectEvent` the keyboard shortcut kept a stale closure and manual mode restarted the raffle on every key press (covered by the manual-mode test in `App.test.jsx`).
- **Reset**: "Borrar caché y datos" (SettingsPanel) calls `clearAppData()` in `src/utils/resetApp.js`: clears storage and, only when online, the service worker + Cache Storage (offline it keeps them so the app can still load), then reloads.
- **Dialogs**: `Modal.jsx` is the accessible base (role=dialog, Esc, focus trap, focus restore); `SettingsPanel` and `ConfirmDialog` build on it. Don't use `window.confirm` — destructive bulk actions use `ConfirmDialog`, single deletions use `UndoToast` + `restoreHistoryEntry`.
- **Accessibility**: the result card is an `aria-live` region; `RaffleDisplay` exposes one `aria-label` for the whole number (boxes are `aria-hidden`); `index.html` is `lang="es"`.
- **PWA**: `vite-plugin-pwa` in `vite.config.js` (autoUpdate, precaches the whole build; icons in `public/`). Disabled in `pnpm dev`.
- **Persistence**: `src/hooks/useLocalStorage.js` infers deserialization from the type of the default value (boolean, number, object/array → JSON) and accepts `{ validate }`; invalid/corrupted values fall back to the default. Keys: `raffle_digitCount`, `raffle_isManualRevealEnabled`, `raffle_isCountdownEnabled`, `raffle_countdownDuration`, `raffle_isNoRepeatEnabled`, `raffle_isSoundEnabled`, `raffle_history`. Changing a key's default type invalidates existing stored values. History entries: `{ id (UUID), number, winnerName, createdAt (ISO), timestamp }` — older entries may lack `createdAt` and have numeric ids.
- **Styling**: a single global stylesheet `src/index.css` (CSS variables in `:root`, kebab-case classes, fluid `clamp`/`dvh`/`vmin` sizes, breakpoints at 1024px, 640px and a short-landscape query, a global `prefers-reduced-motion` override at the end). No CSS modules or CSS-in-JS; only dynamic values are inline (`--digits`, animation delays).
- **One-screen layout**: `main` is a `100dvh` flex column (header, content, footer); the page must not scroll except on short landscape phones. Wide (> 1024px): grid history | stage, `.digit-container` is a size container and each box is `min(100cqw / --digits, 100cqh / 1.35)`, so digits fill the leftover height. Narrow (≤ 1024px): stage first, digits width-driven capped at `24dvh`, history `order: 1` fills the remaining height and scrolls inside; small phones (≤ 640×760) get a compact block. The winner card always reserves its space (dashed placeholder) so nothing jumps. `layout.spec.js` asserts no page scroll, footer/button/winner visible, history below stage on narrow screens, and digits filling their space — rerun `pnpm test:e2e layout` after any sizing change.
- **Conventions**: context handlers are wrapped in `useCallback` and the context value in `useMemo`; heavier components use `React.memo`. One component per file, PascalCase.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to `main` only (or manual dispatch). `vite.config.js` sets `base: '/Rifas-Pacorenos/'` — it must match the repo name or assets will 404 on Pages. The Pages source must be **GitHub Actions** (`gh api repos/Dyplox/Rifas-Pacorenos/pages -q .build_type` → `workflow`); if it points to a branch and that branch is deleted, GitHub unpublishes the site and the deploy fails at *Setup Pages* with 404. Check this before deleting branches.

## Docs

`README.md`, `SNAPSHOT.md` and `docs/*.md` (Spanish) document architecture, components and deployment in detail. When changing context API, defaults, localStorage keys or the workflow, update `docs/COMPONENTS.md` / `docs/ARCHITECTURE.md` accordingly.
