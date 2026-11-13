# Corrillo

Colección de 26 minijuegos sociales para jugar en grupo con un solo móvil. Es una web estática (HTML, CSS y JavaScript sin compilar): no necesita servidor, cuentas ni conexión.

## Abrirla

- **En el ordenador:** doble clic en `index.html`.
- **En el móvil, misma wifi:** doble clic en `servir.bat` (usa Python) y abre en el móvil `http://IP-DEL-PC:8000`. La IP aparece en la ventana.
- **En el móvil, desde cualquier sitio:** sube la carpeta tal cual a un alojamiento estático (GitHub Pages, Netlify, Cloudflare Pages…). Con HTTPS se puede «Añadir a pantalla de inicio» y funciona sin conexión.

## Estructura

```
index.html            Página única; carga los scripts en orden
css/styles.css        Estilos (móvil primero)
js/core/core.js       Registro de juegos, rutas, pantalla de configuración y componentes compartidos
js/content/*.js       Contenido: palabras, preguntas, retos, categorías (solo texto)
js/games/*.js         Un módulo por minijuego o familia de minijuegos
sw.js, manifest       Instalación como app y uso sin conexión
```

Cada minijuego guarda **sus propios** jugadores y ajustes en el dispositivo (`localStorage`, clave `corrillo:cfg:<id>`). No hay lista global de jugadores.

## Añadir contenido

Abre el archivo de `js/content/` correspondiente y añade líneas a la categoría que quieras. El formato de cada juego está explicado en el comentario que lo precede. Las categorías marcadas como picantes (`spicy: true` en el juego) vienen desactivadas por defecto.

## Añadir un minijuego

1. Crea `js/games/mi-juego.js` con una llamada a `Corrillo.register({...})`:
   - `id`, `name`, `emoji`, `color`, `tag`, `group` (`deduccion`, `preguntas` o `palabras`), `min`, `max` (20 por defecto)
   - `how`: pasos de «Cómo se juega»
   - `cats`: categorías de contenido (opcional)
   - `settings`: ajustes de tipo `toggle`, `step` o `select`
   - `validate(ajustes, numJugadores)`: devuelve un texto de error o `null`
   - `play(ctx)`: la partida. `ctx.players`, `ctx.s` (ajustes), `ctx.show(...)`, `ctx.endBar()`, `ctx.onExit(fn)`
2. Añade su `<script>` en `index.html` y su ruta en la lista `FILES` de `sw.js`.

Componentes reutilizables en `Corrillo`: `pass` (reparto privado pasando el móvil), `clock` (cuenta atrás), `pickGrid` (elegir jugador), `scores`, `numIn`, `secret`, `draw` (mazo sin repeticiones), `sound`.

Al publicar cambios, sube `VERSION` en `sw.js` para que los móviles descarguen la versión nueva.

## Funciones generales

- **Modo fiesta** (`js/games/fiesta.js`): encadena rondas cortas de los juegos marcados con `party: true`, con una sola lista de jugadores. Un juego es compatible si llama a `ctx.turn()` al empezar cada tarjeta o turno.
- **Contenido propio**: los juegos con `custom: { bank, hint }` muestran un cuadro en su pantalla de ajustes; lo escrito se guarda en el dispositivo como categoría «Propias».
- **Castigos** (`#/castigos`): `Corrillo.penalty(nombre)` devuelve una tarjeta con un castigo al azar, o nada si están desactivados.
- **Marcador de la noche** (`#/marcador`): `ctx.finish(nombres, puntos, unidad)` pinta la clasificación final y suma una victoria a quien gane.
- **Compartir**: `Corrillo.shareBtn(título, líneas, color)` genera una imagen con el resultado.
- **Favoritos, recientes y juego al azar** en el menú; **«Usar los de la última partida»** en la configuración de cada juego.
- **Fotos de Precio justo**: ver `img/precios/LEEME.txt`.
