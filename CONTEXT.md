# Corrillo — contexto del proyecto

Documento de traspaso para continuar el desarrollo desde Claude Code (u otro asistente) sin el historial de la conversación original. Última actualización: 13 de noviembre de 2026.

## 1. Qué es

**Corrillo** es una web de minijuegos sociales para jugar en grupo, presencialmente, con un solo móvil que pasa de mano en mano. Está inspirada en la app móvil *Splash* (Cranberry Apps), pero es una web, con nombres, textos y contenido propios.

- **Propietario:** Sergio. Carpeta del proyecto: `E:\sergio\Programacion\corrillo` (Windows).
- **Público objetivo:** estudiantes universitarios españoles. Todo el texto está en español de España.
- **Estado:** 26 juegos, Modo fiesta y funciones generales. Incluye filtros del menú, copias de seguridad, historial visible, marcador editable y contenido propio en Verdad o Reto. Pruebas reproducibles en `tests/` y comprobaciones automáticas en GitHub Actions. Sergio ha probado la versión anterior en su móvil; las funciones nuevas se verifican en Chrome con tamaño de móvil.
- **Uso:** personal y no comercial, como alternativa propia a las apps de pago de este estilo.
- **Publicada:** repositorio público https://github.com/R4INYIS/corrillo (cuenta personal, no la de la empresa) y web en GitHub Pages: https://r4inyis.github.io/corrillo/ (HTTPS, se actualiza con cada push a `main`).

## 2. Decisiones del propietario (no cambiarlas sin preguntar)

1. **Web estática sin compilación.** HTML, CSS y JavaScript plano. Tiene que funcionar con doble clic en `index.html` (protocolo `file://`). Por eso **no se usan módulos ES, `fetch` de JSON, bundlers ni frameworks**: todo son `<script>` clásicos que cuelgan de un objeto global `Corrillo`.
2. **Pensada para móvil**, aunque sea web: botones grandes, una columna, sin depender de hover.
3. **Cada juego gestiona sus propios jugadores y ajustes.** No hay lista global de jugadores. Se guardan por juego en `localStorage`. La única concesión es el botón «Usar los de la última partida».
4. **Contenido apto para todos por defecto, picante opcional.** Las categorías con `spicy: true` vienen desactivadas y se marcan «🌶️ +18». Lo mismo con la lista de castigos «Beber».
5. **Enfoque universitario:** casi todos los juegos tienen una categoría «🎓 Universidad» y referencias a internet, TikTok y famosos conocidos en España.
6. **Barra de estimación «futurista»:** escala logarítmica de 0 a 1T con notación americana (K, M, **B** = mil millones, **T** = billón español), que redondea más cuanto mayor es la cifra. La puntuación usa diferencia simple, no logarítmica, y los resultados se ven en escala lineal ampliada.
7. **Fuera de alcance por ahora:** modo online con salas y servidor, y dominio propio (se publica gratis en GitHub Pages).

## 3. Cómo ejecutarla y probarla

| Qué | Cómo |
|---|---|
| Abrir en el ordenador | Doble clic en `index.html` |
| Abrir en el móvil | La web publicada: https://r4inyis.github.io/corrillo/ (se puede añadir a la pantalla de inicio) |
| Probar en el móvil sin publicar (misma wifi) | `servir.bat` (lanza `python -m http.server 8000`) y abrir `http://IP-DEL-PC:8000`. Este script no se ha usado nunca |
| Publicar cambios | `git push` a `main`; GitHub Pages actualiza la web en uno o dos minutos. Antes, subir `VERSION` en `sw.js` para que los móviles descarguen la versión nueva |
| Comprobar sintaxis | `node --check` sobre cada archivo de `js/` |
| Pruebas rápidas de lógica y contenido | `node --test tests/*.test.js` (Node 22 o posterior; sin instalar dependencias JavaScript) |
| Regresiones de interfaz y PWA | `python tests/regression.py` (Chrome; `pip install -r tests/requirements.txt`) |
| Prueba de humo | `python tests/smoke.py [id …]` (necesita `pip install playwright` y Chrome). Juega cada juego (o solo los indicados) con ajustes al azar pulsando botones al azar y falla si hay errores de JavaScript. Todos tardan 10–15 minutos |

El service worker (`sw.js`) solo se registra bajo `http(s)`, no en `file://`. Usa red primero y recupera la copia guardada también ante errores HTTP; no guarda respuestas de error ni devuelve HTML en lugar de scripts o imágenes. Solo borra cachés cuyo nombre empieza por `corrillo-v`. **Al añadir o quitar archivos hay que actualizar `FILES` y subir `VERSION`** (ahora `corrillo-v7`). El menú indica cuándo está preparado el modo sin conexión. Las actualizaciones esperan a cerrar la app o a pulsar «Actualizar» desde el menú, sin interrumpir partidas. El arranque sin conexión y la recuperación ante un HTTP 503 se comprueban en Chrome; la instalación real en Android e iPhone sigue pendiente.

## 4. Estructura de archivos

```
index.html              Página única. El orden de los <script> importa (ver abajo)
manifest.webmanifest    Datos para instalarla como app
sw.js                   Service worker (lista FILES + VERSION)
servir.bat              Servidor local para abrirla desde el móvil
README.md               Guía breve para personas
CONTEXT.md              Este documento
css/styles.css          Todos los estilos
icons/                  Icono SVG y PNG (180, 192, 512)
img/precios/            Fotos de «Precio justo» (Wikimedia Commons, libres; créditos en js/content/creditos.js)
tests/smoke.py          Prueba de humo con Playwright
js/core/core.js         Núcleo (ver sección 5)
js/core/library.js      Catálogo, contenido propio, mazos por juego, marcador y copias de seguridad
js/content/             Solo datos: palabras, preguntas, retos…
  deduccion.js            impostor, mentiroso, espia
  cifras.js               parejas de preguntas numéricas
  preguntas.js            verdadreto, probable, rompehielos, prefieres, diez, detallazo, invento, apuesto
  palabras.js             bomba, charadas, prohibidas
  universidad.js          AÑADE categorías «uni», «internet», «famosos» a los bancos anteriores + `estimaciones`
  nuevos.js               yonunca, cinco, quienlodijo, conocemos, onda, precios, castigos, impostorPares
  ampliacion.js           Tercera tanda: amplía casi todos los bancos y crea categorías nuevas (ver sección 7)
  ampliacion2.js          Cuarta tanda: 78 entradas nuevas y fuentes primarias de sus datos
  creditos.js             Generado: autor y licencia de cada foto de «Precio justo» (página #/creditos)
js/games/               Lógica de los juegos (ver tabla de la sección 6)
```

**Orden de carga en `index.html`:** `core.js` → `library.js` → contenido (`deduccion`, `cifras`, `preguntas`, `palabras`, `universidad`, `nuevos`, `ampliacion`, `ampliacion2`, `creditos`) → juegos. Las ampliaciones dependen de los bancos anteriores. El orden de los scripts de juegos es el orden del menú dentro de cada grupo.

## 5. Arquitectura (`js/core/core.js`)

Todo cuelga del global `Corrillo` (alias `C` dentro de los archivos).

### Registro y rutas
- `C.register({...})` añade un juego a `C.games`. `C.content` guarda los bancos de contenido.
- Rutas por hash: `#/` menú · `#/j/<id>` configuración · `#/j/<id>/jugar` partida · `#/marcador` · `#/castigos` · `#/creditos` · `#/datos` (copias de seguridad).
- Si se navega atrás durante una partida, se pide confirmación antes de salir.

### Definición de un juego
```js
C.register({
  id, name, emoji, color, tag,            // identidad y tarjeta del menú
  group: 'deduccion' | 'preguntas' | 'palabras',   // 'especial' + hidden:true para Modo fiesta
  min, max,                               // jugadores (max por defecto 20)
  how: ['paso 1', ...],                   // «Cómo se juega»
  cats: [{ id, label, spicy? }],          // categorías de contenido (opcional)
  settings: [{ key, label, type: 'toggle' | 'step' | 'select', def, min, max, options, help, show(s) }],
  validate(s, n) { return 'texto de error' || null; },
  party: true,                            // entra en el Modo fiesta (debe llamar a ctx.turn())
  custom: { bank: 'claveEnContent', hint: '…', fix(linea) },   // contenido propio del grupo
  play(ctx) { ... },
});
```

### El objeto `ctx` de una partida
| Miembro | Uso |
|---|---|
| `ctx.players` | Nombres ya resueltos (los vacíos pasan a «Jugador N») |
| `ctx.s` | Ajustes; `ctx.s.cats` es la lista de categorías activas |
| `ctx.show(...nodos)` | Sustituye el contenido de la pantalla |
| `ctx.onExit(fn)` | Limpieza al salir (temporizadores, listeners) |
| `ctx.alive` | `false` cuando la partida se ha cerrado; comprobar en callbacks diferidos |
| `ctx.turn()` | Llamar al empezar cada tarjeta o turno. Devuelve `true` si el Modo fiesta cambia de juego: en ese caso, `return` |
| `ctx.finish(nombres, puntos, unidad, porEquipos)` | Devuelve la pantalla de clasificación final: suma victoria al marcador de la noche, castiga al último y añade «Compartir» |
| `ctx.endBar(etiqueta)` | Botones de fin: otra partida / ajustes / menú (en fiesta: siguiente juego). Además marca como jugada la carta pendiente |
| `ctx.again()`, `ctx.setup()`, `ctx.menu()` | Navegación |

### Utilidades compartidas
- **DOM:** `C.h(tag, attrs, ...hijos)` y `C.btn(texto, fn, clases)`. Los textos de usuario se insertan siempre como nodos de texto, nunca como HTML.
- **Azar y contenido:** `C.rnd`, `C.pick`, `C.shuffle`, `C.pool(banco, cats)`.
- **Mazos sin repetir:** `C.draw(clave, pool, {keep})` saca una carta no jugada en este dispositivo ni salida en esta sesión. Queda *pendiente* y solo se guarda como jugada (`used:<clave>`) cuando termina su ronda: con `C.commit()`, al sacar la siguiente carta o al llegar a `endBar`. `C.skip(clave)` la descarta sin guardarla; salir a mitad de ronda la olvida (`C.discard()` en `stop`). `keep: false` = nunca se guarda entre sesiones. Al agotarse el mazo se baraja de nuevo. `C.unplayed(clave, pool)` y `C.forget(clave)` para consultas y reinicios.

| Juego | No repetir entre sesiones | Botón «Saltar» |
|---|---|---|
| A ojo, Precio justo, Subasta | sí | «Ya la conocemos: otra pregunta» antes de estimar/apostar |
| ¿Verdad o invento? | sí | «Ya me la sé: otra» antes de responder |
| Apuesto a que… | sí | «Cambiar de reto» antes de apostar |
| En la misma onda | **no** (una escala admite otras pistas) | «Otra escala», solo en la pantalla secreta de quien da la pista |
| Impostor, ¿Quién miente?, Espía, Impostor de cifras, Contraseña | sí | no (la carta es secreta: saltar delataría) |
| Tarjetas de fiesta (Yo nunca, Probable, Prefieres, Es un 10, Detallazo, Verdad o Reto, Rompehielos), Bomba, 5 segundos, Charadas, Prohibidas, ¿Quién lo dijo?, Conocemos | sí | no (forma parte del juego o ya hay «Siguiente») |
- **Reparto privado:** `C.pass(ctx, nombres, carta(nombre, i, avanzar), alTerminar, opciones)`. La carta puede devolver un nodo o `{ node, before() → error, noBtn }`.
- **Otros componentes:** `C.secret` (carta de papel), `C.clock` (cuenta atrás), `C.pickGrid` (elegir jugador), `C.scores`, `C.confirm`.
- **Cifras:** `C.dial({unit})` barra logarítmica 0–1T; `C.dial({min, max})` barra lineal de enteros (años). `C.big(n)` → «2,7B»; `C.bigWords(n)` → «2,7 mil millones»; `C.plot(puntos, respuesta, lineal?, zoom?)` dibuja las estimaciones sobre la barra; con `zoom = {min, max, fmt}` se amplía a escala lineal tras un segundo.
- **Funciones generales:** `C.penalty(nombre)` (tarjeta de castigo o `null`), `C.shareBtn(titulo, lineas, color)` (imagen en canvas → Web Share o descarga), `C.say(texto)` (voz del navegador), `C.sound` (pitidos con WebAudio), `C.buzz` (vibración), `C.sub` y `C.canPlay` (Modo fiesta).

### Claves de `localStorage` (prefijo `corrillo:`)
`cfg:<id>` (jugadores, ajustes y categorías conocidas de cada juego) · `used:<clave>` (cartas ya jugadas) · `custom:<id>` (contenido propio; en Verdad o Reto, `{verdad: [], reto: []}`) · `last` · `fav` · `recent` · `night` (marcador) · `pen` · `sound` · `menu` (filtros, sin lista global de jugadores).

Las categorías nuevas no picantes se activan solas en configuraciones ya guardadas gracias a la lista `known` de `cfg:<id>`.

Los ajustes numéricos se normalizan antes de guardarlos y también al cargarlos. Los nombres repetidos tras ignorar mayúsculas y espacios impiden iniciar la partida (salvo las opciones de Al azar). El marcador fusiona esas variantes de nombres anteriores y permite añadir y quitar victorias. `C.pool` elimina coincidencias entre categorías para que no aumenten la probabilidad de una tarjeta.

`library.js` define `C.catalog` (estilo y minutos orientativos con cuatro jugadores), `C.decks(g,s)` (mazos e historial de cada juego), `C.exportData`, `C.readBackup` y `C.importData`. Las copias JSON solo contienen claves de Corrillo, se validan completas antes de restaurarlas y revierten las escrituras ante falta de espacio. No incluyen las fotos ni el contenido de fábrica.

El Modo fiesta usa `s.spicy` (desactivado por defecto) para activar o excluir categorías picantes en toda la sesión; desactivado también evita «Beber» y la regla de beber de Yo nunca. No modifica los ajustes guardados de los juegos. El contenido propio no tiene clasificación automática de tono. Cada subjuego tiene su propia limpieza y botón «Saltar al siguiente juego», que descarta la tarjeta pendiente y cancela temporizadores. La vista previa muestra juegos y categorías efectivos.

## 6. Los 26 juegos

| id | Nombre | Grupo | Mín. | Archivo | Fiesta | Contenido propio |
|---|---|---|---|---|---|---|
| impostor | Impostor | deducción | 3 | impostor.js | | sí |
| mentiroso | ¿Quién miente? | deducción | 3 | mentiroso.js | | sí |
| lobos | Hombres Lobo | deducción | 4 | lobos.js | | |
| cifras | Impostor de cifras | deducción | 3 | cifras.js | | |
| espia | El Espía | deducción | 3 | espia.js | | sí |
| onda | En la misma onda | deducción | 2 | nuevos.js | | sí |
| verdadreto | Verdad o Reto | preguntas | 2 | verdadreto.js | sí | sí |
| probable | ¿Quién es más probable…? | preguntas | 3 | tarjetas.js | sí | sí |
| rompehielos | Rompehielos | preguntas | 2 | tarjetas.js | sí | sí |
| prefieres | ¿Qué prefieres? | preguntas | 2 | tarjetas.js | sí | sí |
| diez | Es un 10, pero… | preguntas | 2 | tarjetas.js | sí | sí |
| detallazo | ¿Detallazo o lo mínimo? | preguntas | 2 | tarjetas.js | sí | sí |
| invento | ¿Verdad o invento? | preguntas | 1 | puntos.js | | |
| apuesto | Apuesto a que… | preguntas | 2 | puntos.js | | |
| yonunca | Yo nunca | preguntas | 2 | nuevos.js | sí | sí |
| quienlodijo | ¿Quién lo dijo? | preguntas | 3 | nuevos.js | sí | sí |
| conocemos | ¿Cuánto nos conocemos? | preguntas | 3 | nuevos.js | | |
| aojo | A ojo | palabras | 2 | cifras.js | | |
| precio | Precio justo | palabras | 2 | cifras.js | | |
| subasta | Subasta de cifras | palabras | 2 | cifras.js | | |
| bomba | La Bomba | palabras | 2 | rapidez.js | sí | sí |
| charadas | Charadas | palabras | 2 | rapidez.js | | sí |
| prohibidas | Palabras prohibidas | palabras | 2 | rapidez.js | | |
| cinco | 5 segundos | palabras | 2 | nuevos.js | sí | sí |
| contrasena | Contraseña | palabras | 2 | nuevos.js | | |
| azar | Al azar (dedos, flecha, ruleta) | palabras | 0 | azar.js | | |

Además, `fiesta` (**Modo fiesta**, `fiesta.js`) está registrado como juego oculto: sus «categorías» son los juegos con `party: true`.

**Equivalencias con Splash** (nombres cambiados a propósito): A ojo = Circa · Impostor de cifras = Circa Impostor · ¿Detallazo o lo mínimo? = Princess Treatment · ¿Verdad o invento? = Fake or Fact · Apuesto a que… = Bet Buddy · Palabras prohibidas = Taboom · Al azar = Chooser · Rompehielos = 100 preguntas · En la misma onda = Mind Match (reglas tipo «Wavelength», definidas por Sergio) · Contraseña = «tabú inverso».

### Reglas que no son obvias leyendo el menú
- **Impostor:** modo clásico (el impostor no ve palabra; pista opcional; si lo pillan puede salvarse adivinándola) y modo «palabra parecida» (usa `impostorPares`; el impostor no sabe que lo es; ignora las categorías).
- **Hombres Lobo:** sin narrador. Cada noche el móvil pasa por todos los vivos y todos tocan un nombre para no delatar su papel. Papeles opcionales: vidente, protector, bruja, cazador, cupido. La bruja usa la poción de vida a ciegas (no ve a quién atacan). Las muertes en cadena (enamorados, disparo del cazador) las resuelve la función `die()`.
- **A ojo / Precio justo / Impostor de cifras:** se estima en la barra logarítmica, pero **gana quien tenga la menor diferencia simple** |estimación − respuesta| (decisión de Sergio, noviembre de 2026). En la pantalla de resultados la barra se amplía con animación a **escala lineal** entre la cifra más baja y la más alta, y cada jugador ve a qué distancia se quedó.
- **Subasta de cifras:** se sube la apuesta («son al menos X») o se desafía al anterior. Si la cifra real ≥ apuesta, gana quien apostó.
- **En la misma onda:** cooperativo, con una rueda semicircular (SVG) y aguja arrastrable. Franja estrecha: distancia al centro ≤3 → 4 puntos, ≤9 → 3, ≤15 → 2, más → 0. Cada escala es **un solo eje** con dos extremos opuestos de la misma cualidad («Barato ↔ Caro», «Mal regalo ↔ Buen regalo»), subjetiva para que haya debate. No mezclar dos ideas distintas en una escala (se quitó «Placer culpable ↔ Orgullo total») ni usar escalas puramente físicas. Las escalas pueden repetirse entre partidas y quien da la pista puede pedir «otra escala».
- **¿Cuánto nos conocemos?:** preguntas de dos opciones; el protagonista puntúa si acierta al menos la mitad.
- **Charadas:** ajuste opcional para marcar inclinando el móvil (`deviceorientation`, eje beta).
- **Votaciones:** en Impostor, Espía y Lobos se vota a mano alzada y se toca al más votado. Solo «¿Quién es más probable…?» tiene voto secreto en el móvil.

## 7. Contenido

2.738 entradas en total (recuento de noviembre de 2026; cada pareja cuenta como una entrada y las coincidencias entre categorías se cuentan en cada categoría). Elementos por banco de `C.content`:

| Banco | N.º | Formato de cada elemento |
|---|---|---|
| impostor | 393 | `'palabra|pista'` (la pista orienta al impostor sin regalar la palabra) |
| impostorPares | 48 | `'palabra A|palabra B'` |
| mentiroso | 104 | `'pregunta normal|pregunta distinta'` (respuestas que puedan parecerse) |
| espia | 152 | `'lugar'` |
| cifras | 60 parejas | `[pregA, respA, unidadA, pregB, respB, unidadB, min, max]` (min y max solo para años) |
| estimaciones | 54 | `[pregunta, respuesta, unidad, min, max]` |
| precios | 70 | `[título, precio, unidad, 0, 0, emoji, detalle, rutaFoto?]` |
| verdadreto | 94 + 80 | `{ verdad: {cat: [...]}, reto: {cat: [...]} }`; `{j}` = otro jugador |
| probable | 125 | frase sin el encabezado «¿Quién es más probable que…» |
| rompehielos | 102 | pregunta |
| prefieres | 96 | `'opción A|opción B'` |
| diez | 96 | la pega, sin «Es un 10, pero…» |
| detallazo | 88 | situación |
| invento | 94 | `'V o F|afirmación|explicación'` |
| apuesto | 80 | `'reto|segundos'` (0 = sin cuenta atrás) |
| bomba | 147 | categoría |
| charadas | 270 | palabra (también la usa Contraseña, salvo la categoría de películas) |
| prohibidas | 94 | `'PALABRA|vetada1,vetada2,…'` |
| yonunca | 102 | frase sin «Yo nunca» |
| cinco | 97 | consigna sin «Di tres» |
| quienlodijo | 86 | pregunta |
| conocemos | 68 | `'pregunta con {n}|opción A|opción B'` |
| onda | 72 | `'extremo izquierdo|extremo derecho'` |
| castigos | 66 | `{ suaves, retos, beber }` |
| creditos | 67 | `[ruta, qué es, autor, licencia, url]` (no es un banco de juego) |

Todos los bancos (salvo `impostorPares`, `verdadreto` y los numéricos) son objetos `{ categoría: [elementos] }`.

La cuarta tanda añade 12 parejas de cifras, 20 estimaciones, 10 afirmaciones de Verdad o invento, 20 preguntas de Quién lo dijo y 16 castigos sin alcohol. `invento` tenía realmente 84 tarjetas antes de esta tanda, aunque el documento decía 94; ahora sí son 94. Se sustituyó el Socorrista duplicado en la categoría Oficios de Charadas por Relojero. Algunas coincidencias entre categorías son deliberadas (Mago, Mimo, Influencer o Tiburón); el pool las cuenta una sola vez.

`C.sources` registra 54 preguntas o afirmaciones de esta ampliación con `{bank, question, urls, checked}`. Sus fuentes son NASA, CERN, National Park Service, la Torre Eiffel y la Ópera de Sídney. Se muestran en los resultados de estimaciones, subastas y Verdad o invento cuando están disponibles. La fecha de consulta es 2026-11-13. Los datos anteriores aún no tienen una auditoría retrospectiva completa: no dar por verificados sus valores ni asignarles una fecha de revisión inventada.

### Tipos de juego y tono
- **De fiesta** (rápidos, gamberros, picante opcional): Verdad o Reto, Yo nunca, ¿Quién es más probable…?, Es un 10 pero…, ¿Detallazo o lo mínimo?, ¿Qué prefieres?, ¿Quién lo dijo?, Apuesto a que…, La Bomba, 5 segundos, Charadas, Palabras prohibidas. Varios tienen la categoría «🎉 De fiesta» (no picante).
- **Más formales** (cultura, deducción, conversación): Impostor, ¿Quién miente?, El Espía, Hombres Lobo, Impostor de cifras, A ojo, Precio justo, Subasta, ¿Verdad o invento?, Rompehielos, ¿Cuánto nos conocemos?, En la misma onda, Contraseña. Su contenido debe tener algo de reto: en A ojo y ¿Verdad o invento? se evitan las preguntas obvias (horas de un día, «solo usamos el 10 % del cerebro»…).
- Categorías añadidas en la tercera tanda: Impostor «🎬 Películas y series» y «🌍 Países y ciudades»; ¿Quién miente? «🔢 Con números»; El Espía «🇪🇸 Muy de España»; Charadas «🎬 Películas y series»; Precio justo «🏛️ Historia y ciencia»; «🎉 De fiesta» en Probable, ¿Qué prefieres?, Yo nunca, 5 segundos y La Bomba.

### Criterios de contenido
- **Datos reales:** las afirmaciones de «¿Verdad o invento?», las cifras y los precios se eligieron por ser hechos estables y comprobables. Al añadir más, verificarlos; evitar datos discutidos o que cambien cada año.
- **Nivel de A ojo y cifras:** medio-alto. La gente debe saber más o menos por dónde va, pero no la cifra exacta. Nada de «¿cuántas horas tiene un día?», semanas del año, casillas del ajedrez, etc.
- **¿Verdad o invento?:** se quitaron los mitos que ya conoce todo el mundo (10 % del cerebro, memoria del pez, cascos vikingos…); priorizar datos poco conocidos.
- **Cifras que caducan:** usuarios de YouTube (2.700 M), Instagram y WhatsApp (3.000 M), habitantes (España 49 M, mundo 8.200 M), artículos de la Wikipedia en inglés (7 M). Son aproximadas a 2026.
- **Famosos:** solo como palabras de juego, con pistas neutras («Streamer», «Fútbol»). No atribuirles frases ni hechos inventados.
- **Tono:** humor de estudiante, sin estereotipos ofensivos.

## 8. Pendiente y sin verificar

### Fotos de «Precio justo»
67 de los 70 artículos tienen foto de Wikimedia Commons (dominio público, CC0 o CC BY/BY-SA), redimensionada a 640×400 como máximo en `img/precios/` (2,4 MB en total). Sin foto, con su emoji: «Facebook compra WhatsApp», «Fichaje de Coutinho» y «Rodar Paranormal Activity». Criterio: **sin retratos de personas reales ni logotipos protagonistas**; para fichajes y compras, imágenes genéricas (estadio, objeto relacionado). La atribución que exigen las licencias está en `js/content/creditos.js` y se muestra en `#/creditos`. Para añadir una foto: guardarla en `img/precios/`, ponerla como octavo elemento del artículo, añadir su crédito en `creditos.js` y su ruta a `FILES` en `sw.js`. Al descargar de Commons, pedir miniaturas de tamaño estándar (p. ej. 500 px): los tamaños no estándar devuelven error 429.

### Sin verificar de forma expresa
Sergio ha probado la versión anterior en su móvil sin detectar problemas. Siguen pendientes las pruebas específicas de selector de dedos multitáctil, inclinación en Charadas (en iPhone exige permiso), voz de Hombres Lobo, vibración, compartir resultado como imagen, instalación y uso sin conexión en móviles reales, y `servir.bat`. El arranque sin conexión y la recuperación ante errores de servidor sí se comprueban ahora en Chrome de escritorio con tamaño de móvil.

### Limitaciones conocidas
- Los tiempos del catálogo son orientativos; cambian según el grupo y los ajustes.
- El control de picante no clasifica automáticamente las preguntas o castigos escritos por el grupo.
- Los datos históricos anteriores a la cuarta tanda no tienen todos sus enlaces y fechas de revisión registrados.
- `CONTEXT.md` es público en el repositorio (incluye el nombre de pila del propietario y la ruta local).

### Mejoras incorporadas e ideas pendientes
- **Calidad ya incorporada:** comprobador de formatos, duplicados por categoría, recuentos, fuentes, catálogo y archivos de caché; regresiones de lógica, interfaz y uso sin conexión. GitHub Actions ejecuta estas pruebas y una prueba de humo breve en cada push a `main` y cada PR. El humo admite `--seed`, `--steps` y `--variants`.
- **Ajustes ya incorporados:** picante de fiesta, edición y normalización del marcador, contenido propio en Verdad o Reto, historial visible y reiniciable, filtros de juegos y copias JSON.
- **Estética:** tema oscuro, animaciones (giro de carta, confeti, temblor de la bomba), ilustraciones propias en lugar de emojis, sonidos con más carácter, avatares de color por jugador.
- **Juegos nuevos (reglas genéricas, nombre y textos propios):** «Solo respuestas incorrectas», «Dibujo a ciegas», «Cita, boda o huida» (picante), más papeles en Hombres Lobo. Otros de Splash tienen reglas no públicas o requieren modo online.

## 9. Convenciones de código

- Cada archivo de juego es una función autoejecutada `(function (C) { ... })(Corrillo);` con `const { h, btn } = C;`.
- Estilo compacto, comentarios en español, sin dependencias externas.
- El contenido va en `js/content/`, nunca incrustado en la lógica.
- Los estilos usan variables CSS (`--ink`, `--bg`, `--c` para el color del juego) y un lenguaje visual de borde grueso con sombra dura. El dial de estimación es la excepción deliberada (panel oscuro con neón).
- Tras cualquier cambio: `node --check` en los archivos tocados, `python tests/smoke.py` (al menos con los juegos tocados), subir `VERSION` en `sw.js`, commit y `git push` a `main` para actualizar la web.
- Git: repositorio en la cuenta personal **R4INYIS**, nunca en la organización de la empresa.

## 10. Historial resumido

1. Versión inicial: 18 juegos a partir de una especificación basada en Splash.
2. Contenido universitario en todos los juegos y categorías «Internet» y «Famosos» en Impostor.
3. Nueva barra logarítmica de estimación para A ojo e Impostor de cifras (hoy solo para estimar; la puntuación es por diferencia simple).
4. Ocho juegos nuevos, Modo fiesta, castigos, contenido propio, favoritos, marcador de la noche, compartir resultado, y mejoras en Impostor, Hombres Lobo, Charadas y A ojo.
5. Noviembre de 2026 (Claude Code): fotos de Precio justo y página de créditos; Precio justo pasa de 28 a 70 artículos; En la misma onda con rueda semicircular; A ojo e Impostor de cifras con preguntas de nivel medio-alto; revisión de todo el contenido y ampliación (`ampliacion.js`) con categorías nuevas.
6. Noviembre de 2026: git y publicación (repositorio público R4INYIS/corrillo + GitHub Pages); prueba en móvil real; escalas de En la misma onda reescritas con un solo eje; mazos que solo guardan una carta como jugada al terminar su ronda, con botón «Saltar» en los juegos donde tiene sentido; A ojo, Precio justo e Impostor de cifras puntúan por diferencia simple y muestran los resultados en escala lineal ampliada con la distancia de cada jugador.
7. Noviembre de 2026: corrección de ajustes al reducir jugadores y de la caché ante errores HTTP; filtros del menú; picante, vista previa y salto de juego en fiesta; marcador normalizado y editable; historial visible; contenido propio en Verdad o Reto; copias JSON; 78 entradas nuevas con fuentes de sus datos y pruebas automáticas de lógica, interfaz y PWA. La revisión específica de funciones móviles y los cambios estéticos quedan para la siguiente fase.
