> Validación histórica anterior al reajuste. La entrega actual usa DOCX sin orientación y conserva su contraseña; ver `COMPATIBILIDAD_Y_WORD_20261111.md`.

# Accesos automáticos por aula · Revisión local 09/11/2026

## Cambios y evidencia

| Antes | Ahora | Comprobación |
|---|---|---|
| Orientación creaba docentes uno a uno por DNI. | Se propone una cuenta por aula, con selección mediante casillas. | Excel sintético real: 27 aulas por centro; Primaria, ESO y Bachillerato. Pruebas adicionales de PDC, siglas, colisiones y orden estable. |
| Se configuraban contraseñas y permisos individualmente. | Contraseñas aleatorias distintas y un único permiso PDF para todas las cuentas. | Generación, aislamiento por aula, permiso activado/desactivado y renovación verificados mediante Web Crypto. |
| Había que entregar accesos manualmente. | Una descarga ZIP contiene .pbis y TXT; también hay descargas separadas. | Descarga real desde el navegador, ZIP validado con Python zipfile, CRC correcto y exactamente dos archivos. TXT UTF-8 BOM y CRLF. |
| La marca docente dependía del DNI de la cuenta. | Las cuentas nuevas muestran el usuario del aula y sesión; orientación no tiene marca. | Navegador: 1ESOA y 1ESOB muestran solo su aula; orientación abre las 27 aulas y puede administrar. |
| El DNI de la cuenta protegía el PDF. | Una cuenta de aula pide el DNI de quien descarga. | PDF real de cuatro páginas: cifrado AES-256, contraseña incorrecta rechazada, DNI ficticio correcto aceptado; usuario 1ESOA en cada página, sin DNI en el texto. |
| Los manifiestos de registro solo reconocían cuentas con DNI parcial. | El receptor admite etiquetas de aula y conserva las cuentas antiguas. | Contrato del receptor probado con manifiesto sintético. No se ha actualizado el despliegue de Google. |

## Resultados ejecutados

- `node tools/run-tests.mjs`: **219 pruebas, 219 correctas, 0 fallos**. Incluye compatibilidad antigua, errores de credenciales, integridad cifrada, aislamiento, indicadores y validación de registros.
- `node tools/build.mjs` y `node tools/verify-release.mjs`: aplicación reconstruida y cuatro ZIP verificados.
- Navegador integrado sobre Windows, HTTP local: creación desde Excel sintético, descarga ZIP, entrada con 1ESOA/1ESOB/orientacion, reapertura de administración y PDF con DNI.
- Anchuras de 320, 390 y 1280 píxeles: el diálogo no tiene desbordamiento horizontal. En 1280, ancho interior y contenido de 923 píxeles.
- La copia aislada de comprobación sustituye únicamente el texto de las confirmaciones por etiquetas no contractuales de prueba. Mantiene los manejadores, validación, cifrado y descargas. Las condiciones originales permanecen en la entrega.
- Los scripts E2E del repositorio se han adaptado y comprobado sintácticamente. **No se han ejecutado como suite E2E** en esta revisión; las comprobaciones visuales anteriores se realizaron con el navegador integrado.

No se modificaron datos reales, no se enviaron correos o registros reales y no se publicó esta revisión. Los datos del ejemplo y los accesos descargados son sintéticos y se guardan fuera del código publicable. No se añadió almacenamiento persistente del navegador.

## Límites y siguientes comprobaciones

- No se ha realizado una prueba nativa en macOS, Linux, Safari o Firefox. El formato estándar de HTML, ZIP y TXT facilita la compatibilidad, pero no sustituye esas pruebas.
- La apertura con doble clic (`file://`) no se pudo verificar con el navegador integrado; sí se verificó por HTTP local. El paquete mantiene el HTML autónomo y sus recursos incorporados.
- Para usar los nuevos manifiestos en Google Sheets hay que actualizar el receptor privado y dar de alta cada revisión. No hay activación automática en esta entrega.
- Las cuentas por aula son compartidas: la marca y el registro identifican la cuenta, no acreditan la identidad física de una persona. El DNI introducido en el PDF no verifica identidad.
- Cada nueva generación cambia todas las contraseñas, incluida orientación. Las copias anteriores siguen siendo utilizables con sus antiguos accesos.

## Archivos principales

`src/project-accounts.js`, `src/project-admin.js`, `src/protected-project.js`, `src/app.js`, `src/pdf-export.js`, `src/protected-project.css`, `audit-service/Code.gs`, `tools/build.mjs`, `tools/protected-example.mjs` y pruebas asociadas. No se modificaron fórmulas, normalización ni datos de la demo.
