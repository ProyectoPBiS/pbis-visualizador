# Revisión de usabilidad · 11 de noviembre de 2026

## Cambios

- Acceso móvil más compacto, conservando logo, lema, condiciones y demo. Campos de 16 px en acceso, filtros y formularios.
- Las flechas del teclado recorren las pestañas en su orden visual y ejecutan la misma acción que un clic.
- Los recuentos, nombres y botones de regreso sitúan el foco en el título de destino.
- Las propuestas de mejora sin descripción señalan el campo que hay que completar y conservan el voto al corregirlo.
- Contacto solo vacía el formulario tras recibir confirmación explícita de Formspree. Los errores conservan el mensaje y enfocan el campo o estado, sin quedar detrás de la cabecera.
- Desplazamiento contenido en los diálogos.

## Alcance y validación

Aplicadas web-design-guidelines, webapp-testing y frontend-design. Se conserva la identidad visual. No se modifican los motores de cálculo, normalización, cifrado, cuentas, permisos, redes o PDF. Tampoco se introduce almacenamiento persistente en el navegador.

271 pruebas JavaScript aprobadas. Revisión local en navegador de demo, recuentos, listas, búsqueda, fichas, redes, teclado, opiniones, cierre y apertura de administración, con tamaños de 320, 390 y 1280 px. Contacto probado sin enviar correos reales, con respuestas de servicio simuladas en las pruebas.

La carga manual de archivos en el navegador de la revisión local quedó pendiente por falta de autorización de subida; las pruebas automatizadas de importación y permisos sí se ejecutaron. GitHub Actions comprueba también los recorridos con archivos sintéticos antes de desplegar.

La web y las cuatro descargas se generan desde las mismas fuentes. No se incorporan datos reales, credenciales de centros ni conexiones privadas. Los tutoriales entregados por separado no forman parte de este cambio.
