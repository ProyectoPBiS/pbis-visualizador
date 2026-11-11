# Estado vigente de la revisión local

El cierre actual está en [REVISION_PENDIENTES_20261111.md](REVISION_PENDIENTES_20261111.md).

El contenido siguiente es un registro histórico de iteraciones del mismo día. Las cifras de ejemplos, nombres de controles y totales de pruebas antiguos se conservan como evidencia de cada fase, no como el estado actual.

---

## Verificación de categorías y red individual · 11/11/2026

- Se comprobaron las cinco categorías en **54 aulas y 2 centros ficticios**. Sus sumas cubren todos los registros y sus listas son disjuntas. Se verificaron **280 aperturas** usando los controladores reales de la aplicación, comparando tanto el número mostrado como los ID exactos esperados. Se añadió un escenario con 1 (C), 1 (A) y ausencia de autorreporte para comprobar también categorías que están vacías en la demo habitual.
- En el navegador se comprobaron las cinco listas del aula inicial, las de ambos centros y de nuevo las del aula en móvil: 20 aperturas correctas, sin errores de consola. Se utilizó una pestaña independiente con datos simulados; se conservó la sesión que el usuario tenía abierta.
- Ejemplos, en el orden Ninguna / 1 (C) / 1 (A) / 2+ (C) / 2+ (C+A): 1.º ESO A del Centro 3705 = **23 / 0 / 0 / 2 / 3**, total 28; Centro 3705 = **682 / 0 / 0 / 27 / 47**, total 756; Centro 3884 = **680 / 0 / 0 / 28 / 48**, total 756.
- Por indicación expresa del usuario, la red individual en estrella **permanece al final de Ver más indicadores**. Se confirmó que está oculta con ese apartado cerrado y visible al abrirlo, con el estudiante en el centro, relaciones alrededor, flechas, verdes y rojos. La red del aula sigue mostrando comunidades por defecto. No se cambia el motor ni los permisos.
- Validación: **75 pruebas afectadas correctas**. Evidencia: `revision-category-star-tests.log`, `test-results/relaunch/category-navigation-audit.json` y `test-results/relaunch/category-navigation-browser.json`. Se añadieron pruebas de regresión; no se detectó un fallo funcional en las categorías.
- Solo local. Sin publicación, envíos de correo ni modificación de datos reales.

---

## Clasificación completa de bullying · 11/11/2026

- Por petición del usuario, se retira la frase de información insuficiente y el recuento separado de pendientes. Todos los registros se incluyen en una de las cinco categorías.
- Esta es una regla de presentación: autorreporte ausente o encuesta no realizada se trata como ausencia de autodeclaración registrada; las menciones recibidas deciden entre Ninguna, 1 (C) y 2+ (C). Si tampoco consta recuento de pares, no hay menciones registradas para el reparto. No se escriben ceros ni respuestas «No» en los datos originales.
- Las autodeclaraciones afirmativas disponibles conservan 1 (A) o 2+ (C+A). Los porcentajes y denominadores de respuestas válidas, el filtro de más de quince nominaciones, las fichas individuales y el PDF no cambian.
- En la demo de 1.º ESO A: Ninguna 23, 1 (C) 0, 1 (A) 0, 2+ (C) 2 y 2+ (C+A) 3. Total 28. El autorreporte mantiene 27 respuestas válidas.
- Validación: 37 pruebas específicas y 246 pruebas JavaScript de la batería completa correctas; cuatro descargas locales verificadas. Incluye los listados pulsables por perfil, partición completa de todas las aulas y conservación de los registros originales. Solo local; sustituye la regla histórica de pendientes descrita debajo.

---

## Tarjetas del ejemplo: revisión completa · 11/11/2026

Estado vigente: **245 pruebas JavaScript correctas**, comparación numérica con el prototipo original y revisión de escritorio y móvil. Solo local. Las decisiones nuevas de este apartado sustituyen a las interpretaciones de las revisiones históricas inferiores.

| Tarjeta | Antes | Ahora | Validación |
| --- | --- | --- | --- |
| Bullying | Categorías ya recuperadas | Se mantienen las cinco categorías, definiciones, recuentos pulsables y pendientes | Partición de 54 aulas y dos centros; autodeclaración más un par no se confunde con dos pares |
| Relaciones de amistad y negativas | Medias de nominaciones | Porcentajes de relaciones positivas y negativas, comparación Clase/Colegio y frase sobre la media; en Centro, promedio narrativo de relaciones | Archivo sintético original: 18,2 % y 9,1 % en cada clase y colegio; denominador ponderado por oportunidades |
| Bienestar | Promedio con barra general | Promedio /10, media del colegio y las tres frases con recuento y denominador | Respuestas válidas, cero y ausencia diferenciados; soledad sigue invertida en el índice |
| Posición | Popularidad basada en buenas relaciones; centralidad reportada | Popularidad y centralidad reportadas con sus narrativas, top 3 y empates; recuentos del centro pulsables | Preguntas `popular` y `central`, sin autoselección; mismo recuento al abrir la ficha individual |
| Mediador | Recuento positivo y negativo más ranking | Ranking narrativo y, en Centro, número con opiniones favorables, como la referencia | Recuento de personas y enlaces a fichas; indicadores de mediación negativa siguen conservados en el motor |
| Test cognitivo | Distribución de totales 0–3 | Media y tres barras Carrera/Emilia/Biblioteca con porcentaje y aciertos/respuestas | Desglose importado de cada respuesta; validación binaria y consistencia del total; respuestas parciales admitidas por ítem |

### Datos, permisos y reglas conservadas

- Las nuevas densidades se calculan dentro de cada aula: suma de vínculos positivos o negativos / suma de `respuestas de relaciones × (tamaño del aula − 1)`. El colegio reúne esas sumas, no promedia porcentajes sin ponderar. La clase debe estar completa en el conjunto consultado.
- No se recalculan ni modifican los indicadores normalizados existentes ni el eigenvector contrastado con R. Los recuentos individuales admiten relaciones entre aulas. Popularidad y centralidad reportadas cuentan emisores distintos del mismo centro, excluyendo autoselección.
- Se conserva el filtro anterior de **más de 15 nominaciones a otras personas** y el resumen de **dos o más menciones de pares**.
- Archivos antiguos sin preguntas `popular`, `central` o detalles CRT muestran ausencia de información, sin sustituirla por medidas distintas. En la demo los nuevos campos son sintéticos deterministas, conservando los totales previos.
- Los nuevos campos de recuento e ítems se validan y se conservan en los compartimentos protegidos. Un docente no recibe otras aulas; tampoco se añade una comparación global que no esté disponible en su ámbito autorizado.
- El PDF sigue con la implementación anterior, DNI y marca de agua, por la decisión vigente del reajuste. No se han modificado datos reales, enviado valoraciones ni publicado nada.

### Evidencia

- `revision-exact-cards-tests.log`: 245 correctas, 0 fallos.
- `test-results/relaunch/comparacion-tarjetas-referencia.json`: igualdad numérica con `entradas/paquete/prototipo/live/data.js` sobre el Excel sintético `DEMO_AUDITORIA_36.xlsx`. Solo se añadieron en memoria las columnas de metadatos necesarias para el importador Wave 1; no se cambiaron las respuestas.
- Revisión visual a 1360, 390 y 320 px; recuentos de centro abren las listas correspondientes y los nombres abren fichas con los mismos valores.

---

## Informes narrativos y centralidad reportada · 11/11/2026

Validación de esa revisión: **239 pruebas JavaScript correctas y cuatro descargas locales verificadas**. Revisión de categorías, navegación y presentación en escritorio y móvil (320 y 390 px). No publicado. Los apartados inferiores conservan la historia de cambios y sus validaciones anteriores.

- Se recuperan los seis apartados del ejemplo y su estilo narrativo con la estructura y paleta actuales. Las cinco categorías de bullying conservan las definiciones solicitadas; se calculan con los datos propios y de pares disponibles, sin sustituir ausencias por cero. Cada recuento abre su lista exacta y autorizada.
- Se mantiene el resumen de dos o más menciones de pares y el filtro de emisores con más de quince nominaciones a otras personas. Autodeclaración más una mención entra en 2+ (C+A), pero no en el resumen de dos pares. Los casos sin información suficiente se muestran aparte.
- Por indicación posterior del usuario, Posición muestra ahora centralidad **reportada**, no eigenvector. Se importa la pregunta opcional `central`, cuenta personas distintas del mismo centro y excluye autoselección; las referencias entre aulas se admiten. El campo `centralidad_reportada_n` se valida y se conserva en los compartimentos cifrados. La ficha individual usa el mismo recuento. Archivos antiguos sin esa información muestran «Sin datos».
- La demo incluye votos sintéticos deterministas para centralidad reportada, independientes del eigenvector. El motor de redes y sus pruebas contra R permanecen conservados para la red; no se cambia su normalización ni se redefine el valor calculado almacenado.
- Se adaptan las frases que, copiadas literalmente, cambiarían el significado: popularidad sigue siendo buenas relaciones recibidas; las comparaciones de relaciones siguen siendo medias de recuentos, no porcentajes de otra implementación. El CRT conserva total y distribución 0–3; no se inventan resultados por pregunta que el conjunto ya procesado no conserva.
- Los PDF mantienen su implementación anterior y su protección. Estos cambios de composición afectan a la consulta en pantalla. No se han usado datos reales ni enviado valoraciones.

Archivos: `src/app.js`, `src/relaunch.css`, `src/consultation-ui.js`, `src/raw-wave1.js`, `src/core.js`, `src/protected-project.js`, `tools/demo-fixture.mjs`, pruebas afectadas y esta guía. Registro de pruebas: `revision-narrative-tests.log`.

## Ajuste visual de aula y lista

- La ficha de aula ya no muestra los cuatro indicadores estructurales sobre la red.
- La red mantiene comunidades, círculo, selección y zoom, con menos recuadros anidados.
- Dos o más menciones de acoso usan rojo más intenso; una conserva el amarillo. Se elimina la leyenda de cantidades.
- Validación: 49 pruebas afectadas correctas, vista de escritorio y móvil de 390 px sin desbordamiento de página, cuatro descargas locales regeneradas y verificadas. Sin cambios de cálculo ni en el PDF. No publicado.

> Revisión vigente: auditoría desde **veinte perspectivas profesionales**, según la aclaración del usuario. Búsqueda y contexto de listas mejorados, ayuda simplificada y documentación/portada actualizadas. **232 pruebas JavaScript y 12 Python aprobadas; cuatro descargas locales verificadas**. Informe: [Auditoría de veinte perfiles](AUDITORIA_20_PERFILES_20261111.md). La revisión de veinte aulas descrita abajo se conserva como evidencia funcional independiente.

> Estado actual: **230 pruebas JavaScript aprobadas y cuatro descargas locales verificadas**. Menú con iconos, lista móvil en tarjetas, menciones de acoso declaradas, colores semánticos y auditoría secuencial de veinte aulas. Véase [auditoría detallada](AUDITORIA_20_AULAS_20261111.md). Las cifras de validación de los apartados inferiores son históricas; ya no debe leerse «16 módulos idénticos» como estado actual: son 12 idénticos y 4 ampliaciones acotadas, con los resultados analíticos conservados. Se corrige además el recuento de respuestas en la red individual.

> Actualización posterior del 11/11/2026: se retira la valoración docente y se sustituyen los resúmenes de centro y aula por las tarjetas de la referencia recibida. La cronología anterior se conserva más abajo.

## Ajuste de las fichas de centro y aula

- Antes había una pestaña de valoración docente; ahora se ha retirado, junto con sus controles y las invitaciones en acceso, portada y ayuda. Se comprobó en navegación real y pruebas de sesión. El motor de envío anterior permanece conservado, sin activar un envío durante esta revisión.
- Antes el resumen mostraba tres bloques y una ampliación; ahora presenta seis tarjetas: señales de acoso, relaciones, bienestar, posición, mediación y test de impulsividad. Se conserva la ampliación de red del aula.
- Los recuentos abren la lista correspondiente y los nombres destacados abren la ficha, con vuelta a centro o aula. Los empates se conservan bajo un desplegable.
- Se muestran promedios y denominadores sobre los indicadores existentes. No se altera el filtro de más de 15 nominaciones, el umbral de dos menciones, la centralidad, la normalización ni la importación. La centralidad se compara dentro del aula; las referencias de centro solo aparecen cuando el perfil permite verlo.
- Validación actual: **226 pruebas JavaScript aprobadas**; cuatro descargas comprobadas; 16 módulos y conjuntos de referencia preservados idénticos. Revisión interactiva de centro, aula, recuentos, vuelta desde fichas, menú sin valoración y anchos de 1360, 390 y 320 px. Sin desbordamientos ni errores de consola observados.
- No se ha publicado. Los PDF conservan su implementación anterior; esta modificación afecta a la presentación en pantalla.

---

# Reajuste local de PBiS — 0.13.0

Fecha: 11 de noviembre de 2026. Estado: preparado para revisión local, sin publicación.

## Alcance aplicado

Se ha trabajado en `PBIS_REAJUSTE_LOCAL_20261111/implementacion`. La versión anterior y su copia de seguridad permanecen intactas. Los HTML y recursos recibidos se usan como referencia visual; no sustituyen al motor analítico anterior.

| Antes | Ahora | Comprobación |
| --- | --- | --- |
| Identidad visual anterior | Portada y aplicación con la nueva identidad crema/coral y los logotipos suministrados | Revisión visual en escritorio y móvil, incluida la portada y las descargas |
| Acceso a la demo con pasos de entrada y carga | Botón bajo el acceso que abre directamente el aula con datos simulados | Recorrido real de portada, acceso y demo; pruebas de sesión |
| Recuentos sin navegación uniforme | Los recuentos pulsables muestran exactamente los estudiantes que los forman | Pruebas contra el motor existente en 54 aulas y dos centros |
| Navegación y valoraciones anteriores | Menú por vistas y valoración simplificada «Me sorprende»; se conservan los motivos de no respuesta | Pruebas de cambios de vista, marcas independientes y generación del envío anterior |
| Red circular inicial | Comunidades como vista inicial; se conserva el cambio a círculo y la apertura de fichas | Revisión en navegador con datos simulados y pruebas de red |
| PDF con identidad anterior | PDF con nueva identidad, manteniendo permiso, DNI como contraseña y marca de agua | PDF real de cuatro páginas, apertura con DNI, rechazo de otra contraseña y revisión visual |

No se ha añadido descarga simultánea de varias fichas. La guía completa queda pendiente de su siguiente revisión; la demo actual entra directamente en los datos.

## Cálculos y reglas conservados

- Se excluyen las menciones emitidas por quien selecciona **más de 15 personas distintas de sí mismo**. Exactamente 15 se admiten. Se mantiene la autoselección separada.
- Los resúmenes cuentan estudiantes con **dos o más** menciones; las fichas individuales conservan el recuento real.
- Se mantiene el ámbito del centro para relaciones entre aulas, la importación anterior de nombres, la normalización y la centralidad contrastada con la referencia de R. El cálculo en ejecución sigue siendo JavaScript.
- Se conservan el cifrado y los permisos de `.pbis`, el registro de accesos y el motor de envío y reintento de valoraciones.
- No se introduce almacenamiento persistente en el navegador. La copia opcional de valoraciones es un archivo que la persona descarga explícitamente; su restauración valida el origen y los datos antes de aplicarlos.

## Evidencias de validación

- 224 pruebas JavaScript aprobadas, sin fallos: `revision-test-final.log`.
- 12 pruebas Python aprobadas: `revision-python.log`.
- Validación de los datos ficticios y las cuatro descargas de la versión 0.13.0.
- Comparación SHA-256 de 16 módulos y conjuntos de referencia conservados: todos idénticos a la base anterior. Evidencia: `test-results/relaunch/preserved-engine.json`.
- PDF de prueba cifrado con AES-256, contraseña DNI comprobada, logotipo y marca de agua en las cuatro páginas. Evidencia: `test-results/relaunch/pdf-result.json`.
- Revisión en navegador de acceso, demo, aula, recuentos, lista, valoraciones, red, ficha individual, vuelta a la vista de origen y diálogo PDF. Revisión móvil sin desbordamiento horizontal de la página.
- Se corrigió la superposición de los botones del menú móvil. Capturas en `test-results/relaunch/`.
- La base anterior y los archivos recibidos no han cambiado; comprobación en `../VERIFICACION_BASES.json`.

Los scripts de pruebas de navegador se han adaptado al nuevo recorrido, pero no se ha ejecutado su batería automatizada completa en esta revisión. La comprobación del navegador indicada arriba ha sido interactiva. No se ha enviado correo real ni se han registrado accesos reales durante las pruebas. No se ha realizado una prueba física en macOS o Linux.

## Revisión local

Portada: `http://127.0.0.1:19031/` mientras el servidor local permanezca abierto.

Aplicación sin instalación: `release/PBIS.html`. Paquete descargable: `site/downloads/PBIS-Universal.zip`.

No se ha modificado la web pública, ni incluido datos reales, credenciales de centros o conexiones privadas en esta entrega de revisión.


## Ficha individual según el prototipo · C15

Antes se repartían los datos entre el resumen y varios indicadores ampliados. Ahora se presentan las seis tarjetas de la referencia `entradas/paquete/prototipo/index.html`, con el diseño crema/coral de esta revisión. «Ver más información» muestra únicamente la estrella y sus notas de cobertura cuando proceden. Anterior y Siguiente recorren el aula autorizada.

Se preservan las respuestas a `fqbullying`, `stopbullying` y `conductas` en tres campos opcionales de texto. Se validan y conservan también al generar y abrir un proyecto protegido. No se modifican filtros, normalización, centralidad calculada, recuentos ni ámbito de las relaciones. Posición sigue mostrando las nominaciones reportadas. El PDF mantiene su motor anterior, con DNI y marca de agua.

Validación: **250 pruebas JavaScript aprobadas, sin fallos**, en `revision-student-reference-full-tests.log`. Incluyen importación de respuestas, escape HTML, ceros/ausencias, permisos y cifrado, valores calculados conservados, navegación individual y red desplegable. Navegador revisado a 1360, 390 y 320 px: seis tarjetas, cambio completo entre estudiantes, estrella inicialmente oculta y apertura con teclado; sin desbordamiento horizontal de la página. Capturas: `test-results/relaunch/ficha-referencia-*.png`. Sin envío real de correo, datos reales ni despliegue.


## Proporciones y anidación de las tarjetas · C16

Antes quedaban huecos entre tarjetas de alturas muy distintas y el test cognitivo de centro/aula aparecía solo en una última fila. Ahora las fichas usan separaciones y títulos uniformes, columnas de igual ancho y bordes alineados. En centro/aula, Posición ocupa dos filas junto a Mediador y Test cognitivo. En la ficha individual, Relaciones se alinea con Posición y Bienestar; Mediador y Test cognitivo cierran juntos. Bullying conserva el ancho completo.

El contenido mantiene altura natural: no se recortan respuestas ni se fijan alturas que oculten información. En pantallas estrechas todas las tarjetas vuelven a una columna en el orden de lectura. Se elimina el doble borde de la estrella dentro de «Ver más información».

Revisión interactiva de las tres fichas a 320, 390, 768, 1024, 1101 y 1440 px: sin solapamientos ni desbordamientos. También se han comprobado los empates desplegados del centro, una ficha sin respuesta, lista móvil y red de relaciones. Evidencia: `test-results/relaunch/card-layout-audit.json` y capturas `tarjetas-*.png`. Construcción y cuatro paquetes locales verificados. Este cambio afecta al CSS, no a cálculos, permisos, datos ni PDF. No se ha publicado.

Único bloque especialmente largo: Posición de centro reúne dos listados y puede crecer mucho al abrir los empates. Se conserva completo. Separar popularidad y centralidad en tarjetas distintas queda como posible decisión de organización con el usuario, no como cambio aplicado.

## Demo realista y reproducible · C17

La demostración utiliza ahora 1.512 estudiantes inventados en dos centros, con 54 aulas de 25 a 31 estudiantes y 86 personas sin respuesta. Cada aula combina probabilidades agregadas de varias aulas de distintos centros; las identidades, las respuestas y todos los vínculos se generan de nuevo. Los seis archivos recibidos contenían cuatro fuentes distintas: los duplicados no se ponderan dos veces. No se copian filas ni grafos reales.

Las fuentes se usan únicamente en la preparación privada del modelo. `data/demo-model.json` contiene probabilidades mezcladas; `tools/synthetic-survey.mjs` genera las respuestas con semilla fija; `tools/demo-fixture.mjs` las convierte mediante el importador vigente. No cambia el motor de indicadores, la normalización, la centralidad ni el filtro de acoso. Las relaciones entre aulas se conservan.

En el ejemplo: densidad positiva dentro de las aulas cercana al 53,5 %, negativa al 5,2 %, autoselección de acoso del 6,0 % de las respuestas válidas y dos o más menciones de pares para el 18,6 % de los registros. Son parámetros de demostración, no estimaciones publicadas sobre centros reales. Los patrones de referencia cubren 5.º–6.º de Primaria y 1.º–4.º de ESO; los demás cursos son aproximaciones ficticias para mantener el recorrido completo.

Excel local: `outputs/demo-realista-20261111/PBIS_demo_realista.xlsx`, hojas Users y Leer primero. Al volver a importar el Excel, sus indicadores coinciden exactamente con los de la demo. Sin errores de celdas, referencias de red inexistentes ni coincidencias de ID o nombre completo con los archivos de referencia. Estas comprobaciones no equivalen a una garantía formal de anonimización; la protección principal es generar registros y redes nuevos desde agregados.

Validación: 255 pruebas aprobadas; las cinco categorías y sus listas se comprueban en las 54 aulas y los dos centros. Se verificaron además 20 cuentas cifradas con la nueva demo: ámbito, recuentos conservados, relaciones autorizadas, PDF y rechazo de contraseña ajena. Las fuentes y la mezcla detallada quedan fuera de la publicación, en `privado_demo_realista` junto a la implementación.

## Portada original integrada · C18

Se recupera el diseño completo de `pbis_web.html`: cabecera, relato, programa, pasos, redes interactivas, beneficios, participación, preguntas, formulario y logos. La cabecera incorpora un único acceso destacado, «Tu área privada». El botón principal abre la demo directamente con el ejemplo cargado. Las descargas se trasladan a «¿Quieres trabajar sin conexión?» bajo el acceso.

El formulario deja de abrir un mailto a dos destinatarios. Envía los campos de contacto al receptor Formspree ya configurado para PBIS. Pide confirmar la política de privacidad, bloquea el doble clic y solo confirma tras una respuesta satisfactoria. Si falla o no hay conexión conserva los campos en esa visita y permite reintentar; no guarda un borrador persistente ni adjunta información del visualizador. No se ha enviado correo real durante las pruebas.

Los diálogos legales se generan desde las mismas condiciones y política de privacidad que la aplicación. Se elimina el aviso ficticio de analítica y el almacenamiento de consentimiento de cookies, ya que no se utiliza esa analítica. Se incluye una explicación de cookies y servicios externos, sin presentar una certificación legal. Fuentes y D3 quedan incorporados localmente para evitar dependencias de CDN al consultar la portada sin conexión; se incluyen sus licencias. La política y la guía también se incluyen en las descargas.

Pruebas del formulario: éxito, rechazo, desconexión, respuesta tardía, reintento, doble envío y validación. Comprobación interactiva de portada, menú móvil, redes, avisos, entrada a la demo y descargas. Documentación técnica consultada: [Formspree AJAX](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax/) y [Guía de cookies de la AEPD](https://www.aepd.es/guias/guia-cookies.pdf).

No se publica esta revisión ni se modifican los archivos reales.

Límite de comprobación: el navegador integrado bloquea direcciones file://, por lo que no se ha probado visualmente la apertura por doble clic en esta revisión. Sí se han verificado el contenido autocontenido de las descargas, sus enlaces locales, las licencias, los hashes y la identidad de los datos incrustados. La revisión visual se ha realizado en localhost.
