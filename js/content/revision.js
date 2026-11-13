/* Revisión editorial: fuentes de cada dato, contexto y alias de las cartas corregidas. */
(function (C) {
  'use strict';
  C.cardAliases = C.cardAliases || [];
  const rewrite = (bank, before, after) => Object.keys(C.content[bank]).forEach((cat) => {
    C.content[bank][cat] = C.content[bank][cat].map((item) => {
      if (item !== before) return item;
      C.cardAliases.push([before, after]); return after;
    });
  });
  [
    ['¿Cuál es la mejor estación del año?|¿Qué mes del año se hace más largo?', '¿Cuál es la mejor estación del año?|¿Qué estación del año se hace más larga?'],
    ['¿Cuántos países has visitado?|¿Cuántas veces has ido al gimnasio este año?', '¿Cuántos países has visitado?|¿Cuántos países te gustaría visitar en los próximos cinco años?'],
    ['¿Cuántos cafés tomas a la semana?|¿Cuántas veces cocinas a la semana?', '¿Cuántos cafés tomas a la semana?|¿Cuántos cafés pedirías para todo tu grupo de amigos?'],
    ['¿Cuántos pares de zapatos tienes?|¿Cuántas plantas has matado?', '¿Cuántos pares de zapatos tienes?|¿Cuántos pares de zapatos usarías en un mes?'],
    ['¿Cuántas alarmas pones por la mañana?|¿Cuántas pestañas tienes abiertas en el móvil?', '¿Cuántas alarmas pones por la mañana?|¿Cuántas alarmas pondrías para no perder un vuelo?'],
    ['¿Qué electrodoméstico inventarías?|¿Qué invento eliminarías del mundo?', '¿Qué electrodoméstico inventarías?|¿Qué electrodoméstico eliminarías de tu casa?'],
    ['¿Cuántos amigos de verdad tienes?|¿Cuántos grupos de WhatsApp tienes silenciados?', '¿Cuántos amigos de verdad tienes?|¿Cuántos amigos invitarías a una cena en casa?'],
    ['¿Con cuántas personas te has besado?|¿Cuántas citas malas has tenido?', '¿Con cuántas personas te has besado?|¿Con cuántas personas has tenido una primera cita?'],
    ['¿Cuántas copas aguantas sin que se note?|¿Cuántos mensajes le mandas a alguien que te gusta antes de rendirte?', '¿Cuántas copas aguantas sin que se note?|¿Cuántas copas pedirías para una cena entre dos?'],
    ['¿Cuánto tardas en contestar a quien te gusta?|¿Cuánto debería durar una primera cita?', '¿Cuántos minutos tardas en contestar a quien te gusta?|¿Cuántos minutos debería durar una primera cita?'],
    ['¿Cuántos cafés tomas en un día de exámenes?|¿Cuántas horas duermes la noche antes de un examen?', '¿Cuántos cafés tomas en un día de exámenes?|¿Cuántos cafés tomarías durante un día entero de clases?'],
    ['¿Cuántas apps tienes en el móvil?|¿Cuántas fotos haces en un viaje de un día?', '¿Cuántas apps tienes en el móvil?|¿Cuántas apps crees que usa habitualmente tu grupo?'],
    ['¿Cuántos kilómetros andas al día?|¿Cuántas horas pasas sentado al día?', '¿Cuántos kilómetros andas al día?|¿Cuántos kilómetros andarías para no pagar un taxi?'],
    ['¿Cuántos libros lees al año?|¿Cuántas series empiezas al año?', '¿Cuántos libros lees al año?|¿Cuántos libros te gustaría leer en tus próximas vacaciones?'],
    ['¿Cuántos países te gustaría visitar en tu vida?|¿Cuántas personas invitarías a tu boda?', '¿Cuántos países te gustaría visitar en tu vida?|¿Cuántos países crees que podrías recorrer en un año?'],
    ['¿Cuántos mensajes de WhatsApp recibes al día?|¿Cuántas veces miras el móvil por la mañana?', '¿Cuántos mensajes de WhatsApp recibes al día?|¿Cuántos mensajes de WhatsApp envías al día?'],
  ].forEach(([before, after]) => rewrite('mentiroso', before, after));
  rewrite('castigos', 'Deja el móvil boca abajo en el centro durante dos rondas.', 'Quédate de pie junto a tu sitio durante la siguiente ronda, sin impedir que el móvil siga circulando.');
  C.reviseFact = (bank, question, urls, asof, precision, changes) => {
    const byCat = C.content[bank];
    let found = false, revisedQuestion = question;
    Object.keys(byCat).forEach((cat) => {
      byCat[cat] = byCat[cat].map((item) => {
        const fields = typeof item === 'string' ? item.split('|') : item.slice();
        const index = bank === 'invento' ? 1 : fields[0] === question ? 0 : bank === 'cifras' && fields[3] === question ? 3 : -1;
        if (index < 0 || fields[index] !== question) return item;
        found = true;
        Object.entries(changes || {}).forEach(([key, value]) => fields[Number(key)] = value);
        const revised = typeof item === 'string' ? fields.join('|') : fields;
        revisedQuestion = fields[index];
        if (JSON.stringify(revised) !== JSON.stringify(item)) {
          C.cardAliases.push([item, revised], [question, revisedQuestion]);
          if (bank === 'cifras') {
            for (const offset of [0, 3]) C.cardAliases.push([[item[offset], item[offset + 1], item[offset + 2], item[6], item[7]], [fields[offset], fields[offset + 1], fields[offset + 2], fields[6], fields[7]]]);
          }
        }
        return revised;
      });
    });
    if (!found) throw new Error('No existe el dato editorial: ' + bank + ' · ' + question);
    C.sources = (C.sources || []).filter((source) => !(source.bank === bank && (source.question === question || source.question === revisedQuestion)));
    C.sources.push({ bank, question: revisedQuestion, urls, checked: '2026-11-13', asof, precision });
  };
  const price = (name, url, date, precision, changes) => C.reviseFact('precios', name, [url], date, precision, changes);
  price('PlayStation 5', 'https://sonyinteractive.com/en/press-releases/2020/playstation-5-launches-this-november-at-399-for-ps5-digital-edition-and-499-for-ps5-with-ultra-hd-blu-ray-disc-drive/', '2020-09-16', 'PVP anunciado en Europa, modelo con lector; importe nominal.', { 1: 499.99, 6: 'Lanzamiento europeo de 2020, modelo con lector: PVP anunciado, no precio actual' });
  price('El primer iPhone', 'https://www.apple.com/newsroom/2007/06/18iPhone-Delivers-Up-to-Eight-Hours-of-Talk-Time/', '2007-06-18', 'Precio anunciado en EE. UU.; modelo de 4 GB y contrato AT&T.', { 6: 'Lanzamiento en EE. UU. en 2007, 4 GB, con contrato AT&T; dólares de la época' });
  price('iPhone 15 Pro', 'https://www.apple.com/es/newsroom/2023/09/apple-unveils-iphone-15-pro-and-iphone-15-pro-max/', '2023-09-12', 'PVP de salida en España del modelo básico.', { 6: 'PVP de lanzamiento en España en 2023, modelo básico de 128 GB' });
  price('Apple Vision Pro', 'https://www.apple.com/newsroom/2024/01/apple-vision-pro-available-in-the-us-on-february-2/', '2024-01-08', 'Precio inicial anunciado en EE. UU., 256 GB.', { 6: 'Precio inicial anunciado en EE. UU. en 2024, modelo de 256 GB' });
  price('El primer iPod', 'https://www.apple.com/newsroom/2001/10/23Apple-Presents-iPod/', '2001-10-23', 'Precio anunciado en EE. UU., modelo de 5 GB.');
  price('Microsoft compra Minecraft', 'https://news.microsoft.com/source/2014/09/15/minecraft-to-join-microsoft/', '2014-09-15', 'Valor anunciado de la adquisición de Mojang, no de una copia del juego.', { 0: 'Microsoft compra Mojang, creadora de Minecraft', 6: 'Acuerdo de adquisición anunciado en 2014, en dólares nominales' });
  price('Microsoft compra Activision Blizzard', 'https://news.microsoft.com/source/2022/01/18/microsoft-to-acquire-activision-blizzard-to-bring-the-joy-and-community-of-gaming-to-everyone-across-every-device/', '2022-01-18', 'Valor anunciado, incluido el efectivo neto de Activision; no coste contable posterior.', { 1: 68700000000, 6: 'Valor del acuerdo anunciado en enero de 2022; adquisición cerrada en 2023' });
  price('Disney compra Marvel', 'https://thewaltdisneycompany.com/press-releases/disney-to-acquire-marvel-entertainment/', '2009-08-31', 'Valor aproximado del acuerdo anunciado, en efectivo y acciones.');
  price('Disney compra Lucasfilm', 'https://thewaltdisneycompany.com/app/uploads/ir/2012/events/lucasfilm-2012-1030-transcript.pdf', '2012-10-30', 'Valor aproximado del acuerdo anunciado, en efectivo y acciones.');
  price('Disney compra Pixar', 'https://thewaltdisneycompany.com/press-releases/disney-to-acquire-pixar/', '2006-01-24', 'Valor de la operación en acciones; no importe neto del efectivo de Pixar.');
  price('Disney compra 21st Century Fox', 'https://thewaltdisneycompany.com/press-releases/the-walt-disney-company-signs-amended-acquisition-agreement-to-acquire-twenty-first-century-fox-inc-for-71-3-billion-in-cash-and-stock/', '2018-06-20', 'Valor del acuerdo de efectivo y acciones, sin añadir la deuda asumida.', { 6: 'Acuerdo anunciado en junio de 2018: efectivo y acciones, sin deuda asumida' });
  price('Amazon compra Whole Foods', 'https://press.aboutamazon.com/2017/6/amazon-to-acquire-whole-foods-market', '2017-06-16', 'Valor aproximado del acuerdo, incluida la deuda neta.');
  price('Microsoft compra LinkedIn', 'https://news.microsoft.com/source/2016/06/13/microsoft-to-acquire-linkedin/', '2016-06-13', 'Valor anunciado, incluido el efectivo neto de LinkedIn.');
  price('Microsoft compra Skype', 'https://news.microsoft.com/source/2011/05/10/microsoft-to-acquire-skype-3/', '2011-05-10', 'Importe anunciado en efectivo.');
  price('Amazon compra Twitch', 'https://press.aboutamazon.com/2014/8/amazon-com-to-acquire-twitch', '2014-08-25', 'Importe aproximado anunciado en efectivo, sujeto a ajustes.');
  price('Game Boy', 'https://www.pbs.org/newshour/arts/nintendos-game-boy-turns-25', 'Lanzamiento norteamericano de 1989', '89,99 dólares, redondeados al dólar.', { 6: 'Lanzamiento en Norteamérica en 1989, redondeado al dólar' });
  price('Nintendo 64', 'https://www.spokesman.com/stories/1996/oct/03/nintendo-64-debut-empties-store-shelves/', 'Lanzamiento estadounidense de 1996', 'Precio de lista de 199,99 dólares, redondeado al dólar.', { 6: 'Precio de lista en EE. UU. en 1996, redondeado al dólar' });
  const consoles = 'https://questromworld.bu.edu/platformstrategy/wp-content/uploads/sites/49/2015/06/platform2015_submission_15-1.pdf';
  price('Sega Mega Drive', consoles, 'Lanzamiento estadounidense de 1989; tabla publicada en 2015', 'Tabla 2 del estudio: precio de lanzamiento expresado en dólares enteros.');
  price('Super Nintendo', consoles, 'Lanzamiento estadounidense de 1991; tabla publicada en 2015', 'Se toma la referencia de 199 dólares de la Tabla 2 del estudio; importe nominal sin inflación.', { 6: 'Precio estadounidense de 1991 recogido en la Tabla 2 del estudio citado' });
  price('La primera PlayStation', consoles, 'Lanzamiento estadounidense de 1995; tabla publicada en 2015', 'Precio de referencia de la Tabla 2 del estudio, en dólares nominales.');
  price('PlayStation 2', consoles, 'Lanzamiento estadounidense de 2000; tabla publicada en 2015', 'Precio de referencia de la Tabla 2 del estudio, en dólares nominales.');
  price('Tesla Model 3', 'https://ir.tesla.com/_flysystem/s3/sec/000119312516577582/d158845d8k-gen_0.pdf', 'Presentación de 2016', 'Precio base objetivo anunciado antes de incentivos; no precio actual.');
  price('El primer iPad', 'https://www.apple.com/newsroom/2010/03/29iPad-Arrives-This-Saturday/', '2010-03-29', 'Precio inicial anunciado en Estados Unidos del modelo básico con wifi.');
  price('La primera Raspberry Pi', 'https://www.raspberrypi.com/news/the-raspberry-pi-launch/', '2012-02-29', 'Modelo B de 256 MB; precio anunciado sin impuestos locales ni envío.');
  price('Facebook compra Instagram', 'https://about.fb.com/news/2012/04/facebook-to-acquire-instagram/', '2012-04-09', 'Valor anunciado aproximado, en efectivo y acciones.', { 6: 'Valor del acuerdo anunciado en abril de 2012, antes del cierre' });
  price('Facebook compra WhatsApp', 'https://about.fb.com/news/2014/02/facebook-to-acquire-whatsapp/', '2014-02-19', '16.000 millones por la adquisición más 3.000 millones en acciones restringidas para fundadores y empleados.', { 6: 'Acuerdo de 2014: adquisición y acciones restringidas adicionales para empleados' });
  price('Google compra YouTube', 'https://www.sec.gov/Archives/edgar/data/1288776/000119312506206884/dex991.htm', '2006-10-09', 'Valor anunciado en acciones, no precio de una compra en efectivo.');
  price('Elon Musk compra Twitter', 'https://www.sec.gov/Archives/edgar/data/1418091/000119312522117720/d319190dex991.htm', '2022-04-25', 'Valor aproximado del acuerdo anunciado a 54,20 dólares por acción.');
  price('eBay compra PayPal', 'https://www.sec.gov/Archives/edgar/data/1103415/000091205702037693/a2090698zex-99_1.htm', '2002-10-03', 'Valor aproximado según la cotización usada en el anuncio del canje de acciones.');
  price('Rodar «Avatar»', 'https://www.the-numbers.com/movie/Avatar-%282009%29', '2009; ficha consultada en 2026', 'Presupuesto de producción estimado por The Numbers; no auditoría de costes del estudio.', { 6: 'Presupuesto de producción estimado por The Numbers para la película de 2009' });
  price('Rodar «Titanic»', 'https://www.the-numbers.com/movie/Titanic-%281997%29', '1997; ficha consultada en 2026', 'Presupuesto de producción estimado por The Numbers; excluye marketing.', { 6: 'Presupuesto de producción estimado por The Numbers para la película de 1997' });
  price('Rodar «Vengadores: Endgame»', 'https://www.the-numbers.com/movie/Avengers-Endgame-%282019%29', '2019; ficha consultada en 2026', 'Referencia elegida: estimación de The Numbers. Otras publicaciones manejan cifras distintas.', { 1: 400000000, 6: 'Presupuesto de producción según The Numbers, película de 2019' });
  price('Rodar «El proyecto de la bruja de Blair»', 'https://www.the-numbers.com/movie/Blair-Witch-Project-The', '1999; ficha consultada en 2026', 'Estimación de producción de The Numbers, incluyendo costes posteriores al rodaje inicial.', { 1: 600000, 6: 'Presupuesto de producción según The Numbers, no solo el rodaje inicial de 1999' });
  price('Rodar «Paranormal Activity»', 'https://www.the-numbers.com/movie/Paranormal-Activity', '2009; ficha consultada en 2026', 'Estimación de producción de The Numbers para la versión distribuida; no el rodaje doméstico original.', { 1: 450000, 6: 'Presupuesto de producción según The Numbers para su distribución en 2009' });
  const numeric = (question, url, date, precision, changes) => C.reviseFact('cifras', question, [url], date, precision, changes);
  price('Steam Deck', 'https://steamdb.info/blog/valve-introduces-steam-deck/', '2021-07-15; primeras entregas en 2022', 'Comunicado de Valve reproducido: precio inicial de la versión de 64 GB en Estados Unidos.');
  price('Crear y promocionar GTA V', 'https://www.guinnessworldrecords.com/world-records/109999-largest-budget-for-a-videogame', '2013', 'Estimación de desarrollo y marketing publicada por Guinness; no presupuesto auditado de Rockstar. Se conserva la moneda original.', { 1: 170000000, 2: '£', 6: 'Estimación publicada por Guinness para desarrollo y marketing en 2013, en libras' });
  price('Anuncio de 30 segundos en la Super Bowl', 'https://www.cbsnews.com/amp/news/how-much-super-bowl-commercial-cost-2024/', '2024-02-11', 'Referencia de CBS para el espacio publicitario en la edición de 2024; producción excluida.');
  price('«Los jugadores de cartas», de Cézanne', 'https://www.guinnessworldrecords.com/world-records/71413-most-expensive-painting-by-cezanne', 'Venta privada de 2011', 'Cifra publicada por Guinness; una venta privada no tiene un resultado público de subasta.', { 6: 'Cifra publicada por Guinness para la venta privada de 2011; importe no público auditado' });
  price('El Códice Leicester de Leonardo', 'https://www.guinnessworldrecords.com/world-records/most-expensive-manuscript-that-is-illustrated', '1994-11-11', '30.802.500 dólares, redondeados a cien mil; sin ajustar por inflación.');
  price('El sello «1 centavo magenta» de la Guayana Británica', 'https://www.sothebys.com/en/digital-catalogues/three-treasures-collected-by-stuart-weitzman', '2014-06-17', '9,48 millones de dólares, redondeados a cien mil.', { 6: 'Resultado de la subasta de 2014, redondeado; no su venta posterior de 2021' });
  price('«Sue», el esqueleto de T. rex', 'https://www.deseret.com/1997/10/5/19337864/dinosaur-fossil-sells-for-8-36-million/', '1997-10-04', '8,36 millones con comisión, redondeados a cien mil.');
  price('Un Ford Modelo T', 'https://www.thehenryford.org/collections/explore/articles/fords-model-t', '1908', 'Precio introductorio del Model T según el museo Henry Ford.');
  price('Estados Unidos compra Luisiana a Francia', 'https://www.archives.gov/milestone-documents/louisiana-purchase-treaty', '1803-04-30', 'Importe nominal de la operación histórica, sin ajuste por inflación.');
  price('Dos pizzas pagadas con bitcoin', 'https://www.guinnessworldrecords.com/world-records/696240-first-commercial-bitcoin-transaction', '2010-05-22', 'Cantidad de bitcoins acordada por las dos pizzas; no equivalencia actual en dinero.');
  price('Fichaje de Cristiano Ronaldo por el Real Madrid', 'https://www.uefa.com/news-media/news/01da-0e724ecc82ec-05f7b7b5fb93-1000--ronaldo-completes-record-madrid-switch/', '2009-06', 'Equivalencia en euros publicada por UEFA de la operación de 80 millones de libras.');
  price('Google compra Android', 'https://www.govinfo.gov/content/pkg/CPRT-117HPRT47832/pdf/CPRT-117HPRT47832.pdf', 'Operación de 2005; informe del Congreso de EE. UU.', 'Valor recogido en la tabla de adquisiciones del informe, no precio anunciado por Google.');
  price('Fichaje de Mbappé por el PSG', 'https://media.psg.fr/image/upload/v1771575276/De%CC%81cision_CPH_16_de%CC%81cembre_2025_jolc91.pdf', 'Operación de 2017–2018; resolución de 2025', 'Importe del traspaso consignado en la resolución judicial publicada por PSG.');
  price('Fichaje de Coutinho por el Barça', 'https://www.bbc.co.uk/sport/football/42592508', '2018-01', 'Parte fija de 120 millones publicada por la prensa; variables excluidas.', { 6: 'Parte fija publicada para el traspaso de enero de 2018, sin variables' });
  price('Nintendo Switch', 'https://www.nintendo.co.jp/ir/pdf/2017/170201_2e.pdf', '2017-02-01', 'PVP anunciado en Estados Unidos, antes de impuestos locales.', { 1: 299.99, 2: '$', 6: 'PVP de lanzamiento anunciado en EE. UU. en 2017, modelo original' });
  price('Wii', 'https://www.nintendoworldreport.com/pr/12050/official-wii-launch-details', '2006-09-14', 'Comunicado de Nintendo reproducido íntegramente: 249,99 dólares, redondeados.', { 6: 'Lanzamiento en EE. UU. en 2006 con Wii Sports, redondeado al dólar' });
  price('Nintendo DS', 'https://www.nintendo.co.jp/ir/pdf/2005/050527.pdf', '2004-11-21', 'PVP estadounidense de 149,99 dólares, redondeado al dólar.');
  price('El primer Macintosh', 'https://www.computerhistory.org/revolution/artifact/303/1203', '1984', 'Precio original estadounidense del Macintosh, según la ficha del museo.');
  price('«Salvator Mundi»', 'https://press.christies.com/christies-sells-leonardo-da-vincis-500-year/', '2017-11-15', '450.312.500 dólares con comisiones, redondeados al millón.', { 6: 'Precio de subasta de 2017 con comisiones, redondeado al millón' });
  price('Un plátano pegado a la pared con cinta', 'https://www.sothebys.com/en/articles/top-banana-maurizio-cattelans-comedian-sells-for-6-2-million-at-sothebys-new-york', '2024-11-20', 'Resultado de Comedian publicado por la casa de subastas, con comisiones.');
  price('Bugatti Chiron', 'https://newsroom.bugatti.com/press-releases/geneva-international-motor-show-2016', '2016', 'Precio base neto anunciado por el fabricante, sin impuestos.', { 6: 'Precio base neto anunciado en su presentación de 2016, sin impuestos' });
  price('«El grito», de Munch', 'https://www.guinnessworldrecords.com/news/2012/5/edvard-munchs-the-scream-fetches-world-record-price-at-auction-41487', '2012-05-02', '119.922.500 dólares con comisiones, redondeados al millón.');
  price('La camiseta de Maradona de la «Mano de Dios»', 'https://www.guinnessworldrecords.com/world-records/most-expensive-football-shirt-sold-at-auction', '2022-05-04', 'Se usa la moneda de la subasta: 7.142.500 libras. Evita conversiones periodísticas de fechas distintas.', { 1: 7142500, 2: '£', 6: 'Resultado en libras de la subasta del 4 de mayo de 2022' });
  price('La Estación Espacial Internacional', 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/International_Space_Station/How_much_does_it_cost', 'Estimación histórica publicada por ESA', 'Desarrollo, montaje y diez años de operación; no coste acumulado actual.', { 1: 100000000000, 2: '€', 6: 'Estimación histórica de ESA: desarrollo, montaje y diez años de operación' });
  price('El Burj Khalifa', 'https://besixwatpac.com/projects/hotels-living/burj-khalifa', 'Construcción 2004–2010', 'Coste del proyecto recogido por el contratista, en dólares nominales.');
  price('«Lirios», de Van Gogh', 'https://www.upi.com/Archives/1987/11/12/Van-Goghs-Irises-sold-for-record-539-million-at-auction/3541563691600/', '1987-11-11', 'Resultado con comisión: 53,9 millones, frente a 49 millones de martillo.');
  price('«Los girasoles», de Van Gogh', 'https://www.upi.com/Archives/1987/11/12/Van-Goghs-Irises-sold-for-record-539-million-at-auction/3541563691600/', '1987-03', 'Equivalencia histórica en dólares citada por UPI; la venta londinense fue en libras.', { 6: 'Equivalencia en dólares publicada por UPI de la subasta londinense de marzo de 1987' });
  price('«Almiares», de Monet', 'https://www.sothebys.com/en/articles/monets-meules-sells-for-astonishing-110-7-million-a-new-artist-record', '2019-05-14', 'Resultado de Meules con comisiones, redondeado a cien mil dólares.');
  price('Un Ferrari 250 GTO de 1962', 'https://rmsothebys.com/media-center/press-releases/the-most-valuable-car-ever-sold-at-auction/', '2018-08-25', '48.405.000 dólares con comisiones, redondeados a cien mil.');
  price('Un Mercedes 300 SLR «Uhlenhaut» de 1955', 'https://group.mercedes-benz.com/company/news/uhlenhaut-coupe.html', '2022-05-05', 'Resultado anunciado por Mercedes-Benz en euros.', { 6: 'Coupé subastado en el museo Mercedes-Benz el 5 de mayo de 2022' });
  price('Un asiento al espacio con Virgin Galactic', 'https://www.sec.gov/Archives/edgar/data/1706946/000170694622000035/spce-20211231.htm', '2021-08', 'Precio base por asiento al reabrir ventas en agosto de 2021; no tarifa actual.');
  price('Estados Unidos compra Alaska a Rusia', 'https://www.archives.gov/milestone-documents/check-for-the-purchase-of-alaska', 'Tratado de 1867; pago de 1868', 'Importe nominal del cheque conservado en los Archivos Nacionales.');
  price('Los neerlandeses compran Manhattan', 'https://nysl.nysed.gov/newnetherland/schaghentrans', 'Carta de 1626', 'Valor en florines relatado en la carta de Schaghen, no una tasación moderna ni una descripción incuestionada del acuerdo.', { 6: 'Valor de bienes que relata la carta de Schaghen de 1626, en florines neerlandeses' });
  price('El programa Apolo', 'https://www.planetary.org/space-policy/cost-of-apollo', 'Ejercicios 1960–1973', 'Reconstrucción de costes directos e indirectos con los presupuestos históricos NASA; dólares nominales.');
  price('El telescopio espacial James Webb', 'https://www.gao.gov/products/gao-21-406', '2021-05', 'Estimación del ciclo de vida NASA, incluida operación prevista; no solo construcción.', { 1: 9700000000, 6: 'Estimación del ciclo de vida de NASA según GAO en 2021, incluida operación prevista' });
  price('Fichaje de Neymar por el PSG', 'https://www.fcbarcelona.com/en/news/748497/fc-barcelona-communique-on-neymar-jr', '2017-08-03', 'Indemnización por rescisión del contrato comunicada por el FC Barcelona.');
  numeric('¿Cuántos países miembros tiene la ONU?', 'https://www.un.org/en/about-us', '2026-11-13', '193 Estados miembros; no incluye Estados observadores.', { 0: '¿Cuántos Estados miembros integraban la ONU en noviembre de 2026?' });
  numeric('¿A cuántos kilómetros por segundo viaja la luz?', 'https://physics.nist.gov/cgi-bin/cuu/Value?c', 'CODATA 2022', 'En el vacío: 299.792,458 km/s, redondeados al km/s.', { 3: '¿A cuántos kilómetros por segundo viaja la luz en el vacío, redondeando?' });
  numeric('¿A cuántos grados Celsius está, aproximadamente, la superficie del Sol?', 'https://science.nasa.gov/earth/earth-observatory/climate-and-earths-energy-budget/', 'Ficha NASA consultada en 2026', 'Fotosfera: aproximadamente 5.500 °C; no temperatura del núcleo.');
  numeric('¿Cuántos kilómetros mide el radio medio de la Tierra?', 'https://science.nasa.gov/earth/facts/', 'Ficha NASA consultada en 2026', 'Radio medio aproximado, no radio ecuatorial.');
  numeric('¿Cuántos minutos tarda la luz del Sol en llegar a la Tierra?', 'https://science.nasa.gov/earth/facts/', 'Ficha NASA consultada en 2026', 'Aproximadamente 8,3 minutos; redondeado al minuto.', { 0: '¿Cuántos minutos tarda la luz del Sol en llegar a la Tierra, redondeando al minuto?' });
  numeric('¿Cuántas neuronas tiene el cerebro humano, aproximadamente?', 'https://www.frontiersin.org/journals/neuroanatomy/articles/10.3389/fnana.2014.00046/full', 'Estimación de Azevedo 2009 citada en 2014', 'Estimación media, no una cifra exacta para todos los cerebros humanos.');
  numeric('¿A cuántos grados Celsius se funde el hierro?', 'https://periodic-table.rsc.org/element/26/iron', 'Ficha RSC consultada en 2026', 'Punto de fusión de hierro puro a presión ordinaria.');
  numeric('¿A cuántos grados Celsius se funde el oro?', 'https://periodic-table.rsc.org/element/79/gold', 'Ficha RSC consultada en 2026', '1.064,18 °C, redondeados al grado.');
  numeric('¿A cuántos grados Celsius se funde el plomo?', 'https://periodic-table.rsc.org/element/82/lead', 'Ficha RSC consultada en 2026', '327,462 °C, redondeados al grado.');
  numeric('¿Cuántos grados bajo cero es el cero absoluto?', 'https://www.nist.gov/pml/owm/si-units-temperature', 'Definición del SI', '−273,15 °C; se pregunta su magnitud bajo cero, redondeada al grado.', { 0: '¿Cuántos grados Celsius bajo cero es el cero absoluto, redondeando al grado?' });
  numeric('¿En qué año se firmó la Declaración de Independencia de Estados Unidos?', 'https://www.archives.gov/milestone-documents/declaration-of-independence', '1776', 'La firma del documento manuscrito comenzó el 2 de agosto de 1776.');
  numeric('¿En qué año se publicó la primera parte de «El Quijote»?', 'https://cervantes.bne.es/es/colecciones/impresos-antiguos/ingenioso-hidalgo-don-quijote-mancha', '1605', 'Fecha de la primera edición de la primera parte.');
  numeric('¿En qué año murió Shakespeare?', 'https://www.shakespeare.org.uk/explore-shakespeare/shakespedia/william-shakespeare/when-did-shakespeare-die/', '1616', 'Año documentado por su registro de entierro y monumento.');
  numeric('¿Hacia qué año inventó Gutenberg la imprenta?', 'https://blogs.loc.gov/international-collections/2023/10/man-behind-the-bible-johannes-gutenbergs-life-of-adventure-and-art-loclr-blogint/', 'Hacia 1450', 'Fecha aproximada de su desarrollo europeo; hubo antecedentes de impresión en Asia.', { 0: '¿Hacia qué año desarrolló Gutenberg su imprenta europea de tipos móviles?' });
  numeric('¿En qué año se aprobó la Constitución española?', 'https://www.congreso.es/public_oficiales/L0/CONG/DS/C_1978_130.PDF', '1978', 'Texto aprobado por las Cortes en octubre y ratificado en referéndum en diciembre.');
  numeric('¿En qué año entró España en la Comunidad Económica Europea?', 'https://www.consilium.europa.eu/en/documents/treaties-agreements/agreement/?docLanguage=en&id=1985005', '1986-01-01', 'Entrada en vigor de la adhesión; no año de firma del tratado.');
  numeric('¿En qué año volaron por primera vez los hermanos Wright?', 'https://www.nps.gov/places/000/first-flight-landing.htm', '1903-12-17', 'Primer vuelo motorizado controlado de los hermanos Wright.');
  numeric('¿En qué año se estrenó la primera película sonora, «El cantor de jazz»?', 'https://www.loc.gov/programs/national-film-preservation-board/film-registry/descriptions-and-essays/', '1927', 'Película pionera del largometraje con diálogo sincronizado; no primera película con cualquier tipo de sonido.', { 3: '¿En qué año se estrenó la película sonora «El cantor de jazz»?' });
  /* Las 54 referencias de la ampliación previa conservan su procedencia y se explicita su precisión. */
  C.sources.forEach((source) => {
    if (!source.asof) source.asof = 'Ficha de referencia consultada el ' + source.checked;
    if (!source.precision) source.precision = source.bank === 'invento' ? 'Afirmación contrastada con la referencia indicada; consulta la explicación de la carta.' : /aproximad|redondeando/.test(source.question) ? 'Valor aproximado o redondeado según el enunciado; se usa la cifra de esta referencia.' : 'Se usa la unidad y la definición de la ficha indicada.';
  });
})(Corrillo);
