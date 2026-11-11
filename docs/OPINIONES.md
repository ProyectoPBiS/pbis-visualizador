# Opiniones sobre la aplicación

Hay un único botón **Opinar** por bloque: **Centro**, **Aula**, **Estudiantes** y **Red de relaciones**. La lista y las fichas individuales comparten el bloque Estudiantes; las tarjetas interiores no repiten el botón. Es una opción voluntaria sobre la claridad y utilidad de la herramienta, no una valoración del alumnado.

1. Elige una opinión, una propuesta de mejora o «Algo no funciona».
2. Puedes votar del 1 al 5, escribir un comentario o ambas cosas. Las propuestas y los fallos requieren una explicación breve.
3. Pulsa **Añadir a esta sesión**. Cambiar de ficha conserva lo añadido y los borradores.
4. Al pulsar **Cerrar sesión**, revisa el resumen y elige **Enviar y cerrar sesión**. Todas las aportaciones se agrupan en un único envío a pbis_usuario@outlook.es mediante Formspree. Si no has opinado, el cierre es directo.

También puedes abrir **Revisar y enviar** durante la consulta. No se envía un correo por tarjeta ni por voto. El correo contiene un resumen legible y un JSON compacto, sin adjuntar Excel ni generar un ZIP.

## Contenido y conservación

Se incluyen cuenta, rol, sesión aleatoria, vista y apartado, tipo de aportación, puntuación opcional, comentario, fecha y versión. No se añaden nombres, códigos de estudiantes, resultados educativos, nombre del archivo, huellas de archivos ni contraseñas. No introduzcas datos personales en el texto libre.

En un proyecto protegido se utiliza el código de cuenta. Una cuenta compartida no acredita quién comentó físicamente. Las aportaciones no se incluyen en los PDF ni alteran los indicadores.

Solo se conserva memoria durante la sesión. No se usan localStorage, sessionStorage ni IndexedDB. Tras 15 minutos sin actividad se intenta enviar lo añadido y cerrar, con aviso previo. Si hay borradores o el envío falla, la consulta permanece abierta y permite revisar o reintentar. Cerrar la pestaña o apagar el equipo puede perder lo pendiente: para terminar, usa **Cerrar sesión**.

La confirmación de Formspree acredita que el servicio ha aceptado el lote; no que Outlook haya recibido el aviso. Los reintentos sin cambios conservan el identificador y contenido del lote, aunque una respuesta perdida puede producir un correo duplicado. Puedes descargar una copia JSON como alternativa si no tienes conexión.

## Demostración

Los mismos controles permiten probar la función. La demo muestra que son opiniones de práctica, no envía correos y las elimina al salir.

## Formato para análisis

El JSON se identifica como `pbis.app-feedback.v1`: un lote con `batchId`, `username`, `role`, `sessionCode`, `version`, `preparedAt` y una lista `records`. Cada registro contiene `eventId`, `scope: app`, `sheet`, `section`, `kind`, `rating` (1–5 o null), `comment`, `date`, rol, sesión y versión. `kind` distingue `opinion`, `improvement` y `problem`. No interpretes una puntuación ausente como cero.

Este formato es distinto del histórico `pbis.feedback.v2`, que vinculaba valoraciones a estudiantes. El importador histórico de FEEDBACK_DATOS.md sigue destinado a ese formato anterior; no debe mezclar estas opiniones con respuestas educativas.
