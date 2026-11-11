# Revisión de acuerdos y pendientes

11 de noviembre de 2026 · PBiS 0.13.0 · Solo local.

Este informe recoge el cierre de la revisión local. La publicación posterior se registra en PUBLICACION_PROYECTOPBIS_20261111.md. Las entradas de REVISION_LOCAL_20261111.md y las auditorías anteriores conservan la historia de cada iteración; sus cifras y capturas no describen necesariamente la demo actual.

## Lista de acuerdos de hoy

| Acuerdo | Estado observado y evidencia |
| --- | --- |
| Conservar la versión anterior | Copia aislada y ZIP de respaldo conservados. Control en ../CONTROL_CAMBIOS.json y ../VERIFICACION_BASES.json. |
| Trabajar en local | Sin publicación ni cambios de credenciales o datos reales. La distribución se prepara en site/ y release/. |
| Conservar acceso, cifrado y registro | Módulos anteriores conservados; contratos ampliados solo para respuestas narrativas opcionales. Pruebas de permisos, registro y veinte cuentas cifradas. |
| Conservar correo | Motor heredado conservado. Formulario de portada conectado al receptor Formspree configurado; éxito, error, timeout, doble clic y reintento probados con receptor simulado. |
| Retirar valoración docente | No aparece en navegación, lista ni consulta. Pruebas de sesión. La implementación histórica permanece para no perderla. |
| Usar la portada recibida, colores y logos | Portada completa integrada y aplicación crema/coral. Acceso destacado arriba a la derecha y botón para conocer la herramienta. |
| Demo directa | Abre los datos simulados sin introducir credenciales ni cargar un archivo. No hay recorrido obligatorio. |
| Descargas en acceso | Windows, Mac y Linux bajo «¿Quieres trabajar sin conexión?». Cuatro paquetes preparados, incluido Universal. |
| Condiciones, privacidad y cookies compartidas | Textos generados desde los documentos del proyecto; diálogos accesibles y documentación incluida en las descargas. No se ha inventado una nueva entidad jurídica. |
| Recuentos pulsables | Las listas corresponden exactamente a sus recuentos. Prueba de las cinco categorías en 54 aulas y 2 centros. |
| Cinco categorías que cubran todo el alumnado | Incluyen los 1.512 registros una sola vez. La falta de autorreporte no altera la respuesta original; solo se interpreta como ausencia de autodeclaración registrada en ese reparto. |
| Conservar filtro y normalización | Más de 15 nominaciones a otras personas excluye ese emisor; exactamente 15 se admite. Resúmenes con dos o más menciones; fichas con el recuento real. Sin cambios de normalización. |
| Relaciones entre aulas e importación anterior | Conservadas dentro del centro. Los nombres se importan del Excel y se abrevian los apellidos. |
| Centralidad | Posición muestra nominaciones reportadas. El cálculo de red contrastado con R permanece en el motor y sus pruebas. |
| Tarjetas de la referencia | Centro, aula y estudiante mantienen sus seis apartados narrativos, recuentos, medias y respuestas. Se retiraron las cuatro tarjetas estructurales que pidió el usuario. |
| Redes | Comunidades por defecto en el aula, círculo alternativo; estrella individual únicamente dentro de «Ver más información». Verdes/rojos y grosor conservan signo e intensidad. |
| Lista y colores | Columna de menciones declaradas; una mención ámbar, dos o más rojo y el mismo rojo para el autorreporte afirmativo. Ausencia de respuesta diferenciada, sin leyenda adicional. |
| Móvil y proporciones | Tarjetas con altura natural, una columna en móvil, búsqueda y ordenación de listas; revisiones previas en 320–1440 px y nueva comprobación móvil. |
| PDF | Motor anterior, una ficha por vez, permisos por cuenta, DNI como contraseña y marca de agua. Evidencia de cifrado y revisión visual en test-results/relaunch/pdf-result.json; no se afirma que se haya repetido toda la prueba visual de PDF en este último cierre. |
| Ejemplo más realista | Dos centros inventados, 54 aulas, 1.512 estudiantes, 86 sin respuesta. Redes e identidades generadas de nuevo desde patrones mezclados; fuentes reales y mapa detallado fuera de la distribución. |
| Veinte perspectivas profesionales | Revisión documentada en AUDITORIA_20_PERFILES_20261111.md. Son perspectivas de revisión aplicadas por el asistente, no veinte personas entrevistadas. |

## Pendientes resueltos en esta revisión

| Antes | Ahora | Verificación |
| --- | --- | --- |
| La ayuda decía «Ver más indicadores» y describía un contenido ya movido | Dice «Ver más información» y explica que abre la red individual | Fuente y recorrido en navegador |
| Los títulos de cuatro enlaces parecían artículos que no existían | Cada título describe su destino real: guía, privacidad, condiciones o metodología | Revisión de destinos y enlaces locales |
| La portada prometía comparar con toda la muestra y limitaba las relaciones al aula | Describe los recuentos disponibles y las relaciones del centro | Contraste con el alcance del visualizador |
| La pestaña mostraba «Prueba de concepto» y el pie repetía «Edición de evaluación» | Título «Consulta de fichas» y versión discreta; la demo sigue indicando datos simulados | Navegador y revisión de metadatos |
| La metodología del paquete local requería Internet | Se incluye metodologia.html junto con la guía y las políticas | Prueba de todos los destinos locales en los cuatro ZIP |
| Las instrucciones nombraban botones anteriores | Coinciden con Tu área privada, demo directa, Excel y proyecto cifrado | Revisión de GUIA.md y EMPIEZA-AQUI.txt generado |
| El empaquetador alternativo perdía documentos/licencias; la copia de fuentes omitía el modelo de demo y las tipografías | Incluye los documentos, las licencias y los recursos necesarios para reconstruir la versión | Pruebas Python, integridad ZIP y validación de enlaces |
| Algunas respuestas simuladas nombraban víctimas y después decían «Nunca» | Las respuestas narrativas son compatibles con las nominaciones y entre sí | 1.135 narrativas corregidas; todos los demás campos y agregados son idénticos. Excel reimportado contra la demo |
| Las pruebas de navegador aún buscaban la portada y cifras de la demo anterior | Escenarios actualizados y comparaciones con los ID del ejemplo vigente | Sintaxis revisada y recorrido interactivo; batería automática de navegador pendiente de ejecutar en su entorno |
| Documentos sucesivos parecían todos el estado actual | Este informe establece el estado vigente y marca los informes anteriores como históricos | COMPROBACIONES.md y CONTROL_CAMBIOS.json actualizados |

## Lo que sigue pendiente

1. **Compromisos del programa.** Confirmar cinco recogidas, plazo de entrega, teléfono y disponibilidad de especialistas. Proceden de la portada facilitada; no se pueden verificar en el código del visualizador. Se conservan a la espera de esa confirmación. Las cifras de alcance ya están aclaradas: el usuario confirmó el 11/11/2026 que los 100 centros y aproximadamente 25.000 estudiantes son metas previstas. La portada muestra «centros educativos previstos» y «estudiantes previstos», sin presentarlos como participación confirmada.
2. **Recorrido guiado completo.** Se dejó para después por decisión del usuario. La demo directa y la ayuda breve sí funcionan.
3. **Prueba real de recepción.** El formulario usa el receptor configurado y sus estados están comprobados con simulaciones. En esta revisión no se ha enviado un correo ni se ha verificado la cuenta privada de Google Sheets.
4. **Compatibilidad física y automatización de navegador.** Falta probar el doble clic sin conexión en equipos Windows/Mac/Linux y ejecutar la batería E2E actualizada. El navegador integrado impide file://; la prueba interactiva se realizó en localhost. Los ZIP sí han pasado validación de contenido y enlaces.
5. **Opcional, no bloqueo:** el bloque Posición de centro crece al desplegar todos los empates. Se conserva completo; dividirlo requeriría decidir otra organización.

## Evidencias del cierre

- revision-pendientes-tests.log: 257 pruebas JavaScript correctas.
- revision-pendientes-python.log: 12 pruebas Python correctas.
- test-results/relaunch/narrative-consistency.json: únicamente cambian las respuestas narrativas simuladas.
- test-results/relaunch/realistic-workbook-roundtrip.json: Excel y demo coinciden, incluidos ID con ceros iniciales.
- test-results/relaunch/cierre-browser.json: revisión interactiva final.
- tools/verify-release.mjs: versiones, hashes, contenido de ZIP y lista de archivos permitidos.

No se ha utilizado esta revisión para certificar seguridad, cumplimiento legal o validez de instrumentos. Tampoco se han añadido funciones de seguimiento, cuestionarios nuevos ni almacenamiento persistente.


## Actualización: opiniones opcionales sobre la app

Se recupera el feedback de la herramienta por apartado (voto, mejora o fallo), sin volver a valorar estudiantes. Se agrupa al cerrar sesión en un solo correo, con revisión y reintento. Ver FEEDBACK_APP_20261111.md y OPINIONES.md. Solo local; la demo no envía. Esta decisión sustituye la retirada completa de valoraciones descrita en auditorías anteriores.


## Ajustes de lectura y opiniones

- Un único Opinar por bloque Centro, Aula, Estudiantes y Red. La lista y las fichas individuales comparten el bloque Estudiantes.
- Recuentos de relaciones, popularidad, centralidad reportada y mediación con X de N en Centro y Aula. N es el total de estudiantes del ámbito, sin cambiar los cálculos.
- Fecha, participación y porcentaje pendiente de relaciones en una sola nota desplegable al final.
- Navegador y pruebas de carga/fichas correctos; descargas locales verificadas. Sin publicación.

## Red de aula simplificada (C25)

Antes se dibujaban todas las menciones dirigidas entre estudiantes del aula. Ahora solo se dibujan parejas recíprocas del mismo signo, una línea por pareja; se omiten las unilaterales y las que mezclan buena y mala relación. El grosor es la media de las dos intensidades. Se aplica a círculo, comunidades, ficha de aula y su PDF. La estrella individual y los cálculos no cambian.

Validación: 263 pruebas JavaScript correctas, incluidas redes aleatorias y casos contradictorios; cuatro descargas locales verificadas. En el navegador, 1.º ESO A conserva 28 estudiantes y muestra 151 parejas en ambos diseños; la estrella de Ana conserva 33 flechas. Evidencias: `test-results/reciprocal-network-suite.log` y `test-results/relaunch/red-reciproca-aula.png`. Sin publicación.
