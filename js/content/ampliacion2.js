/* Cuarta tanda. Datos estables contrastados con fuentes primarias el 13-11-2026.
   Las fuentes se guardan fuera de los bancos para no cambiar el formato de las tarjetas. */
(function (C) {
  const K = C.content;
  C.sources = [];
  const NASA = (planet) => 'https://science.nasa.gov/' + planet + '/facts/';
  const eiffel = 'https://www.toureiffel.paris/en/the-monument/key-figures';
  const liberty = 'https://www.nps.gov/stli/learn/historyculture/statue-statistics.htm';
  const canyon = 'https://www.nps.gov/grca/learn/management/statistics.htm';
  const sydney = 'https://www.sydneyoperahouse.com/our-story/the-spherical-solution';
  const cern = 'https://home.cern/science/computing/the-birth-of-the-web/where-web-was-born/';
  function add(bank, cat, item, urls) {
    (K[bank][cat] = K[bank][cat] || []).push(item);
    const questions = bank === 'cifras' ? [item[0], item[3]] : bank === 'invento' ? [item.split('|')[1]] : [item[0]];
    questions.forEach((question) => C.sources.push({ bank, question, urls, checked: '2026-11-13' }));
  }

  /* 12 parejas nuevas, con unidades explícitas y magnitudes próximas. */
  add('cifras', 'ciencia', ['¿Cuántos kilómetros mide el radio medio de Mercurio, aproximadamente?', 2440, 'km', '¿Cuántos kilómetros mide el radio medio de Marte, aproximadamente?', 3390, 'km', 0, 0], [NASA('mercury'), NASA('mars')]);
  add('cifras', 'ciencia', ['¿Cuántos días terrestres dura un año en Mercurio, aproximadamente?', 88, 'días', '¿Cuántos días terrestres dura un año en Venus, aproximadamente?', 225, 'días', 0, 0], [NASA('mercury'), 'https://science.nasa.gov/venus/venus-facts/']);
  add('cifras', 'ciencia', ['¿Cuántos días terrestres tarda Venus en girar una vez sobre su eje, aproximadamente?', 243, 'días', '¿Cuántos días terrestres tarda Mercurio en girar una vez sobre su eje, aproximadamente?', 59, 'días', 0, 0], ['https://science.nasa.gov/venus/venus-facts/', NASA('mercury')]);
  add('cifras', 'ciencia', ['¿Cuántos años terrestres tarda Júpiter en dar una vuelta al Sol, redondeando?', 12, 'años', '¿Cuántos años terrestres tarda Saturno en dar una vuelta al Sol, redondeando?', 29, 'años', 0, 0], ['https://science.nasa.gov/jupiter/jupiter-facts/', NASA('saturn')]);
  add('cifras', 'ciencia', ['¿Cuántos años terrestres tarda Urano en dar una vuelta al Sol, aproximadamente?', 84, 'años', '¿Cuántos años terrestres tarda Neptuno en dar una vuelta al Sol, aproximadamente?', 165, 'años', 0, 0], [NASA('uranus'), 'https://science.nasa.gov/neptune/neptune-facts/']);
  add('cifras', 'ciencia', ['¿Cuántos kilómetros mide el diámetro ecuatorial de Urano, aproximadamente?', 51118, 'km', '¿Cuántos kilómetros mide el diámetro ecuatorial de Neptuno, aproximadamente?', 49528, 'km', 0, 0], [NASA('uranus'), 'https://science.nasa.gov/neptune/neptune-facts/']);
  add('cifras', 'general', ['¿Cuántas toneladas pesa la estructura metálica de la Torre Eiffel?', 7300, 'toneladas', '¿Cuántas toneladas pesa en total la Torre Eiffel, aproximadamente?', 10100, 'toneladas', 0, 0], [eiffel]);
  add('cifras', 'general', ['¿Cuántos metros mide la Estatua de la Libertad desde el suelo hasta la antorcha, redondeando?', 93, 'm', '¿Cuántos metros mide solo la Estatua de la Libertad, sin su pedestal, redondeando?', 46, 'm', 0, 0], [liberty]);
  add('cifras', 'records', ['¿Cuántos kilómetros recorre el Colorado dentro del Parque Nacional del Gran Cañón, aproximadamente?', 447, 'km', '¿Cuántos metros tiene de profundidad media el Gran Cañón, aproximadamente?', 1600, 'm', 0, 0], [canyon]);
  add('cifras', 'general', ['¿En qué año se declaró parque nacional el Gran Cañón?', 1919, '', '¿En qué año se descubrió Neptuno?', 1846, '', 1750, 2000], [canyon, 'https://science.nasa.gov/neptune/neptune-facts/']);
  add('cifras', 'general', ['¿En qué año propuso Tim Berners-Lee la World Wide Web en el CERN?', 1989, '', '¿En qué año liberó el CERN el software de la web al dominio público?', 1993, '', 1950, 2010], [cern]);
  add('cifras', 'records', ['¿Cuántos azulejos recubren las cubiertas de la Ópera de Sídney?', 1056006, 'azulejos', '¿Cuántos remaches se usaron para construir la Torre Eiffel?', 2500000, 'remaches', 0, 0], [sydney, eiffel]);

  /* 20 estimaciones nuevas: ciencia, monumentos y naturaleza. */
  add('estimaciones', 'general', ['¿Cuántas piezas de hierro forman la Torre Eiffel?', 18038, 'piezas', 0, 0], [eiffel]);
  add('estimaciones', 'general', ['¿Cuántos años estaba previsto conservar inicialmente la Torre Eiffel?', 20, 'años', 0, 0], [eiffel]);
  add('estimaciones', 'general', ['¿Cuántos centímetros mide el dedo índice de la Estatua de la Libertad?', 244, 'cm', 0, 0], [liberty]);
  add('estimaciones', 'general', ['¿Cuántos centímetros mide la mano de la Estatua de la Libertad?', 500, 'cm', 0, 0], [liberty]);
  add('estimaciones', 'general', ['¿Cuántos centímetros mide la nariz de la Estatua de la Libertad?', 137, 'cm', 0, 0], [liberty]);
  add('estimaciones', 'general', ['¿Cuántos centímetros mide el brazo derecho de la Estatua de la Libertad?', 1280, 'cm', 0, 0], [liberty]);
  add('estimaciones', 'records', ['¿Cuántos metros mide el Gran Cañón en su parte más estrecha, según el NPS?', 180, 'm', 0, 0], [canyon]);
  add('estimaciones', 'records', ['¿Cuántos kilómetros mide el Gran Cañón en su parte más ancha, redondeando?', 29, 'km', 0, 0], [canyon]);
  add('estimaciones', 'records', ['¿Cuántos años tienen las rocas más antiguas que describe el NPS en el Gran Cañón, aproximadamente?', 1800000000, 'años', 0, 0], [canyon]);
  add('estimaciones', 'records', ['¿Hace cuántos años se estableció el curso del Colorado por el Gran Cañón, aproximadamente?', 6000000, 'años', 0, 0], [canyon]);
  add('estimaciones', 'records', ['¿Cuántos kilómetros cuadrados ocupa el Parque Nacional del Gran Cañón, aproximadamente?', 4931, 'km²', 0, 0], [canyon]);
  [
    ['Mercurio', 'mercury', 58000000], ['Venus', 'venus', 108000000], ['Marte', 'mars', 228000000], ['Júpiter', 'jupiter', 778000000],
    ['Saturno', 'saturn', 1400000000], ['Urano', 'uranus', 2900000000], ['Neptuno', 'neptune', 4500000000],
  ].forEach(([name, planet, distance]) => add('estimaciones', 'ciencia', ['¿A cuántos kilómetros del Sol está ' + name + ' de media, aproximadamente?', distance, 'km', 0, 0], [NASA(planet)]));
  add('estimaciones', 'general', ['¿Cuántos milímetros mide de lado un azulejo de las cubiertas de la Ópera de Sídney?', 120, 'mm', 0, 0], [sydney]);
  add('estimaciones', 'general', ['¿Cuántos paneles en forma de V agrupan los azulejos de las cubiertas de la Ópera de Sídney?', 4228, 'paneles', 0, 0], [sydney]);

  /* 10 afirmaciones nuevas. No se usan recuentos de lunas ni otros récords que cambian. */
  add('invento', 'cuerpo', 'V|Entre dos amaneceres consecutivos en Mercurio transcurren aproximadamente dos años de ese planeta.|Su ciclo solar dura unos 176 días terrestres y su órbita, unos 88.', [NASA('mercury')]);
  add('invento', 'cuerpo', 'F|Desde Venus se vería salir el Sol por el este, igual que desde la Tierra.|Su rotación es retrógrada: allí el Sol saldría por el oeste.', ['https://science.nasa.gov/venus/venus-facts/']);
  add('invento', 'naturaleza', 'V|Marte tiene estaciones del año.|Su eje está inclinado unos 25 grados; las estaciones duran más que las terrestres.', [NASA('mars')]);
  add('invento', 'cuerpo', 'F|Júpiter tarda más que la Tierra en girar una vez sobre su eje.|Su rotación dura unas diez horas, aunque es el planeta más grande.', ['https://science.nasa.gov/jupiter/jupiter-facts/']);
  add('invento', 'naturaleza', 'V|En los polos de Urano puede haber inviernos de unos veinte años sin Sol.|La fuerte inclinación de su eje y su larga órbita producen estaciones extremas.', [NASA('uranus')]);
  add('invento', 'historia', 'F|Neptuno se descubrió al observar a simple vista una estrella que cambiaba de posición.|Se localizó con telescopio en 1846, guiándose por predicciones matemáticas.', ['https://science.nasa.gov/neptune/neptune-facts/']);
  add('invento', 'historia', 'V|La Torre Eiffel se construyó con la idea de que permaneciera solo veinte años.|Los experimentos científicos y las telecomunicaciones ayudaron a conservarla.', [eiffel]);
  add('invento', 'historia', 'F|La Estatua de la Libertad, sin su pedestal, mide más de noventa metros.|La figura mide unos 46 metros; los 93 incluyen el pedestal y la base.', [liberty]);
  add('invento', 'cuerpo', 'V|Las cubiertas de la Ópera de Sídney se diseñaron a partir de la geometría de una esfera.|La solución esférica permitió unificar la construcción de sus piezas curvas.', [sydney]);
  add('invento', 'naturaleza', 'F|Las rocas más antiguas del Gran Cañón tienen menos de cien millones de años.|El parque conserva rocas de unos 1.800 millones de años.', [canyon]);

  /* 20 preguntas para escribir respuestas anónimas. */
  K.quienlodijo.uni.push(
    '¿Qué nombre le pondrías a una asignatura sobre sobrevivir a la carrera?',
    '¿Qué objeto de tu mochila merece una jubilación?',
    '¿Cuál sería tu excusa si llegaras dos horas tarde a un examen?',
    '¿Qué puesto tendrías en un trabajo en grupo si fuera una empresa?',
    '¿Qué pondrías en una reseña sincera de la biblioteca?',
    '¿Qué frase pondrías en una camiseta de tu promoción?',
    '¿Qué comida representarías en una competición de cenas de estudiante?',
    '¿Qué norma absurda añadirías a tu piso compartido?');
  K.quienlodijo.clasico.push(
    '¿Qué compra de menos de diez euros te ha alegrado la vida?',
    '¿Qué sonido elegirías para que sonara cada vez que entras en una sala?',
    '¿Qué habilidad inútil incluirías en tu currículum?',
    '¿Qué objeto cotidiano mandarías a un museo del futuro?',
    '¿Qué harías durante una hora si nadie pudiera verte?',
    '¿Qué frase debería decir un muñeco que hablara con tu voz?',
    '¿Qué plan defenderías aunque todo el mundo lo encuentre aburrido?',
    '¿Qué título tendría tu último mes si fuera un capítulo de una serie?');
  K.quienlodijo.grupo.push(
    '¿Qué nombre le pondrías al grupo si montarais una banda?',
    '¿Qué objeto llevarías a una escapada organizada por este grupo?',
    '¿Qué tradición inventarías para cada vez que os reunís?',
    '¿Qué prueba pondrías para entrar en vuestro club secreto?');

  /* 16 castigos que se pueden hacer aquí mismo, sin alcohol. */
  K.castigos.suaves.push(
    'Presenta al siguiente jugador como si entrara a una gala.',
    'Termina tus próximas tres frases con una rima.',
    'Pon voz de GPS a las instrucciones de la siguiente ronda.',
    'Describe tu día usando solo títulos de películas.',
    'Inventa un lema para el grupo y recítalo con solemnidad.',
    'Agradece tu derrota como si recogieras un premio.',
    'Durante una ronda, llama «su señoría» a quien te hable.',
    'Haz una predicción disparatada sobre la siguiente partida.');
  K.castigos.retos.push(
    'Vende un objeto de la mesa en un anuncio de veinte segundos.',
    'Representa una escena de suspense usando una servilleta.',
    'Da una rueda de prensa sobre por qué has perdido.',
    'Improvisa una canción de dos versos con el nombre del juego.',
    'Haz de comentarista deportivo del siguiente turno.',
    'Inventa un baile de tres pasos y ponle nombre.',
    'Defiende durante veinte segundos que el lunes es el mejor día.',
    'Dobla una conversación imaginaria entre dos objetos de la sala.');
})(Corrillo);
