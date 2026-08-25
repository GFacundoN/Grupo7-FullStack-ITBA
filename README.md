# Grupo 7 - Full Stack Developer ITBA

## Integrantes

| Nombre | Usuario de GitHub |
|---|---|
| Niderhaus Franco | @franNider |
| Ferreira German | @GermanFerreiraa> |
| Maximo Manicchio | @maxi919 |
| Cingolani Lucio | @cingolanilucio29 |
| Gandolfo Facundo Nicolas | @GFacundoN |

# Guía de trabajo con Git y GitHub

Esta sección documenta el flujo de trabajo que usamos como equipo. El objetivo es que todos podamos trabajar en paralelo sin pisarnos los cambios y que el historial del repositorio quede ordenado y trazable por sprint.

## Modelo de ramas

```
main                    ← siempre contiene el último sprint aprobado
 └── sprint-1           ← rama de integración del Sprint 1
      ├── sprint-1-fran-html-home
      ├── sprint-1-maxi-js-formulario
      └── sprint-1-lucio-css-base
 └── sprint-2           ← se crea desde main una vez cerrado el Sprint 1
      └── ...
```

Reglas del modelo:

1. **`main`** es la rama de corrección. En todo momento debe reflejar el sprint que corresponde entregar. Nunca se trabaja directamente sobre `main`.
2. **`sprint-N`** es la rama de integración del sprint en curso. Se crea a partir de `main` al comenzar el sprint. Nunca se trabaja directamente sobre ella: recibe cambios únicamente por Pull Request.
3. **Ramas personales** (`sprint-N-nombre-tarea`) son donde cada uno trabaja. Se crean a partir de `sprint-N` y vuelven a `sprint-N` por Pull Request.

> **Importante:** las ramas personales usan guiones, no barras (`sprint-1-nico-css` y **no** `sprint-1/nico-css`). Git no permite que exista una rama `sprint-1` y a la vez ramas que empiecen con `sprint-1/`.

## Requisitos previos

- Git instalado ([git-scm.com/downloads](https://git-scm.com/downloads)).
- Cuenta de GitHub con acceso al repositorio.
- Configuración de identidad, una sola vez por computadora:

```bash
git config --global user.name "Nombre Apellido"
git config --global user.email "correo@ejemplo.com"
```

## 1. Clonar el repositorio

Se hace una única vez, en la carpeta donde quieran guardar el proyecto:

```bash
git clone <URL-del-repositorio>
cd <nombre-del-repositorio>
```

Para verificar que quedó bien:

```bash
git status
git branch -a
```

## 2. Crear la rama personal del sprint

Antes de empezar a trabajar, siempre partan de la rama del sprint actualizada:

```bash
git switch sprint-1
git pull origin sprint-1
git checkout -b sprint-1-nombre-tarea
```

`git checkout -b` crea la rama nueva y te para sobre ella. Confirmá en qué rama estás con:

```bash
git branch --show-current
```
O simplemente con:
```bash
git status
```

**Convención de nombres:** `sprint-<número>-<nombre>-<tarea>`
Ejemplos: `sprint-1-ana-html-home`, `sprint-1-luis-js-validaciones`, `sprint-2-nico-css-responsive`.

## 3. Guardar y subir los cambios

Después de editar archivos:

```bash
git status                          # ver qué archivos cambiaron
git add .                           # preparar todos los cambios
git commit -m "Agrega estructura HTML de la página de contacto"
git push -u origin sprint-1-nombre-tarea
```

El `-u` solo hace falta en el **primer** push de la rama. Después alcanza con:

```bash
git push
```

**Formato de los mensajes de commit:** en presente, describiendo qué hace el cambio.

- Correcto: `Agrega validación del formulario de contacto`, `Corrige alineación del footer en mobile`
- Evitar: `cambios`, `arreglos`, `subo lo de hoy`, `asdasd`

## 4. Abrir un Pull Request hacia la rama del sprint

1. Entrar al repositorio en GitHub.
2. GitHub muestra un cartel con la rama recién subida y el botón **Compare & pull request**. Si no aparece, ir a la pestaña **Pull requests** → **New pull request**.
3. **Verificar las dos ramas del PR**, este es el paso más importante:
   - `base:` **`sprint-1`** ← GitHub selecciona `main` por defecto, hay que cambiarlo manualmente.
   - `compare:` `sprint-1-nombre-tarea` (la rama propia).
4. Poner un título descriptivo y, en la descripción, un resumen corto de qué se hizo.
5. **Create pull request**.
6. Avisar por el grupo para que otro integrante lo revise. Los PR los mergea el revisor, no el autor.

Una vez mergeado el PR, la rama personal se puede borrar desde el botón **Delete branch** que aparece en el mismo PR.

## 5. Mantener la rama personal actualizada

Si mientras trabajás se mergearon otros PR a `sprint-1`, traé esos cambios a tu rama antes de seguir:

```bash
git switch sprint-1
git pull origin sprint-1
git switch sprint-1-nombre-tarea
git merge sprint-1
```

Hacer esto seguido reduce la cantidad y el tamaño de los conflictos.

### Si aparece un conflicto

Git marca los archivos en conflicto con este formato:

```
<<<<<<< HEAD
código de tu rama
=======
código que viene de sprint-1
>>>>>>> sprint-1
```

Hay que editar el archivo dejando la versión final correcta y borrando las líneas `<<<<<<<`, `=======` y `>>>>>>>`. Después:

```bash
git add <archivo-en-conflicto>
git commit
```

Si el conflicto toca código de otro integrante, resolverlo entre ambos antes de commitear.

## 6. Cierre de sprint: pasar a `main`

Cuando todos los PR del sprint están mergeados en `sprint-N` y el equipo verificó que el sitio funciona correctamente:

1. Probar la rama `sprint-N` completa: abrir las cuatro páginas, revisar navegación, formularios, estilos y consola del navegador sin errores.
2. Abrir un Pull Request con `base: main` y `compare: sprint-N`.
3. Mergear ese PR.

A partir de ese momento, `main` contiene el sprint listo para corrección.

**La rama `sprint-N` no se borra**: queda como registro del trabajo de ese sprint.

## 7. Comenzar el sprint siguiente

Una vez que el sprint anterior está en `main`:

```bash
git switch main
git pull origin main
git switch -c sprint-2
git push -u origin sprint-2
```

Después, cada integrante crea su rama personal a partir de `sprint-2`, como en el paso 2.

## Comandos de referencia rápida

| Acción | Comando |
|---|---|
| Ver estado del repositorio | `git status` |
| Ver en qué rama estoy | `git branch --show-current` |
| Listar todas las ramas | `git branch -a` |
| Cambiar de rama | `git switch <rama>` |
| Crear rama nueva y cambiarme a ella | `git switch -c <rama>` |
| Traer los cambios del remoto | `git pull origin <rama>` |
| Preparar cambios | `git add .` |
| Confirmar cambios | `git commit -m "mensaje"` |
| Subir cambios | `git push` |
| Ver historial resumido | `git log --oneline --graph --all` |
| Descartar cambios de un archivo sin commitear | `git restore <archivo>` |

## Situaciones frecuentes

**Hice cambios estando parado en la rama equivocada (todavía sin commit).**
Los cambios se pueden llevar a otra rama:

```bash
git stash
git switch <rama-correcta>
git stash pop
```

**Mi `push` fue rechazado con `rejected — fetch first`.**
El remoto tiene commits que no tenés localmente:

```bash
git pull origin <tu-rama>
git push
```

**Abrí el PR contra `main` por error.**
No hace falta cerrarlo: en el mismo PR, hacer clic sobre la rama base (`main`) y seleccionar `sprint-N`.

**Quiero volver a como estaba un archivo antes de tocarlo (sin commitear).**

```bash
git restore <archivo>
```

## A tener en cuenta

- No se hace `push` directo a `main` ni a `sprint-N`. Todo entra por Pull Request.
- No se commitea código comentado ni archivos de prueba (`test.html`, `copia de index.html`, etc.).
- Antes de empezar a trabajar: `git pull` sobre la rama del sprint.
- Los archivos compartidos (`css/styles.css`, `js/main.js`) se coordinan por el grupo antes de editarlos, para evitar conflictos grandes.
