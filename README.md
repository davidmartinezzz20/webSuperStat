# webSuperStat — la web de superstat.online

La web pública de **SuperStat**, la app de estadísticas de balonmano. Es la
página a la que llega quien busca la app: cuenta qué hace, la enseña y lleva a
abrirla. La app en sí vive en otro repositorio,
[superStat](https://github.com/davidmartinezzz20/superStat).

Cuatro portadas —castellano, inglés, francés y alemán—, un blog con las mismas
cuatro, y nada más: **HTML plano, sin build, sin framework y sin fuentes de
CDN**, la misma regla que sigue la app. Se publica con **GitHub Pages**: lo que
hay en el repositorio es exactamente lo que se sirve, y desplegar es hacer push.

```
index.html          castellano
en/index.html       inglés
fr/index.html       francés
de/index.html       alemán
blog/               el índice del blog y un artículo por carpeta, y lo mismo en
                    en/blog/, fr/blog/ y de/blog/
privacidad.html     la política de privacidad, y privacidad-en/-fr/-de.html las
                    otras tres. Páginas sueltas, con sus estilos dentro
404.html            la página de error, en los cuatro idiomas
css/web.css         los estilos de las portadas y del blog
img/               iconos, la imagen para redes y las capturas, una carpeta por idioma
robots.txt  sitemap.xml
CNAME               el dominio. Lo escribe GitHub al configurar Pages; no borrarlo
```

> **Las cuatro `privacidad*.html` están duplicadas a propósito, y es temporal.**
> Las mismas páginas están en el repositorio de la app, servidas por Vercel, que
> es la URL a la que apunta hoy la ficha de Google Play. Mientras las dos copias
> existan, un cambio en una hay que hacerlo en la otra; `npm test` lo comprueba
> cuando los dos repositorios están clonados uno al lado del otro. La
> duplicación se acaba en cuanto Play Console apunte a
> `superstat.online/privacidad.html`: entonces se borran las copias del
> repositorio de la app.

Y lo que no es la web:

```
tools/optimizar-capturas.js   pasa las capturas de la app a WebP para la web
test/web.js                   comprueba enlaces, anclas y paridad de los cuatro
```

Esos dos se publican también —Pages sirve el repositorio entero—, pero no los
enlaza nadie y no ocupan nada. Quitarlos costaría montar un workflow de
compilación, que es justo lo que este proyecto no quiere.

## Verla

```bash
npm start          # npx serve en http://localhost:4173
npm test           # enlaces, anclas, paridad de los cuatro idiomas y metadatos
```

Con `file://` no sirve: `npm start` levanta un servidor, y es lo que hace falta
para que `en/`, `fr/`, `de/` y las rutas de las imágenes se resuelvan como en
producción.

## Al tocar la página

**Toda sección nueva va en los cuatro idiomas.** `test/web.js` compara los `id`
de las `<section>` de las cuatro portadas contra las de `index.html` y falla si
una se queda corta o si el orden no coincide. Es el equivalente aquí de lo que
`test/i18n.js` vigila en la app, con la diferencia de que allí hay un
diccionario y aquí hay cuatro archivos escritos a mano.

**Cada portada enlaza a la política de privacidad de su idioma**, y eso también
lo comprueba la prueba: mandar al lector alemán a un documento legal en
castellano no rompe nada y no se ve. La tabla `PORTADAS` de `test/web.js` es la
lista de la que sale todo lo demás; añadir un idioma es añadir una fila ahí,
sus dos archivos y su carpeta de capturas.

**Al tocar `css/web.css` hay que subir su versión** en el enlace de **todas** las
páginas que lo piden —hoy trece: las cuatro portadas, `404.html` y las ocho del
blog—: `href="css/web.css?v=3"` → `?v=4`. GitHub Pages sirve el CSS con caché,
así que sin eso quien ya haya entrado antes se queda con las reglas de ayer y ve
el HTML nuevo pintado con ellas: no parece roto, parece mal hecho. Pasó con la
sección de planes. Es lo mismo que `VERSION` en el `sw.js` de la app.
`test/web.js` no lleva la lista escrita —la sacaba a mano y se quedó corta al
aparecer el blog—: recorre las páginas que enlazan la hoja, comprueba aparte que
las que tienen que estar están, y falla si una pide otra versión.

**El precio está escrito cuatro veces**, una por portada, en la sección
`#planes` a la que baja el botón de la cabecera. No hay plantilla que lo
centralice —aquí no hay build—, así que `test/web.js` compara el número de las
cuatro y falla si una se despareja: un 3,49 que en alemán diga 3,99 no rompe
nada, no sale en ninguna consola y lo lee un cliente. Tiene que coincidir
además con lo que cobra Stripe y con `PRO_PRICE` en `js/config.js` de la app
(`docs/suscripcion.md`), y los topes del plan Gratis de la tabla, con
`FREE_TEAMS` y `FREE_MATCHES` en `js/app.js`.

Dentro de cada portada está **dos veces**: la tarjeta que se lee y el `offers`
de sus datos estructurados, que va con punto y sin símbolo (`"3.49"`) porque no
lo lee nadie. La segunda no es otra copia que recordar: la misma prueba compara
las dos de cada página entre sí, así que cambiar la tarjeta y dejarse los datos
falla en el acto. En la app ese precio no puede aparecer —sería la guía 3.1.1
de Apple— y por eso vive de este lado.

**Los textos no se inventan.** Salen ya escritos del repositorio de la app:

| Qué | De dónde |
|---|---|
| Descripción corta y larga, correo de contacto | `docs/play.md` |
| Los eslóganes, en los dos idiomas | `docs/instagram.md` |
| El vocabulario de cada idioma (*save*, *arrêt*, *Parade*) | `js/i18n.js` |
| Lo que da el plan Pro y lo que limita el Gratis | `js/i18n.js` (`paywall.*`, `limit.*`) |
| Los nombres de las cuentas de redes | `docs/instagram.md` |

Si allí se reescribe la descripción de la ficha de Play, conviene traer el
cambio aquí; son el mismo mensaje contado dos veces y quedan desparejados sin
que nadie se entere.

**Las redes están en dos sitios de cada portada**, y los dos tienen que decir lo
mismo: los enlaces del pie, que lee una persona, y el `sameAs` del bloque
`application/ld+json` del `<head>`, que es por donde un buscador ata los
perfiles a esta marca. Sin el segundo, los enlaces del pie no posicionan nada.

Hay **dos cuentas de Instagram y una de X**: `superstat.es` la castellana,
`superstat.en` la inglesa y `superstatapp` en X. Las portadas francesa y alemana
enlazan la inglesa, porque no hay cuenta en esos idiomas. El `sameAs`, en
cambio, nombra las tres en las cuatro páginas: son de la misma marca y llevan el
mismo `@id`, así que declarar unas en una página y otras en otra sería
contradecirse. `test/web.js` (bloque *4 ter*) comprueba las dos cosas, y es lo
único que las sujeta: el bloque de paridad de idiomas compara `<section id>` y
el pie no es una sección.

**El `@graph` tiene tres nodos**: la marca (`Organization`), la página
(`WebSite`, el único que cambia de idioma en idioma) y la app
(`SoftwareApplication`, que es la que dice qué es esto y cuánto vale). El de la
app lleva el `@id` `https://superstat.online/#app`, **el mismo que los datos
estructurados de `index.html` en el repositorio de la app**: son dos páginas
hablando de una app, no dos apps, y el `@id` es lo que lo dice. Si allí cambia,
aquí también. De ese nodo cambia por idioma lo que se lee —la descripción, los
requisitos, la captura y el nombre y el destino de cada oferta— y nada más; el
resto tiene que ser idéntico en las cuatro, y `test/web.js` lo compara quitando
lo primero. Sin valoraciones: no hay reseñas de verdad, e inventarlas es spam
estructurado, así que no habrá resultado enriquecido de app hasta que las haya.

**Los colores y la tipografía son los de la app**, copiados de su
`css/styles.css`: el mismo negro `#08090B`, el mismo rojo `#D9182B`, la misma
pila de fuentes del sistema. Cambiar uno aquí y no allí es lo único que puede
hacer que la web y la app parezcan dos productos.

**El dibujo de la marca está repetido a propósito.** El cuadro rojo con las tres
barras se dibuja en línea en cada página, y el favicon es el mismo SVG como data
URI. Contando la app, el dibujo vive en seis sitios y todos se mantienen a mano:

1. `brandLogo()` en `js/app.js` de la app
2. el favicon de `index.html` de la app
3. `tools/make-icons.js` de la app
4. `tools/make-play-assets.js` de la app
5. `index.html`, `en/index.html`, `fr/index.html`, `de/index.html` y
   `404.html` de aquí
6. el favicon de esas cinco páginas

Si cambia el dibujo, hay que tocarlos todos y volver a generar los iconos.

## El blog

Está para posicionar: una portada responde a quien ya busca «SuperStat», y un
artículo responde a quien busca «cómo llevar la estadística de un partido de
balonmano», que es mucha más gente y todavía no sabe que esto existe.

```
blog/index.html                                    el índice, castellano
blog/<slug>/index.html                             un artículo por carpeta
en/blog/  fr/blog/  de/blog/                       lo mismo en los otros tres
```

Carpeta con `index.html` dentro, igual que `en/`, `fr/` y `de/`: Pages la sirve
como su índice y la URL queda sin extensión. Se llega desde la cabecera y desde
el pie de las cuatro portadas, y `test/web.js` comprueba que los dos enlaces
están en las cuatro.

**El slug va traducido, y no es un capricho**: `/blog/acta-balonmano-sin-conexion/`
pero `/en/blog/handball-match-stats-offline/`. Es el motivo entero de tener
blog: cada idioma posiciona por las palabras que se buscan en ese idioma. El
precio es que la URL de un artículo **no se deduce** de la de otro cambiando el
prefijo, así que las cuatro están escritas —en el `hreflang` de cada página, en
`sitemap.xml` y en la tabla `SLUGS` de `test/web.js`— y hay que casarlas a mano.

**Añadir un artículo son cuatro archivos, cuatro `<url>` y una línea de prueba:**

1. `blog/<slug-es>/index.html` y los tres equivalentes, copiando el `head` y el
   pie de un artículo que ya esté. Ojo a la profundidad de los `../`: un
   artículo en castellano cuelga a dos carpetas de la raíz y uno en inglés a
   tres.
2. Su tarjeta en los cuatro índices.
3. Sus cuatro `<url>` en `sitemap.xml`, con las cinco alternativas de idioma.
4. Su fila en `SLUGS` (`test/web.js`), de la que sale todo el bloque *7*.

**Los cuatro tienen que contar lo mismo.** Como un artículo no tiene
`<section id>` que comparar, el bloque *7* compara su esqueleto: los mismos
`<h2>` y los mismos puntos en cada lista, contados dentro de `<main>`. Es lo que
caza una traducción a la que le faltan dos viñetas, que no rompe nada y no sale
en ninguna consola.

**Aquí no se escribe precio.** La app y sus dos ofertas las declaran las cuatro
portadas y solo ellas; si el blog las repitiera, el 3,49 pasaría de cuatro
copias a mantener a mano a muchas más. Los datos estructurados de una página del
blog llevan el `Organization` de siempre (el mismo `@id`, el mismo `sameAs`) más
un `Blog` o un `BlogPosting`, y ningún `SoftwareApplication`. La prueba lo
comprueba. Lo que sí puede nombrar el texto son los topes del plan gratis —un
equipo y cinco partidos—, que son `FREE_TEAMS` y `FREE_MATCHES` en la app.

## Las capturas

Las ocho pantallas salen de la app de verdad y se generan en **su** repositorio,
no en éste:

```bash
cd ../superStat
node tools/make-screenshots.js            # las ocho en castellano
IDIOMA=en node tools/make-screenshots.js  # y en inglés, francés y alemán
IDIOMA=fr node tools/make-screenshots.js
IDIOMA=de node tools/make-screenshots.js
```

Son PNG de 1080×1920, que es lo que pide Google Play, y pesan 1,9 MB por idioma:
demasiado para una página web. Aquí se guarda la copia reducida a WebP de
540×960, unos 25 KB por imagen, en una carpeta por idioma (`img/capturas`,
`img/capturas-en`, `-fr` y `-de`):

```bash
ORIGEN=../superStat npm run capturas
```

Se ejecuta a mano y solo cuando las capturas cambien. Necesita `playwright`
(`npm install`), que es la única dependencia del repositorio y no entra en la
web.

## Publicar

La web la sirve **GitHub Pages** desde la rama `main`. No hay despliegue que
mantener: se hace push y en un minuto está arriba.

Antes vivía en el hosting de PiensaSolutions, en un WordPress, y se subía por
FTP. Se cambió porque una web estática no necesita nada de lo que da un hosting
compartido —ni PHP, ni base de datos, ni panel—, y Pages hace gratis las tres
cosas que hacía el `.htaccess`: forzar https, servir `404.html` ante una URL que
no existe, y poner las cabeceras de caché. Por eso ese archivo ya no está.

### Las dos URL

Pages sirve el repositorio en dos sitios a la vez:

```
https://davidmartinezzz20.github.io/webSuperStat/   siempre disponible
https://superstat.online/                           con el dominio configurado
```

La primera es la de comprobación: con ella se ve la web **antes** de tocar el
DNS, mientras el dominio sigue apuntando a donde apunte hoy. Por eso los enlaces
de navegación van en relativo (`en/`, `../`) y no colgando de la raíz (`/en/`):
en esa URL el sitio cuelga de `/webSuperStat/`, y un `/en/` se saldría del
repositorio. `test/web.js` lo vigila.

La excepción es `404.html`, que necesita rutas absolutas porque el servidor lo
saca ante cualquier URL y no tiene una carpeta desde la que contar. En la URL de
comprobación se verá sin estilos; en el dominio, bien. No es un fallo.

### Montarlo

1. **Activar Pages**: *Settings → Pages → Source: Deploy from a branch*, rama
   `main`, carpeta `/ (root)`. En un minuto responde la URL de `github.io`.
2. **Comprobarla ahí**: la portada, `en/`, `fr/`, `de/`, que las capturas
   cargan y que el cambio de idioma va. Con el dominio aún sin tocar, así que no
   hay prisa ni riesgo.
3. **Poner el dominio**: en esa misma pantalla, *Custom domain* →
   `superstat.online` → *Save*. GitHub escribe un archivo `CNAME` en la raíz del
   repositorio con el dominio dentro. **No lo borres**: si desaparece, Pages
   deja de servir en tu dominio.
4. **Cambiar el DNS**, en el panel donde gestiones `superstat.online`. Cuatro
   registros `A` para el dominio a secas, y opcionalmente un `CNAME` para el
   `www`:

   | Tipo | Nombre | Valor |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `davidmartinezzz20.github.io` |

   Son las cuatro de GitHub y no cambian. Con el `CNAME` del `www`, GitHub
   redirige `www.superstat.online` al dominio a secas él solo.
5. **Esperar y marcar https.** El DNS tarda de minutos a un par de horas. Cuando
   GitHub lo vea, saca el certificado solo (Let's Encrypt) y se habilita la
   casilla *Enforce HTTPS* en esa misma pantalla: márcala, para que nadie entre
   por `http`.
6. **Comprobar** `https://superstat.online/` y las otras tres portadas en una
   ventana de incógnito, y que `http://superstat.online` salta a `https`.

A partir de ahí, publicar un cambio es `git push`.

### El hosting viejo

No hace falta tocarlo para nada de lo anterior, y conviene dejarlo en pie hasta
que el dominio responda desde Pages: si algo saliera mal, se devuelve el DNS y
la web vieja sigue ahí.

Cuando lo nuevo funcione:

- **Bájate una copia del WordPress antes de cancelar nada**: los archivos de la
  raíz web y un volcado de la base de datos. Al cancelar el hosting se borra, y
  es lo único que va a quedar de esa web.
- El dominio **no** hay que moverlo de sitio. Solo se cambió a dónde apuntan sus
  DNS; el registro sigue donde esté.
- La ficha de Google Play sigue apuntando a `https://super-stat.vercel.app` como
  sitio web y como política de privacidad. Eso está decidido así y esta web solo
  enlaza allí; el día que se quiera mover, el archivo a tocar es `docs/play.md`
  en el repositorio de la app.

## Lo que todavía no está

- **El enlace de Google Play.** La app aún no está publicada, así que donde irá
  el botón hay una etiqueta de «Próximamente». Cuando salga, se cambian los
  `<span class="pendiente">` de las dos páginas por un `<a class="boton
  secundario">` con el enlace de la tienda.
- **Acabar con la duplicación de la política de privacidad.** Las cuatro páginas
  están aquí y, mientras Play Console siga apuntando a Vercel, también en el
  repositorio de la app. Cuando la ficha apunte a `superstat.online`, se borran
  las de allí.
