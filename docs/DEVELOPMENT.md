# Guía de desarrollo — Gran Rifa

## Requisitos previos

- Node.js >= 22.12 (lo exigen Vitest 5 y jsdom)
- pnpm 12 — la versión exacta está en `packageManager` de `package.json`; con `corepack enable` se usa automáticamente

## Configuración inicial

```bash
git clone https://github.com/Dyplox/Rifas-Pacorenos.git
cd Rifas-Pacorenos
pnpm install
pnpm dev
```

El servidor de desarrollo arranca en `http://localhost:5173/Rifas-Pacorenos/` (por el `base` de Vite).

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Build de producción en `dist/` |
| `pnpm preview` | Vista previa del build de producción |
| `pnpm lint` | ESLint sobre todos los archivos `.js`/`.jsx` del repo (excepto `dist/`) |
| `pnpm test` | Ejecuta todos los tests una vez (Vitest) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm test:e2e` | Tests Playwright contra el build de producción (6 tamaños de pantalla) |

## Tests

Vitest con entorno `jsdom` y Testing Library; la configuración está en el bloque `test` de `vite.config.js` y el setup (limpia el DOM y `localStorage` tras cada test) en `src/test/setup.js`. Los tests viven junto al código (`*.test.js` / `*.test.jsx`).

```bash
pnpm test src/context/RaffleContext.test.jsx   # un archivo
pnpm test -t "no-repeat"                        # tests cuyo nombre coincide
```

- Los tests del contexto usan `vi.useFakeTimers()` y las constantes de tiempo exportadas (`TRADITIONAL_SHUFFLE_MS`, `DIGIT_STEP_MS`, `GO_MESSAGE_MS`) para avanzar la animación.
- La configuración inicial se pone en `localStorage` antes de renderizar (p. ej. `raffle_isCountdownEnabled = 'false'`).
- `App.test.jsx` mockea `canvas-confetti`, porque jsdom no tiene canvas.

### Tests end-to-end (Playwright)

Están en `e2e/` y corren contra `pnpm build && pnpm preview` (incluye el service worker). La primera vez hay que instalar el navegador:

```bash
pnpm exec playwright install chromium
pnpm test:e2e                              # todo, en los 6 proyectos
pnpm test:e2e --project=phone              # un tamaño de pantalla
pnpm test:e2e layout -g "MATRACA"          # un archivo / test
SCREENSHOTS=1 pnpm test:e2e screenshots    # capturas para revisión visual en e2e-screens/
```

Proyectos (tamaños): `phone` (Pixel 7), `phone-small` (360×640), `phone-landscape`, `tablet` (820×1180), `laptop` (1366×768) y `projector` (1920×1080).

- `layout.spec.js` comprueba en cada tamaño: sin scroll horizontal, dígitos al máximo tamaño posible, botón visible sin hacer scroll, mensaje del ganador visible tras sortear, objetivos táctiles ≥ 44 px, countdown y "¡MATRACA!" dentro de la pantalla, diálogo de configuración accesible.
- `raffle.spec.js` (solo `laptop`): flujo completo con teclado, deshacer, CSV, borrar historial, foco del diálogo.
- `pwa.spec.js` (solo `laptop`): manifest e iconos válidos y uso sin conexión tras la primera visita.
- `helpers.js`: `seedSettings()` (configuración inicial en `localStorage`) y `waitForAnimations()` (medir después de las animaciones de entrada).

## Convenciones de código

### Estructura de archivos

- Un componente por archivo, nombre en PascalCase
- Hooks personalizados en `src/hooks/`, prefijo `use`
- Utilidades puras en `src/utils/`
- Estado global en `src/context/`

### Estilo de componentes

```jsx
// Importaciones primero, luego el componente
import { memo } from 'react';
import { useRaffle } from '../context/RaffleContext';

const MiComponente = memo(({ prop }) => {
  const { winner } = useRaffle();
  // ...
});

MiComponente.displayName = 'MiComponente';

export default MiComponente;
```

### CSS

- Las variables CSS globales están en `:root` dentro de `src/index.css`
- Clases en kebab-case: `.raffle-display`, `.digit-box`
- Animaciones definidas con `@keyframes` junto a la sección que las usa
- Breakpoints responsive: `@media (max-width: 1024px)` y `@media (max-width: 640px)`

### Variables CSS principales

```css
--bg-dark: #0f0f13;
--bg-card: #1a1a20;
--primary-gold: #fbbf24;
--primary-gold-dim: #b45309;
--text-main: #ffffff;
--text-muted: #9ca3af;
--accent-glow: rgba(251, 191, 36, 0.2);
```

El verde Pacoreños (`#58892B`) no es una variable CSS; se usa directamente (p. ej. `rgba(88, 137, 43, …)`).

## Agregar un nuevo componente

1. Crear `src/components/NuevoComponente.jsx`
2. Si necesita estado global, consumir `useRaffle()` del contexto
3. Si necesita persistencia local, usar `useLocalStorage`
4. Exportar como default, envolver con `memo` y asignar `displayName`
5. Añadir los estilos en `src/index.css` bajo un comentario de sección

## Modificar la lógica de la rifa

Toda la lógica del sorteo vive en `src/context/RaffleContext.jsx`. Las funciones clave son:

- `generateWinner()` — genera el número aleatorio
- `executeRaffle()` — ejecuta la animación y actualiza el estado
- `runTraditionalRaffle()` — modo tradicional (todo de golpe)
- `runDigitRaffleStep()` — modo manual (dígito a dígito)
- `runWithCountdown()` — envuelve cualquier callback con el countdown opcional
- `resetRaffle()` — cancela el countdown y cualquier temporizador pendiente, y limpia el estado de la rifa

Todos los `setTimeout` de la rifa deben crearse con el helper `schedule()` del contexto (no con `setTimeout` directo), para que `resetRaffle()` y el desmontaje puedan cancelarlos. El azar sale de `src/utils/random.js` (`crypto.getRandomValues()`); no usar `Math.random()` para elegir ganadores.

## Agregar un nuevo efecto de celebración

Los efectos están en `src/utils/confettiEffects.js`. Exporta `runWinnerCelebration()`, que se llama desde `RaffleContent` en `App.jsx` cuando la rifa termina (`winner && revealedCount === digitCount`).

Para agregar un efecto continuo, añadir una llamada a `confetti()` dentro de la función `frame()` (bucle `requestAnimationFrame` que dura `CELEBRATION_DURATION`, 5 s); para efectos esporádicos, condicionarla con `Math.random() < p`. Para un efecto único al inicio, añadirlo junto al "Initial Massive Blast".

## Diseño responsive

El tamaño de los dígitos se calcula solo en CSS (`.digit-box` en `src/index.css`): `.card-raffle` es un *container* (`container-type: inline-size`) y `RaffleDisplay` pasa `--digits`. Cada caja toma el mínimo entre:

1. el ancho disponible repartido entre los dígitos (`100cqi`),
2. `30dvh`, y
3. el alto que queda tras el resto de la interfaz (`--stage-chrome`, medido con Playwright), para que el mensaje del ganador quepa sin scroll.

Si cambias tamaños del header, botón o tarjeta del ganador, ejecuta `pnpm test:e2e layout`: el test "winner message visible" detecta si algo deja de caber, y `layout.spec.js` replica la fórmula de la altura.

## Listeners con estado actual

Para listeners registrados en efectos (atajos de teclado, temporizadores) usar `useLatestCallback` (`src/hooks/`). No usar `useEffectEvent` de React 19.2 aquí: en esta app el listener seguía llamando a una versión antigua de la función (el modo manual reiniciaba la rifa en cada tecla). El test "reveals the next digit … in manual mode" de `App.test.jsx` lo cubre.

## Agregar una opción persistida

Usar `useLocalStorage(clave, default, { validate })` en `RaffleContext.jsx`. El tipo del default decide cómo se lee el valor guardado; si el valor está corrupto o `validate` devuelve `false`, se usa el default. Exponer el valor y su setter en el `value` del contexto y agregar el control en `SettingsPanel.jsx`.

## Linting

El proyecto usa ESLint 9 (flat config en `eslint.config.js`) con `@eslint/js` recommended, `eslint-plugin-react-hooks` y `eslint-plugin-react-refresh`. `no-unused-vars` ignora variables que empiezan por mayúscula o `_`. Para corregir automáticamente:

```bash
pnpm lint --fix
```

## Depuración

- El historial de ganadores se puede inspeccionar en DevTools → Application → Local Storage
- Para resetear todo el estado, borrar las claves `raffle_*` de localStorage
- Si el sistema tiene activado "reducir movimiento", la celebración no se muestra (`prefersReducedMotion()` en `confettiEffects.js`)
- Los efectos de confetti se pueden probar abriendo la consola y ejecutando:

```js
import('/Rifas-Pacorenos/src/utils/confettiEffects.js').then(m => m.runWinnerCelebration())
```
