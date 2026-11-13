# Auditoría: alcance aprobado y seguimiento

El propietario confirmó la implementación completa por bloques tras 105 preguntas, el 13-11-2026. Esta lista distingue trabajo incorporado de verificación pendiente. No es un registro de publicación.

## Límites aprobados

- Web estática, scripts clásicos, sin compilación ni servidor; debe funcionar por `file://`. Configuraciones por juego y picante desactivado por defecto.
- Conservar las opciones existentes. Fuera de alcance: recuperación de partidas, nuevas acciones de deshacer y los otros juegos propuestos por la auditoría.
- Feedback: informes y ocultación locales, exportación y enlace a una issue de GitHub rellenada. El usuario publica en GitHub con su cuenta. Se descartaron servidor, GitHub App y envío automático, incluida la cola automática al reconectar.
- No publicar cambios en `main` sin seguir la autorización de publicación correspondiente al commit preparado.

## Reglas aprobadas

- Solo las competiciones completas conceden victorias de la noche. Todo primer puesto recibe una victoria si hay alguien por debajo; empate total no concede nada. También con negativos y por equipos (victoria a cada integrante).
- Equidad por ciclos individuales o turnos/tiempo por equipo; 2+ equipos, mínimo 2 personas por equipo, reparto automático y manual, portavoces independientes.
- Apuesto: azar ponderado siempre con posibilidades positivas en candidatos válidos; mínimo de intentos en ambos papeles antes de acabar, longitud variable. Media de los dos porcentajes por defecto; puntos clásicos conservados.
- Impostor/Espía: rápida por defecto, supervivencia nueva. No se conocen entre infiltrados. Supervivencia: minoría inicial, una expulsión por votación, sin adivinar, sin pistas posteriores al reparto, normales ganan al eliminar a todos; infiltrados al alcanzar paridad. Solo infiltrados supervivientes ganan; todos los normales, incluidos eliminados, ganan cuando vence su bando. Rápida: acusación errónea gana infiltrados, correcta ganan normales salvo última oportunidad opcional; si adivina, solo gana quien adivina. Reparto y seguimiento disponibles. Revelación del eliminado activada por defecto; eliminado no participa. Votos públicos o secretos opcionales, abstención sí, autovoto no. Desempate y, si persiste, discusión sin eliminar.
- Lobos: presets inicial/avanzado, 7 roles, lobos se conocen, variantes actuales explicadas (protector puede repetirse/protegerse, bruja a ciegas/una poción por noche, amantes conservan bandos). Todos muertos: sin ganador.
- Cifras: dial conservado, teclado directo, unidades y límites naturales sin acercarlos a la respuesta. Distancia absoluta predeterminada. Precio sin pasarse opcional; todos pasados = nadie puntúa. Subasta: puja previa e incrementos, reloj opcional; al agotarse desafía o pasa si no hay puja inicial.
- Público oral y privado donde encajen; conservar recuento manual ilimitado de Prefieres. Agregados por defecto, detalle nominal opcional. Detallazo binario y opción Depende; NO añadir No me parece bien.
- Yo nunca: móvil solo para leer, no registrar quién lo ha hecho. 5/10 dedos (10 por defecto), cambio de regla durante partida.
- Conocemos: rondas por participante y preguntas totales, variante oral con protagonista privado y aciertos confirmados por el grupo. Mostrar carga/duración, breves para grupos grandes.
- Quién lo dijo: sin puntos por defecto; competencia opcional 1 punto por autor, 0 fallo, no respuesta propia; autores idénticos válidos, predicciones antes de revelar.
- Contraseña: cooperación por defecto, individual y equipos conservados. Onda: cooperación y nueva individual (mínimo 3), zonas 4/3/2/0, emisor recibe la media, ciclos completos.
- Bomba: pase físico sin botones; categoría antes, reloj opcionalmente visible y oculto por defecto, duración aleatoria dentro de límites configurables 15–45 s por defecto. Seleccionar víctima después de explosión. Abierta, por explosiones (menos gana) y vidas (3 configurables, último gana).
- Fiesta: todos los juegos, rápida/completas, abierta/número de juegos/ciclos y resumen. Cierres seguros, ciclos equitativos, rebarajar sin repetición inmediata. Parciales conservados en resumen temporal, sin victoria incompleta. Predeterminado/menos móvil, selector público/privado donde encaje. En menos móvil, roles priorizan solo reparto; secretos y respuestas anónimas conservan interacción necesaria.
- Ranking nuevo: 5/10 posiciones (5 por defecto), sin puntuación, consenso y personal público/privado. Puestos bloqueados. Público elementos diferentes por persona; privado mismos elementos/orden y comparación solo al final.
- Cuatro rondas es modo de Charadas: 2+ equipos, mismo mazo, descripción/1 palabra/mímica/sonidos sin palabras. 60 s por equipo hasta agotar mazo, siguiente fase empieza equipo posterior al que lo agotó, tiempo sobrante no se lleva. Pasar devuelve carta pendiente sin penalizar; 1 punto por acierto. Inicio aleatorio seleccionable. Catálogo/propias/mezcla y aportaciones de sesión, guardar expreso opcional.
- Pista única nueva: coop por defecto o 2+ equipos, rotación de adivinador, igual cantidad de palabras por equipo. Por defecto 1 turno por persona coop, 5 palabras/equipo. Una palabra/pista, cancelar todas las repetidas ignorando tildes/mayúsculas; revisión manual de equivalencias. Una respuesta, 1/0 puntos, válido intento a ciegas si se anulan todas.
- Castigos: desactivados inicialmente y preferencia recordada. Cambiar ilimitadamente sin puntuar ni repetir mientras haya alternativas; NO botón de omitir castigo. Mantener tareas con materiales/apps/terceros y etiquetarlas; sustituir tareas que bloquean el móvil. Filtros opcionales sin exclusiones iniciales para materiales, apps, terceros, contacto, esfuerzo y exposición.
- Contenido factual: revisar TODO con fuente, contexto, fecha, unidad y precisión; sustituir/reformular no respaldado, corregir parejas delatadoras y categorías. V/F aproximadamente equilibrado por categoría, sin secuencias forzadas. IDs permanentes, migración de historial, historial factual compartido activado por defecto (alternativa independiente).
- Editor visual con vista previa y entrada masiva avanzada conservada, Prohibidas propias. Grupos guardados importan copias por juego. Invitado sin autoguardados y borrado selectivo.
- Secretos cubiertos al segundo plano y revelación consciente sin cambiar jugador, mantener pulsado opcional. Pausa manual y segundo plano por defecto (configurable). Panel sonido/vibración independiente/pausa/ayuda pública. Calibración y botones de Charadas.
- Menú compacto con filtros de dinámica y configuración progresiva con resumen. Búsqueda se reinicia al recargar. Legibilidad/gráficos/resultados/compartir completos, foco y movimiento reducido sin anuncios de secretos.
- Offline: versiones coherentes y aceptación de recarga, esenciales independientes de fotos, fallback y estado preciso. Ruleta hasta una opción y reinicio.

## Verificación final a 13-11-2026

- [x] Reglas comunes, victorias, equipos, porcentajes, Bomba, roles/supervivencia y Lobos.
- [x] Variantes sociales y cooperación, Ranking, Pista única, Cuatro rondas dentro de Charadas y Fiesta.
- [x] Privacidad, pausa, modo invitado, grupos, copias, editor visual, filtros, feedback y gráficos.
- [x] Revisión de los 338 datos factuales con referencias y contexto. Mentiroso: parejas del mismo dominio. V/F: seis categorías equilibradas. Reformulación de afirmaciones no respaldadas y castigo que bloqueaba el móvil.
- [x] IDs y alias permanentes, migración de historial anterior y reconocimiento de paráfrasis del mismo dato.
- [x] Regresiones de votos secretos/abstenciones/desempates, Onda individual, Conocemos oral, autores idénticos, tres equipos impares, timeout de Subasta, Cuatro rondas con pase y timeout, filtros vacíos, exportación invitada y borrado selectivo.
- [x] PWA en servidor real: foto ausente, esenciales disponibles offline, versión A inmutable hasta aceptar B, recarga y arranque offline de B. Hashes SRI comprobados contra los archivos.
- [x] Capturas revisadas a 320/390 px, horizontal y texto 150 %; gráfica con veinte estimaciones próximas, detalle completo y PNG de veinte personas. Se corrigieron desbordamientos y etiquetas de escala.
- [x] Sintaxis, pruebas de Node, regresiones originales y nuevas, y recorrido de los 28 juegos y Fiesta sin errores de JavaScript.
- [x] CI, README y CONTEXT actualizados. `tools/catalogue.cjs` conserva identidades y `tools/offline.cjs` genera la integridad después de editar recursos.

El propietario autorizó expresamente hacer el push a `main` y actualizar la web al terminar. El anexo original aportado por el usuario se conserva sin modificar. Recuperar partidas y nuevas acciones de deshacer siguen fuera del alcance aprobado.

Las pruebas físicas de sensores, vista de aplicaciones recientes, compartir nativo e instalación en Android/iPhone no están certificadas por estas pruebas de Chromium.
