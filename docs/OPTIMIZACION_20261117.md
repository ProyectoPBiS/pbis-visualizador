# Optimización local de PBiS — 17 de noviembre de 2026

Base: repositorio `ProyectoPBiS/pbis-visualizador`, rama `main`, commit
`cfaf30cfe3841aa047348bf6167047eb29ad91ee`, versión 0.13.0.
Se descargó en una carpeta nueva, conservando las copias anteriores. No se publicó.

## Qué cambia

1. **Carga inicial del visualizador.** La edición web obtiene el lector Excel y el
   motor de cifrado PDF al utilizarlos por primera vez. Son exactamente los mismos
   componentes, con su contenido comprobado mediante SHA-256 antes de crear el worker.
   El código se reutiliza durante la sesión; las peticiones simultáneas no lo duplican.
   Las descargas de escritorio siguen incluyendo todo para funcionar sin conexión.
2. **Animaciones de portada.** El fondo animado y la simulación del ejemplo de red
   se detienen cuando no están visibles o la pestaña está oculta. Al volver continúan.
   Se evitan reconstrucciones de la red por eventos de tamaño que no cambian sus dimensiones.
3. **Errores recuperables.** Si falla la descarga de un componente, se informa y se
   permite reintentar. Una descarga con contenido alterado se rechaza. Cancelar un PDF
   mientras se carga el componente no inicia el cifrado después de cerrar el diálogo.

No se han cambiado el diseño, CSS, textos existentes, cálculos, normalización,
datos de demostración, cuentas, permisos, contraseñas, formatos de proyecto ni
contenido de los PDF. No se añadieron dependencias ni se actualizaron sus versiones.
No se incorporan datos de centros ni conexiones privadas. Las peticiones nuevas
son GET de código estático del mismo sitio, sin archivos ni datos de estudiantes.
No se añade almacenamiento en localStorage, sessionStorage o IndexedDB.

## Mediciones locales

Microsoft Edge en Windows, viewport 1360 × 960, perfiles nuevos, CPU limitada
artificialmente a 4× mediante Playwright/CDP. Tres repeticiones de referencia y
cinco de la versión final; peticiones externas bloqueadas. No es una medición
de la velocidad real de Internet ni una garantía para todos los equipos.

| Medida | Antes | Ahora |
| --- | ---: | ---: |
| HTML inicial del visualizador, sin compresión HTTP | 3.751.948 bytes | 948.777 bytes |
| Mediana hasta DOMContentLoaded | 596,6 ms | 467,1 ms |
| Dibujos del fondo por segundo fuera de pantalla | 60 | 0 |
| Dibujos del fondo por segundo visible | 61 | 61 |

La carga inicial disminuye un **74,7 %**. El tiempo medido hasta DOMContentLoaded
disminuye un 21,7 % en esta prueba. No se afirma que todos los cambios entre fichas
sean más rápidos: las mediciones de navegación fluctúan y ese motor no se modificó.
La demo conserva su JSON de 4,47 MB: no se han recortado sus estudiantes ni relaciones.
El tamaño de las descargas sin conexión se mantiene prácticamente igual porque
conservan todas las herramientas incorporadas.

En la edición web, la primera lectura de Excel y el primer PDF protegido necesitan
cargar sus componentes. Si se necesita trabajar sin Internet desde el principio,
se debe usar la descarga completa, igual que en la distribución anterior.

## Validación

- 298 pruebas de JavaScript y 15 de Python superadas.
- Recorridos de navegador: los 12 perfiles de evaluación, carga de Excel, demo,
  fichas, listas, redes, aportaciones y reintentos simulados, proyectos protegidos,
  administración y edición de permisos, portada, descargas y uso mediante `file://`.
- PDF cifrado: DNI, reintento tras fallo, cancelación, ausencia de descarga sin
  proteger y funcionamiento sin conexión. Se corrigió una referencia obsoleta
  del test a un control `pdf-network` que la versión descargada ya no contiene;
  no se modificó la interfaz para recuperar ese control.
- Nueva prueba de navegador: los workers no se solicitan al entrar, un lector
  manipulado se rechaza por integridad, un fallo HTTP no descarga un PDF abierto,
  el reintento funciona y el código ya cargado se reutiliza.
- No hay peticiones reales a Formspree ni a Google durante las pruebas.
- Comparación de los cinco bloques: textos idénticos antes y después.
  Las capturas de centro, aula, lista y estudiante son idénticas píxel a píxel en
  escritorio y móvil. La red mantiene el mismo contenido y geometría; en la
  captura de escritorio variaron ocho píxeles de rasterizado de texto.
- Integridad comprobada de las cuatro descargas, componentes web y manifiestos.
- Fuentes del motor analítico, validación de datos, permisos, redes, datos de demo
  y hojas de estilo idénticas a la revisión original.

## Archivos principales

- `src/lazy-resources.js`: carga compartida y verificada del código de workers.
- `src/app.js`: espera al lector antes de crear el worker; comprueba que la carga
  siga perteneciendo a la sesión actual.
- `src/pdf-crypto.js`: carga diferida y cancelación antes del cifrado.
- `site-src/site.js`: pausa y reanudación de animaciones.
- `tools/build.mjs`, `tools/worker-assets.mjs`, `tools/verify-release.mjs` y
  `tools/package_files.py`: generación, integridad y empaquetado de recursos.
- Pruebas añadidas: `tests/lazy-resources.test.cjs`,
  `tests/e2e/lazy-resources.mjs`, `tests/e2e/performance.py`.

Los resultados y capturas locales están en `test-results/performance/`.
La copia completa contiene las fuentes, las pruebas y las distribuciones
reconstruidas, sin `node_modules`, resultados temporales ni archivos privados.

## Reproducir

```text
npm ci --ignore-scripts
node tools/build.mjs
node tools/run-tests.mjs
python -m unittest discover -s tests -p "test_*.py" -v
node tests/e2e/smoke.mjs
node tests/e2e/landing.mjs
node tests/e2e/protected.mjs
node tests/e2e/pdf-password.mjs
node tests/e2e/lazy-resources.mjs
node tools/verify-release.mjs
```

Las pruebas de navegador usan Edge en Windows; en otro entorno puede indicarse
`PBIS_BROWSER_PATH`. El benchmark Python requiere Playwright y un servidor local
de `site/`, y admite `--url`, `--label` y `--runs`.

Para una futura publicación hay que desplegar toda la carpeta `site/`, incluidos
`assets/workers/` y `worker-assets.json`, no solo el HTML. Las descargas están en
`site/downloads/`; para abrir sin servidor se utiliza `release/index.html`.
