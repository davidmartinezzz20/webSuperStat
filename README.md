# webSuperStat — la web de superstat.online

La web pública de **SuperStat**, la app de estadísticas de balonmano. Es la
página a la que llega quien busca la app: cuenta qué hace, la enseña y lleva a
abrirla. La app en sí vive en otro repositorio,
[superStat](https://github.com/davidmartinezzz20/superStat).

Cuatro portadas —castellano, inglés, francés y alemán— y nada más: **HTML
plano, sin build, sin framework y sin fuentes de CDN**, la misma regla que sigue
la app. Se publica con **GitHub Pages**: lo que hay en el repositorio es
exactamente lo que se sirve, y desplegar es hacer push.

```
index.html          castellano
en/index.html       inglés
fr/index.html       francés
de/index.html       alemán
privacidad.html     la política de privacidad, y privacidad-en/-fr/-de.html las
                    otras tres. Páginas sueltas, con sus estilos dentro
404.html            la página de error, en los cuatro idiomas
css/web.css         los estilos de las cuatro portadas
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

**El precio está escrito cuatro veces**, una por portada, en la sección
`#planes` a la que baja el botón de la cabecera. No hay plantilla que lo
centralice —aquí no hay build—, así que `test/web.js` compara el número de las
cuatro y falla si una se despareja: un 3,49 que en alemán diga 3,99 no rompe
nada, no sale en ninguna consola y lo lee un cliente. Tiene que coincidir
además con lo que cobra Stripe y con `PRO_PRICE` en `js/config.js` de la app
(`docs/suscripcion.md`), y los topes del plan Gratis de la tabla, con
`FREE_TEAMS` y `FREE_MATCHES` en `js/app.js`.

**Los textos no se inventan.** Salen ya escritos del repositorio de la app:

| Qué | De dónde |
|---|---|
| Descripción corta y larga, correo de contacto | `docs/play.md` |
| Los eslóganes, en los dos idiomas | `docs/instagram.md` |
| El vocabulario de cada idioma (*save*, *arrêt*, *Parade*) | `js/i18n.js` |
| Lo que da el plan Pro y lo que limita el Gratis | `js/i18n.js` (`paywall.*`, `limit.*`) |

Si allí se reescribe la descripción de la ficha de Play, conviene traer el
cambio aquí; son el mismo mensaje contado dos veces y quedan desparejados sin
que nadie se entere.

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
