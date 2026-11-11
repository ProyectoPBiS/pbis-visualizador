> Aclaración posterior: el usuario se refería a veinte perfiles profesionales. Este documento se conserva solo como prueba funcional de aulas. La revisión solicitada está en AUDITORIA_20_PERFILES_20261111.md.

# Auditoría local de veinte aulas · PBiS 0.13.0

Fecha: 11/11/2026. Solo datos simulados. No publicado.

## Alcance

«Veinte grupos» se ha interpretado como veinte aulas y sus cuentas, no como veinte revisores humanos. Se han generado accesos temporales para veinte aulas de un centro ficticio, recorrido de forma secuencial cada autorización y contrastado cada resultado antes de pasar al siguiente. Las contraseñas de esta prueba solo han existido en memoria.

En el navegador se ha visitado cada una de las veinte aulas en modo demo: resumen, lista, red de comunidades y una ficha individual ampliada, a 320 px de ancho. La comprobación criptográfica por cuenta se ha ejecutado aparte sobre los módulos reales, no mediante veinte inicios de sesión manuales.

## Criterio de lectura

1. Cada pantalla responde a una tarea: conocer el centro, revisar el aula, localizar un estudiante o explorar relaciones.
2. Primero se muestra el dato y su contexto mínimo. Las explicaciones extensas quedan desplegables.
3. «Recibidas» y «declaradas» indican direcciones diferentes. «No respondió» nunca significa cero.
4. El color acompaña al valor escrito. Una mención se distingue de dos o más; el color no es una clasificación de riesgo.
5. La pantalla móvil debe poder leerse sin desplazar toda la página lateralmente.

## Hallazgos y cambios

| Antes | Ahora | Comprobación |
| --- | --- | --- |
| Menú con iconografía incompleta y navegación por teclado que podía alcanzar una pestaña oculta | Iconos en todas las vistas; teclado limitado a pestañas visibles | Recorrido de teclado y navegador |
| No se mostraba cuántas personas menciona el estudiante sobre posible acoso | «Menciones de acoso declaradas», sin autoselección; ordenable | Importador bruto, ejemplo sintético, permisos y ordenación |
| Una mención recibida tenía el mismo tratamiento que varias | Ámbar para 1, rojo para 2 o más y neutro para 0 | Clases de color y comprobación visual; leyenda explícita |
| La tabla necesitaba desplazamiento lateral en móvil | Tarjetas por estudiante y selector de ordenación | Veinte aulas a 320 px, sin desbordamiento de página |
| La leyenda de relaciones podía heredar el coral de la marca | Líneas y flechas verdes para buenas relaciones y rojas para malas | Estilos calculados del SVG y de la leyenda; se conserva el grosor |
| La red individual contaba una lista vacía como respuesta pese a indicar «No respondió» | Se respeta el estado de respuesta; se mantienen las relaciones recibidas | Regresión específica y caso Valeria: 755 de 756, no 756 de 756 |
| En ese caso se indicaban cero menciones declaradas | Se indica «Sin respuesta propia» | Comprobación del modelo y de la ficha real |
| La demo repetía la identidad y las explicaciones eran largas | Una indicación clara de datos simulados y ayudas resumidas | Revisión de texto y móvil |

## Aula por aula

Cada fila ha superado: descifrado con su cuenta, rechazo de contraseña incorrecta, aislamiento de registros/vínculos, marca de cuenta, permiso PDF, conservación de indicadores, denominadores y ordenación. Las columnas de señales son recuentos de estudiantes, no porcentajes.

| Orden | Cuenta del aula | Estudiantes | Respuestas | Declaran acoso | Reciben ≥2 menciones | Resultado |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | 4PRIMA | 28 | 28 | 1 | 2 | Correcto |
| 2 | 4PRIMB | 28 | 28 | 3 | 5 | Correcto |
| 3 | 5PRIMA | 28 | 28 | 2 | 3 | Correcto |
| 4 | 5PRIMB | 28 | 28 | 1 | 2 | Correcto |
| 5 | 6PRIMA | 28 | 28 | 1 | 1 | Correcto |
| 6 | 6PRIMB | 28 | 28 | 2 | 3 | Correcto |
| 7 | 1ESOA | 28 | 27 | 3 | 5 | Correcto |
| 8 | 1ESOB | 28 | 28 | 1 | 1 | Correcto |
| 9 | 2ESOA | 28 | 28 | 1 | 2 | Correcto |
| 10 | 2ESOB | 28 | 28 | 3 | 5 | Correcto |
| 11 | 3ESOA | 28 | 28 | 2 | 3 | Correcto |
| 12 | 3ESOB | 28 | 28 | 1 | 2 | Correcto |
| 13 | 4ESOA | 28 | 28 | 1 | 1 | Correcto |
| 14 | 4ESOB | 28 | 28 | 2 | 3 | Correcto |
| 15 | 1BACHA | 28 | 28 | 3 | 5 | Correcto |
| 16 | 1BACHB | 28 | 28 | 1 | 1 | Correcto |
| 17 | 2BACHA | 28 | 28 | 1 | 2 | Correcto |
| 18 | 2BACHB | 28 | 28 | 3 | 5 | Correcto |
| 19 | 4PRIMC | 28 | 28 | 1 | 1 | Correcto |
| 20 | 5PRIMC | 28 | 28 | 3 | 5 | Correcto |

## Coherencia y conservación

- 1.512 registros, 54 aulas y dos centros sintéticos: los resultados analíticos validados y los agregados coinciden exactamente con el módulo anterior congelado. No se cambia la normalización ni la centralidad contrastada con R.
- El nuevo recuento declarado es un campo adicional. En archivos antiguos que no lo incluyan aparece «Datos insuficientes»; no se reconstruye ni se inventa.
- Se mantiene la regla de excluir fuentes con **más de 15** nominaciones ajenas; exactamente 15 se admite. Los resúmenes siguen requiriendo dos o más menciones recibidas. El recuento declarado original no se reduce por esa regla.
- Doce de los dieciséis componentes conservados siguen siendo idénticos. Cuatro contienen ampliaciones acotadas: lectura/validación del nuevo campo, preservación en el compartimento cifrado, incorporación a la demo y corrección de cobertura de la red individual. La referencia de R no se modifica.
- Los recuentos de aula enlazan con sus listas; las relaciones siguen admitiendo vínculos entre aulas donde los permisos lo permiten.

## Evidencias

- `test-results/relaunch/audit-twenty-classrooms.json`: veinte cuentas, en secuencia; sin contraseñas.
- `test-results/relaunch/audit-twenty-browser.json`: resumen, lista y red de veinte aulas en navegador móvil.
- `test-results/relaunch/audit-individual-browser.json`: veinte fichas individuales, ampliación y red.
- `test-results/relaunch/analytics-baseline.json`: comparación exacta del motor conservado.
- `revision-mobile-tests.log`: **230 pruebas JavaScript aprobadas**, cero fallos.
- `tools/verify-release.mjs`: cuatro descargas locales verificadas.
- Capturas: `test-results/relaunch/lista-movil-auditada.png`, `lista-escritorio-auditada.png` y `red-colores-auditada.png`.
- Revisión adicional de escritorio a 1360 px y móvil a 390 px; consola sin errores observados.

Repetición de la auditoría de cuentas: `node tools/audit-twenty-classrooms.mjs`. Usa exclusivamente la demo compilada y genera su registro local sin acceso a Internet.

## Límites

No se han usado datos reales ni se han enviado correos. No se han probado veinte dispositivos físicos o veinte docentes reales. La claridad de los textos se ha revisado editorialmente; su comprensión por docentes requiere una sesión de observación. La guía completa de demostración sigue pendiente del reajuste acordado; la demo actual abre los datos directamente.

Siguiente comprobación útil: pedir a dos docentes que identifiquen, sin ayuda, la diferencia entre declarar haber sufrido acoso, recibir menciones y declarar menciones sobre otras personas. Observar dónde dudan antes de añadir más explicaciones.
