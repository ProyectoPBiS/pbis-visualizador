# Importación Wave 1: implementación vigente

Revisión local del 15 de noviembre de 2026. La referencia de interpretación es [METODOLOGIA.md](METODOLOGIA.md). Esta copia no se ha publicado.

Las parejas redes1/redes2, beliefs1/beliefs2 y las tres parejas cognitivas se resuelven mediante su contenido: se utiliza la variante contestada, independientemente del día, mes o asignación aleatoria. Si ambas tienen respuesta se notifica una incoherencia; no se mezclan. Los tiempos de entrada por sí solos no acreditan respuesta.

## Entrada y nombres

El lector acepta la hoja `Users` del cuestionario Wave 1 y la hoja `Datos` de indicadores preparados. Se procesa el archivo en un Web Worker del navegador. El importador valida columnas, tipos, códigos y categorías antes de presentar resultados; sustituir el archivo invalida la consulta anterior.

`Nombre` y `Apellidos` son opcionales. Si están presentes, la interfaz muestra el nombre y las iniciales de los apellidos; en su ausencia usa el código. No se pide una llave aparte. Esto no modifica el Excel original.

Las relaciones se resuelven con `Usuario Id` dentro del mismo `Estudio`, que se presenta como «Centro código». `Alumno Id` no es la clave de la red. Curso y aula delimitan las vistas y los permisos de interfaz.

## Dos ámbitos que no deben confundirse

Los recuentos principales de buenas relaciones, malas relaciones, mediación y menciones de acoso incluyen las respuestas válidas de todo el centro, también entre cursos. Las buenas relaciones incluyen buena y muy buena relación; las malas incluyen mala y muy mala. Las autoselecciones se excluyen de relaciones y mediación. En acoso, la autoselección define la declaración propia.

Las medidas estructurales se calculan **dentro del aula**. El módulo `src/raw-wave1.js` construye una matriz dirigida binaria A de buenas relaciones. La centralidad de la ficha utiliza A + Aᵀ: una relación recíproca suma dos, mientras que buena y muy buena relación tienen el mismo peso en A. El eigenvector se normaliza por su máximo (1); la ficha lo presenta multiplicado por 10. No es una normalización mínimo–máximo entre estudiantes del centro.

El campo `centralidad_eigenvector_or` conserva por separado la variante OR. La centralización utiliza SUM; Gini usa las menciones recibidas dentro del aula; las comunidades y la modularidad utilizan Louvain sobre OR, con resolución 1 y semilla 20261010. Los campos técnicos `ambito_centralidad` y `metodo_centralidad` identifican estas definiciones.

Los algoritmos se ejecutan en JavaScript, **no mediante R dentro del navegador**. Sus resultados se comparan con referencias generadas en R/igraph 2.3.3, guardadas en `tests/fixtures/network-reference-R.json`. `tools/reference-networks.R` permite regenerar esas referencias con las versiones indicadas.

## Respuestas ausentes y agregación

Un cero observado no se sustituye por dato ausente ni al contrario. Una lista vacía de acoso se interpreta como «Nadie» cuando las respuestas posteriores confirman que se avanzó por esa pregunta. «Error en relación» deja pendiente esa pregunta; no elimina respuestas válidas de otras preguntas.

Las redes incompletas conservan los vínculos observados e informan de las respuestas pendientes. Una centralidad sin convergencia o sin solución única permanece sin calcular. La ausencia de respuesta propia no impide recibir menciones.

La ficha individual muestra el recuento recibido de nominaciones de bullying. «Señalados por otros» cuenta alumnos con al menos una nominación de otra persona. Se conservan todas las nominaciones, también las emitidas por alguien que señala a 15 o más compañeros; ese caso genera un aviso, no una exclusión. Numeradores y denominadores se recomponen con registros individuales. La comparativa de cero, una o dos o más nominaciones incluye la propia y no establece grados de gravedad.

Bienestar suma las dos preguntas positivas codificadas de 0 a 4 y `4 − soledad`; la suma de 0 a 12 se expresa de 0 a 10 y requiere las tres respuestas. Se conservan las respuestas originales. El Test cognitivo presenta los aciertos de las tres respuestas efectivamente contestadas, de 0 a 3, su desglose y la media del aula con resultados completos.

## Ejemplos y comprobaciones

Los Excel sintéticos preparados están en `data/examples/`. La demo web se construye con `tools/demo-fixture.mjs` a partir de esas entradas y `data/fixtures.json`; no se alimenta de archivos reales de centros. El ejemplo incorporado utiliza Centro 3705 y Centro 3884. El caso guiado «Me sorprende» y el estudiante sin respuestas se comprueban en `tests/demo.test.cjs`.

`tests/raw-wave1.test.cjs` prueba las rutas, categorías, casos incompletos y cálculos. `tests/network-reference.test.cjs` contrasta las medidas con R. `tests/e2e/smoke.mjs` recorre la guía, las cuentas, la carga, las vistas y el envío simulado. Los límites y denominadores completos se documentan en la metodología vigente.
