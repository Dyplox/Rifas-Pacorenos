# Guía de desarrollo — Gran Rifa

## Requisitos previos

- Node.js >= 22 (lo exigen Vitest 5 y jsdom)
- pnpm >= 9 (`npm install -g pnpm`)

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

## Tests

Vitest con entorno `jsdom` y Testing Library; la configuración está en el bloque `test` de `vite.config.js` y el setup (limpia el DOM y `localStorage` tras cada test) en `src/test/setup.js`. Los tests viven junto al código (`*.test.js` / `*.test.jsx`).

```bash
pnpm test src/context/RaffleContext.test.jsx   # un archivo
pnpm test -t "no-repeat"                        # tests cuyo nombre coincide
```

- Los tests del contexto usan `vi.useFakeTimers()` y las constantes de tiempo exportadas (`TRADITIONAL_SHUFFLE_MS`, `DIGIT_STEP_MS`, `GO_MESSAGE_MS`) para avanzar la animación.
- La configuración inicial se pone en `localStorage` antes de renderizar (p. ej. `raffle_isCountdownEnabled = 'false'`).
- `App.test.jsx` mockea `canvas-confetti`, porque jsdom no tiene canvas.

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
