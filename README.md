# webSuperStat — la web de superstat.online

La web pública de **SuperStat**, la app de estadísticas de balonmano. Es la
página a la que llega quien busca la app: cuenta qué hace, la enseña y lleva a
abrirla. La app en sí vive en otro repositorio,
[superStat](https://github.com/davidmartinezzz20/superStat).

Dos páginas, castellano e inglés, y nada más: **HTML plano, sin build, sin
framework y sin fuentes de CDN**, la misma regla que sigue la app. Lo que hay en
el repositorio es exactamente lo que se sube al servidor.

```
index.html        castellano
en/index.html     inglés
404.html          la página de error, en los dos idiomas
css/web.css       los estilos de las dos
img/              iconos, la imagen para redes y las capturas
.htaccess         https forzado, caché y página de error, para el Apache del hosting
robots.txt  sitemap.xml
```

Y lo que no se sube:

```
tools/optimizar-capturas.js   pasa las capturas de la app a WebP para la web
test/web.js                   comprueba enlaces, anclas y paridad es/en
.github/workflows/            el despliegue
```

## Verla

```bash
npm start          # npx serve en http://localhost:4173
npm test           # enlaces, anclas, paridad es/en y metadatos
```

Se puede abrir `index.html` a pelo con `file://`, pero los enlaces del pie y del
cambio de idioma son absolutos (`/`, `/en/`) y desde `file://` no van a ningún
sitio. Con `npm start` sí.

## Al tocar la página

**Toda sección nueva va en los dos idiomas.** `test/web.js` compara los `id` de
las `<section>` de `index.html` y de `en/index.html` y falla si una se queda
corta o si el orden no coincide. Es el equivalente aquí de lo que `test/i18n.js`
vigila en la app, con la diferencia de que allí hay un diccionario y aquí hay
dos archivos escritos a mano.

**Los textos no se inventan.** Salen ya escritos del repositorio de la app:

| Qué | De dónde |
|---|---|
| Descripción corta y larga, correo de contacto | `docs/play.md` |
| Los eslóganes, en los dos idiomas | `docs/instagram.md` |
| El vocabulario inglés (*save*, *plus/minus*, *squad*) | `js/i18n.js` |

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
5. `index.html`, `en/index.html` y `404.html` de aquí
6. el favicon de esas tres páginas

Si cambia el dibujo, hay que tocarlos todos y volver a generar los iconos.

## Las capturas

Las ocho pantallas salen de la app de verdad y se generan en **su** repositorio,
no en éste:

```bash
cd ../superStat
node tools/make-screenshots.js            # las ocho en castellano
IDIOMA=en node tools/make-screenshots.js  # las mismas en inglés
```

Son PNG de 1080×1920, que es lo que pide Google Play, y pesan 1,9 MB por idioma:
demasiado para una página web. Aquí se guarda la copia reducida a WebP de
540×960, unos 25 KB por imagen:

```bash
ORIGEN=../superStat npm run capturas
```

Se ejecuta a mano y solo cuando las capturas cambien. Necesita `playwright`
(`npm install`), que es la única dependencia del repositorio y no entra en la
web.

## Publicar

La web se sirve desde el hosting de **PiensaSolutions**, en `public_html`. El
despliegue lo hace `.github/workflows/desplegar.yml` en cada push a `main`.

### Antes del primer despliegue

Aquí estaba WordPress, y hay un paso que no se puede saltar: **mientras sigan en
`public_html` el `index.php` y el `.htaccess` de WordPress, Apache manda todas
las peticiones a WordPress** y el `index.html` nuevo no llega a verse nunca. No
basta con subir los archivos encima.

En orden:

1. **Copia de seguridad completa**, desde cPanel: los archivos de `public_html`
   y también la base de datos por phpMyAdmin. Es lo único que queda del
   WordPress cuando esto acabe, así que guárdala fuera del servidor.
2. **Vaciar `public_html`**, el `.htaccess` incluido. Si prefieres no borrar,
   mueve todo a una carpeta `wordpress-viejo/` fuera de `public_html`.
3. **Cargar los cuatro secretos** en *Settings → Secrets and variables →
   Actions* del repositorio: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` y
   `FTP_DIR` (normalmente `public_html/`). Las credenciales FTP están en cPanel,
   en *Cuentas FTP*.
4. **Lanzar el despliegue**: un push a `main`, o *Actions → Desplegar → Run
   workflow*.
5. Comprobar `https://superstat.online/` y `https://superstat.online/en/` en una
   ventana de incógnito, y que `http://superstat.online` salta a `https`.

Si prefieres no usar la Action, la alternativa es subir con cualquier cliente
FTP el contenido del repositorio a `public_html`, **menos** `tools/`, `test/`,
`.github/`, `package.json` y `README.md`. El `.htaccess` sí va, y muchos
clientes ocultan los archivos que empiezan por punto.

### Una vez publicada

- La base de datos de WordPress se puede borrar cuando estés seguro de que la
  web nueva funciona. Ya no la usa nadie.
- La ficha de Google Play sigue apuntando a `https://super-stat.vercel.app` como
  sitio web y como política de privacidad. Eso está decidido así y esta web solo
  enlaza allí; el día que se quiera mover, el archivo a tocar es `docs/play.md`
  en el repositorio de la app.

## Lo que todavía no está

- **El enlace de Google Play.** La app aún no está publicada, así que donde irá
  el botón hay una etiqueta de «Próximamente». Cuando salga, se cambian los
  `<span class="pendiente">` de las dos páginas por un `<a class="boton
  secundario">` con el enlace de la tienda.
- **La política de privacidad en inglés.** `privacidad.html` es castellana y se
  sirve desde la app; la página inglesa enlaza a ella avisando del idioma.
