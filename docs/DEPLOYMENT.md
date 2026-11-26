# Despliegue — Gran Rifa

## GitHub Pages (producción)

El despliegue está automatizado con GitHub Actions usando el despliegue nativo de Pages (artefacto + `actions/deploy-pages`), no una rama `gh-pages`.

### URL de producción

```
https://dyplox.github.io/Rifas-Pacorenos/
```

### CI (`.github/workflows/ci.yml`)

Se ejecuta en cada pull request (y manualmente), con dos jobs en paralelo. No despliega nada.

- `verify`: `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm test` → `pnpm run build`
- `e2e`: instala Chromium y ejecuta `pnpm test:e2e` (6 tamaños de pantalla, flujo con teclado, PWA sin conexión). Si falla, sube el reporte de Playwright como artefacto (`playwright-report`, 7 días).

### Workflow de deploy (`.github/workflows/deploy.yml`)

Se dispara con:

- push a `main`
- push a `feature/ux-pacorenos-medellin`
- ejecución manual (`workflow_dispatch`)

```
job build
  └─ checkout del código
       └─ setup pnpm (versión de packageManager) + Node 22 (con caché)
            └─ pnpm install --frozen-lockfile
                 └─ pnpm lint
                      └─ pnpm test
                           └─ pnpm run build
                      └─ configure-pages + upload-pages-artifact (./dist)
job deploy (needs: build)
  └─ actions/deploy-pages → entorno github-pages
```

Si el lint o los tests fallan, no se despliega. Solo un despliegue corre a la vez (`concurrency: pages`, cancela el anterior).

> Como `pnpm install` usa `--frozen-lockfile`, cualquier cambio de dependencias debe incluir el `pnpm-lock.yaml` actualizado o el build falla. La versión de pnpm se fija en el campo `packageManager` de `package.json`; `pnpm/action-setup` la lee de ahí, así que local y CI usan la misma.

### Configuración del base path

Vite necesita saber que la app vive bajo `/Rifas-Pacorenos/` y no en la raíz del dominio. Esto se configura en `vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  base: '/Rifas-Pacorenos/',
})
```

Sin este `base`, los assets (JS, CSS, imágenes) no se cargarían en GitHub Pages. Si se renombra el repositorio, hay que actualizarlo.

## Despliegue manual

Si necesitas desplegar manualmente:

```bash
pnpm build
# El contenido de dist/ es la app lista para servir como archivos estáticos
```

Cualquier servidor de archivos estáticos (Nginx, Apache, Netlify, Vercel) puede servir el contenido de `dist/` directamente.

### Consideraciones para otros hosts

Si cambias el host y la app no vive en `/Rifas-Pacorenos/`, actualiza el campo `base` en `vite.config.js`:

```js
// Para raíz del dominio
base: '/'

// Para subpath personalizado
base: '/mi-subpath/'
```

## PWA y caché

`vite-plugin-pwa` genera en el build `manifest.webmanifest`, `sw.js` (Workbox) y `registerSW.js`. El service worker precachea todo el build, así que tras la primera visita la app abre y funciona sin conexión.

- Con `registerType: 'autoUpdate'`, cuando se despliega una versión nueva el service worker la descarga y la activa en la siguiente carga.
- Los iconos (`public/pwa-192x192.png`, `pwa-512x512.png`, `maskable-512x512.png`, `apple-touch-icon.png`) se generaron a partir de `src/assets/images/pacomede.jpg`.
- En `pnpm dev` el service worker está desactivado; para probarlo usar `pnpm build && pnpm preview` (o `pnpm test:e2e pwa`).

## Dependabot

`.github/dependabot.yml` abre PRs semanales para dependencias npm (un PR agrupado para minor/patch, uno por cada major) y mensuales para las GitHub Actions. El CI valida cada PR.

## Variables de entorno

La app no usa variables de entorno. Toda la configuración es en cliente vía `localStorage`.

Si en el futuro se agregan variables de entorno de build, definirlas en un archivo `.env` (no comiteado) y exponerlas con el prefijo `VITE_`:

```
VITE_MI_VARIABLE=valor
```

Acceso en el código:

```js
const valor = import.meta.env.VITE_MI_VARIABLE;
```

## Ramas de despliegue

| Rama | Acción |
|------|--------|
| `main` | Deploy automático a producción (GitHub Pages) |
| `feature/ux-pacorenos-medellin` | También despliega a producción (mismo entorno) |
| Pull requests | CI: lint + tests + build, sin deploy |
