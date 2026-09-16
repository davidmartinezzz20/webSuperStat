// Que las cuatro páginas no se rompan por lo silencioso.
//
// Esta web tiene dos modos de fallo que nadie ve hasta que es tarde:
//
//   1. Un enlace o una imagen que apunta a un archivo que no está. En una SPA
//      salta a la primera; aquí es una imagen rota en una sección a la que hay
//      que bajar, o un 404 al pulsar el pie.
//   2. Que los cuatro idiomas se separen. Al añadir una sección a index.html
//      es fácil olvidarse de en/, fr/ o de/, y entonces una parte de la web
//      dice una cosa y otra dice otra. Es el mismo problema que test/i18n.js
//      vigila en la app, con la diferencia de que aquí no hay diccionario: hay
//      cuatro archivos escritos a mano.
//
// Sin dependencias y sin navegador: es leer los archivos y mirar.
//
//   node test/web.js
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const leer = rel => fs.readFileSync(path.join(RAIZ, rel), 'utf8');

let fallos = 0, pasadas = 0;
function check(nombre, ok, detalle){
  if(ok){ pasadas++; console.log('  ok   ' + nombre); }
  else { fallos++; console.log('  FALLA ' + nombre + (detalle ? '  → ' + detalle : '')); }
}

// Las cuatro portadas, con su idioma, la carpeta de capturas y la cuenta de
// Instagram que le toca a cada una. Añadir un idioma es añadir una fila aquí y
// sus archivos: todo lo demás de esta prueba sale de esta tabla.
//
// Solo hay dos cuentas de Instagram, la castellana y la inglesa, así que las
// portadas francesa y alemana enlazan la inglesa. La de X es una sola y por eso
// no es columna.
const IG_ES = 'https://www.instagram.com/superstat.es/';
const IG_EN = 'https://www.instagram.com/superstat.en/';
const EQUIS = 'https://x.com/superstatapp';

const PORTADAS = [
  { pagina:'index.html',    lang:'es', capturas:'img/capturas',    privacidad:'privacidad.html',    instagram:IG_ES },
  { pagina:'en/index.html', lang:'en', capturas:'img/capturas-en', privacidad:'privacidad-en.html', instagram:IG_EN },
  { pagina:'fr/index.html', lang:'fr', capturas:'img/capturas-fr', privacidad:'privacidad-fr.html', instagram:IG_EN },
  { pagina:'de/index.html', lang:'de', capturas:'img/capturas-de', privacidad:'privacidad-de.html', instagram:IG_EN }
];
const PRIVACIDADES = PORTADAS.map(p => p.privacidad);
const PAGINAS = [...PORTADAS.map(p => p.pagina), '404.html', ...PRIVACIDADES];
const html = {};
for(const p of PAGINAS) html[p] = leer(p);

// -------------------------------------------------------------------------
console.log('1. Todo href y src local apunta a algo que existe');

// Lo que no se comprueba: lo que sale del sitio (http, mailto), lo que no es
// un archivo (data:, las anclas sueltas) y las rutas de las que no se puede
// saber nada desde disco.
const FUERA = /^(https?:|mailto:|tel:|data:|#|\/\/)/;

function destinos(pagina){
  const fuente = html[pagina];
  const salida = [];
  const re = /(?:href|src)\s*=\s*"([^"]+)"/g;
  let m;
  while((m = re.exec(fuente))) salida.push(m[1]);
  return salida;
}

// Una URL de carpeta ('/', '/en/') se sirve como su index.html. Una ruta
// absoluta cuelga de la raíz del sitio, que aquí es la raíz del repositorio.
function aArchivo(pagina, url){
  const limpia = url.split('#')[0].split('?')[0];
  if(limpia === '') return null;
  const base = limpia.startsWith('/')
    ? path.join(RAIZ, limpia)
    : path.join(RAIZ, path.dirname(pagina), limpia);
  return limpia.endsWith('/') ? path.join(base, 'index.html') : base;
}

for(const pagina of PAGINAS){
  for(const url of destinos(pagina)){
    if(FUERA.test(url)) continue;
    const archivo = aArchivo(pagina, url);
    if(!archivo) continue;
    check(`${pagina} → ${url}`, fs.existsSync(archivo),
          path.relative(RAIZ, archivo) + ' no está');
  }
}

// -------------------------------------------------------------------------
console.log('\n1 bis. Las dos portadas enlazan en relativo');

// Los enlaces de navegación van en relativo ('en/', '../') y no colgando de la
// raíz ('/en/'). Con el dominio puesto da igual, pero GitHub Pages sirve el
// repositorio también en davidmartinezzz20.github.io/webSuperStat/, que es la
// URL con la que se comprueba la web ANTES de tocar el DNS. Ahí un '/en/'
// apunta fuera del repositorio y el cambio de idioma lleva a un 404.
//
// 404.html se queda fuera a propósito: lo sirve el servidor ante una URL
// cualquiera, así que no tiene una carpeta desde la que contar y necesita la
// ruta absoluta. Solo queda bien en el dominio de verdad. Las privacidad*.html
// también: son páginas sueltas de la raíz y solo se enlazan entre ellas.
for(const { pagina } of PORTADAS){
  for(const url of destinos(pagina)){
    if(FUERA.test(url) || !url.startsWith('/')) continue;
    check(`${pagina} → ${url} no cuelga de la raíz`, false,
          'escríbelo en relativo, o la URL de github.io se rompe');
  }
  check(`${pagina} no tiene enlaces a la raíz`,
        !destinos(pagina).some(u => !FUERA.test(u) && u.startsWith('/')));
}

// -------------------------------------------------------------------------
console.log('\n1 ter. La hoja de estilos lleva versión, y la misma en todas');

// GitHub Pages sirve el CSS con caché, así que un cambio de estilos no llega a
// quien ya ha entrado antes: el navegador se queda con el de ayer y pinta el
// HTML nuevo con reglas viejas. Pasó, y no se ve como un fallo —la página no
// está rota, está mal—, así que el enlace lleva ?v=N y se sube el número al
// tocar css/web.css. Es lo mismo que VERSION en el sw.js de la app.
//
// Y tiene que ser el mismo número en las cinco páginas: si una se queda atrás,
// vuelve a servir el CSS viejo a quien entre por ella.
const versiones = new Map();
for(const pagina of [...PORTADAS.map(p => p.pagina), '404.html']){
  const m = html[pagina].match(/href="[^"]*css\/web\.css(\?v=(\d+))?"/);
  check(`${pagina} pide el CSS con versión`, !!(m && m[2]),
        m ? m[0] : 'no enlaza css/web.css');
  if(m && m[2]) versiones.set(pagina, m[2]);
}
check('las cinco páginas piden la misma versión del CSS',
      new Set(versiones.values()).size === 1,
      [...versiones].map(([p, v]) => `${p}=${v}`).join(' · '));

// -------------------------------------------------------------------------
console.log('\n2. Las anclas internas llevan a un id que existe');

for(const pagina of PAGINAS){
  const ids = new Set([...html[pagina].matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  for(const url of destinos(pagina)){
    if(!url.startsWith('#') || url === '#') continue;
    check(`${pagina} → ${url}`, ids.has(url.slice(1)));
  }
}

// -------------------------------------------------------------------------
console.log('\n3. Los cuatro idiomas cuentan lo mismo');

function secciones(pagina){
  return [...html[pagina].matchAll(/<section id="([^"]+)"/g)].map(m => m[1]);
}
// El castellano es la referencia, como en la app: es el idioma en el que se
// escribe la página y del que salen las traducciones.
const es = secciones('index.html');
check('index.html tiene secciones', es.length > 0, 'ninguna');
for(const { pagina } of PORTADAS.slice(1)){
  const otras = secciones(pagina);
  for(const id of es) check(`${pagina} tiene la sección "${id}"`, otras.includes(id));
  for(const id of otras) check(`index.html tiene la sección "${id}" de ${pagina}`, es.includes(id));
  check(`${pagina} lleva las secciones en el mismo orden`, es.join(',') === otras.join(','),
        `es: ${es.join(',')} · ${pagina}: ${otras.join(',')}`);
}

// Cada página enseña las capturas de su idioma. Cruzarlas es el despiste
// típico al copiar una sección de un archivo al otro, y ahora hay cuatro
// carpetas que confundir en vez de dos.
for(const { pagina, capturas } of PORTADAS){
  const ajenas = PORTADAS.filter(p => p.capturas !== capturas)
    // 'img/capturas' es prefijo de 'img/capturas-en': se compara con la barra
    // final para que la castellana no parezca estar en todas.
    .filter(p => (html[pagina].match(new RegExp(p.capturas + '/', 'g')) || []).length > 0)
    .map(p => p.capturas);
  check(`${pagina} solo usa ${capturas}/`, ajenas.length === 0, 'también usa ' + ajenas.join(', '));
  // Diez y no nueve: las ocho de la tira, la del marco del móvil que se repite
  // y la del `screenshot` de los datos estructurados, que también es la suya.
  const propias = (html[pagina].match(new RegExp(capturas + '/', 'g')) || []).length;
  check(`${pagina} usa las suyas`, propias === 10, `${propias} veces`);
}

// -------------------------------------------------------------------------
console.log('\n4. Lo que hace falta para que Google las entienda');

for(const { pagina, lang } of PORTADAS){
  const f = html[pagina];
  check(`${pagina} declara su idioma`, new RegExp(`<html lang="${lang}">`).test(f));
  check(`${pagina} tiene <title>`, /<title>[^<]+<\/title>/.test(f));
  check(`${pagina} tiene description`, /name="description" content="[^"]+"/.test(f));
  check(`${pagina} tiene canonical`, /rel="canonical"/.test(f));
  // Las cuatro alternativas en las cuatro páginas: si una se olvida de otra,
  // Google sirve la portada de otro idioma y no hay error que lo delate.
  for(const { lang: otro } of PORTADAS){
    check(`${pagina} declara la alternativa "${otro}"`,
          new RegExp(`hreflang="${otro}"[^>]*href="https://superstat.online/`).test(f));
  }
}

// El sitemap tiene que nombrarlas todas, y no se genera solo.
const mapa = leer('sitemap.xml');
check('sitemap.xml nombra la portada castellana', mapa.includes('<loc>https://superstat.online/</loc>'));
for(const { lang } of PORTADAS.slice(1)){
  check(`sitemap.xml nombra la portada "${lang}"`,
        mapa.includes(`<loc>https://superstat.online/${lang}/</loc>`));
}
for(const p of PRIVACIDADES){
  check(`sitemap.xml nombra ${p}`, mapa.includes(`<loc>https://superstat.online/${p}</loc>`));
}

// -------------------------------------------------------------------------
console.log('\n4 bis. Los planes dicen lo mismo en los cuatro idiomas');

// El precio se escribe a mano cuatro veces, una por portada. Un 3,49 que en
// alemán diga 3,99 no rompe nada, no sale en ninguna consola y lo lee un
// cliente: es exactamente el tipo de fallo para el que existe esta prueba. Se
// compara el número y no la cadena entera porque cada idioma lo escribe a su
// manera ("3,49 €" y "€3.49").
const precios = new Set();
// Y guardado por página, porque el bloque de abajo lo compara con el que dicen
// los datos estructurados de esa misma portada.
const preciosPorPagina = new Map();
for(const { pagina } of PORTADAS){
  const f = html[pagina];
  check(`${pagina} lleva el botón que baja a los planes`, /href="#planes"/.test(f));
  check(`${pagina} tiene la sección de planes`, /<section id="planes">/.test(f));

  const cifras = [...f.matchAll(/<span class="plan-cifra">([^<]+)<\/span>/g)].map(m => m[1]);
  check(`${pagina} enseña los dos precios`, cifras.length === 2, cifras.join(' · '));
  const pro = (cifras[1] || '').replace(/[^\d,.]/g, '').replace(',', '.');
  if(pro){ precios.add(pro); preciosPorPagina.set(pagina, pro); }

  // Y que no se quede sin la coletilla de impuestos, que es lo que convierte el
  // precio en el precio de verdad.
  const notas = [...f.matchAll(/<p class="plan-nota">([^<]+)<\/p>/g)].map(m => m[1]);
  check(`${pagina} dice que los impuestos van aparte`, notas.length === 2 &&
        /impuestos|taxes|steuern/i.test(notas[1]), notas.join(' · '));

  const filas = (f.match(/<tr>/g) || []).length;
  check(`${pagina} tiene la tabla comparativa entera`, filas === 14, `${filas} filas`);
}
check('las cuatro portadas dicen el mismo precio', precios.size === 1,
      [...precios].join(' · '));

// -------------------------------------------------------------------------
console.log('\n4 ter. Las redes y la app, en los datos estructurados');

// Los enlaces del pie son la mitad visible de esto; la otra es el sameAs del
// JSON-LD, que es por donde un buscador ata los perfiles a esta marca y la
// razón de que los enlaces se añadieran. Las dos mitades tienen que decir lo
// mismo y no hay nada más que las sujete: el bloque 3 compara <section id>, y
// el pie no es una sección, así que una portada con la cuenta del idioma de al
// lado —o sin cuenta— pasaría entera sin que fallara nada.
const PERFILES = [IG_ES, IG_EN, EQUIS];
const perfilesPorPagina = new Map();
const appPorPagina = new Map();

for(const { pagina, lang, instagram, capturas } of PORTADAS){
  const f = html[pagina];
  const pie = (f.match(/<nav class="enlaces-pie"[\s\S]*?<\/nav>/) || [''])[0];

  const suyas = [...pie.matchAll(/href="(https:\/\/www\.instagram\.com\/[^"]+)"/g)].map(m => m[1]);
  check(`${pagina} enlaza su Instagram y solo el suyo`,
        suyas.length === 1 && suyas[0] === instagram,
        suyas.join(', ') || 'no enlaza ninguno');
  check(`${pagina} enlaza la cuenta de X`, pie.includes(`href="${EQUIS}"`));

  // Las dos redes se abren en pestaña nueva para no sacar a nadie de la página,
  // y un target="_blank" se escribe con rel="noopener" en todo el repositorio.
  const nuevaPestana = pie.match(/<a[^>]*target="_blank"[^>]*>/g) || [];
  check(`${pagina} abre las dos en pestaña nueva con rel="noopener"`,
        nuevaPestana.length === 2 && nuevaPestana.every(a => /rel="noopener"/.test(a)),
        `${nuevaPestana.length} enlaces con target="_blank"`);

  check(`${pagina} declara twitter:site`,
        new RegExp(`<meta name="twitter:site" content="@superstatapp">`).test(f));

  // El JSON-LD. Que exista no basta: un bloque con una coma de más lo descarta
  // el buscador entero y en silencio, así que aquí se parsea de verdad.
  const bloque = (f.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  let datos = null;
  try { datos = JSON.parse(bloque || ''); } catch(e){ datos = e; }
  check(`${pagina} lleva datos estructurados que parsean`,
        datos !== null && !(datos instanceof Error),
        datos instanceof Error ? datos.message : 'no hay bloque application/ld+json');
  if(!datos || datos instanceof Error) continue;

  const grafo = datos['@graph'] || [];
  const org = grafo.find(n => n['@type'] === 'Organization');
  const sitio = grafo.find(n => n['@type'] === 'WebSite');

  const declarados = (org && org.sameAs) || [];
  check(`${pagina} nombra las tres cuentas en sameAs`,
        declarados.length === PERFILES.length && PERFILES.every(u => declarados.includes(u)),
        declarados.join(' · ') || 'sin Organization o sin sameAs');
  perfilesPorPagina.set(pagina, [...declarados].sort().join(' · '));

  const url = `https://superstat.online/${lang === 'es' ? '' : lang + '/'}`;
  check(`${pagina} declara el WebSite de su idioma`,
        !!sitio && sitio.inLanguage === lang && sitio.url === url,
        sitio ? `${sitio.inLanguage} · ${sitio.url}` : 'no hay WebSite');

  // El tercer nodo es la app. Su @id es el mismo que el de los datos
  // estructurados de index.html en el repositorio de la app: las dos páginas
  // hablan de una app y no de dos, y quien lo dice es el @id.
  const app = grafo.find(n => n['@type'] === 'SoftwareApplication');
  check(`${pagina} declara la app con el @id de siempre`,
        !!app && app['@id'] === 'https://superstat.online/#app',
        app ? app['@id'] : 'no hay SoftwareApplication');
  if(!app) continue;

  check(`${pagina} dice de qué va la app`, typeof app.description === 'string' &&
        app.description.length > 0, app.description);
  check(`${pagina} cuelga la app de la misma marca`,
        !!app.publisher && app.publisher['@id'] === (org || {})['@id'],
        app.publisher && app.publisher['@id']);
  check(`${pagina} enseña una captura de su idioma`,
        typeof app.screenshot === 'string' && app.screenshot.includes(capturas + '/'),
        app.screenshot);

  // Y el precio. Aquí está escrito una segunda vez dentro de la misma página, y
  // ésa es justo la copia que se puede quedar atrás al cambiar la tarjeta: se
  // compara con la de arriba (4 bis) en vez de con una constante, para que las
  // dos tengan que moverse a la vez. En los datos va con punto y sin símbolo,
  // porque no es un texto que lea nadie.
  const ofertas = app.offers || [];
  check(`${pagina} declara las dos ofertas`, ofertas.length === 2, `${ofertas.length}`);
  const gratis = ofertas[0] || {}, pro = ofertas[1] || {};
  check(`${pagina} declara el plan gratis a cero`, gratis.price === '0', gratis.price);
  check(`${pagina} declara el mismo precio que enseña su tarjeta`,
        pro.price === preciosPorPagina.get(pagina),
        `datos: ${pro.price} · tarjeta: ${preciosPorPagina.get(pagina)}`);
  check(`${pagina} declara las dos ofertas en euros`,
        gratis.priceCurrency === 'EUR' && pro.priceCurrency === 'EUR',
        `${gratis.priceCurrency} · ${pro.priceCurrency}`);
  // Lo mismo que la coletilla "Impuestos aparte" de la tarjeta, pero en dato.
  check(`${pagina} dice en los datos que los impuestos van aparte`,
        !!pro.priceSpecification &&
        pro.priceSpecification.valueAddedTaxIncluded === false,
        JSON.stringify(pro.priceSpecification));
  check(`${pagina} lleva la oferta de pago a sus propios planes`,
        pro.url === `${url}#planes`, pro.url);

  // Lo que no depende del idioma tiene que ser idéntico en las cuatro: si una
  // dijera otra categoría o otro precio, estarían contradiciéndose sobre la
  // misma entidad, igual que pasaría con los perfiles. Lo que sí cambia de una
  // a otra, y por eso se quita antes de comparar, es lo que se lee: la
  // descripción, lo que hace falta para abrirla, la captura de su idioma y el
  // nombre y el destino de cada oferta.
  const esqueleto = JSON.parse(JSON.stringify(app));
  for(const campo of ['description', 'browserRequirements', 'screenshot']) delete esqueleto[campo];
  (esqueleto.offers || []).forEach(o => { delete o.name; delete o.url; });
  appPorPagina.set(pagina, JSON.stringify(esqueleto));
}

// Las cuatro hablan de la misma marca con el mismo @id: si una declarara otros
// perfiles, estaría contradiciendo a las otras tres sobre la misma entidad.
check('las cuatro portadas declaran los mismos perfiles',
      new Set(perfilesPorPagina.values()).size === 1,
      [...perfilesPorPagina].map(([p, s]) => `${p}: ${s}`).join(' | '));
const modelo = appPorPagina.get('index.html');
check('las cuatro portadas describen la misma app',
      appPorPagina.size === PORTADAS.length &&
      new Set(appPorPagina.values()).size === 1,
      [...appPorPagina].filter(([p, a]) => a !== modelo)
        .map(([p, a]) => `${p}: ${a}`).join(' | ') || `solo ${appPorPagina.size} portadas`);

// -------------------------------------------------------------------------
console.log('\n5. La trampa del tamaño de las capturas');

// Las capturas llevan width y height en el HTML para que el navegador reserve
// el hueco antes de cargarlas. El precio es que, si el CSS solo fija el ancho,
// el alto del atributo gana y salen estiradas al triple de largo. Pasó, y es
// invisible salvo mirando la página: no hay error de consola ni enlace roto.
// Sin los comentarios: este archivo explica la trampa justo encima de la
// regla, y buscar el texto a pelo encontraría la explicación en vez de la
// declaración. La prueba pasaba con la regla rota por exactamente eso.
const css = leer('css/web.css').replace(/\/\*[\s\S]*?\*\//g, '');

// Las dos reglas que pintan una captura: la tira de la sección «Así se ve» y el
// marco de móvil de la portada. Las dos tienen la misma trampa y las dos la han
// tenido de verdad.
for(const sel of ['.tira img', '.telefono img']){
  const regla = (css.match(new RegExp(sel.replace('.', '\\.') + '\\{[^}]*\\}')) || [''])[0];
  check(`${sel} fija height:auto`, /height\s*:\s*auto/.test(regla),
        regla ? 'la regla está pero sin height:auto' : 'no se encontró la regla');
  // object-fit:cover recorta para rellenar la caja, y una captura de pantalla
  // es justo lo que no se puede recortar: la interfaz de la app deja unos 12 px
  // de margen, así que un recorte de nada se lleva por delante lo que va pegado
  // al borde. Pasó en el marco de la portada y en la web publicada.
  check(`${sel} no recorta con object-fit:cover`,
        !/object-fit\s*:\s*cover/.test(regla), regla);
}
// El marco tampoco puede imponerle una proporción a la imagen: con el borde de
// por medio, la caja de contenido queda más estrecha que la proporción pedida y
// vuelve a sobrar imagen que recortar.
const reglaMarco = (css.match(/\.telefono\{[^}]*\}/) || [''])[0];
check('.telefono no impone aspect-ratio', !/aspect-ratio/.test(reglaMarco), reglaMarco);
for(const { pagina } of PORTADAS){
  const tira = (html[pagina].match(/<div class="tira">[\s\S]*?<\/div>/) || [''])[0];
  const imgs = tira.match(/<img[^>]*>/g) || [];
  check(`${pagina} tiene las ocho capturas`, imgs.length === 8, `${imgs.length}`);
  check(`${pagina} las declara con width y height`,
        imgs.every(i => /width="540"/.test(i) && /height="960"/.test(i)));
  // La primera se ve nada más abrir, así que cargarla en diferido es lo
  // contrario de lo que se quiere; las otras siete sí.
  check(`${pagina} carga en diferido las que no se ven`,
        imgs.slice(1).every(i => /loading="lazy"/.test(i)));
  check(`${pagina} describe todas las capturas`,
        imgs.every(i => /alt="[^"]+"/.test(i)));
}

// -------------------------------------------------------------------------
console.log('\n6. Las políticas de privacidad, que están duplicadas');

// Las cuatro viven aquí y, de momento, también en el repositorio de la app:
// aquéllas son las que sirve Vercel y a las que apunta hoy la ficha de Google
// Play. Mientras las dos copias existan tienen que decir lo mismo, y no hay nada
// que avise si se separan. La duplicación se acaba cuando Play Console apunte
// aquí.
for(const p of PRIVACIDADES){
  check(`${p} está en la raíz`, fs.existsSync(path.join(RAIZ, p)));
}

// El ancla es la URL de eliminación de cuenta que se pega en Play Console, y es
// la misma en los cuatro idiomas para que esas URL sean intercambiables.
// Renombrarla rompe algo que está escrito en un formulario de Google.
for(const p of PRIVACIDADES){
  check(`${p} conserva el ancla #borrar`, /id="borrar"/.test(html[p]));
}

// Cada portada enlaza a la política de SU idioma. Mandar al inglés a la
// castellana es lo que hacía la web antes de tener las cuatro, y no falla nada:
// simplemente el lector se encuentra un documento legal en otro idioma.
for(const { pagina, privacidad } of PORTADAS){
  const suyos = destinos(pagina).filter(u => /privacidad[^"]*\.html/.test(u));
  check(`${pagina} enlaza a ${privacidad}`,
        suyos.length > 0 && suyos.every(u => u.endsWith(privacidad)),
        suyos.join(', ') || 'no enlaza a ninguna');
}

const ORIGEN = path.resolve(RAIZ, process.env.ORIGEN || '../superStat');
if(fs.existsSync(ORIGEN)){
  // El comentario de cabecera sí es distinto a propósito —el de aquí avisa de la
  // duplicación—, así que se compara del <html> en adelante.
  const cuerpo = t => t.slice(t.indexOf('<html'));
  for(const p of PRIVACIDADES){
    const otraCopia = path.join(ORIGEN, p);
    check(`las dos copias de ${p} dicen lo mismo`,
          fs.existsSync(otraCopia) &&
          cuerpo(html[p]) === cuerpo(fs.readFileSync(otraCopia, 'utf8')),
          'se han separado: cambia las dos o borra una');
  }
} else {
  console.log('  --   el repositorio de la app no está al lado, no se comparan');
}

console.log(`\n${pasadas} comprobaciones pasadas, ${fallos} fallidas`);
process.exit(fallos ? 1 : 0);
