# Publicación en ProyectoPBiS · 11 de noviembre de 2026

Versión 0.13.0. Destino nuevo: ProyectoPBiS/pbis-visualizador. Se conserva la web anterior y no se modifica su repositorio.

## Entrega

Se genera una copia de fuentes mediante tools/prepare-github.mjs. Incluye los nuevos recursos de marca, el modelo de demo y las pruebas. No incorpora outputs, resultados locales, proyectos de centros, documentos de contraseñas ni conexiones privadas. Las únicas hojas de cálculo incluidas son los dos ejemplos sintéticos de data/examples.

Los enlaces actuales apuntan a https://proyectopbis.github.io/pbis-visualizador/. La web y los cuatro ZIP se reconstruyen desde las mismas fuentes. No cambian cálculos, normalización, cifrado ni permisos.

## Comprobación

Las pruebas de navegador se adaptan a las relaciones recíprocas del aula y al desplegable de preguntas frecuentes. La batería JavaScript, Python y la verificación de los paquetes se ejecutan antes de la publicación. GitHub Actions añade los recorridos completos de navegador y solo despliega si pasan.

La comprobación visual nativa de la paginación del Word y las pruebas físicas en Mac siguen pendientes. No se presentan como realizadas.
