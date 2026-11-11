# Proyectos PBIS protegidos · 0.12.2

Esta ampliación conserva el visualizador, sus cálculos, su normalización y la práctica guiada. Añade proyectos cifrados y permisos por aula, tanto en la web como en las descargas.

## Abrir el proyecto del centro

1. Abre **PBIS.html** en la web o extrae la descarga y abre **index.html**.
2. Introduce el usuario y la contraseña entregados por orientación.
3. En **Abrir proyecto**, selecciona el archivo **.pbis** que te ha facilitado el centro. Las credenciales se comprueban en ese momento.
4. Si tienes acceso como orientación, **Administrar el proyecto** permite cambiar cuentas y generar una nueva revisión.

Los archivos y credenciales de centros no se distribuyen con la aplicación. La práctica guiada utiliza exclusivamente datos simulados. Para pruebas técnicas, tras construir el proyecto, `node tools/protected-example.mjs` genera un archivo ficticio y sus accesos en `revision-local/`, excluido de la publicación. Las contraseñas distinguen mayúsculas y minúsculas.

## Acceso unificado

La primera pantalla admite cualquier usuario y contraseña no vacíos para llegar a la carga; todavía no concede permisos sobre un archivo. El proyecto cifrado valida las credenciales antes de mostrar datos. Si no permiten abrirlo, se muestra «No tienes permisos para visualizar este archivo…». Pulsa **Cambiar usuario o contraseña** para corregir el acceso y cargarlo de nuevo.

Para un Excel sin cifrar se conservan las cuentas del piloto y sus ámbitos. Un usuario desconocido o una contraseña incorrecta tampoco acceden por esa vía. Las credenciales iniciales se conservan solo en memoria para la apertura; la contraseña se retira al activar el proyecto cifrado. Las cuentas nuevas solicitan el DNI de quien descarga en el diálogo PDF y lo retiran al terminar. Los proyectos antiguos con DNI lo conservan únicamente durante la sesión para proteger sus PDF. No se añade al registro de accesos ni a las valoraciones.

## Crear un proyecto: accesos automáticos

1. Entra con orientación, fuera de la demo, y pulsa **Administrar el proyecto**.
2. Sube un Excel compatible. Selecciona **Users** para Wave 1 o **Datos** para indicadores calculados y elige el centro si hay más de uno.
3. Revisa las aulas detectadas. Todas parten seleccionadas: desmarca aquellas para las que no quieras crear acceso docente. Orientación conserva todos los datos del centro.
4. Marca **Permitir descargar PDF a todas las cuentas** si lo deseas. La misma opción se aplica a docentes y orientación; por defecto está desactivada en un proyecto nuevo.
5. Confirma las aulas y permisos y pulsa **Generar y descargar**.

La descarga única es un ZIP estándar con dos archivos: el proyecto cifrado `.pbis` y un documento Word (.docx) con los usuarios y contraseñas de las aulas. Extrae el ZIP en Windows o macOS. El Word usa un formato estándar compatible con Word para Windows y Mac y con Pages. No incluye la cuenta ni la contraseña de orientación. Si la descarga se interrumpe, puedes repetirla sin generar claves nuevas o descargar ambos archivos por separado.

Los usuarios se derivan de curso y aula: **1ESOA**, **4PRIMB**, **2BACHC**, **3ESOPDCI**. Se conservan las siglas, y se añaden sufijos si dos etiquetas producen el mismo nombre, sin mezclar sus permisos. Se genera una contraseña aleatoria distinta por cuenta docente. No se pide DNI para crear usuarios.

**orientacion** abre todo el centro. Conserva la contraseña con la que se crea el proyecto (FRJ508 en el acceso tradicional del piloto). Al renovar un proyecto protegido se conserva su contraseña de orientación, aunque sea diferente. Esa cuenta no se incluye en el Word. Guarda el Word y entrega a cada docente únicamente su acceso, separado del .pbis. El ZIP contiene las contraseñas en texto: no lo distribuyas completo al profesorado.

La aplicación calcula sobre el centro completo y conserva esos indicadores antes de separar los datos cifrados de cada aula. La marca de agua identifica la cuenta de aula y la sesión. Los PDF autorizados siguen pidiendo el DNI de quien los descarga; ese DNI no se envía a los registros ni se añade al documento.

La plantilla universitaria de matrícula con columnas Var1–Var5 no es una exportación de indicadores ni una encuesta Wave 1. Reconocer siglas como ADE1 o PSI2 para nombrar cuentas no convierte esa plantilla en datos analíticos compatibles.

## Generar una nueva versión

Abre un proyecto como orientación, entra en administración y revisa las aulas y la opción PDF. Puedes sustituir el Excel por otra medición del mismo centro. **Cada generación renueva las contraseñas de las aulas y conserva la de orientación**, y crea un Word con los accesos docentes de esa revisión. El .pbis no conserva contraseñas recuperables; guarda el Word al generar.

Los proyectos antiguos con DNI siguen abriéndose con sus contraseñas y permisos originales. Si los regeneras desde esta pantalla, la nueva revisión utiliza cuentas por aula. **Las copias anteriores no se revocan**: conservan sus antiguos accesos. Distribuye la nueva revisión y su acceso correspondiente.
## Qué ve cada cuenta

- Orientación consulta todo el centro y administra accesos. La cabecera dice **Equipo orientador**. No aparece marca de agua.
- Cada docente descifra únicamente los registros de sus aulas y sus relaciones entre personas autorizadas. Ni cambiar el filtro ni modificar el rol visual aporta las claves de otras aulas.
- Las cuentas por aula muestran su usuario y código corto de sesión en una marca tenue. Los proyectos antiguos con DNI mantienen el DNI parcial, ocultando las posiciones 2, 4, 5 y 7.
- Los indicadores calculados para el centro se conservan. Una red restringida puede mostrar menos vínculos que el recuento recibido: ese recuento sigue incluyendo las respuestas del ámbito original.

Los nombres y apellidos son opcionales; se mantiene la abreviación habitual de apellidos. Excel y proyectos cifrados utilizan el mismo acceso y control de carga. La aplicación reconoce el formato. La demo conserva su práctica guiada.

## Formato y protección

El archivo comienza con **PBIS-PROTECTED/1**. Es diferente del antiguo .pbis, que era un Excel con otra extensión. El formato contiene JSON con bloques cifrados; no es necesario ocultar su estructura.

Se utiliza Web Crypto: AES-256-GCM con etiquetas de 128 bits, IV aleatorios de 96 bits y claves derivadas con PBKDF2-HMAC-SHA-256, 600.000 iteraciones y sales aleatorias de 128 bits. Los identificadores, claves de compartimento y credenciales de escritura se generan con la fuente criptográfica del navegador. Los datos asociados de GCM vinculan cada bloque al proyecto, revisión y finalidad.

Cada contraseña abre una autorización cifrada que contiene la clave de su compartimento. Cuentas con las mismas aulas comparten contenido cifrado, pero tienen claves de acceso independientes. Orientación conserva la configuración necesaria para volver a generar el proyecto, sin contraseñas docentes en texto ni material que permita descifrarlas directamente.

El bloque docente se prepara con una lista cerrada de campos: se excluyen los registros, nombres, códigos y vínculos individuales externos a sus aulas. Un contrato específico valida los resultados sin recalcularlos sobre el subconjunto. La validación original de Excel no se modifica.

Los localizadores de cuentas en el sobre son hashes; no prometen ocultar usuarios previsibles frente a enumeración. La longitud del archivo y el número de compartimentos también son visibles. Las contraseñas con dos animales y dos cifras tienen un espacio reducido: PBKDF2 ralentiza los intentos, pero no las hace resistentes a un ataque prolongado. La contraseña de orientación se conserva; si se crea un proyecto usando la contraseña del piloto, esa misma contraseña lo abre. No existe una contraseña alternativa para proyectos que se crearon con otra clave.

La marca de agua disuade y ayuda a contextualizar una captura; no impide fotografiar, copiar, modificar el navegador ni compartir credenciales. El registro identifica la cuenta utilizada, no la persona física.

## Registro de accesos opcional

El registro lo gestiona la dirección general del proyecto. La pantalla ordinaria
de los centros no ofrece campos de Google Sheets ni descarga de manifiestos.
Al editar un proyecto conserva el receptor que ya tuviese configurado.

La herramienta local de dirección se genera en `direccion-local/PBIS.html` y,
en el kit interno, en `DIRECCION.html`. No entra en la web ni en los ZIP para los
centros. Desde esa copia se configura el receptor y se obtiene el manifiesto.
Consulta `audit-service/README.md`: cada revisión requiere alta en la hoja privada.
Ocultar estos controles no activa un registro nuevo ni da de alta las cuentas.
Esta separación organiza las pantallas; el acceso privado a Sheets sigue
protegido por Google y las credenciales de escritura, no por ocultar un botón.

Antes de registrar proyectos con cuentas por aula, actualiza el receptor privado con esta versión de `audit-service/Code.gs`. Esta entrega local no modifica el receptor de Google ni su despliegue. La versión actual acepta las etiquetas de aula y conserva la compatibilidad con los manifiestos anteriores.

Solo se comunica código de cuenta, proyecto y revisión, centro o centros, nombre del archivo, sesión, tipo de evento y hora del cliente. El receptor añade el usuario de registro (orientacion, usuario de aula o código de cuenta), la etiqueta y el DNI parcial de las cuentas antiguas, y su hora de recepción. No recibe nombres de estudiantes, respuestas, Excel, DNI completos ni contraseñas. El token de escritura viaja por HTTPS y se valida contra su hash registrado.

La apertura se registra después de descifrar y validar. Cada cinco minutos se comunica actividad si la consulta está visible y se ha utilizado recientemente. **Cerrar sesión** intenta confirmar el cierre. La hoja conserva **Sin cierre confirmado** si solo recibió apertura o actividad; no inventa una hora final.

Los fallos se muestran y se reintentan con conexión o durante la consulta. Las colas son solo de memoria. Cerrar sin conexión, interrumpir el navegador o apagar el equipo puede perder eventos. Al cerrar se espera brevemente la confirmación; si no llega, se informa. No hay envíos garantizados desde una aplicación offline.

Los eventos tienen identificadores estables y el receptor evita duplicados al reintentar. Una respuesta HTTP correcta sin confirmación del evento no se considera registro aceptado.

## Valoraciones y cierre

El envío de valoraciones sigue usando el recorrido existente de revisión y Formspree. Para un proyecto protegido, la cuenta enviada es un código **U-…**, nunca el DNI completo. Las opiniones actuales se refieren a la aplicación y a su apartado, sin códigos ni valores de estudiantes. Son distintas del registro de accesos y se vinculan a la cuenta que las envía.

El Word descargado sí contiene las contraseñas de las aulas y permanece en el equipo. No se escriben consultas, contraseñas, valoraciones o colas de accesos en localStorage, sessionStorage ni IndexedDB. Al cerrar se retiran las referencias del estado de la sesión, los diálogos y las marcas. Esto no borra el Excel original, los proyectos descargados, el portapapeles ni garantiza borrado forense de memoria, cachés del sistema o memoria virtual.

## Alcance de la verificación

La revisión de accesos por aula prueba cuentas automáticas, permisos comunes, separación cifrada, renovación de contraseñas y ZIP/DOCX portables con datos sintéticos. Las pruebas nativas en macOS siguen pendientes.

Se prueban Web Crypto real, permisos separados, integridad, cambio de contraseña, conservación de indicadores y el contrato del receptor. En esta revisión, la comprobación visual se realiza en el navegador integrado sobre Windows por HTTP local, con anchos de 320 y 390 píxeles. La apertura mediante doble clic (`file://`) y la prueba nativa en macOS quedan pendientes; no se deducen de la portabilidad del formato.

Los envíos de las pruebas se interceptan: no se mandan correos ni accesos reales. Google Sheets requiere activar el receptor en la cuenta propietaria y verificar una recepción real. El funcionamiento nativo en macOS, Linux, Safari y Firefox queda pendiente de comprobación en esos equipos. Esta revisión no es una auditoría criptográfica independiente ni una certificación.

Referencias de implementación: [Web Crypto: deriveKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey), [Google Apps Script: aplicaciones web](https://developers.google.com/apps-script/guides/web).

Para las cargas directas de Excel de la cuenta compartida orientacion se utiliza
un archivo privado de conexión generado desde la hoja. Dirección general lo
carga con Registro de accesos en su copia local. Consulta audit-service/README.md de la revisión
local para la activación actualizada; no se publica esa conexión.
