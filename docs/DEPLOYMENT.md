# Despliegue — Gran Rifa

## GitHub Pages (producción)

El despliegue está automatizado con GitHub Actions usando el despliegue nativo de Pages (artefacto + `actions/deploy-pages`), no una rama `gh-pages`.

### URL de producción

```
https://dyplox.github.io/Rifas-Pacorenos/
```

### CI (`.github/workflows/ci.yml`)

Se ejecuta en cada pull request (y manualmente): `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm test` → `pnpm run build`. No despliega nada.

### Workflow de deploy (`.github/workflows/deploy.yml`)

Se dispara con:

- push a `main`
- push a `feature/ux-pacorenos-medellin`
- ejecución manual (`workflow_dispatch`)

```
job build
  └─ checkout del código
       └─ setup pnpm 9 + Node 22 (con caché de pnpm)
            └─ pnpm install --frozen-lockfile
                 └─ pnpm lint
                      └─ pnpm test
                           └─ pnpm run build
                      └─ configure-pages + upload-pages-artifact (./dist)
job deploy (needs: build)
  └─ actions/deploy-pages → entorno github-pages
```

Si el lint o los tests fallan, no se despliega. Solo un despliegue corre a la vez (`concurrency: pages`, cancela el anterior).

> Como `pnpm install` usa `--frozen-lockfile`, cualquier cambio de dependencias debe incluir el `pnpm-lock.yaml` actualizado o el build falla. El lockfile debe seguir en `lockfileVersion: '9.0'` para que lo lea el pnpm 9 del CI.

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
