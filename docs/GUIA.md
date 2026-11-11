# Guía de PBiS · 0.13.0

## Entrar

Desde la portada pulsa **Tu área privada**. Introduce usuario y contraseña y abre el Excel o proyecto `.pbis`. Los proyectos cifrados comprueban las aulas autorizadas antes de mostrar las fichas. El archivo original no se modifica.

Para explorar, pulsa el botón de demo bajo el acceso. El ejemplo se abre directamente con datos simulados, sin contraseña ni carga manual.

## Consultar

- **Centro:** visión del centro disponible para orientación.
- **Aula:** tarjetas de bullying, relaciones, bienestar, posición, mediación y test cognitivo. La información complementaria permite explorar la red del aula.
- **Estudiantes:** busca por nombre o código, ordena y pulsa un nombre para abrir su ficha. Las listas de centro muestran también el curso y el aula. En móvil se presenta como tarjetas, con un selector para ordenar.
- **Red de relaciones:** comunidades como vista inicial, con opción de círculo.

La ficha individual muestra las seis tarjetas del prototipo: **Bullying, Relaciones de amistad y negativas, Posición, Bienestar, Mediador y Test cognitivo**. Conserva las preguntas y las respuestas disponibles, con las medias de la clase. Los botones **Anterior** y **Siguiente** recorren los estudiantes del aula. **Ver más información** contiene la red en estrella, con el estudiante en el centro y sus relaciones alrededor. Las flechas indican quién nombra a quién; el verde identifica buena relación y el rojo mala relación.

Las tres preguntas complementarias de bullying conservan el texto importado del Excel. Si falta una respuesta se indica «Sin respuesta»; no se deduce del resto de indicadores. Los archivos antiguos sin estas respuestas siguen siendo compatibles.

Los recuentos pulsables abren la lista exacta de estudiantes que los forman. Las listas destacadas incluyen los empates del tercer puesto. La popularidad y la centralidad reportadas cuentan a quienes eligen a cada estudiante en esas preguntas. Los mismos recuentos aparecen en su ficha individual. Si el archivo no incluye una de esas preguntas, se muestra «Sin datos».

Las cinco categorías de bullying combinan autodeclaración y menciones de compañeros e incluyen a todos los estudiantes. Solo para este reparto, si falta el autorreporte se entiende que no hay autodeclaración registrada; si tampoco constan menciones de compañeros, se incluye en «Ninguna». La respuesta original permanece ausente en la ficha y la lista. El indicador «Señalados por otros» mantiene el criterio de dos o más menciones de compañeros.

Bienestar muestra el promedio de las respuestas completas y conserva las tres respuestas por separado. El test muestra la media 0–3 y los aciertos por pregunta: Carrera, Emilia y Biblioteca. Cada pregunta usa sus respuestas disponibles; el promedio total requiere las tres. Si un archivo anterior solo contiene el total, no se inventa el desglose. Los denominadores indican la información disponible. Las comparaciones con el centro solo aparecen si el perfil tiene acceso a él.

En el aula, las relaciones positivas y negativas se comparan con el colegio. Son los vínculos dirigidos dentro del aula divididos por las relaciones posibles entre quienes respondieron y el resto de su clase. La referencia del colegio combina numeradores y denominadores de todas sus aulas. Los recuentos individuales siguen incluyendo las relaciones entre aulas del mismo centro.

En la lista, **menciones recibidas** cuenta quiénes nombran a ese estudiante; **menciones declaradas** cuenta a las otras personas que nombra, sin incluirse a sí mismo. Una mención aparece en ámbar y dos o más en rojo; el «Sí» de acoso autodeclarado usa el mismo rojo. Son cantidades, no niveles de riesgo. Si el archivo no incluye el nuevo recuento declarado, se indica «Datos insuficientes».

En la red del aula solo aparecen parejas con una buena relación mutua o una mala relación mutua, con una línea por pareja. Las relaciones unilaterales y las que combinan buena y mala relación no se dibujan. El verde indica buena relación y el rojo mala relación; el grosor representa la media de las dos intensidades. El color de los estudiantes identifica comunidades. La red individual conserva todas las relaciones disponibles y sus flechas. Los indicadores no cambian.

Cada bloque —Centro, Aula, Estudiantes y Red— ofrece un único botón discreto **Opinar**, sin repetirlo en sus tarjetas. Puedes votar del 1 al 5, proponer una mejora o describir un fallo. Pulsa **Añadir a esta sesión**: todas las aportaciones se reúnen en un único correo al cerrar sesión. Antes de enviarlo se muestra un resumen. Es opcional y se refiere a la herramienta, no a los estudiantes. La demo permite practicar sin enviar nada.

## PDF y cierre

Se conserva el PDF de la vista actual, sujeto al permiso del perfil, protegido con el DNI indicado y con marca de agua. No se generan varias fichas a la vez.

Pulsa **Cerrar sesión** al terminar. El logotipo cierra la sesión y vuelve a la portada. No se guardan consultas de forma persistente en el navegador. El registro de accesos, si está activado, necesita conexión.

## Portada y trabajo sin conexión

«Tu área privada» abre la pantalla de acceso. Para probar, el botón «¿Quieres ver cómo funciona? Pulsa aquí» abre directamente los datos simulados. Bajo el acceso puedes desplegar «¿Quieres trabajar sin conexión?» y descargar la aplicación para Windows, Mac o Linux. Extrae la carpeta y abre index.html.

El formulario de la portada envía consultas al equipo PBIS mediante Formspree y necesita conexión. Solo se envía al pulsar «Enviar mensaje». Si falla, conserva el texto durante esa visita para reintentarlo; no cierres la página sin copiar un mensaje pendiente.

La demo incorpora dos centros y 54 aulas inventadas, con tamaños distintos y respuestas incompletas. Sus redes se generan de nuevo a partir de patrones agregados; ninguna corresponde a un centro real. El ejemplo permanece fijo entre sesiones.
