# Guía de desarrollo — Gran Rifa

## Requisitos previos

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)

## Configuración inicial

```bash
git clone https://github.com/abelgutierrezarias/Rifas-Pacorenos.git
cd Rifas-Pacorenos
pnpm install
pnpm dev
```

El servidor de desarrollo arranca en `http://localhost:5173`.

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Build de producción en `dist/` |
| `pnpm preview` | Vista previa del build de producción |
| `pnpm lint` | ESLint sobre todos los archivos `src/` |

## Convenciones de código

### Estructura de archivos

- Un componente por archivo, nombre en PascalCase
- Hooks personalizados en `src/hooks/`, prefijo `use`
- Utilidades puras en `src/utils/`
- Estado global en `src/context/`

### Estilo de componentes

```jsx
// Importaciones primero, luego el componente
import { useRaffle } from '../context/RaffleContext';

// Memoizar componentes que reciben props estables
const MiComponente = React.memo(function MiComponente({ prop }) {
  const { winner } = useRaffle();
  // ...
});

export default MiComponente;
```

### CSS

- Las variables CSS globales están en `:root` dentro de `src/index.css`
- Clases en kebab-case: `.raffle-display`, `.digit-box`
- Animaciones definidas con `@keyframes` al final del archivo de estilos

### Variables CSS principales

```css
--color-gold: #fbbf24;
--color-gold-dim: #b45309;
--color-bg: #0f0f13;
--color-card: rgba(255, 255, 255, 0.05);
--color-green: #58892B;
```

## Agregar un nuevo componente

1. Crear `src/components/NuevoComponente.jsx`
2. Si necesita estado global, consumir `useRaffle()` del contexto
3. Si necesita persistencia local, usar `useLocalStorage`
4. Exportar como default y memoizar con `React.memo` si recibe props que no cambian frecuentemente
5. Añadir los estilos en `src/index.css` bajo un comentario de sección

## Modificar la lógica de la rifa

Toda la lógica del sorteo vive en `src/context/RaffleContext.jsx`. Las funciones clave son:

- `generateWinner()` — genera el número aleatorio
- `executeRaffle()` — ejecuta la animación y actualiza el estado
- `runTraditionalRaffle()` — modo tradicional (todo de golpe)
- `runDigitRaffleStep()` — modo manual (dígito a dígito)
- `runWithCountdown()` — envuelve cualquier callback con el countdown opcional

## Agregar un nuevo efecto de celebración

Los efectos están en `src/utils/confettiEffects.js`. Exporta `triggerSuperCelebration()` que se llama desde `App.jsx` cuando `winner` cambia.

Para agregar un nuevo efecto, crear una función auxiliar dentro del archivo y llamarla desde `triggerSuperCelebration()`. Usar `setTimeout` para escalonar los efectos en el tiempo.

## Linting

El proyecto usa ESLint 9 con las reglas de `eslint-plugin-react` y `eslint-plugin-react-hooks`. Para corregir automáticamente:

```bash
pnpm lint --fix
```

## Depuración

- El historial de ganadores se puede inspeccionar en DevTools → Application → Local Storage
- Para resetear todo el estado, borrar las claves `raffle_*` de localStorage
- Los efectos de confetti se pueden probar abriendo la consola y ejecutando:

```js
import('/src/utils/confettiEffects.js').then(m => m.triggerSuperCelebration())
```
