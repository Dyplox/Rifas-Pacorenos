# Guía de desarrollo — Gran Rifa

## Requisitos previos

- Node.js >= 20
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

No hay suite de tests: verificar cambios con `pnpm lint`, `pnpm build` y prueba manual en el navegador.

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
- `resetRaffle()` — cancela el countdown y limpia el estado de la rifa

## Agregar un nuevo efecto de celebración

Los efectos están en `src/utils/confettiEffects.js`. Exporta `runWinnerCelebration()`, que se llama desde `RaffleContent` en `App.jsx` cuando la rifa termina (`winner && revealedCount === digitCount`).

Para agregar un efecto continuo, añadir una llamada a `confetti()` dentro de la función `frame()` (bucle `requestAnimationFrame` que dura `CELEBRATION_DURATION`, 5 s); para efectos esporádicos, condicionarla con `Math.random() < p`. Para un efecto único al inicio, añadirlo junto al "Initial Massive Blast".

## Linting

El proyecto usa ESLint 9 (flat config en `eslint.config.js`) con `@eslint/js` recommended, `eslint-plugin-react-hooks` y `eslint-plugin-react-refresh`. `no-unused-vars` ignora variables que empiezan por mayúscula o `_`. Para corregir automáticamente:

```bash
pnpm lint --fix
```

## Depuración

- El historial de ganadores se puede inspeccionar en DevTools → Application → Local Storage
- Para resetear todo el estado, borrar las claves `raffle_*` de localStorage
- Los efectos de confetti se pueden probar abriendo la consola y ejecutando:

```js
import('/Rifas-Pacorenos/src/utils/confettiEffects.js').then(m => m.runWinnerCelebration())
```
