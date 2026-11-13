# Corrillo

Colección de 28 minijuegos sociales para jugar en grupo con un solo móvil. Es una web estática (HTML, CSS y JavaScript sin compilar): no necesita servidor, cuentas ni conexión.

## Abrirla

- **En el ordenador:** doble clic en `index.html`.
- **En el móvil, misma wifi:** doble clic en `servir.bat` (usa Python) y abre en el móvil `http://IP-DEL-PC:8000`. La IP aparece en la ventana.
- **En el móvil, desde cualquier sitio:** sube la carpeta tal cual a un alojamiento estático (GitHub Pages, Netlify, Cloudflare Pages…). Con HTTPS se puede «Añadir a pantalla de inicio» y funciona sin conexión.
- **Web publicada:** https://r4inyis.github.io/corrillo/. El menú indica cuándo está lista para usar sin conexión y avisa de nuevas versiones, que se pueden aplicar entre partidas.

## Estructura

```
index.html            Página única; carga los scripts en orden
css/styles.css        Estilos (móvil primero)
js/core/core.js       Registro de juegos, rutas, pantalla de configuración y componentes compartidos
js/core/library.js    Catálogo, historial, contenido propio y copias de seguridad
js/core/rules.js      Resultados, equipos, roles y votaciones
js/core/experience.js Privacidad, pausa, modo invitado y grupos guardados
js/core/catalogue.js  Identidades, etiquetas, editor visual y feedback
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

Al editar contenido ejecuta `node tools/catalogue.cjs`: conserva los IDs y alias del historial. Registra cambios factuales con su referencia, fecha, contexto y precisión en `revision.js` o `referencias.js`. Al publicar, sube `VERSION` en `sw.js` y ejecuta `node tools/offline.cjs` después del último cambio de recursos. Este último normaliza finales de línea y fija sus hashes de integridad. Las pruebas detectan hashes desactualizados.

## Funciones generales

- **Modo fiesta** (`js/games/fiesta.js`): combina los 28 juegos, partidas rápidas o completas, modalidad oral/privada y uso mínimo del móvil. Permite final por juegos o ciclos y resumen con resultados parciales. Las competiciones completan ciclos; saltarlas no concede victorias incompletas.
- **Contenido propio**: editor visual con vista previa, entrada masiva avanzada y guardado expreso; incluye Prohibidas. Los grupos guardados se importan como copias independientes por juego.
- **Castigos** (`#/castigos`): `Corrillo.penalty(nombre)` devuelve una tarjeta con un castigo al azar, o nada si están desactivados.
- **Marcador de la noche** (`#/marcador`): solo competiciones completas conceden victorias. Los primeros empatados ganan si queda alguien por debajo, incluso con negativos; empate total y cooperación no suman victorias individuales.
- **Compartir**: `Corrillo.shareBtn(título, líneas, color)` genera una imagen con el resultado.
- **Favoritos, recientes y juego al azar** en el menú; **«Usar los de la última partida»** en la configuración de cada juego.
- **Fotos de Precio justo**: ver `img/precios/LEEME.txt`.

El menú permite filtrar por número de jugadores, duración aproximada y estilo. «Al azar» respeta esos filtros. La búsqueda y los filtros se conservan al volver al menú, pero se limpian al recargar la página; no se guardan en las copias. Hay un contador de juegos disponibles y botones para limpiar la búsqueda o recuperar todos los juegos si no hay coincidencias. Los tiempos son orientativos para una partida breve con cuatro personas; los jugadores y ajustes siguen guardándose por juego.

El Modo fiesta tiene «Todos compatibles», «Solo rápidos» y «Quitar todos», un control de picante para toda la sesión, vista previa de las categorías y botón para saltar al siguiente juego. Se conserva la selección anterior al actualizar; los juegos adicionales se activan expresamente. El control de picante desactivado también evita los castigos y la regla de beber. El tono de las tarjetas propias depende de quien las escriba.

Las confirmaciones se pueden recorrer con Tab y cancelar con Escape; el foco vuelve al botón que las abrió. Las barras de estimación y la rueda de En la misma onda admiten flechas, Inicio y Fin. Los botones + y − también responden a activaciones de teclado y accesibilidad.

El marcador fusiona nombres que solo difieran en mayúsculas o espacios y permite corregir victorias. Cada configuración muestra cuántas tarjetas quedan y permite reiniciar su historial. Verdad o Reto admite preguntas y retos propios en dos apartados.

**Copias de seguridad**, al pie del menú, descarga o restaura un JSON con nombres, preguntas, ajustes, historial y marcador. La restauración valida todo el archivo antes de escribir y conserva los datos anteriores si falta espacio. Los datos se quedan en tu dispositivo; guarda la copia donde prefieras.

**Nuevos juegos:** Ranking a ciegas y Pista única. **Charadas → Cuatro rondas por equipos** contiene las cuatro fases de descripción, una palabra, mímica y sonidos: mismo mazo, turnos de 60 s y siguiente fase para el equipo posterior al que agota el mazo. Admite dos o más equipos y aportaciones de sesión.

Impostor y Espía ofrecen rápida y supervivencia, solo reparto o seguimiento, votos secretos opcionales y desempate. Los infiltrados no se conocen entre sí. Bomba permite pasar el móvil sin pulsar, seleccionar víctima tras la explosión y jugar por explosiones o vidas. Se conservan modalidades individuales, cooperativas, por equipos y orales donde corresponden.

El panel de partida permite cambiar sonido/vibración, pausar y consultar reglas públicas. Los secretos se cubren al ir a segundo plano; la pausa del tiempo es configurable. Mantener pulsado para ver roles es opcional. Los castigos están desactivados inicialmente y pueden cambiarse sin límite; los filtros de materiales, apps, terceros, contacto, esfuerzo y exposición son opcionales.

**Datos y preferencias** incluye modo invitado sin autoguardado, borrado selectivo, exportación e informes locales sobre tarjetas. Un enlace prepara una issue de GitHub: el usuario decide publicarla allí con su cuenta; la app no envía informes automáticamente.

Los **338 datos factuales** (120 preguntas de cifras, 54 estimaciones, 70 precios y 94 afirmaciones V/F) tienen referencia, fecha, contexto y precisión en `Corrillo.sources`. Se distinguen estimaciones publicadas, precios de lanzamiento, acuerdos y subastas. Las seis categorías V/F están equilibradas. El historial factual compartido entre A ojo, Subasta e Impostor de cifras viene activado y migra el historial anterior; se puede usar por separado.

La caché sirve una versión coherente de la aplicación; las fotos se descargan aparte. Una foto ausente tiene alternativa visual y no impide usar los otros juegos sin conexión. El menú informa de las fotos pendientes y permite reintentarlas.

## Comprobar cambios

```powershell
node --test tests/*.test.js
python -m pip install -r tests/requirements.txt
python tests/regression.py
python tests/audit_regression.py
python tests/offline_update.py
python tests/smoke.py --seed 20261113 --variants 1 --steps 40
python tests/visual_review.py
```

Las pruebas de navegador usan Chrome instalado. Para usar Chromium de Playwright, ejecuta `python -m playwright install chromium` y define `CHROME_CHANNEL=chromium`. La prueba de humo también acepta ids de juegos, `--steps`, `--variants` y `--seed`. La suite comprueba configuración, mazos, puntuación y empates, Modo fiesta, copias, contenido y funcionamiento sin conexión. GitHub Actions ejecuta estas comprobaciones en cada push a `main` y cada pull request.
