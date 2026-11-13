/* Contenido de los juegos y funciones añadidos en la segunda tanda. */
(function (K) {
  /* ---------- Yo nunca (la app añade «Yo nunca…» delante) ---------- */
  K.yonunca = {
    uni: ['he copiado en un examen', 'me he dormido en clase', 'he entregado un trabajo hecho por una IA', 'he ido a un examen sin haber estudiado nada', 'he fingido estar enfermo para no exponer', 'he suspendido una asignatura más de dos veces', 'he ido a clase sin dormir', 'he dejado tirado a mi grupo en un trabajo', 'he llorado por una nota', 'he mentido a mis padres sobre mis notas', 'he salido de fiesta la noche antes de un examen', 'he discutido con un compañero de piso por la limpieza', 'me he comido la comida de un compañero de piso', 'he pedido una revisión solo por probar suerte', 'he pensado en dejar la carrera', 'he puesto una excusa falsa a un profesor por correo', 'he estado una semana entera sin ir a clase', 'he estudiado un temario que no entraba'],
    clasico: ['he mandado un mensaje a la persona equivocada', 'me he reído en un momento serio', 'he fingido que conocía una canción', 'he stalkeado a alguien hasta 2015', 'he dado «me gusta» sin querer a una foto antigua', 'me he quedado dormido en el transporte y me he pasado de parada', 'he roto algo y he culpado a otro', 'he regalado algo que me habían regalado', 'he hablado solo en voz alta por la calle', 'he ignorado una llamada mirando cómo sonaba', 'he mentido sobre mi edad', 'he dicho «ya estoy llegando» desde la cama', 'he buscado mis síntomas en internet y me he asustado', 'me he hecho pasar por otra persona al teléfono', 'he fingido que me gustaba un regalo', 'he saludado a alguien que no me saludaba a mí'],
    aventuras: ['he perdido un avión o un tren', 'he viajado solo', 'me he colado en un sitio sin pagar', 'he dormido en un aeropuerto o una estación', 'me he bañado en el mar de noche', 'he hecho autostop', 'he estado más de 24 horas despierto', 'me he perdido en una ciudad extranjera', 'he salido en la tele', 'he saltado desde un sitio muy alto al agua', 'he ido a un festival de varios días', 'he comido algo sin saber qué era', 'he hecho un viaje sin plan ni alojamiento', 'me he quedado encerrado en algún sitio'],
    picante: ['he besado a alguien de este grupo', 'he ligado con alguien solo por aburrimiento', 'he vuelto con un ex', 'he mandado un mensaje a un ex estando de fiesta', 'he tenido una cita desastrosa', 'he mentido en una aplicación de citas', 'me he liado con alguien cuyo nombre no recuerdo', 'he tenido un lío con alguien de clase', 'he hecho ghosting', 'me he despertado sin saber dónde estaba', 'he besado a más de una persona en la misma noche', 'me he enamorado de alguien con pareja', 'he fingido que no veía a alguien con quien me lié', 'he tenido un crush con un profesor', 'he mirado el móvil de una pareja', 'he dicho «te quiero» sin sentirlo'],
  };

  /* ---------- 5 segundos (la app añade «Di tres…») ---------- */
  K.cinco = {
    uni: ['carreras que no estudiarías', 'excusas para entregar tarde', 'cosas que llevas a la biblioteca', 'asignaturas que odia todo el mundo', 'cosas que hay en la nevera de un piso de estudiantes', 'frases que dice un profesor el primer día', 'cosas que haces en vez de estudiar', 'ciudades para irse de Erasmus', 'cosas que se piden en la cafetería', 'motivos para faltar a clase', 'tipos de compañero de trabajo en grupo', 'cosas que se oyen antes de un examen', 'aplicaciones que usas en clase', 'streamers o youtubers'],
    facil: ['frutas', 'marcas de coches', 'cosas rojas', 'animales con plumas', 'países de Europa', 'deportes de equipo', 'cosas que hay en un baño', 'nombres que empiezan por A', 'sabores de pizza', 'cosas que llevas en los bolsillos', 'superhéroes', 'instrumentos musicales', 'cosas que se hacen en la playa', 'capitales', 'series', 'cantantes', 'cosas frías', 'animales marinos'],
    ingenio: ['cosas que no dirías en una entrevista de trabajo', 'excusas para llegar tarde', 'cosas que no caben en una maleta', 'malos nombres para un perro', 'cosas que dan vergüenza ajena', 'malos regalos de cumpleaños', 'cosas que nunca harías un lunes', 'formas de romper el hielo', 'cosas que se hacen a escondidas', 'cosas que empeoran con kétchup', 'palabras que suenan a insulto y no lo son', 'usos para un calcetín suelto', 'cosas que no se dicen en un ascensor', 'títulos para tu autobiografía', 'malos lemas para una universidad', 'cosas más lentas que la secretaría'],
    picante: ['frases para ligar', 'sitios para una primera cita', 'cosas que no dirías en una primera cita', 'motivos para dejar a alguien', 'red flags', 'apodos cariñosos', 'cosas que haces cuando te gusta alguien', 'excusas para irte de una cita', 'cosas que no le dirías a tu suegra', 'cosas que se dicen después de tres copas', 'canciones para dedicar a un ex', 'señales de que le gustas a alguien'],
  };

  /* ---------- ¿Quién lo dijo? ---------- */
  K.quienlodijo = {
    uni: ['¿Cuál es la peor excusa que le has puesto a un profesor?', '¿Qué es lo más raro que has hecho en época de exámenes?', '¿Qué harías si aprobaras todo sin estudiar el resto de la carrera?', '¿Cuál es tu opinión impopular sobre tu carrera?', '¿Qué cambiarías de la universidad mañana mismo?', '¿Cuál ha sido tu mayor desastre en un trabajo en grupo?', '¿Qué es lo más triste que has cenado este curso?', '¿Qué asignatura inventarías?', '¿Qué título tendría una película sobre tu vida universitaria?', '¿Qué es lo peor de vivir en un piso compartido?', '¿Qué le dirías a tu yo de primero?', '¿Cuál es tu técnica secreta para aprobar?'],
    clasico: ['¿Cuál es tu opinión más impopular sobre la comida?', '¿Qué harías con un millón de euros en 24 horas?', '¿Qué superpoder inútil te gustaría tener?', '¿Cuál es tu miedo más absurdo?', '¿Qué es lo último que buscaste en internet?', '¿Qué prohibirías si mandaras un día?', '¿Cuál es la peor moda que has seguido?', '¿Qué título le pondrías a tu autobiografía?', '¿Qué mentira piadosa dices más a menudo?', '¿Qué cosa creías de pequeño que era totalmente falsa?', '¿Qué talento oculto tienes?', '¿Qué harías si fueras invisible una hora?', '¿Cuál es tu placer culpable?', '¿Qué frase dices demasiado?'],
    grupo: ['Describe a este grupo con una sola palabra.', '¿Quién de aquí acabará siendo famoso y por qué?', '¿Cuál es el mejor recuerdo que tienes con alguien de aquí?', '¿Qué mote le pondrías a la persona de tu derecha?', '¿Quién de aquí sobreviviría menos en una isla desierta y por qué?', '¿Qué harías si te tocara vivir un mes con todos los de aquí?', '¿Qué serie protagonizaría este grupo?', '¿Qué regalo le harías a la persona de tu izquierda?', '¿Quién de aquí sería peor compañero de piso y por qué?', '¿Qué plan le falta por hacer a este grupo?'],
    picante: ['¿Cuál es tu peor frase para ligar?', '¿Qué es lo más vergonzoso que has hecho por alguien que te gustaba?', '¿Cuál es tu mayor red flag?', '¿Qué es lo primero en lo que te fijas de alguien?', '¿Cuál ha sido tu peor cita?', '¿Qué te quita las ganas de inmediato?', '¿Qué pondrías en tu perfil de citas si fueras sincero?', '¿Qué es lo más loco que has hecho estando de fiesta?', '¿Con qué famoso tendrías una cita?', '¿Cuál es tu excusa favorita para irte de una cita?'],
  };

  /* ---------- ¿Cuánto nos conocemos?: «pregunta con {n}|opción A|opción B» ---------- */
  K.conocemos = {
    uni: ['¿Cómo estudia {n}?|Con semanas de antelación|La noche antes', '¿Dónde estudia mejor {n}?|En la biblioteca|En casa', '¿Qué prefiere {n}?|Examen tipo test|Examen a desarrollar', '¿Qué haría {n} con una clase a las ocho?|Ir siempre|Pedir los apuntes', '¿En un trabajo en grupo, {n}…?|Lo organiza todo|Hace lo que le digan', '¿Qué prefiere {n}?|Aprobar todo con un cinco|Arriesgar por la nota', '¿{n} se iría de Erasmus…?|A una ciudad de fiesta|A un sitio tranquilo', '¿{n} en primera fila o al fondo?|Primera fila|Al fondo', '¿Qué come {n} en exámenes?|Tupper casero|Lo que pille', '¿{n} repetiría su carrera?|Sí, sin dudar|Elegiría otra', '¿Qué prefiere {n}?|Clase presencial|Clase online', '¿{n} después de un examen…?|Lo comenta todo|No quiere ni oír hablar'],
    gustos: ['¿Qué prefiere {n}?|Playa|Montaña', '¿Qué prefiere {n}?|Dulce|Salado', '¿Qué prefiere {n}?|Perros|Gatos', '¿Qué prefiere {n}?|Madrugar|Trasnochar', '¿Qué prefiere {n}?|Peli en casa|Salir de fiesta', '¿Qué prefiere {n}?|Verano|Invierno', '¿Qué prefiere {n}?|Pizza|Hamburguesa', '¿Qué prefiere {n}?|Llamar|Escribir', '¿Qué prefiere {n}?|Tortilla con cebolla|Tortilla sin cebolla', '¿Qué prefiere {n}?|Café|Té', '¿Qué prefiere {n}?|Ciudad grande|Pueblo', '¿Qué prefiere {n}?|Series|Películas', '¿Qué prefiere {n}?|Instagram|TikTok', '¿Qué prefiere {n}?|Viaje organizado|Improvisar'],
    caracter: ['¿{n} en una discusión…?|Quiere tener razón|Prefiere dejarlo pasar', '¿{n} llega…?|Antes de tiempo|Tarde', '¿{n} con el dinero es…?|Ahorrador|Gastador', '¿{n} en un grupo nuevo…?|Habla con todos|Espera a que le hablen', '¿{n} ante un problema…?|Lo cuenta|Se lo guarda', '¿{n} es más de…?|Planificar|Dejarse llevar', '¿{n} cuando se enfada…?|Lo dice al momento|Se calla y se le pasa', '¿{n} con los secretos…?|Es una tumba|Se le escapan', '¿{n} en un karaoke…?|Coge el micro|Se esconde', '¿{n} con una mala noticia prefiere…?|Saberla ya|Enterarse lo más tarde posible', '¿{n} es más…?|De cabeza|De corazón', '¿{n} en una fiesta…?|Es el último en irse|Se va a la francesa'],
    picante: ['¿{n} en una primera cita…?|Paga todo|Paga a medias', '¿{n} cuando le gusta alguien…?|Da el primer paso|Espera', '¿{n} volvería con un ex?|Sí|Jamás', '¿{n} cree en el amor a primera vista?|Sí|No', '¿Qué prefiere {n}?|Relación larga|Rollos sin compromiso', '¿{n} tras una cita mala…?|Lo dice claro|Hace ghosting', '¿{n} es celoso?|Bastante|Casi nada', '¿{n} liga más…?|En persona|Por mensajes', '¿{n} perdonaría una infidelidad?|Podría|Nunca', '¿{n} presentaría rápido a su pareja?|Enseguida|Tardaría meses'],
  };

  /* ---------- En la misma onda: «extremo izquierdo|extremo derecho» ----------
     Cada escala es UN solo eje con dos extremos opuestos (de «poco» a «mucho» de la misma cualidad).
     Tiene que ser subjetiva para que haya debate, pero sin mezclar dos ideas distintas. */
  K.onda = {
    uni: [
      'Asignatura fácil|Asignatura imposible', 'Carrera con poco futuro|Carrera con mucho futuro', 'Excusa que cuela|Excusa que no cuela',
      'Mal sitio para estudiar|Buen sitio para estudiar', 'Comida de estudiante triste|Comida de estudiante digna', 'Típico de primero|Típico de último curso',
      'Poco útil en la vida real|Muy útil en la vida real', 'Compañero de piso horrible|Compañero de piso ideal', 'Erasmus tranquilo|Erasmus de fiesta',
      'Profesor que cae mal|Profesor que cae bien', 'Plan barato|Plan caro', 'Te hace parecer pringado|Te hace parecer guay',
      'Poco estresante|Muy estresante', 'Trabajo en grupo fácil|Trabajo en grupo de pesadilla', 'Gasto innecesario|Gasto imprescindible',
    ],
    clasico: [
      'Frío|Caliente', 'Infravalorado|Sobrevalorado', 'Pasado de moda|De moda', 'Barato|Caro', 'Inútil|Imprescindible', 'Aburrido|Divertido',
      'Para niños|Para adultos', 'Fácil|Difícil', 'Normal|Raro', 'Feo|Bonito', 'Poco famoso|Muy famoso', 'Poco saludable|Muy saludable',
      'Mal invento|Gran invento', 'Nada de miedo|Mucho miedo', 'Triste|Alegre', 'Relajante|Estresante', 'Cutre|Pijo', 'Antiguo|Moderno',
      'Mal regalo|Buen regalo', 'Película mala|Peliculón', 'Villano|Héroe', 'Habilidad inútil|Habilidad útil', 'Comida de diario|Comida de celebración',
      'Mainstream|Alternativo', 'Fácil de dibujar|Difícil de dibujar', 'Huele mal|Huele bien', 'Delito leve|Delito grave', 'Lo hace poca gente|Lo hace todo el mundo',
    ],
    absurdo: [
      'Animal que podrías vencer en una pelea|Animal que te destroza', 'Mal nombre para un perro|Buen nombre para un perro', 'Superpoder inútil|Superpoder increíble',
      'Inútil en un apocalipsis zombi|Útil en un apocalipsis zombi', 'Mala idea a las 4 de la mañana|Buena idea a las 4 de la mañana', 'Mal sitio para dormir|Buen sitio para dormir',
      'Mal tatuaje|Buen tatuaje', 'Mala mascota|Mascota perfecta', 'Mal disfraz|Disfraz perfecto', 'Mal regalo para tu suegra|Regalo perfecto para tu suegra',
      'Mala canción para una boda|Canción perfecta para una boda', 'Mal nombre para un grupo de música|Nombre perfecto para un grupo de música', 'Comida que da asco|Comida deliciosa',
      'Mal plan para un domingo|Plan perfecto para un domingo', 'Fácil de arreglar|Imposible de arreglar', 'Cosa de abuelo|Cosa de adolescente',
    ],
    picante: [
      'Red flag|Green flag', 'Corta el rollo|Sube la temperatura', 'Mala primera cita|Primera cita perfecta', 'Para una noche|Para toda la vida',
      'Nada sexi|Muy sexi', 'Mala frase para ligar|Frase para ligar infalible', 'Perdonable en pareja|Imperdonable en pareja', 'Ex fácil de olvidar|Ex imposible de olvidar',
      'Poco romántico|Muy romántico', 'Tímido|Atrevido', 'Mal sitio para un beso|Sitio perfecto para un beso', 'Detalle de pareja tóxico|Detalle de pareja bonito',
      'Mensaje que nunca mandarías|Mensaje que mandarías sin dudar',
    ],
  };


  /* ---------- Precio justo: [título, precio, unidad, 0, 0, emoji, detalle, foto opcional] ----------
     Para usar fotos, guarda la imagen en img/precios/ y pon su ruta al final, p. ej. 'img/precios/ps5.jpg'. */
  K.precios = {
    tecno: [
      ['PlayStation 5', 499, '€', 0, 0, '🎮', 'Precio de lanzamiento en España (2020), modelo con lector', 'img/precios/ps5.jpg'],
      ['Nintendo Switch', 330, '€', 0, 0, '🕹️', 'Precio de lanzamiento en España (2017)', 'img/precios/switch.jpg'],
      ['El primer iPhone', 499, '$', 0, 0, '📱', 'Precio en Estados Unidos en 2007, modelo de 4 GB', 'img/precios/iphone1.jpg'],
      ['iPhone 15 Pro', 1219, '€', 0, 0, '📱', 'Precio de salida en España (2023)', 'img/precios/iphone15.jpg'],
      ['Apple Vision Pro', 3499, '$', 0, 0, '🥽', 'Precio de salida en Estados Unidos (2024)', 'img/precios/visionpro.jpg'],
      ['Game Boy', 90, '$', 0, 0, '👾', 'Precio de lanzamiento en Estados Unidos (1989)', 'img/precios/gameboy.jpg'],
      ['Crear y promocionar GTA V', 265000000, '$', 0, 0, '🚗', 'Presupuesto estimado de desarrollo y marketing', 'img/precios/gta.jpg'],
      ['Tesla Model 3', 35000, '$', 0, 0, '🚙', 'Precio base anunciado en su presentación (2016)', 'img/precios/tesla3.jpg'],
      ['La primera PlayStation', 299, '$', 0, 0, '🎮', 'Precio de lanzamiento en Estados Unidos (1995)', 'img/precios/ps1.jpg'],
      ['PlayStation 2', 299, '$', 0, 0, '🎮', 'Precio de lanzamiento en Estados Unidos (2000)', 'img/precios/ps2.jpg'],
      ['Nintendo 64', 200, '$', 0, 0, '🕹️', 'Precio de lanzamiento en Estados Unidos (1996)', 'img/precios/n64.jpg'],
      ['Super Nintendo', 199, '$', 0, 0, '🕹️', 'Precio de lanzamiento en Estados Unidos (1991)', 'img/precios/snes.jpg'],
      ['Sega Mega Drive', 190, '$', 0, 0, '🕹️', 'Precio de lanzamiento en Estados Unidos (1989), donde se llamó Genesis', 'img/precios/megadrive.jpg'],
      ['Wii', 250, '$', 0, 0, '🎾', 'Precio de lanzamiento en Estados Unidos (2006)', 'img/precios/wii.jpg'],
      ['Nintendo DS', 150, '$', 0, 0, '🕹️', 'Precio de lanzamiento en Estados Unidos (2004)', 'img/precios/ds.jpg'],
      ['Steam Deck', 399, '$', 0, 0, '🎮', 'Modelo básico de 64 GB, precio de salida (2022)', 'img/precios/steamdeck.jpg'],
      ['El primer iPod', 399, '$', 0, 0, '🎧', 'Precio de salida en Estados Unidos (2001), 5 GB', 'img/precios/ipod.jpg'],
      ['El primer iPad', 499, '$', 0, 0, '📱', 'Modelo básico de 16 GB con wifi (2010)', 'img/precios/ipad.jpg'],
      ['El primer Macintosh', 2495, '$', 0, 0, '🖥️', 'Precio de salida en Estados Unidos (1984)', 'img/precios/macintosh.jpg'],
      ['La primera Raspberry Pi', 35, '$', 0, 0, '🔌', 'Modelo B, a la venta en 2012', 'img/precios/raspberry.jpg'],
    ],
    lujo: [
      ['«Salvator Mundi»', 450000000, '$', 0, 0, '🖼️', 'Atribuido a Leonardo; subastado en 2017', 'img/precios/salvator.jpg'],
      ['Un plátano pegado a la pared con cinta', 6200000, '$', 0, 0, '🍌', '«Comedian», de Maurizio Cattelan, subastado en 2024', 'img/precios/banana.jpg'],
      ['Bugatti Chiron', 2400000, '€', 0, 0, '🏎️', 'Precio base aproximado, sin impuestos', 'img/precios/bugatti.jpg'],
      ['Anuncio de 30 segundos en la Super Bowl', 7000000, '$', 0, 0, '🏈', 'Tarifa de 2024', 'img/precios/superbowl.jpg'],
      ['Un asiento al espacio con Virgin Galactic', 450000, '$', 0, 0, '🚀', 'Precio anunciado en 2021', 'img/precios/virgin.jpg'],
      ['«El grito», de Munch', 120000000, '$', 0, 0, '😱', 'Versión al pastel subastada en 2012', 'img/precios/grito.jpg'],
      ['La camiseta de Maradona de la «Mano de Dios»', 9300000, '$', 0, 0, '👕', 'Subastada en 2022', 'img/precios/maradona.jpg'],
      ['Dos pizzas pagadas con bitcoin', 10000, 'bitcoins', 0, 0, '🍕', 'La primera compra con bitcoin, en 2010', 'img/precios/pizza.jpg'],
      ['La Estación Espacial Internacional', 150000000000, '$', 0, 0, '🛰️', 'Coste total estimado', 'img/precios/iss.jpg'],
      ['El Burj Khalifa', 1500000000, '$', 0, 0, '🏙️', 'Coste de construcción', 'img/precios/burj.jpg'],
      ['«Lirios», de Van Gogh', 53900000, '$', 0, 0, '🌸', 'Subastado en 1987', 'img/precios/lirios.jpg'],
      ['«Los girasoles», de Van Gogh', 39900000, '$', 0, 0, '🌻', 'Subastado en Londres en 1987', 'img/precios/girasoles.jpg'],
      ['«Almiares», de Monet', 110700000, '$', 0, 0, '🌾', 'Uno de sus cuadros de almiares, subastado en 2019', 'img/precios/meules.jpg'],
      ['«Los jugadores de cartas», de Cézanne', 250000000, '$', 0, 0, '🃏', 'Venta privada de 2011 (cifra estimada)', 'img/precios/jugadores.jpg'],
      ['Un Ferrari 250 GTO de 1962', 48400000, '$', 0, 0, '🏎️', 'Subastado en 2018', 'img/precios/ferrari.jpg'],
      ['Un Mercedes 300 SLR «Uhlenhaut» de 1955', 135000000, '€', 0, 0, '🚘', 'El coche más caro jamás vendido, subastado en 2022', 'img/precios/mercedes.jpg'],
    ],
    historia: [
      ['Estados Unidos compra Luisiana a Francia', 15000000, '$', 0, 0, '🗺️', 'Compra de 1803; duplicó el tamaño del país', 'img/precios/luisiana.jpg'],
      ['Estados Unidos compra Alaska a Rusia', 7200000, '$', 0, 0, '🏔️', 'Compra de 1867', 'img/precios/alaska.jpg'],
      ['Los neerlandeses compran Manhattan', 60, 'florines', 0, 0, '🏝️', 'Según el relato tradicional, en 1626', 'img/precios/manhattan.jpg'],
      ['El programa Apolo', 25800000000, '$', 0, 0, '🌕', 'Coste total en dólares de la época (1960–1973)', 'img/precios/apolo.jpg'],
      ['El telescopio espacial James Webb', 10000000000, '$', 0, 0, '🔭', 'Coste aproximado hasta su lanzamiento (2021)', 'img/precios/webb.jpg'],
      ['El Códice Leicester de Leonardo', 30800000, '$', 0, 0, '📜', 'Cuaderno de Leonardo subastado en 1994', 'img/precios/codice.jpg'],
      ['El sello «1 centavo magenta» de la Guayana Británica', 9500000, '$', 0, 0, '✉️', 'El sello más caro del mundo, subastado en 2014', 'img/precios/sello.jpg'],
      ['«Sue», el esqueleto de T. rex', 8400000, '$', 0, 0, '🦖', 'Subastado en 1997 y expuesto en el Field Museum de Chicago', 'img/precios/sue.jpg'],
      ['Un Ford Modelo T', 850, '$', 0, 0, '🚗', 'Precio de salida en 1908', 'img/precios/modelt.jpg'],
    ],
    negocios: [
      ['Fichaje de Neymar por el PSG', 222000000, '€', 0, 0, '⚽', 'Cláusula pagada en 2017', 'img/precios/neymar.jpg'],
      ['Fichaje de Cristiano Ronaldo por el Real Madrid', 94000000, '€', 0, 0, '⚽', 'Traspaso de 2009', 'img/precios/cristiano.jpg'],
      ['Microsoft compra Minecraft', 2500000000, '$', 0, 0, '⛏️', 'Operación de 2014', 'img/precios/minecraft.jpg'],
      ['Microsoft compra Activision Blizzard', 69000000000, '$', 0, 0, '🎮', 'Operación cerrada en 2023', 'img/precios/activision.jpg'],
      ['Disney compra Marvel', 4000000000, '$', 0, 0, '🦸', 'Operación de 2009', 'img/precios/marvel.jpg'],
      ['Disney compra Lucasfilm', 4050000000, '$', 0, 0, '⭐', 'Operación de 2012', 'img/precios/lucasfilm.jpg'],
      ['Rodar «Avatar»', 237000000, '$', 0, 0, '🎬', 'Presupuesto de la película de 2009', 'img/precios/avatar.jpg'],
      ['Rodar «Titanic»', 200000000, '$', 0, 0, '🚢', 'Presupuesto de la película de 1997', 'img/precios/titanic.jpg'],
      ['Google compra YouTube', 1650000000, '$', 0, 0, '▶️', 'Operación de 2006', 'img/precios/youtube.jpg'],
      ['Elon Musk compra Twitter', 44000000000, '$', 0, 0, '🐦', 'Operación de 2022', 'img/precios/twitter.jpg'],
      ['Facebook compra Instagram', 1000000000, '$', 0, 0, '📸', 'Operación de 2012', 'img/precios/instagram.jpg'],
      ['Facebook compra WhatsApp', 19000000000, '$', 0, 0, '💬', 'Operación de 2014'],
      ['Amazon compra Whole Foods', 13700000000, '$', 0, 0, '🥦', 'Cadena de supermercados, comprada en 2017', 'img/precios/wholefoods.jpg'],
      ['Microsoft compra LinkedIn', 26200000000, '$', 0, 0, '👔', 'Operación de 2016', 'img/precios/linkedin.jpg'],
      ['Microsoft compra Skype', 8500000000, '$', 0, 0, '📞', 'Operación de 2011', 'img/precios/skype.jpg'],
      ['Disney compra Pixar', 7400000000, '$', 0, 0, '💡', 'Operación de 2006', 'img/precios/pixar.jpg'],
      ['Disney compra 21st Century Fox', 71300000000, '$', 0, 0, '🎞️', 'Operación cerrada en 2019', 'img/precios/fox.jpg'],
      ['Google compra Android', 50000000, '$', 0, 0, '🤖', 'Operación de 2005 (cifra estimada)', 'img/precios/android.jpg'],
      ['Amazon compra Twitch', 970000000, '$', 0, 0, '🎙️', 'Operación de 2014', 'img/precios/twitch.jpg'],
      ['eBay compra PayPal', 1500000000, '$', 0, 0, '💳', 'Operación de 2002', 'img/precios/paypal.jpg'],
      ['Fichaje de Mbappé por el PSG', 180000000, '€', 0, 0, '👟', 'Desde el Mónaco en 2018, con variables', 'img/precios/mbappe.jpg'],
      ['Fichaje de Coutinho por el Barça', 120000000, '€', 0, 0, '⚽', 'Parte fija del traspaso de 2018, sin variables'],
      ['Rodar «Vengadores: Endgame»', 356000000, '$', 0, 0, '🍿', 'Presupuesto de la película de 2019', 'img/precios/endgame.jpg'],
      ['Rodar «El proyecto de la bruja de Blair»', 60000, '$', 0, 0, '🌲', 'Presupuesto de rodaje de la película de 1999', 'img/precios/blairwitch.jpg'],
      ['Rodar «Paranormal Activity»', 15000, '$', 0, 0, '👻', 'Presupuesto de la película de 2007'],
    ],
  };

  /* ---------- Castigos ---------- */
  K.castigos = {
    suaves: ['Habla con acento extranjero hasta tu próximo turno.', 'No puedes decir «sí» ni «no» durante la siguiente ronda.', 'Haz diez sentadillas.', 'Deja el móvil boca abajo en el centro durante dos rondas.', 'Di algo bueno de cada jugador.', 'Juega la siguiente ronda de pie.', 'Imita a un animal durante diez segundos.', 'Sirve algo de beber o picar a quien te lo pida.', 'Habla en susurros hasta tu próximo turno.', 'Aguanta veinte segundos a la pata coja.', 'Canta el estribillo de la canción que elija el grupo.', 'Cuenta un chiste; si nadie se ríe, cuenta otro.'],
    retos: ['El grupo elige tu foto de perfil durante una hora.', 'Enseña la última foto de tu galería.', 'Manda un sticker al tercer chat de tu lista.', 'Lee en voz alta tu último mensaje enviado.', 'Deja que el jugador de tu derecha te despeine.', 'Sube una historia con la frase que elija el grupo.', 'Enseña tu tiempo de uso del móvil de hoy.', 'Baila sin música durante veinte segundos.', 'Haz de camarero del grupo hasta el final del juego.', 'Imita a otro jugador hasta que adivinen quién es.', 'Declárate a un objeto de la sala con total seriedad.', 'Enseña el último vídeo que te salió en «Para ti».'],
    beber: ['Bebe un trago.', 'Bebe dos tragos.', 'Reparte tres tragos entre quien quieras.', 'Brinda con el jugador de tu izquierda y bebed los dos.', 'Elige a alguien: bebe contigo.', 'Bebe un trago por cada vocal de tu nombre.', 'Quien tenga el vaso más lleno bebe contigo.', 'Termina lo que te quede en el vaso (con cabeza).', 'Trago en cascada: empiezas tú y sigue el de tu derecha.', 'Bebe un trago sin usar las manos.'],
  };

  /* ---------- Impostor, modo «palabra parecida»: parejas ---------- */
  K.impostorPares = ['Café|Té', 'Playa|Piscina', 'Pizza|Hamburguesa', 'Perro|Gato', 'Instagram|TikTok', 'Netflix|YouTube', 'Cerveza|Vino', 'Erasmus|Viaje de fin de curso', 'Biblioteca|Sala de estudio', 'Examen|Entrevista de trabajo', 'Profesor|Jefe', 'Gimnasio|Yoga', 'Tren|Autobús', 'Guitarra|Piano', 'Fútbol|Baloncesto', 'Boda|Graduación', 'Resaca|Gripe', 'Tinder|Discoteca', 'Ibai|AuronPlay', 'Messi|Cristiano Ronaldo', 'Madrid|Barcelona', 'Navidad|Nochevieja', 'Cine|Teatro', 'Sushi|Paella', 'Tortilla de patatas|Croquetas', 'Avión|Helicóptero', 'Móvil|Tablet', 'WhatsApp|Telegram', 'Dentista|Peluquero', 'Camping|Hotel', 'Kebab|Bocadillo', 'Apuntes|Chuleta', 'Piso compartido|Residencia', 'Selectividad|Carné de conducir', 'Tatuaje|Piercing', 'Karaoke|Concierto', 'Siesta|Dormirse en clase', 'Bici|Patinete', 'Spotify|Radio', 'Ducha|Bañera', 'Festival|Fiestas del pueblo', 'Rosalía|Aitana', 'Bad Bunny|Quevedo', 'Lasaña|Canelones', 'Trabajo en grupo|Reunión de vecinos', 'Churros|Porras', 'Helado|Granizado', 'Vampiro|Zombi'];

  /* ---------- Más parejas para «¿Quién miente?» ---------- */
  K.mentiroso.clasico.push(
    '¿Cuánto tardas en ducharte?|¿Cuánto tardas en decidir qué ver en Netflix?',
    '¿Cuántos pares de zapatos tienes?|¿Cuántas plantas has matado?',
    '¿Qué harías con una semana de vacaciones?|¿Qué harías si se cayera internet una semana?',
    '¿Qué es lo primero que haces al levantarte?|¿Qué es lo último que haces antes de dormir?',
    '¿Cuántas alarmas pones por la mañana?|¿Cuántas pestañas tienes abiertas en el móvil?',
    '¿Qué regalo te haría más ilusión?|¿Cuál es el peor regalo que has recibido?',
    '¿Cuál es tu red social favorita?|¿Qué red social deberías dejar?',
    '¿Qué comida pedirías a domicilio ahora?|¿Qué comida te sentó fatal alguna vez?');
  K.mentiroso.gustos.push(
    '¿Qué cantante irías a ver en directo?|¿Qué cantante te pone de los nervios?',
    '¿Qué famoso te cae genial?|¿Qué famoso crees que está sobrevalorado?',
    '¿Cuál es el mejor plan para un sábado?|¿Cuál es el plan que siempre cancelas?',
    '¿Qué juego de mesa te encanta?|¿Qué juego acaba siempre en pelea?',
    '¿Cuál es tu bebida de fiesta?|¿Qué bebida no puedes ni oler?',
    '¿Qué ciudad española te gusta más?|¿Qué ciudad española te parece sobrevalorada?');
})(Corrillo.content);
