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
| Tests | Vitest + Testing Library (jsdom) |
| Gestor de paquetes | pnpm |
| CI/CD | GitHub Actions (CI en PRs, deploy a GitHub Pages) |

## Características principales

- **Modo tradicional** — todos los dígitos se revelan de golpe con animación de barajado
- **Modo manual** — revelación dígito a dígito para mayor suspenso
- **Cuenta regresiva** configurable (3-10 segundos, activada por defecto) con overlay a pantalla completa
- **Sin números repetidos** (opcional, activado por defecto): los números ya sorteados se excluyen y se muestra cuántos quedan
- **Sorteo con `crypto.getRandomValues()`**, uniforme y sin sesgo
- **Historial persistente** de ganadores con nombres editables, fecha y hora, borrado individual y exportación a CSV
- **Atajo de teclado**: Espacio o Enter para sortear / revelar el siguiente dígito
- **Pantalla completa** para proyector
- **Sonido opcional** (cuenta regresiva, revelación y fanfarria del ganador)
- **Respeta `prefers-reduced-motion`**: sin confetti ni animaciones si el sistema lo pide
- **Celebración** con confetti, globos y fuegos artificiales al anunciar el ganador
- **Configuración persistente** en `localStorage`
- **Responsive** — funciona en escritorio, tableta, móvil y pantallas de proyector

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

# Tests
pnpm test
```

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
│   ├── Layout.jsx              # Contenedor principal
│   └── Footer.jsx              # Pie de página con marca
├── context/
│   └── RaffleContext.jsx       # Estado global con Context API
├── hooks/
│   └── useLocalStorage.js      # Hook de persistencia en localStorage
└── utils/
    ├── confettiEffects.js      # runWinnerCelebration(): confetti, globos y fuegos
    ├── random.js               # Azar con crypto, selección sin repetidos, IDs
    ├── historyExport.js        # Fecha del historial y exportación CSV
    └── sound.js                # Efectos de sonido con Web Audio
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
