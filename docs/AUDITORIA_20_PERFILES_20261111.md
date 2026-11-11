> Revisión histórica de una fase del 11/11/2026. El estado posterior, incluida la ficha de seis tarjetas y la nueva portada, está en REVISION_PENDIENTES_20261111.md.

# Auditoría de PBiS desde veinte perfiles profesionales

11 de noviembre de 2026 · Revisión local 0.13.0 · No publicada.

## Qué significa esta revisión

Esta es una auditoría realizada por el asistente aplicando veinte perspectivas profesionales, una a una, en el orden documentado abajo. No son veinte personas reales, entrevistas, dictámenes colegiados ni revisores externos. La auditoría anterior de veinte aulas se conserva como evidencia funcional; responde a otra pregunta y no sustituye este informe.

Criterio común: menos pasos y menos repetición, con datos interpretables. Se distingue lo observado en código/pantalla, la valoración editorial y las propuestas pendientes. Ninguna perspectiva recibe una puntuación de aprobación inventada.

## Resultado

El producto ya tiene un recorrido comprensible de centro a aula y estudiante, separación entre fuentes, demostración directa, indicadores conservados, redes dirigidas, permisos por compartimentos y PDF protegido. No necesita veinte funciones nuevas.

La principal mejora era aclarar el ámbito visible y facilitar localizar estudiantes. Se han corregido cinco aspectos: búsqueda en listas; aula visible en resultados del centro; filtros coherentes con ese ámbito; ayuda más breve y accesible; documentación coherente con la versión actual. Los ajustes de tamaño de pulsación y la portada complementan esas correcciones. La captura de portada aún mostraba la pantalla retirada de valoración docente: se ha reemplazado por una captura real actual con datos simulados.

## Revisión secuencial

### 01. Tutoría de Primaria

- **Necesidad:** Entender la primera pantalla sin formación técnica.
- **Observado:** El resumen individual empieza por acoso, bienestar y relaciones; el resto es desplegable. La ayuda anterior dedicaba pasos a entrar en una aplicación ya abierta.
- **Evidencia:** `src/app.html; src/app.js: studentReport`.
- **Valoración y decisión:** Aplicado: ayuda de tres tareas (revisar, localizar, contrastar). Se conservan las preguntas y respuestas del resumen.
- **Estado:** Aplicado.

### 02. Docencia de ESO

- **Necesidad:** Encontrar rápidamente a una persona en una lista.
- **Observado:** Existía búsqueda en la ficha individual, pero no en la lista. En móvil podía requerir recorrer muchas tarjetas.
- **Evidencia:** `src/app.js: rosterReport / renderFilters`.
- **Valoración y decisión:** Aplicado: búsqueda por nombre o código, sin tildes obligatorias, con borrado y mensaje sin coincidencias. Solo busca dentro de la lista autorizada.
- **Estado:** Aplicado.

### 03. Docencia de Bachillerato

- **Necesidad:** Leer los resultados de la prueba sin confundir escalas.
- **Observado:** El test muestra 0–3 aciertos; bienestar muestra 0–10. La ficha añade la media del aula y las respuestas válidas.
- **Evidencia:** `src/app.js: studentReport / overviewReport`.
- **Valoración y decisión:** Conservar las escalas visibles. No convertir tres aciertos en una categoría de capacidad ni modificar el nombre elegido por el usuario sin una decisión metodológica.
- **Estado:** Conservar.

### 04. Orientación educativa

- **Necesidad:** Identificar el aula cuando se consulta todo el centro.
- **Observado:** Los listados de un recuento del centro mostraban nombres y códigos, pero no el aula de cada estudiante.
- **Evidencia:** `src/app.js: rosterReport`.
- **Valoración y decisión:** Aplicado: curso y aula debajo del nombre solo en las listas del centro. En las de aula se evita repetir ese contexto.
- **Estado:** Aplicado.

### 05. Dirección de centro

- **Necesidad:** Saber qué información abarca el resumen.
- **Observado:** El resumen es una fotografía del archivo: fecha, participación, recuentos y promedios. No registra actuaciones ni evolución longitudinal.
- **Evidencia:** `src/app.js: consultationContext; site-src/index.html`.
- **Valoración y decisión:** Conservar la presentación de fotografía de datos. No prometer seguimiento o impacto educativo que no se registra.
- **Estado:** Conservar.

### 06. Coordinación de bienestar y protección

- **Necesidad:** Distinguir fuentes antes de interpretar una señal.
- **Observado:** La declaración propia y las menciones recibidas tienen recuentos separados y denominadores propios. Se advierte que no se suman.
- **Evidencia:** `src/core.js: aggregate / aggregateCenter; tests/consultation-ui.test.cjs`.
- **Valoración y decisión:** Conservar las fuentes y su contexto. Las señales no se convierten en decisiones automáticas. No tocar umbrales durante una revisión de diseño.
- **Estado:** Conservar.

### 07. Coordinación de convivencia

- **Necesidad:** Leer relaciones sin convertirlas en etiquetas personales.
- **Observado:** La red conserva flechas dirigidas e intensidades; el color de nodos representa comunidades y el de líneas representa relaciones.
- **Evidencia:** `src/class-network.js; src/student-network.js; src/relaunch.css`.
- **Valoración y decisión:** Conservar la leyenda y el texto que distingue los colores de nodos y líneas. No llamar a una comunidad grupo conflictivo ni asignar ese significado.
- **Estado:** Conservar.

### 08. Especialista en inclusión educativa

- **Necesidad:** No confundir ausencia de participación con una respuesta desfavorable.
- **Observado:** La lista distingue No respondió, Datos insuficientes y valores cero. La no respuesta se muestra en tono pastel neutro.
- **Evidencia:** `src/app.js: reviewCell; tests/non-participation.test.cjs; tests/student-network.test.cjs`.
- **Valoración y decisión:** Conservar esa distinción. La ausencia no permite inferir un motivo; no inventarlo ni etiquetar al estudiante.
- **Estado:** Conservar.

### 09. Psicometría

- **Necesidad:** Evitar inferencias de capacidad o diagnósticos a partir de un total.
- **Observado:** El CRT se presenta como aciertos 0–3 y la ficha indica que no diagnostica impulsividad. No hay una categoría de capacidad calculada.
- **Evidencia:** `src/app.js: studentReport; docs/METODOLOGIA.md`.
- **Valoración y decisión:** Pendiente de decisión metodológica: revisar con especialistas si Test de impulsividad es la denominación que se quiere mantener. No se cambia unilateralmente ni se inventan puntos de corte.
- **Estado:** Pendiente.

### 10. Estadística aplicada

- **Necesidad:** Conservar denominadores y distinguir filtrar de recalcular.
- **Observado:** Los resúmenes usan registros válidos; la búsqueda nueva solo oculta filas y no recalcula datos ni normaliza sobre las coincidencias.
- **Evidencia:** `src/core.js; src/app.js: filterRosterList; test-results/relaunch/analytics-baseline.json`.
- **Valoración y decisión:** Conservar cálculos y normalización. Comprobación adicional: el contador de búsqueda dice cuántas coincidencias hay dentro de la lista, sin sustituir el total del informe.
- **Estado:** Conservar.

### 11. Análisis de redes

- **Necesidad:** Mantener dirección, ámbito y definición de las medidas.
- **Observado:** Se mantiene la centralidad contrastada con la referencia de R y las comunidades existentes. Los permisos limitan identidades visibles, no recalculan indicadores sobre el subconjunto.
- **Evidencia:** `tests/fixtures/network-reference-R.json; src/protected-project.js; src/class-network.js`.
- **Valoración y decisión:** Conservar motor y comunidades. No aplicar otra normalización ni redefinir popularidad durante esta auditoría. Redes densas siguen necesitando ampliación.
- **Estado:** Conservar.

### 12. Investigación de experiencia de uso

- **Necesidad:** Que los controles indiquen el ámbito real y no se pierda el contexto.
- **Observado:** Las listas del centro conservaban desplegables de curso y aula que no limitaban sus filas. Era una ambigüedad real.
- **Evidencia:** `src/app.js: renderFilters / resultClick`.
- **Valoración y decisión:** Aplicado: en esas listas solo se muestra Centro. Cambiarlo conserva el tipo de resultado. Volver de una ficha conserva la búsqueda; cambiar de ámbito la limpia.
- **Estado:** Aplicado.

### 13. Diseño de interfaz

- **Necesidad:** Reconocer acciones sin añadir ruido.
- **Observado:** El menú ya tiene iconos; los colores semánticos están separados de la paleta de marca. Algunos nombres destacados eran objetivos de pulsación pequeños.
- **Evidencia:** `src/relaunch.css: overview-ranking / roster-search-bar`.
- **Valoración y decisión:** Aplicado: área de pulsación de nombres destacados de al menos 44 px de alto; búsqueda discreta y adaptable. Se conserva el resto de la identidad.
- **Estado:** Aplicado.

### 14. Redacción de producto

- **Necesidad:** Una función, una explicación concreta.
- **Observado:** La portada repetía la misma explicación de recuentos en dos tarjetas. Parte de la documentación describía una demo con carga manual y valoraciones que ya no están en la interfaz.
- **Evidencia:** `site-src/index.html; docs/PRIVACIDAD.md; docs/CONDICIONES_USO.md`.
- **Valoración y decisión:** Aplicado: separar consulta del aula y comprensión de la ficha. Actualizar solo las descripciones funcionales de privacidad y comunicaciones; no reescribir la atribución legal de responsabilidades.
- **Estado:** Aplicado.

### 15. Accesibilidad

- **Necesidad:** Usar los recorridos con teclado y ayudas identificables.
- **Observado:** La ayuda no tenía nombre de diálogo explícito. Los recuentos tienen etiquetas; los colores se acompañan de números y texto.
- **Evidencia:** `src/app.html: help; src/relaunch.css; src/app.js: bindRosterSort`.
- **Valoración y decisión:** Aplicado: diálogo con nombre accesible, ayudas desplegables con área cómoda y estado de búsqueda anunciado. Comprobados Escape y retorno de foco. No equivale a una certificación de accesibilidad.
- **Estado:** Aplicado.

### 16. Diseño para móviles

- **Necesidad:** Leer sin desplazar lateralmente toda la página.
- **Observado:** La lista ya utiliza tarjetas en móvil. La búsqueda y el contexto de aula podían añadir anchura o perderse al volver.
- **Evidencia:** `src/relaunch.css; test-results/relaunch/lista-movil-auditada.png`.
- **Valoración y decisión:** Comprobar los nuevos recorridos a 320 y 390 px. Mantener tarjetas, controles de ordenación y detalle desplegable; no añadir otra vista paralela.
- **Estado:** Verificado.

### 17. Ciberseguridad y privacidad de producto

- **Necesidad:** Que las promesas correspondan con las protecciones implementadas.
- **Observado:** Los proyectos protegidos separan compartimentos; las cuentas compartidas de aula no acreditan una identidad física. La documentación mezclaba las marcas y flujos antiguos con los actuales.
- **Evidencia:** `src/protected-project.js; src/access-audit.js; src/project-accounts.js; docs/PRIVACIDAD.md`.
- **Valoración y decisión:** Aplicado: explicar cuenta compartida y registro opcional de metadatos. Mantener cifrado, permisos, contraseñas fuera del registro y ausencia de persistencia. No presentar esto como auditoría de intrusión.
- **Estado:** Aplicado.

### 18. Ingeniería de datos

- **Necesidad:** Distinguir incompatibilidad, ausencia y datos válidos.
- **Observado:** Se conserva la importación de Excel y proyectos cifrados. Los campos opcionales ausentes no se convierten en ceros. La nueva búsqueda usa exclusivamente filas ya autorizadas.
- **Evidencia:** `src/raw-wave1.js; src/core.js; src/consultation-ui.js: searchStudents`.
- **Valoración y decisión:** Conservar contratos y errores de validación. Añadida prueba de búsqueda limitada al conjunto recibido, códigos con ceros y nombres ausentes.
- **Estado:** Verificado.

### 19. Control de calidad de software

- **Necesidad:** Cambiar lo mínimo y comprobar regresiones.
- **Observado:** La app tiene pruebas de cálculo, permisos, PDF, cierre, paquetes y envíos heredados. Se conservó el motor anterior de correo sin exponer una pantalla de valoración.
- **Evidencia:** `tests/; tools/verify-release.mjs; revision-professional-tests.log`.
- **Valoración y decisión:** Aplicado: regresiones de búsqueda y contexto de centro; ejecutar batería completa y verificar paquetes. No se envían correos ni datos reales durante QA.
- **Estado:** Verificado.

### 20. Formación y adopción en centros

- **Necesidad:** Explicar el valor en un recorrido corto y reproducible.
- **Observado:** La demo entra directamente con datos simulados; la guía completa quedó pendiente por decisión del usuario. Hay versiones portables.
- **Evidencia:** `src/app.html: help; docs/GUIA.md; release/PBIS.html`.
- **Valoración y decisión:** Aplicado: guía de tres pasos dentro de Ayuda. No añadir de nuevo un recorrido obligatorio. Pendiente: observar a docentes reales y probar físicamente macOS/Safari antes de afirmar esa validación.
- **Estado:** Aplicado / pendiente.

## Cambios realizados y validación

| Antes | Ahora | Comprobación |
| --- | --- | --- |
| Buscar requería abrir la ficha individual | La lista permite buscar por nombre o código | Tildes, varios términos, ceros iniciales, conjunto autorizado, cero coincidencias y borrado |
| Las listas de centro no identificaban el aula de cada persona | Cada fila muestra curso y aula; la lista del aula no los repite | Regresión de todas las filas y navegación a la ficha correcta |
| Una lista de centro mostraba filtros de un aula que no se aplicaban | Solo muestra Centro; al cambiarlo conserva el resultado consultado | Cambio entre los dos centros simulados, retorno desde una ficha |
| La ayuda repetía pasos de acceso | Tres tareas de consulta y dos apartados desplegables | Diálogo etiquetado, teclado, Escape y retorno a Ayuda |
| Las descripciones hablaban de una demo y valoraciones anteriores | Describen la demo directa y la ausencia de valoración docente en esta edición | Revisión de portada, guía, privacidad y sección de comunicaciones de las condiciones |

Los resultados de búsqueda no modifican los indicadores. Los términos, el filtro de acoso, la normalización, la centralidad, el cifrado, el registro opcional y el motor de PDF se conservan.

## Validación realizada

- **232 pruebas JavaScript aprobadas**: `revision-professional-tests.log`.
- **12 pruebas Python de empaquetado aprobadas**: `revision-professional-python.log`. El primer intento encontró restricciones de carpetas temporales de Windows; se repitió con el permiso de ejecución necesario y pasó.
- **Cuatro descargas locales verificadas**, incluyendo portada y nueva captura PNG: `tools/verify-release.mjs`.
- Navegador: búsqueda con y sin tildes, código 00280, cero resultados, borrado, ordenación, regreso desde una ficha, cambio de centro y conservación del ámbito.
- Teclado: diálogo Ayuda con nombre accesible, cierre con Escape y devolución del foco.
- Ventanas de **320, 390 y 1360 px**, sin desbordamiento horizontal de página en los recorridos revisados. Consola sin errores observados.
- Evidencia resumida: `test-results/relaunch/professional-browser-checks.json`.
- Capturas: `test-results/relaunch/revision-profesional-lista-centro.png` y `revision-profesional-movil.png`.

Archivos principales afectados: `src/app.js`, `src/consultation-ui.js`, `src/relaunch.css`, `src/app.html`, `site-src/index.html`, `site-src/assets/ficha-grupo-ejemplo.png`, las descripciones de `docs/GUIA.md`, `docs/PRIVACIDAD.md` y `docs/CONDICIONES_USO.md`, y las rutas de la imagen en las herramientas y pruebas de empaquetado. El original JPG de referencia permanece en `site-src/assets/`; ya no se distribuye.

## Pendientes que no se presentan como terminados

- Comprobar comprensión con docentes reales: pedir que expliquen «declara haber sufrido acoso», «menciones recibidas» y «menciones declaradas», y observar dónde dudan.
- Decidir la denominación metodológica del CRT. No se ha convertido el total en un diagnóstico ni se han añadido categorías de capacidad.
- Pruebas con lector de pantalla y equipos macOS/Safari reales. Las comprobaciones de teclado y tamaños de ventana no sustituyen esas pruebas.
- Revisión independiente de seguridad y responsabilidades para producción, si se decide comercializar. Esta revisión funcional no es esa certificación.
- Seguimiento de actuaciones y evolución permanece fuera de este visualizador. No se añade en una tarea de simplificación.

No se han tocado datos reales, credenciales de centros ni la web pública. Las credenciales o nombres empleados en las pruebas son los simulados del proyecto.
