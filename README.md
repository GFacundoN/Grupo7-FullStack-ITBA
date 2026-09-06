# Hermanos Jota — Muebles artesanales

Sitio de e-commerce para "Hermanos Jota", marca de muebles artesanales. Proyecto Sprint 1 — Full Stack Developer (ITBA), Grupo 7.

**Sitio en vivo:** https://gfacundon.github.io/Grupo7-FullStack-ITBA/index.html

## Tecnologías

Sitio estático, sin backend: HTML5, CSS3 y JavaScript. El carrito se guarda en `localStorage` y el catálogo de productos es un array de JS.

## Cómo verlo localmente

Abrí `index.html` en el navegador, o si tenés VS Code, click derecho → **Open with Live Server**.

## Deploy

El sitio está desplegado en **GitHub Pages**, conectado directamente a la rama main del repositorio.

- Al ser un sitio estático (sin backend ni build), no hace falta configurar build command ni variables de entorno.
- La URL pública queda fija y se actualiza sola con cada cambio aprobado en `main`.

## Integrantes

| Nombre | GitHub |
|---|---|
| Niderhaus Franco | @franNider |
| Ferreira German | @GermanFerreiraa |
| Maximo Manicchio | @maxi919 |
| Cingolani Lucio | @cingolanilucio29 |
| Gandolfo Facundo Nicolas | @GFacundoN |

## Flujo de trabajo (resumen)

- `main` = rama de entrega. `sprint-N` = integración del sprint. Ramas personales: `sprint-N-nombre-tarea`.
- Nadie pushea directo a `main` ni a `sprint-N`: todo entra por Pull Request.

```bash
git switch sprint-1
git pull origin sprint-1
git switch -c sprint-1-nombre-tarea

# ... trabajar y commitear ...

git push -u origin sprint-1-nombre-tarea
# abrir PR: base = sprint-1, compare = tu rama
```
