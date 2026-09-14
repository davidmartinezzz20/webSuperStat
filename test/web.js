// Que las dos páginas no se rompan por lo silencioso.
//
// Esta web tiene dos modos de fallo que nadie ve hasta que es tarde:
//
//   1. Un enlace o una imagen que apunta a un archivo que no está. En una SPA
//      salta a la primera; aquí es una imagen rota en una sección a la que hay
//      que bajar, o un 404 al pulsar el pie.
//   2. Que castellano e inglés se separen. Al añadir una sección a index.html
//      es fácil olvidarse de en/index.html, y entonces media web dice una cosa
//      y la otra media dice otra. Es el mismo problema que test/i18n.js vigila
//      en la app, con la diferencia de que aquí no hay diccionario: hay dos
//      archivos escritos a mano.
//
// Sin dependencias y sin navegador: es leer tres archivos y mirar.
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

const PAGINAS = ['index.html', 'en/index.html', '404.html', 'privacidad.html'];
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
// ruta absoluta. Solo queda bien en el dominio de verdad.
for(const pagina of ['index.html', 'en/index.html']){
  for(const url of destinos(pagina)){
    if(FUERA.test(url) || !url.startsWith('/')) continue;
    check(`${pagina} → ${url} no cuelga de la raíz`, false,
          'escríbelo en relativo, o la URL de github.io se rompe');
  }
  check(`${pagina} no tiene enlaces a la raíz`,
        !destinos(pagina).some(u => !FUERA.test(u) && u.startsWith('/')));
}

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
console.log('\n3. Castellano e inglés cuentan lo mismo');

function secciones(pagina){
  return [...html[pagina].matchAll(/<section id="([^"]+)"/g)].map(m => m[1]);
}
const es = secciones('index.html');
const en = secciones('en/index.html');

check('index.html tiene secciones', es.length > 0, 'ninguna');
for(const id of es){
  check(`en/index.html tiene la sección "${id}"`, en.includes(id));
}
for(const id of en){
  check(`index.html tiene la sección "${id}"`, es.includes(id));
}
check('las secciones van en el mismo orden', es.join(',') === en.join(','),
      `es: ${es.join(',')} · en: ${en.join(',')}`);

// Cada página enseña las capturas de su idioma. Cruzarlas es el despiste
// típico al copiar una sección de un archivo al otro.
const capturasEs = (html['index.html'].match(/img\/capturas-en\//g) || []).length;
const capturasEn = (html['en/index.html'].match(/img\/capturas\//g) || []).length;
check('index.html no usa las capturas inglesas', capturasEs === 0, `${capturasEs} veces`);
check('en/index.html no usa las castellanas', capturasEn === 0, `${capturasEn} veces`);

// -------------------------------------------------------------------------
console.log('\n4. Lo que hace falta para que Google las entienda');

for(const pagina of ['index.html', 'en/index.html']){
  const f = html[pagina];
  check(`${pagina} declara su idioma`, /<html lang="(es|en)">/.test(f));
  check(`${pagina} tiene <title>`, /<title>[^<]+<\/title>/.test(f));
  check(`${pagina} tiene description`, /name="description" content="[^"]+"/.test(f));
  check(`${pagina} tiene canonical`, /rel="canonical"/.test(f));
  check(`${pagina} declara las dos alternativas de idioma`,
        /hreflang="es"/.test(f) && /hreflang="en"/.test(f));
}

// El sitemap tiene que nombrar las dos, y no se genera solo.
const mapa = leer('sitemap.xml');
check('sitemap.xml nombra la portada castellana', mapa.includes('<loc>https://superstat.online/</loc>'));
check('sitemap.xml nombra la inglesa', mapa.includes('<loc>https://superstat.online/en/</loc>'));

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
for(const pagina of ['index.html', 'en/index.html']){
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
console.log('\n6. La política de privacidad, que está duplicada');

// privacidad.html vive aquí y, de momento, también en el repositorio de la app:
// aquélla es la que sirve Vercel y a la que apunta hoy la ficha de Google Play.
// Mientras las dos existan tienen que decir lo mismo, y no hay nada que avise si
// se separan. La duplicación se acaba cuando Play Console apunte aquí.
check('privacidad.html está en la raíz', fs.existsSync(path.join(RAIZ, 'privacidad.html')));

// El ancla es la URL de eliminación de cuenta que se pega en Play Console.
// Renombrarla rompe algo que está escrito en un formulario de Google.
check('privacidad.html conserva el ancla #borrar', /id="borrar"/.test(html['privacidad.html']));

const otraCopia = path.resolve(RAIZ, process.env.ORIGEN || '../superStat', 'privacidad.html');
if(fs.existsSync(otraCopia)){
  // El comentario de cabecera sí es distinto a propósito —el de aquí avisa de la
  // duplicación—, así que se compara del <html> en adelante.
  const cuerpo = t => t.slice(t.indexOf('<html'));
  check('las dos copias dicen lo mismo',
        cuerpo(html['privacidad.html']) === cuerpo(fs.readFileSync(otraCopia, 'utf8')),
        'se han separado: cambia las dos o borra una');
} else {
  console.log('  --   el repositorio de la app no está al lado, no se comparan');
}

console.log(`\n${pasadas} comprobaciones pasadas, ${fallos} fallidas`);
process.exit(fallos ? 1 : 0);
