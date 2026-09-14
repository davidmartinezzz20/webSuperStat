// Pasa las capturas de la app a lo que puede servir una landing.
//
// Las originales viven en el repositorio de la app (superStat) y salen de
// `node tools/make-screenshots.js`: son PNG de 1080×1920 y pesan 1,9 MB por
// idioma. Eso es lo que pide Google Play, y es demasiado para una página web.
// Esto las deja en WebP de 540×960 —la mitad de lado, que a 270 px de ancho en
// pantalla sigue siendo el doble de píxeles de los que hacen falta— dentro de
// `img/capturas/` e `img/capturas-en/`.
//
// Se ejecuta a mano, solo cuando las capturas cambien:
//   ORIGEN=../superStat node tools/optimizar-capturas.js
//
// Usa Chromium por lo mismo que `tools/make-icons.js` y
// `tools/make-play-assets.js` en el repositorio de la app: ya hace falta para
// generar las capturas, así que redimensionarlas con él no añade ninguna
// dependencia que no estuviera.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LANZAR = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
const RAIZ   = path.join(__dirname, '..');
const ORIGEN = path.resolve(RAIZ, process.env.ORIGEN || '../superStat');

// De dónde sale cada idioma y dónde acaba. Los nombres de archivo no se tocan:
// son los mismos ocho de la ficha de Play, y el orden lo da el número.
const JUEGOS = [
  { de: path.join(ORIGEN, 'play', 'capturas'),    a: path.join(RAIZ, 'img', 'capturas') },
  { de: path.join(ORIGEN, 'play', 'capturas-en'), a: path.join(RAIZ, 'img', 'capturas-en') }
];

const ANCHO   = 540;
const ALTO    = 960;
const CALIDAD = 0.82;

async function main(){
  for(const j of JUEGOS){
    if(!fs.existsSync(j.de)){
      console.error(`No está ${j.de}.`);
      console.error('Pasa la ruta del repositorio de la app en ORIGEN, por ejemplo:');
      console.error('  ORIGEN=../superStat node tools/optimizar-capturas.js');
      process.exit(1);
    }
  }

  const navegador = await chromium.launch(LANZAR);
  const pagina    = await navegador.newPage();
  let total = 0;

  for(const juego of JUEGOS){
    fs.mkdirSync(juego.a, { recursive: true });
    const nombres = fs.readdirSync(juego.de).filter(n => n.endsWith('.png')).sort();

    for(const nombre of nombres){
      const datos = fs.readFileSync(path.join(juego.de, nombre)).toString('base64');

      // El redimensionado lo hace el propio navegador sobre un canvas. Dos
      // pasadas de reducción a la mitad en vez de un solo salto de 1080 a 540:
      // el escalado del canvas no promedia bien saltos grandes y el texto de
      // las capturas se emborrona.
      const webp = await pagina.evaluate(async ({ datos, ancho, alto, calidad }) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + datos;
        await img.decode();

        let origen = img;
        let w = img.width, h = img.height;
        while(w / 2 > ancho){
          w = Math.round(w / 2); h = Math.round(h / 2);
          const paso = document.createElement('canvas');
          paso.width = w; paso.height = h;
          const cp = paso.getContext('2d');
          cp.imageSmoothingQuality = 'high';
          cp.drawImage(origen, 0, 0, w, h);
          origen = paso;
        }

        const lienzo = document.createElement('canvas');
        lienzo.width = ancho; lienzo.height = alto;
        const ctx = lienzo.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(origen, 0, 0, ancho, alto);
        return lienzo.toDataURL('image/webp', calidad).split(',')[1];
      }, { datos, ancho: ANCHO, alto: ALTO, calidad: CALIDAD });

      const destino = path.join(juego.a, nombre.replace(/\.png$/, '.webp'));
      fs.writeFileSync(destino, Buffer.from(webp, 'base64'));
      const kb = Math.round(fs.statSync(destino).size / 1024);
      console.log(`${path.relative(RAIZ, destino)}  ${kb} KB`);
      total++;
    }
  }

  await navegador.close();
  console.log(`\n${total} capturas a ${ANCHO}×${ALTO}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
