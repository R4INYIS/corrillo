/* Ampliación pensada para estudiantes universitarios: vida de facultad, internet y famosos.
   Este archivo añade categorías nuevas a los bancos de contenido ya existentes. */
(function (K) {
  /* ---------- Impostor: «palabra|pista» ---------- */
  K.impostor.uni = ['Erasmus|Extranjero', 'Selectividad|Nervios', 'Segunda matrícula|Pagar', 'Biblioteca en exámenes|Sitio', 'Piso compartido|Convivencia', 'Apuntes|Prestados', 'Cafetería de la facultad|Descanso', 'Beca|Dinero', 'TFG|Final', 'Residencia|Habitación', 'Trabajo en grupo|Equipo', 'Clase a las ocho|Madrugar', 'Chuleta|Trampa', 'Profesor que lee las diapositivas|Aburrimiento', 'Novato|Primero', 'Delegado de clase|Grupo', 'Revisión de examen|Décimas', 'Prácticas sin cobrar|Experiencia', 'Tupper|Comida', 'Jueves universitario|Salir', 'Reprografía|Papel', 'Matrícula de honor|Nota', 'Asignatura hueso|Suspensos', 'Tuna|Capa', 'Compañero de piso|Convivencia', 'Examen tipo test|Opciones', 'Campus virtual|Entregas', 'Paellas universitarias|Primavera', 'Wuolah|Apuntes', 'ChatGPT|Ayuda', 'Recuperación|Segunda oportunidad', 'Graduación|Final'];
  K.impostor.internet = ['Ghosting|Desaparecer', 'Crush|Gustar', 'Red flag|Aviso', 'Meme|Risa', 'Story|Un día', 'Stalkear|Perfil', 'Influencer|Seguidores', 'Directo de Twitch|Chat', 'BeReal|Dos minutos', 'Sticker de WhatsApp|Chat', 'Audio de cinco minutos|Escuchar', 'Grupo de WhatsApp de clase|Mensajes', 'Dejar en visto|Ignorar', 'Filtro de Instagram|Cara', 'Trend de TikTok|Baile', 'Podcast|Micrófono', 'Unboxing|Paquete', 'Hate|Comentarios', 'Cancelación|Polémica', 'Clickbait|Titular', 'Spoiler|Final', 'Modo avión|Desconectar', 'Captura de pantalla|Prueba', 'Mejores amigos de Instagram|Verde', 'Link en la bio|Perfil', 'NPC|Fondo', 'POV|Cámara', 'Shippear|Pareja', 'Doble check azul|Leído', 'Wrapped de Spotify|Diciembre'];
  K.impostor.famosos = ['Ibai|Streamer', 'AuronPlay|Streamer', 'El Rubius|Youtuber', 'TheGrefg|Videojuegos', 'IlloJuan|Streamer', 'El Xokas|Streamer', 'Jordi Wild|Podcast', 'Llados|Gimnasio', 'Lola Lolita|TikTok', 'Marina Rivers|TikTok', 'Dulceida|Influencer', 'María Pombo|Influencer', 'Georgina Rodríguez|Reality', 'Rosalía|Cantante', 'Bad Bunny|Reguetón', 'Quevedo|Canarias', 'Aitana|Cantante', 'Bizarrap|Sesiones', 'Shakira|Colombia', 'Piqué|Kings League', 'Lamine Yamal|Fútbol', 'Cristiano Ronaldo|Fútbol', 'Messi|Fútbol', 'Mbappé|Fútbol', 'MrBeast|Retos', 'Khaby Lame|Gestos', 'Kim Kardashian|Reality', 'Taylor Swift|Gira', 'Elon Musk|Cohetes', 'Belén Esteban|Televisión', 'Ilia Topuria|Lucha', 'Carlos Alcaraz|Tenis', 'David Broncano|Televisión', 'Karol G|Colombia', 'Plex|Youtuber'];

  /* ---------- ¿Quién miente?: «pregunta normal|pregunta distinta» ---------- */
  K.mentiroso.uni = [
    '¿Cuántas asignaturas has suspendido en la carrera?|¿Cuántas veces has ido a una revisión de examen?',
    '¿Con cuántos días de antelación empiezas a estudiar un examen?|¿Cuántos días seguidos puedes estar sin pisar la facultad?',
    '¿A qué hora empieza tu clase más temprana?|¿A qué hora te acuestas en época de exámenes?',
    '¿Cuántos cafés tomas en un día de exámenes?|¿Cuántas horas duermes la noche antes de un examen?',
    '¿Quién de aquí tiene los mejores apuntes?|¿Quién de aquí pide siempre los apuntes?',
    '¿Quién de aquí acabará la carrera el primero?|¿Quién de aquí estudiaría otra carrera solo por no trabajar?',
    '¿Cuál es la mejor excusa para faltar a clase?|¿Cuál es la peor excusa que le has puesto a un profesor?',
    '¿Qué nota te pondrías como compañero de piso?|¿Qué nota le pondrías a la comida de tu facultad?',
    '¿Cuánto te gastas en una noche de fiesta?|¿Cuánto te gastas en comer una semana?',
    '¿Qué carrera habrías elegido si no fuera la tuya?|¿Qué carrera no estudiarías ni cobrando?',
    '¿Cuántas horas al día pasas en TikTok?|¿Cuántas horas al día estudias de verdad?',
    '¿Quién de aquí sería mejor profesor?|¿Quién de aquí copiaría en un examen?',
    '¿Qué streamer o youtuber ves más?|¿Qué famoso de internet no soportas?',
    '¿Cuántos seguidores tienes en Instagram?|¿A cuántas personas sigues sin conocerlas de nada?',
  ];

  /* ---------- El Espía: lugares ---------- */
  K.espia.uni = ['Biblioteca en exámenes', 'Cafetería de la facultad', 'Aula magna', 'Piso de estudiantes', 'Residencia universitaria', 'Secretaría', 'Revisión de examen', 'Fiesta Erasmus', 'Reprografía', 'Laboratorio de prácticas', 'Examen final', 'Botellón', 'Autobús nocturno', 'Kebab a las seis de la mañana', 'Graduación', 'Despacho del profesor', 'Comedor universitario', 'Paellas universitarias', 'Discoteca un jueves', 'Sala de estudio 24 horas'];

  /* ---------- Verdad o Reto ---------- */
  K.verdadreto.verdad.uni = ['¿Cuál es la peor nota que has sacado y en qué?', '¿Has copiado alguna vez en un examen? Cuenta cómo.', '¿Qué es lo más raro que has hecho para no estudiar?', '¿A qué clase has ido menos veces en toda la carrera?', '¿Qué profesor te ha caído peor y por qué?', '¿Has entregado un trabajo hecho entero por una IA?', '¿Qué mentira les has contado a tus padres sobre la uni?', '¿Con quién de aquí no harías un trabajo en grupo?', '¿Te has arrepentido de tu carrera alguna vez?', '¿Cuál ha sido tu peor experiencia con un compañero de piso?', '¿Cuál es tu récord de días sin ir a clase?', '¿Qué es lo más triste que has cenado en época de exámenes?', '¿Qué has hecho en la biblioteca que no fuera estudiar?', '¿A quién de clase le has cogido manía sin motivo?', '¿Cuál es tu tiempo de pantalla diario de verdad?', '¿A qué famoso de internet sigues y te da vergüenza admitirlo?'];
  K.verdadreto.reto.uni = ['Explica tu carrera en veinte segundos como si se la vendieras a un inversor.', 'Imita a un profesor tuyo hasta que alguien adivine de qué da clase.', 'Enseña tu última nota en el campus virtual.', 'Lee en voz alta el último mensaje del grupo de clase.', 'Da una clase magistral de un minuto sobre el tema que elija {j}.', 'Defiende durante treinta segundos que la carrera de {j} es más fácil que la tuya.', 'Enseña tu tiempo de uso del móvil de hoy.', 'Pon de estado «Estudiando 📚» ahora mismo.', 'Recita de memoria algo que te aprendieras para un examen.', 'Deja que {j} envíe un sticker al grupo de clase.', 'Presenta un trabajo inventado sobre el objeto que te dé {j}.', 'Enseña la foto de tu carné universitario.', 'Haz un baile de TikTok que el grupo reconozca.', 'Enseña el último vídeo que te salió en «Para ti».'];

  /* ---------- ¿Quién es más probable que…? ---------- */
  K.probable.uni = ['se presente a un examen sin haber abierto los apuntes', 'acabe la carrera con matrícula de honor', 'cambie de carrera en el último año', 'se duerma en primera fila', 'haga el trabajo de grupo entero la noche antes', 'se quede de Erasmus para siempre', 'se vaya de fiesta el día antes de un examen', 'llore en una revisión de examen', 'le escriba un correo al profesor a las tres de la mañana', 'acabe siendo profesor de la facultad', 'estudie el temario equivocado', 'se prepare el tupper y se lo olvide en casa', 'apruebe sin ir a clase ni un día', 'se enamore en la biblioteca', 'sea el último en acabar la carrera', 'siga en el mismo piso de estudiantes con cuarenta años', 'se haga viral en TikTok por accidente', 'deje la carrera para hacerse streamer'];

  /* ---------- Rompehielos ---------- */
  K.rompehielos.uni = ['¿Por qué elegiste tu carrera?', '¿Cuál ha sido tu mejor momento de la universidad hasta ahora?', '¿Qué asignatura te ha sorprendido para bien?', '¿Qué harías distinto si volvieras a primero?', '¿Dónde te irías de Erasmus?', '¿Cuál es tu sitio favorito para estudiar?', '¿Qué es lo mejor y lo peor de tu piso o residencia?', '¿Qué plan tienes para cuando acabes la carrera?', '¿Cuál es tu truco para estudiar que de verdad funciona?', '¿Qué profesor te ha marcado?', '¿Cuál es la anécdota de clase que más cuentas?', '¿Qué es lo más útil que has aprendido fuera de las aulas?', '¿Trabajarías de lo tuyo o te ves en otra cosa?', '¿Qué canción te recuerda a este curso?', '¿Qué creador de contenido ves casi a diario?', '¿Qué aplicación borrarías del móvil si tuvieras fuerza de voluntad?'];

  /* ---------- ¿Qué prefieres?: «A|B» ---------- */
  K.prefieres.uni = ['Un examen final que vale el cien por cien|Diez trabajos en grupo', 'Tener clase a las ocho todos los días|Tener clase los viernes por la tarde', 'Aprobar todo con un cinco|Sacar tres matrículas y suspender dos', 'Compañero de piso que no limpia|Compañero de piso que monta fiesta cada noche', 'Exponer delante de toda la facultad|Examen oral con el profesor más duro', 'Estudiar siempre en la biblioteca llena|Estudiar siempre en tu cama', 'Un año de Erasmus sin fiestas|Un mes de Erasmus inolvidable', 'Hacer el TFG solo|Hacerlo con el compañero que nunca contesta', 'Que tu profesor te siga en Instagram|Que tus padres vean tu TikTok', 'Un piso céntrico horrible|Un pisazo a una hora de la facultad', 'No volver a usar una IA para estudiar|No volver a usar apuntes de otros', 'Comer en el comedor universitario cada día|Cocinar para todo el piso cada día', 'Un tipo test que resta|Un examen a desarrollar sin límite de folios', 'Trabajar de lo tuyo cobrando poco|De otra cosa cobrando mucho', 'Hacerte viral por un vídeo ridículo|No tener redes sociales nunca más', 'Un año sin TikTok|Un año sin salir de fiesta'];

  /* ---------- Es un 10, pero… ---------- */
  K.diez.uni = ['nunca hace su parte del trabajo en grupo.', 'sube stories desde la biblioteca cada diez minutos.', 'levanta la mano cuando faltan dos minutos para acabar la clase.', 'le recuerda al profesor que había deberes.', 'no te pasa los apuntes.', 'dice que no ha estudiado nada y saca un diez.', 'sigue de fiesta como en primero y ya va por el máster.', 'te explica tu propia carrera.', 'tiene un podcast sobre criptomonedas.', 'hace el TFG con una IA y presume de ello.', 'solo habla de su Erasmus.', 'reserva sitio en la biblioteca con una chaqueta y desaparece tres horas.', 'manda audios al grupo de clase a las siete de la mañana.', 'graba un «un día conmigo» cada día.', 'te etiqueta en memes a las cuatro de la mañana.', 'responde a todo con frases de un gurú de internet.'];

  /* ---------- ¿Detallazo o lo mínimo? ---------- */
  K.detallazo.uni = ['Te pasa sus apuntes sin que se los pidas.', 'Te guarda sitio en la biblioteca en exámenes.', 'Hace su parte del trabajo en grupo a tiempo.', 'Te avisa de que han cambiado el aula.', 'Te trae un café cuando llevas horas estudiando.', 'Friega los platos del piso el mismo día.', 'Te espera al salir del examen para comentarlo.', 'Te deja dormir en su sofá después de una fiesta.', 'Te explica un tema la noche antes del examen.', 'Pone tu nombre en el trabajo aunque hiciste poco.', 'Baja la música cuando tienes examen al día siguiente.', 'Te acompaña a la revisión para darte apoyo moral.', 'Te contesta al mensaje aunque esté de exámenes.', 'Te pide permiso antes de subir una foto en la que sales.'];

  /* ---------- ¿Verdad o invento?: «V o F|afirmación|explicación» ---------- */
  K.invento.internet = [
    'V|El primer vídeo de YouTube se grabó en un zoo.|Se titula «Me at the zoo» y se subió en 2005.',
    'V|La arroba ya se usaba siglos antes de internet.|Era una unidad de medida en el comercio.',
    'V|El primer SMS de la historia felicitaba la Navidad.|Se envió en 1992 y decía «Merry Christmas».',
    'V|Nokia empezó fabricando papel.|La empresa nació en 1865 como fábrica de pasta de papel en Finlandia.',
    'V|Google se llamó al principio «BackRub».|Era el nombre del proyecto en Stanford antes de adoptar el actual.',
    'V|La Universidad de Salamanca tiene más de ochocientos años.|Se fundó en 1218.',
    'V|La Universidad de Bolonia es la más antigua de Europa.|Se considera fundada en 1088 y sigue en activo.',
    'V|«Wifi» no es la abreviatura de nada.|Fue un nombre comercial inventado; lo de «wireless fidelity» llegó después.',
    'F|Mark Zuckerberg terminó la carrera antes de crear Facebook.|Dejó Harvard a medias; años después recibió un título honorífico.',
    'F|El modo incógnito te hace anónimo en internet.|Solo evita que el historial se guarde en tu dispositivo.',
    'F|El logo de Bluetooth representa un diente.|Combina las runas de las iniciales del rey vikingo Harald «Diente Azul».',
    'F|Escuchar a Mozart mientras estudias te hace más inteligente.|El llamado «efecto Mozart» no se ha podido confirmar.',
    'F|Los tuits siempre han podido tener 280 caracteres.|Al principio el límite era de 140; se duplicó en 2017.',
    'F|Instagram fue creado por Facebook.|Era una empresa independiente que Facebook compró en 2012.',
  ];

  /* ---------- Apuesto a que…: «reto|segundos» ---------- */
  K.apuesto.uni = ['Nombrar diez carreras universitarias.|15', 'Decir el nombre completo de tres profesores suyos.|15', 'Decir qué estudia cada jugador sin fallar.|0', 'Nombrar ocho universidades españolas.|20', 'Decir cinco asignaturas de la carrera de la persona de su derecha.|25', 'Resumir su carrera en diez palabras exactas.|20', 'Recordar la nota de corte de su carrera.|0', 'Nombrar seis países de destino Erasmus.|12', 'Decir diez aplicaciones del móvil.|10', 'Nombrar siete streamers o youtubers.|10', 'Tararear una canción viral hasta que el grupo la adivine.|20', 'Hacer un baile de TikTok que alguien reconozca.|20', 'Adivinar el tiempo de pantalla de hoy de otro jugador con un margen de media hora.|0', 'Nombrar cinco memes que todos conozcan.|20'];

  /* ---------- La Bomba: categorías ---------- */
  K.bomba.uni = ['Carreras universitarias', 'Excusas para no ir a clase', 'Cosas que hay en un piso de estudiantes', 'Asignaturas', 'Cosas que se hacen en vez de estudiar', 'Comidas de estudiante', 'Cosas que se oyen en una biblioteca', 'Destinos de Erasmus', 'Motivos para pedir una revisión', 'Frases típicas de profesor', 'Universidades', 'Cosas que llevas en la mochila', 'Streamers y youtubers', 'Canciones virales', 'Influencers y tiktokers', 'Memes', 'Aplicaciones del móvil', 'Cosas que pasan en una fiesta universitaria', 'Palabras en inglés que usamos sin traducir', 'Frases típicas de un trabajo en grupo', 'Cantantes de reguetón o trap', 'Cosas por las que cancelarían a alguien en redes'];

  /* ---------- Charadas ---------- */
  K.charadas.uni = ['Erasmus', 'Chuleta', 'Trabajo en grupo', 'Dormirse en clase', 'Revisión de examen', 'Empollón', 'Compañero de piso', 'Resaca en clase', 'Tupper', 'Biblioteca', 'Graduación', 'Profesor aburrido', 'Selectividad', 'Presentación con diapositivas', 'Becario', 'Fotocopias', 'Copiar en un examen', 'Estudiar la noche antes', 'Tuna', 'Novato', 'Streamer', 'Tiktoker', 'Selfi en el espejo', 'Dejar en visto', 'Hacer un directo', 'Ghosting', 'Baile de TikTok', 'Unboxing', 'Influencer', 'Mandar un audio larguísimo'];

  /* ---------- Palabras prohibidas ---------- */
  K.prohibidas.uni = ['ERASMUS|Extranjero,Beca,Europa,Fiesta,Intercambio', 'SELECTIVIDAD|Examen,Bachillerato,Nota,Universidad,Acceso', 'BIBLIOTECA|Libros,Estudiar,Silencio,Exámenes,Sitio', 'TFG|Trabajo,Final,Grado,Tutor,Defensa', 'APUNTES|Clase,Escribir,Pasar,Estudiar,Hojas', 'BECA|Dinero,Ayuda,Estudiar,Ministerio,Nota', 'RESIDENCIA|Vivir,Estudiantes,Habitación,Colegio mayor,Comedor', 'SUSPENSO|Aprobar,Nota,Cuatro,Examen,Recuperación', 'STREAMER|Directo,Twitch,Juegos,Chat,Seguidores', 'INFLUENCER|Instagram,Seguidores,Marcas,Fotos,Famoso', 'GHOSTING|Desaparecer,Contestar,Ligar,Mensajes,Fantasma', 'MEME|Imagen,Risa,Internet,Gracioso,Viral', 'TIKTOK|Vídeos,Bailes,Aplicación,Corto,Móvil', 'PODCAST|Escuchar,Audio,Micrófono,Episodio,Hablar', 'CRUSH|Gustar,Amor,Persona,Platónico,Enamorado', 'CAFETERÍA|Café,Facultad,Desayuno,Descanso,Bocadillo', 'CHULETA|Copiar,Examen,Papel,Trampa,Escondida', 'COMPAÑERO DE PISO|Vivir,Alquiler,Compartir,Casa,Habitación'];

  /* ---------- A ojo: estimaciones sueltas (sin impostor) ----------
     [pregunta, respuesta, unidad, mínimo, máximo]. Las cifras de usuarios son aproximadas y cambian con el tiempo. */
  K.estimaciones = {
    internet: [
      ['¿Cuántas personas usan YouTube cada mes?', 2700000000, 'personas', 0, 0],
      ['¿Cuántas personas usan Instagram cada mes?', 3000000000, 'personas', 0, 0],
      ['¿Cuántas personas usan WhatsApp cada mes?', 3000000000, 'personas', 0, 0],
      ['¿Cuántos dispositivos llegaron a ver a la vez La Velada del Año V en Twitch?', 9190000, 'dispositivos', 0, 0],
      ['¿Cuántas personas había en el estadio en La Velada del Año V?', 80000, 'personas', 0, 200000],
      ['¿En qué año se subió el primer vídeo a YouTube?', 2005, '', 1995, 2015],
      ['¿En qué año se lanzó Instagram?', 2010, '', 2000, 2020],
      ['¿En qué año salió el primer iPhone?', 2007, '', 1995, 2015],
      ['¿En qué año se lanzó WhatsApp?', 2009, '', 2000, 2020],
      ['¿Cuántos segundos duraba como máximo un vídeo de Vine?', 6, 's', 0, 0],
      ['¿Cuántos caracteres permitía un SMS?', 160, 'caracteres', 0, 0],
      ['¿Cuántos bitcoins existirán como máximo?', 21000000, 'bitcoins', 0, 0],
      ['¿Cuántos artículos tiene, aproximadamente, la Wikipedia en inglés?', 7000000, 'artículos', 0, 0],
      ['¿Cuántas personas caben como máximo en un grupo de WhatsApp?', 1024, 'personas', 0, 0],
      ['¿En qué año se envió el primer correo electrónico?', 1971, '', 1940, 2000],
      ['¿En qué año nació la Wikipedia?', 2001, '', 1985, 2015],
      ['¿En qué año se lanzó Spotify?', 2008, '', 1995, 2020],
      ['¿En qué año se lanzó Twitch?', 2011, '', 1995, 2020],
    ],
    pop: [
      ['¿Cuántos episodios tiene «Friends»?', 236, 'episodios', 0, 0],
      ['¿Cuántos episodios tiene «Juego de tronos»?', 73, 'episodios', 0, 0],
      ['¿Cuántos episodios tiene «Breaking Bad»?', 62, 'episodios', 0, 0],
      ['¿Cuántos goles oficiales marcó Messi con el Barça?', 672, 'goles', 0, 0],
      ['¿Cuántos Óscar ganó «Titanic»?', 11, 'Óscar', 0, 0],
      ['¿Cuántos minutos dura «Titanic»?', 195, 'min', 0, 0],
      ['¿Cuántos minutos dura «Vengadores: Endgame»?', 181, 'min', 0, 0],
      ['¿En qué año se estrenó la primera película de «La guerra de las galaxias»?', 1977, '', 1950, 2000],
      ['¿En qué año se estrenó «Toy Story»?', 1995, '', 1980, 2010],
      ['¿En qué año se estrenó «Shrek»?', 2001, '', 1985, 2015],
      ['¿En qué año salió «Gangnam Style»?', 2012, '', 2000, 2020],
      ['¿Cuántos miligramos de cafeína tiene una lata de Red Bull de 250 ml?', 80, 'mg', 0, 0],
      ['¿Cuántos grados de alcohol tiene el Jägermeister?', 35, '%', 0, 0],
      ['¿Con cuántas hierbas y especias se elabora el Jägermeister?', 56, 'ingredientes', 0, 0],
      ['¿En qué año se fundó la Universidad de Salamanca?', 1218, '', 1000, 1600],
      ['¿En qué año se fundó la Universidad de Bolonia, la más antigua de Europa?', 1088, '', 800, 1400],
    ],
  };
})(Corrillo.content);
