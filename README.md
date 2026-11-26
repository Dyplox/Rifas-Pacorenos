# Gran Rifa — Rifas Pacoreños

Aplicación web para realizar rifas digitales en vivo, diseñada para la comunidad **Pacoreños en Medellín**. Incluye efectos visuales de celebración, historial de ganadores y múltiples modos de revelación.

## Demo

Disponible en GitHub Pages: `https://dyplox.github.io/Rifas-Pacorenos/`

## Tecnologías

| Categoría | Herramienta |
|-----------|-------------|
| Framework | React 19 |
| Build tool | Vite 7 |
| Estilos | CSS puro con variables |
| Animaciones | canvas-confetti |
| Sonido | Web Audio API (sin archivos de audio) |
| PWA | vite-plugin-pwa (Workbox): instalable y sin conexión |
| Tests | Vitest + Testing Library (unitarios) · Playwright (e2e en 6 tamaños de pantalla) |
| Gestor de paquetes | pnpm (versión fijada en `packageManager`) |
| CI/CD | GitHub Actions (CI en PRs, deploy a GitHub Pages) · Dependabot |

## Características principales

- **Modo tradicional** — todos los dígitos se revelan de golpe con animación de barajado
- **Modo manual** — revelación dígito a dígito para mayor suspenso
- **Cuenta regresiva con suspenso** configurable (3-10 segundos, activada por defecto): el número crece, pasa de dorado a rojo y late cada vez más rápido; el último tiembla y una pausa a oscuras precede a "¡MATRACA!"
- **Sin números repetidos** (opcional, activado por defecto): los números ya sorteados se excluyen y se muestra cuántos quedan
- **Sorteo con `crypto.getRandomValues()`**, uniforme y sin sesgo
- **Historial persistente** de ganadores con nombres editables, fecha y hora, borrado individual y exportación a CSV
- **Atajo de teclado**: Espacio o Enter para sortear / revelar el siguiente dígito
- **Pantalla completa** para proyector
- **Sonido opcional** (cuenta regresiva, revelación y fanfarria del ganador)
- **Respeta `prefers-reduced-motion`**: sin confetti ni animaciones si el sistema lo pide
- **Celebración** con confetti, globos y fuegos artificiales al anunciar el ganador
- **Configuración persistente** en `localStorage`, con opción **Borrar caché y datos** para dejar la app como recién instalada
- **Todo en una sola vista, a gran tamaño** — la app ocupa exactamente la pantalla (pie de página incluido) en móvil, tableta, portátil y proyector; los dígitos llenan el espacio que sobra y el historial hace scroll dentro de su panel
- **Funciona sin internet (PWA)** — tras la primera visita se puede instalar y usar sin conexión; un aviso indica cuando no hay red
- **Accesible** — configuración en un diálogo con teclado (Esc, foco atrapado), anuncios para lectores de pantalla, objetivos táctiles de 44 px, deshacer al borrar

## Inicio rápido

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Vista previa del build
pnpm preview

# Linting
pnpm lint

# Tests unitarios
pnpm test

# Tests end-to-end (la primera vez: pnpm exec playwright install chromium)
pnpm test:e2e
```

Requiere Node.js ≥ 22.12 y pnpm 12 (`corepack enable` usa la versión de `packageManager`).

## Estructura del proyecto

```
src/
├── main.jsx                    # Punto de entrada React
├── App.jsx                     # Componente raíz
├── index.css                   # Estilos globales y animaciones
├── assets/images/
│   └── pacomede.jpg            # Logo del header
├── components/
│   ├── RaffleDisplay.jsx       # Cajas de dígitos con animación de barajado
│   ├── RaffleHistory.jsx       # Panel lateral de ganadores
│   ├── SettingsPanel.jsx       # Modal de configuración
│   ├── CountdownOverlay.jsx    # Overlay de cuenta regresiva
│   ├── FullscreenButton.jsx    # Botón de pantalla completa
│   ├── Modal.jsx               # Diálogo accesible (base de configuración y confirmaciones)
│   ├── ConfirmDialog.jsx       # Confirmación con estilo propio
│   ├── UndoToast.jsx           # Aviso con "Deshacer"
│   ├── Layout.jsx              # Contenedor principal
│   └── Footer.jsx              # Pie de página con marca
├── context/
│   └── RaffleContext.jsx       # Estado global con Context API
├── hooks/
│   ├── useLocalStorage.js      # Persistencia en localStorage con validación
│   ├── useLatestCallback.js    # Callback estable que ve el estado actual (listeners)
│   └── useOnlineStatus.js      # Estado de conexión (aviso "Sin conexión")
└── utils/
    ├── confettiEffects.js      # runWinnerCelebration(): confetti, globos y fuegos
    ├── random.js               # Azar con crypto, selección sin repetidos, IDs
    ├── historyExport.js        # Fecha del historial y exportación CSV
    ├── resetApp.js             # Borrar caché y datos (storage, service worker, caché)
    └── sound.js                # Efectos de sonido con Web Audio
e2e/                            # Tests Playwright (layout responsive, flujo, PWA)
public/                         # Favicon e iconos de la PWA
```

## Documentación adicional

- [Arquitectura](docs/ARCHITECTURE.md)
- [Componentes](docs/COMPONENTS.md)
- [Guía de desarrollo](docs/DEVELOPMENT.md)
- [Despliegue](docs/DEPLOYMENT.md)

## Colores de marca

| Color | Valor | Uso |
|-------|-------|-----|
| Dorado principal | `#fbbf24` | Acento principal, botones, texto destacado |
| Dorado oscuro | `#b45309` | Gradientes y sombras |
| Verde Pacoreños | `#58892B` | Último ganador del historial, "¡MATRACA!" y confetti |
| Amarillo Medellín | `#F6BB31` | Confetti de celebración |
| Fondo oscuro | `#0f0f13` | Fondo general de la app |

## Licencia

Uso privado — Pacoreños en Medellín © 2025
