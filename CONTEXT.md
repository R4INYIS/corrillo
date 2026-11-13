# Corrillo — contexto del proyecto

Documento de traspaso para continuar el desarrollo desde Claude Code (u otro asistente) sin el historial de la conversación original. Fecha: 13 de noviembre de 2026.

## 1. Qué es

**Corrillo** es una web de minijuegos sociales para jugar en grupo, presencialmente, con un solo móvil que pasa de mano en mano. Está inspirada en la app móvil *Splash* (Cranberry Apps), pero es una web, con nombres, textos y contenido propios.

- **Propietario:** Sergio. Carpeta del proyecto: `E:\sergio\Programacion\corrillo` (Windows).
- **Público objetivo:** estudiantes universitarios españoles. Todo el texto está en español de España.
- **Estado:** 26 juegos, modo fiesta y funciones generales terminados y probados en navegador de escritorio con tamaño de móvil. **Nunca se ha probado en un teléfono real.**
- **Publicada:** repositorio público https://github.com/R4INYIS/corrillo (cuenta personal, no la de la empresa) y web en GitHub Pages: https://r4inyis.github.io/corrillo/ (HTTPS, se actualiza con cada push a `main`).

## 2. Decisiones del propietario (no cambiarlas sin preguntar)

1. **Web estática sin compilación.** HTML, CSS y JavaScript plano. Tiene que funcionar con doble clic en `index.html` (protocolo `file://`). Por eso **no se usan módulos ES, `fetch` de JSON, bundlers ni frameworks**: todo son `<script>` clásicos que cuelgan de un objeto global `Corrillo`.
2. **Pensada para móvil**, aunque sea web: botones grandes, una columna, sin depender de hover.
3. **Cada juego gestiona sus propios jugadores y ajustes.** No hay lista global de jugadores. Se guardan por juego en `localStorage`. La única concesión es el botón «Usar los de la última partida».
4. **Contenido apto para todos por defecto, picante opcional.** Las categorías con `spicy: true` vienen desactivadas y se marcan «🌶️ +18». Lo mismo con la lista de castigos «Beber».
5. **Enfoque universitario:** casi todos los juegos tienen una categoría «🎓 Universidad» y referencias a internet, TikTok y famosos conocidos en España.
6. **Barra de estimación «futurista»:** escala logarítmica de 0 a 1T con notación americana (K, M, **B** = mil millones, **T** = billón español), que redondea más cuanto mayor es la cifra.
7. **Fuera de alcance por ahora:** modo online con salas y servidor, y dominio propio (se publica gratis en GitHub Pages).

## 3. Cómo ejecutarla y probarla

| Qué | Cómo |
|---|---|
| Abrir en el ordenador | Doble clic en `index.html` |
| Abrir en el móvil (misma wifi) | `servir.bat` (lanza `python -m http.server 8000`) y abrir `http://IP-DEL-PC:8000` en el móvil. **Este script no se ha ejecutado nunca**; comprobar que funciona |
| Comprobar sintaxis | `node --check` sobre cada archivo de `js/` |
| Prueba de humo | `python tests/smoke.py` (necesita `pip install playwright` y Chrome). Juega cada juego con ajustes al azar pulsando botones al azar y falla si hay errores de JavaScript. Tarda 10–15 minutos |

El service worker (`sw.js`) solo se registra bajo `http(s)`, no en `file://`. Usa estrategia «red primero, caché si no hay conexión». **Al añadir o quitar archivos hay que actualizar la lista `FILES` y subir `VERSION`** (ahora `corrillo-v5`). La instalación como app y el uso sin conexión no se han probado.

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
js/content/             Solo datos: palabras, preguntas, retos…
  deduccion.js            impostor, mentiroso, espia
  cifras.js               parejas de preguntas numéricas
  preguntas.js            verdadreto, probable, rompehielos, prefieres, diez, detallazo, invento, apuesto
  palabras.js             bomba, charadas, prohibidas
  universidad.js          AÑADE categorías «uni», «internet», «famosos» a los bancos anteriores + `estimaciones`
  nuevos.js               yonunca, cinco, quienlodijo, conocemos, onda, precios, castigos, impostorPares
  ampliacion.js           Tercera tanda: amplía casi todos los bancos y crea categorías nuevas (ver sección 7)
  creditos.js             Generado: autor y licencia de cada foto de «Precio justo» (página #/creditos)
js/games/               Lógica de los juegos (ver tabla de la sección 6)
```

**Orden de carga en `index.html`:** `core.js` → contenido (`deduccion`, `cifras`, `preguntas`, `palabras`, `universidad`, `nuevos`, `ampliacion`, `creditos`) → juegos. `universidad.js`, `nuevos.js` y `ampliacion.js` amplían bancos ya creados, así que deben ir después de los otros cuatro. El orden de los scripts de juegos es el orden en que aparecen en el menú dentro de cada grupo.

## 5. Arquitectura (`js/core/core.js`)

Todo cuelga del global `Corrillo` (alias `C` dentro de los archivos).

### Registro y rutas
- `C.register({...})` añade un juego a `C.games`. `C.content` guarda los bancos de contenido.
- Rutas por hash: `#/` menú · `#/j/<id>` configuración · `#/j/<id>/jugar` partida · `#/marcador` · `#/castigos` · `#/creditos` (enlazada al pie del menú).
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
| `ctx.endBar(etiqueta)` | Botones de fin: otra partida / ajustes / menú (en fiesta: siguiente juego) |
| `ctx.again()`, `ctx.setup()`, `ctx.menu()` | Navegación |

### Utilidades compartidas
- **DOM:** `C.h(tag, attrs, ...hijos)` y `C.btn(texto, fn, clases)`. Los textos de usuario se insertan siempre como nodos de texto, nunca como HTML.
- **Azar y contenido:** `C.rnd`, `C.pick`, `C.shuffle`, `C.pool(banco, cats)`, `C.draw(clave, pool)` (saca un elemento sin repetir hasta agotar el mazo; persiste en `localStorage`).
- **Reparto privado:** `C.pass(ctx, nombres, carta(nombre, i, avanzar), alTerminar, opciones)`. La carta puede devolver un nodo o `{ node, before() → error, noBtn }`.
- **Otros componentes:** `C.secret` (carta de papel), `C.clock` (cuenta atrás), `C.pickGrid` (elegir jugador), `C.scores`, `C.confirm`.
- **Cifras:** `C.dial({unit})` barra logarítmica 0–1T; `C.dial({min, max})` barra lineal de enteros (años). `C.big(n)` → «2,7B»; `C.bigWords(n)` → «2,7 mil millones»; `C.plot(puntos, respuesta, lineal?)` dibuja las estimaciones sobre la barra.
- **Funciones generales:** `C.penalty(nombre)` (tarjeta de castigo o `null`), `C.shareBtn(titulo, lineas, color)` (imagen en canvas → Web Share o descarga), `C.say(texto)` (voz del navegador), `C.sound` (pitidos con WebAudio), `C.buzz` (vibración), `C.sub` y `C.canPlay` (Modo fiesta).

### Claves de `localStorage` (prefijo `corrillo:`)
`cfg:<id>` (jugadores, ajustes y categorías conocidas de cada juego) · `used:<clave>` (cartas ya salidas) · `custom:<id>` (contenido propio) · `last` (últimos jugadores) · `fav` · `recent` · `night` (marcador) · `pen` (castigos) · `sound`.

Las categorías nuevas no picantes se activan solas en configuraciones ya guardadas gracias a la lista `known` de `cfg:<id>`.

## 6. Los 26 juegos

| id | Nombre | Grupo | Mín. | Archivo | Fiesta | Contenido propio |
|---|---|---|---|---|---|---|
| impostor | Impostor | deducción | 3 | impostor.js | | sí |
| mentiroso | ¿Quién miente? | deducción | 3 | mentiroso.js | | sí |
| lobos | Hombres Lobo | deducción | 4 | lobos.js | | |
| cifras | Impostor de cifras | deducción | 3 | cifras.js | | |
| espia | El Espía | deducción | 3 | espia.js | | sí |
| onda | En la misma onda | deducción | 2 | nuevos.js | | sí |
| verdadreto | Verdad o Reto | preguntas | 2 | verdadreto.js | sí | |
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
- **A ojo / Precio justo / Subasta:** en la escala logarítmica gana quien acierta mejor el **orden de magnitud** (distancia en log10), no la diferencia absoluta. Las preguntas de años usan barra lineal y diferencia directa.
- **Subasta de cifras:** se sube la apuesta («son al menos X») o se desafía al anterior. Si la cifra real ≥ apuesta, gana quien apostó.
- **En la misma onda:** cooperativo, con una rueda semicircular (SVG) y aguja arrastrable. Franja estrecha: distancia al centro ≤3 → 4 puntos, ≤9 → 3, ≤15 → 2, más → 0. Las escalas deben ser subjetivas y dar debate (nada de «seco ↔ mojado»).
- **¿Cuánto nos conocemos?:** preguntas de dos opciones; el protagonista puntúa si acierta al menos la mitad.
- **Charadas:** ajuste opcional para marcar inclinando el móvil (`deviceorientation`, eje beta).
- **Votaciones:** en Impostor, Espía y Lobos se vota a mano alzada y se toca al más votado. Solo «¿Quién es más probable…?» tiene voto secreto en el móvil.

## 7. Contenido

Unas 2.700 tarjetas en total tras la tercera tanda (`ampliacion.js`). Las cifras de la tabla son de antes de esa ampliación; para contarlas, en la consola: recorrer `Corrillo.content`. Elementos por banco de `C.content`:

| Banco | N.º | Formato de cada elemento |
|---|---|---|
| impostor | 257 | `'palabra|pista'` |
| impostorPares | 48 | `'palabra A|palabra B'` |
| mentiroso | 72 | `'pregunta normal|pregunta distinta'` |
| espia | 88 | `'lugar'` |
| cifras | 43 parejas | `[pregA, respA, unidadA, pregB, respB, unidadB, min, max]` |
| estimaciones | 30 | `[pregunta, respuesta, unidad, min, max]` |
| precios | 28 | `[título, precio, unidad, 0, 0, emoji, detalle, rutaFoto?]` |
| verdadreto | 64 + 54 | `{ verdad: {cat: [...]}, reto: {cat: [...]} }`; `{j}` = otro jugador |
| probable | 74 | frase sin el encabezado «¿Quién es más probable que…» |
| rompehielos | 76 | pregunta |
| prefieres | 64 | `'opción A|opción B'` |
| diez | 68 | la pega, sin «Es un 10, pero…» |
| detallazo | 62 | situación |
| invento | 64 | `'V o F|afirmación|explicación'` |
| apuesto | 62 | `'reto|segundos'` (0 = sin cuenta atrás) |
| bomba | 106 | categoría |
| charadas | 200 | palabra (también lo usa Contraseña) |
| prohibidas | 70 | `'PALABRA|vetada1,vetada2,…'` |
| yonunca | 64 | frase sin «Yo nunca» |
| cinco | 60 | consigna sin «Di tres» |
| quienlodijo | 46 | pregunta |
| conocemos | 48 | `'pregunta con {n}|opción A|opción B'` |
| onda | 50 | `'extremo izquierdo|extremo derecho'` |
| castigos | 34 | `{ suaves, retos, beber }` |

Todos los bancos (salvo `impostorPares`, `verdadreto` y los numéricos) son objetos `{ categoría: [elementos] }`.

### Tipos de juego y tono
- **De fiesta** (rápidos, gamberros, picante opcional): Verdad o Reto, Yo nunca, ¿Quién es más probable…?, Es un 10 pero…, ¿Detallazo o lo mínimo?, ¿Qué prefieres?, ¿Quién lo dijo?, Apuesto a que…, La Bomba, 5 segundos, Charadas, Palabras prohibidas. Varios tienen la categoría «🎉 De fiesta» (no picante).
- **Más formales** (cultura, deducción, conversación): Impostor, ¿Quién miente?, El Espía, Hombres Lobo, Impostor de cifras, A ojo, Precio justo, Subasta, ¿Verdad o invento?, Rompehielos, ¿Cuánto nos conocemos?, En la misma onda, Contraseña. Su contenido debe tener algo de reto: en A ojo y ¿Verdad o invento? se evitan las preguntas obvias (horas de un día, «solo usamos el 10 % del cerebro»…).
- Categorías añadidas en la tercera tanda: Impostor «🎬 Películas y series» y «🌍 Países y ciudades»; ¿Quién miente? «🔢 Con números»; El Espía «🇪🇸 Muy de España»; Charadas «🎬 Películas y series»; Precio justo «🏛️ Historia y ciencia»; «🎉 De fiesta» en Probable, ¿Qué prefieres?, Yo nunca, 5 segundos y La Bomba.

### Criterios de contenido
- **Datos reales:** las afirmaciones de «¿Verdad o invento?», las cifras y los precios se eligieron por ser hechos estables y conocidos. Al añadir más, verificarlos; evitar datos discutidos o que cambien cada año.
- **Cifras que caducan:** usuarios de YouTube (2.700 M), Instagram y WhatsApp (3.000 M), habitantes (España 49 M, mundo 8.200 M). Son aproximadas a 2026.
- **Famosos:** solo como palabras de juego, con pistas neutras («Streamer», «Fútbol»). No atribuirles frases ni hechos inventados.
- **Tono:** humor de estudiante, sin estereotipos ofensivos.

## 8. Pendiente y sin verificar

### Fotos de «Precio justo» (hecho)
67 de los 70 artículos tienen foto de Wikimedia Commons (dominio público, CC0 o CC BY/BY-SA), redimensionada a 640×400 como máximo en `img/precios/` (2,4 MB en total). Sin foto, con su emoji: «Facebook compra WhatsApp», «Fichaje de Coutinho» y «Rodar Paranormal Activity». Criterio: **sin retratos de personas reales ni logotipos protagonistas**; para fichajes y compras, imágenes genéricas (estadio, objeto relacionado). La atribución que exigen las licencias está en `js/content/creditos.js` y se muestra en `#/creditos`. Para añadir una foto: guardarla en `img/precios/`, ponerla como octavo elemento del artículo, añadir su crédito en `creditos.js` y su ruta a `FILES` en `sw.js`.
Uso personal y no comercial, como alternativa propia a las apps de pago de este estilo.

### Sin probar en un dispositivo real
- Todo en un teléfono: tamaños, teclado en pantalla, zonas seguras del iPhone.
- Selector de dedos multitáctil (Al azar).
- Inclinación en Charadas. En iPhone exige HTTPS y permiso; el sentido del eje puede necesitar ajuste.
- Narración por voz (Hombres Lobo), sonido y vibración.
- Compartir resultado como imagen (Web Share con archivos).
- Service worker, instalación como app y uso sin conexión.
- `servir.bat`.

### Limitaciones conocidas
- El marcador de la noche identifica a los jugadores por nombre exacto («Ana» ≠ «ana»).
- «Verdad o Reto» no admite contenido propio (su banco tiene dos niveles).
- En Modo fiesta cada juego usa las categorías guardadas en su propia pantalla; no hay ajuste global de picante.
- Bancos más cortos: `estimaciones` (34), `castigos` (50), `cifras` (48 parejas), `quienlodijo` (66).

### Ideas propuestas y no hechas
- **Estética:** tema oscuro, animaciones (giro de carta, confeti, temblor de la bomba), ilustraciones propias en lugar de emojis, sonidos con más carácter, avatares de color por jugador.
- **Juegos de Splash sin replicar:** Solo respuestas incorrectas, Kiss Marry Kill, y otros cuyas reglas no son públicas (Word Rush, Guess What?, Score, Buzzer Imposter, $20 Draft). Sketch It y Meme Master requieren modo online.
- **Otras:** dibujar a ciegas, más papeles en Hombres Lobo, publicar con dominio propio, modo online con salas.

## 9. Convenciones de código

- Cada archivo de juego es una función autoejecutada `(function (C) { ... })(Corrillo);` con `const { h, btn } = C;`.
- Estilo compacto, comentarios en español, sin dependencias externas.
- El contenido va en `js/content/`, nunca incrustado en la lógica.
- Los estilos usan variables CSS (`--ink`, `--bg`, `--c` para el color del juego) y un lenguaje visual de borde grueso con sombra dura. El dial de estimación es la excepción deliberada (panel oscuro con neón).
- Tras cualquier cambio: `node --check` en los archivos tocados, `python tests/smoke.py`, y subir `VERSION` en `sw.js`.

## 10. Historial resumido

1. Versión inicial: 18 juegos a partir de una especificación basada en Splash.
2. Contenido universitario en todos los juegos y categorías «Internet» y «Famosos» en Impostor.
3. Nueva barra logarítmica de estimación para A ojo e Impostor de cifras.
4. Ocho juegos nuevos, Modo fiesta, castigos, contenido propio, favoritos, marcador de la noche, compartir resultado, y mejoras en Impostor, Hombres Lobo, Charadas y A ojo.
5. Noviembre de 2026 (Claude Code): fotos de Precio justo y página de créditos; Precio justo pasa de 28 a 70 artículos; En la misma onda con rueda semicircular y escalas nuevas; A ojo e Impostor de cifras con preguntas de nivel medio-alto; revisión de todo el contenido y ampliación (`ampliacion.js`) con categorías nuevas.
