# Gran Rifa — Rifas Pacoreños

Aplicación web para realizar rifas digitales en vivo, diseñada para la comunidad **Pacoreños en Medellín**. Incluye efectos visuales de celebración, historial de ganadores y múltiples modos de revelación.

## Demo

Disponible en GitHub Pages: `https://abelgutierrezarias.github.io/Rifas-Pacorenos/`

## Tecnologías

| Categoría | Herramienta |
|-----------|-------------|
| Framework | React 19 |
| Build tool | Vite 7 |
| Estilos | CSS puro con variables |
| Animaciones | canvas-confetti |
| Gestor de paquetes | pnpm |
| CI/CD | GitHub Actions → GitHub Pages |

## Características principales

- **Modo tradicional** — todos los dígitos se revelan de golpe con animación de barajado
- **Modo manual** — revelación dígito a dígito para mayor suspenso
- **Cuenta regresiva** configurable (3-10 segundos) con overlay a pantalla completa
- **Historial persistente** de ganadores con nombres editables y timestamps
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
│   ├── Layout.jsx              # Contenedor principal
│   └── Footer.jsx              # Pie de página con marca
├── context/
│   └── RaffleContext.jsx       # Estado global con Context API
├── hooks/
│   └── useLocalStorage.js      # Hook de persistencia en localStorage
└── utils/
    └── confettiEffects.js      # Efectos de celebración (confetti + fuegos)
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
| Verde Pacoreños | `#58892B` | Ganador destacado y "¡MATRACA!" |
| Amarillo Medellín | `#F6BB31` | Confetti de celebración |
| Fondo oscuro | `#0f0f13` | Fondo general de la app |

## Licencia

Uso privado — Pacoreños en Medellín © 2025
