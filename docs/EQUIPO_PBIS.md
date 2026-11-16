# Equipo PBiS en la portada

Se incorpora el módulo editorial aprobado de 21 personas antes de Contacto, con un enlace «Equipo PBiS» en el menú de escritorio y en el móvil. Los nombres, las fotos, las afiliaciones, los 19 enlaces de perfil y los encuadres proceden de la entrega del equipo; no se generan datos nuevos.

## Fuentes

- `site-src/equipo-pbis/equipo-pbis.html`: sección de portada, sin scripts. Título h2, áreas h3 y personas h4.
- `site-src/equipo-pbis/equipo-pbis.css`: estilos limitados a la sección, que heredan la tipografía del sitio. Tres columnas en escritorio, dos en móvil y una por debajo de 350 px.
- `site-src/equipo-pbis/equipo.json`: inventario editorial.
- `site-src/equipo-pbis/assets-manifest.json` y `assets/`: fotos y huellas del material original.

El encabezado interno usa un contenedor propio para no heredar el comportamiento fijo de la cabecera de navegación. El módulo no añade fuentes externas, servicios ni formularios.

## Construcción

El build inserta el módulo y su CSS en la portada común. Copia las fotos a `site/assets/equipo-pbis/` para la web y las incorpora como datos en `release/index.html` y las descargas sin conexión. Verifica sus huellas antes de construir. `verify-release.mjs` admite exclusivamente las imágenes del manifiesto y comprueba sus huellas; no se abre una excepción genérica a archivos públicos adicionales.

Para modificar una foto deliberadamente, actualizar también su huella y el inventario. Los archivos de salida se regeneran con el build; no editar el HTML generado directamente.

## Verificación local del cambio

Build y verificación de distribución superados. Pruebas de contenido del equipo, recursos online/offline, regresión de release y contacto superadas. No se han realizado envíos ni se ha cambiado el importador, los cálculos, permisos o PDF del visualizador.

Pendiente revisión visual en navegador del sitio integrado, especialmente menú estrecho, encuadres y flechas en Safari/iOS. Las comprobaciones estructurales no sustituyen esa revisión.
