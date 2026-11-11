# PBiS · Visualizador 0.13.0

[Visitar PBiS](https://proyectopbis.github.io/pbis-visualizador/) · [Abrir la demo](https://proyectopbis.github.io/pbis-visualizador/DEMO.html#demo)

Aplicación de consulta para el equipo de orientación y docentes. Muestra fichas de centro, aula y estudiante a partir de un Excel compatible o un proyecto PBIS protegido. Los archivos se procesan en el navegador; también se distribuye una copia para consultar sin conexión.

## Qué incluye

- Portada del programa y acceso con cuenta. Demo directa con dos centros, 54 aulas y 1.512 estudiantes inventados.
- Resúmenes narrativos, recuentos que abren sus listas y fichas individuales con respuestas disponibles.
- Red del aula por comunidades o en círculo: relaciones recíprocas del mismo signo. Red individual dirigida dentro de «Ver más información».
- Proyectos cifrados con permisos por aula. Orientación genera un ZIP con el `.pbis` y un Word de accesos docentes; su propia contraseña se conserva y no aparece en ese documento.
- PDF de una ficha, sujeto al permiso de la cuenta, con marca de agua y contraseña DNI.
- Opiniones voluntarias sobre la aplicación, reunidas en un envío al cerrar sesión. La demo no envía opiniones.

Se mantienen el motor analítico, la normalización y la referencia de centralidad contrastada con R. El reparto visual de bullying y sus límites están documentados en [Metodología](docs/METODOLOGIA.md).

## Uso y descargas

Entra en **Tu área privada**. Las descargas para Windows, macOS y Linux están bajo **¿Quieres trabajar sin conexión?**. Extrae el ZIP y abre `index.html` en un navegador actual. No requiere R ni Docker.

Los Excel y las consultas no se guardan de forma persistente en el navegador. El formulario de contacto y el envío voluntario de opiniones utilizan Formspree con conexión. El registro opcional de accesos requiere configurar un receptor privado de Google Sheets; esta publicación no incluye esa conexión ni credenciales de centros. Consulta [Privacidad](docs/PRIVACIDAD.md) y [Proyectos protegidos](docs/PROYECTOS_PROTEGIDOS.md).

## Desarrollo y comprobación

Requiere Node.js 24 y Python 3 para las pruebas de empaquetado.

```sh
npm ci --ignore-scripts
npm run build
npm test
python -m unittest discover -s tests -p 'test_*.py' -v
npm run verify:release
npm start
```

Las pruebas de navegador requieren Playwright/Chromium. GitHub Actions ejecuta los recorridos de demo, acceso, proyectos protegidos, descargas, PDF, condiciones y registro simulado antes de publicar únicamente `site/`.

## Estructura

- `src/`: interfaz, importación, cálculos, cifrado y PDF.
- `site-src/`: portada y recursos de marca.
- `data/`: modelos y ejemplos sintéticos.
- `tools/`: construcción y empaquetado.
- `tests/`: regresiones y recorridos con datos inventados.
- `docs/`: guía, metodología, condiciones e historial de revisiones.
- `audit-service/`: receptor opcional de Google Sheets, sin configuración privada.
- `feedback-service/`: receptor histórico alternativo; no se ejecuta ni despliega con GitHub Pages.

`site/`, `release/`, resultados de pruebas y herramientas de dirección se generan localmente y no forman parte del código publicado. Los ZIP públicos se construyen a partir de las mismas fuentes.

La comprobación automatizada del navegador no sustituye a una prueba física en cada sistema. Los alcances y límites de las verificaciones constan en [COMPROBACIONES.md](COMPROBACIONES.md). Los documentos con fechas anteriores son históricos.

Equipo del proyecto PBIS.
