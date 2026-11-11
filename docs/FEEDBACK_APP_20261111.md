# Recuperación de opiniones sobre PBiS · Local

## Alcance

Botones opcionales por apartado; voto 1–5, comentario, mejora o fallo. Reutilizar memoria de sesión, revisión, envío conjunto, confirmación, reintento y cierre existentes. No recuperar valoraciones del alumnado ni modificar cálculos, permisos, redes o PDF. No publicar.

## Antes y ahora

- Antes no había controles de opinión. Ahora cada tarjeta, lista y red dispone de «Opinar».
- Antes el contrato de envío vinculaba datos educativos. Ahora los comentarios sobre la app utilizan `pbis.app-feedback.v1`, sin contexto de estudiantes ni archivos.
- Antes la documentación describía una función retirada. Ahora guía, privacidad y condiciones explican el recorrido vigente.

## Validación

Pruebas de contrato y UI: todas las vistas/apartados, votos opcionales, texto requerido para mejoras/fallos, borradores separados, ausencia de metadatos educativos, un único envío para varias aportaciones, rechazo de duplicados en el lote, fallo/reintento con el mismo contenido y reinicio de sesión. Se mantienen las pruebas históricas de demo sin correo, inactividad, cierre, permisos y fichas.

Las pruebas interceptan el transporte; no envían correos a Formspree. La entrega real en Outlook no forma parte de esta verificación local. El botón «Cerrar sesión» ofrece envío; no se promete entrega al cerrar la pestaña ni recuperación tras apagar el equipo.

## Resultado comprobado

- 262 pruebas JavaScript correctas (test-results/feedback-suite.log).
- Cuatro descargas locales reconstruidas y verificadas con verify-release.mjs.
- Navegador: escritorio y móvil de 390 px, propuesta sin voto, voto sin comentario, cambio a lista y ficha individual, opinión sobre la estrella, Escape y cierre de demo. Sin errores de consola ni desbordamiento horizontal del formulario.
- Capturas: test-results/relaunch/feedback-escritorio.png y feedback-movil.png.
- Sin publicación ni envíos reales.
