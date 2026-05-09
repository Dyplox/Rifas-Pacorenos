# Despliegue — Gran Rifa

## GitHub Pages (producción)

El despliegue está completamente automatizado con GitHub Actions. Cada push a `main` desencadena el workflow de CI/CD.

### URL de producción

```
https://abelgutierrezarias.github.io/Rifas-Pacorenos/
```

### Workflow (`.github/workflows/deploy.yml`)

```
push a main
  └─ checkout del código
       └─ setup Node 20 + pnpm 9
            └─ pnpm install
                 └─ pnpm build
                      └─ deploy dist/ → gh-pages branch
```

### Configuración del base path

Vite necesita saber que la app vive bajo `/Rifas-Pacorenos/` y no en la raíz del dominio. Esto se configura en `vite.config.js`:

```js
export default defineConfig({
  base: '/Rifas-Pacorenos/',
  plugins: [react()],
})
```

Sin este `base`, los assets (JS, CSS, imágenes) no se cargarían en GitHub Pages.

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

La app no usa variables de entorno de servidor. Toda la configuración es en cliente vía `localStorage`.

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
| Otras ramas | Solo CI (lint + build), sin deploy |
