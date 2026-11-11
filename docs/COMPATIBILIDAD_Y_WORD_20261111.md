# Accesos docentes en Word y compatibilidad

## Cambios locales

- Administración: «Cada docente accede a su aula. El equipo de orientación puede ver todo el centro».
- El ZIP conserva dos archivos: proyecto .pbis cifrado y Word .docx de accesos. La descarga individual de recuperación también entrega DOCX.
- El Word contiene solo aulas, usuarios docentes, contraseñas docentes y permiso PDF. No contiene la cuenta ni la contraseña de orientación, tampoco en propiedades o archivos internos. Se retira la frase sobre la identificación de cuentas compartidas.
- Orientación conserva su contraseña de entrada al crear un proyecto desde el acceso tradicional. Al renovar un archivo protegido se conserva su autorización cifrada, sin recuperar ni sustituir la contraseña. Las claves docentes sí se renuevan.
- No se cambian la apertura de archivos, el cifrado, los cálculos ni los datos reales. No se publica.

## Compatibilidad comprobada

Se abrieron tres archivos sintéticos archivados, creados el 28 de octubre y el 9 de noviembre de 2026. Sus 59 cuentas (56 de los dos ejemplos por aula y tres del ejemplo con DNI) aceptan sus credenciales originales. Los datos, aulas autorizadas, permiso PDF y marcas coinciden con el lector de la copia anterior. Contraseñas incorrectas y usuarios inexistentes se rechazan. Los hashes de los archivos originales no cambian.

Evidencia: `test-results/relaunch/compatibilidad-pbis-antiguos.json`; comprobación reproducible local: `test-results/legacy-projects-check.cjs`. Solo se utilizan ejemplos sintéticos del respaldo, no credenciales de centros reales.

## Validación de la nueva entrega

265 pruebas JavaScript correctas en `test-results/word-access-suite.log`. Incluyen conservación de una clave de orientación personalizada, rechazo de FRJ508 cuando no es la clave del proyecto, renovación de docentes, permanencia de accesos antiguos, DOCX sin orientación, escape XML, 249 aulas, ZIP binario y permisos PDF.

Un ejemplo de 27 aulas fue abierto por python-docx: una tabla con 28 filas (incluida cabecera), cuatro columnas, una sección A4, XML válido y CRC correcto. El documento usa cabeceras de tabla repetidas y filas que no se parten entre páginas. Las cuatro descargas locales pasan `tools/verify-release.mjs`.

## Límite de esta revisión

La revisión visual del documento en Word no pudo completarse: el renderizador no quedó disponible y la autorización para abrir Word caducó. No se ha probado nativamente en macOS/Pages. La estructura DOCX está validada; no se certifica todavía su paginación visual en esos programas. Los E2E de navegador se han adaptado al nuevo formato, pero en este cierre no se han ejecutado.
