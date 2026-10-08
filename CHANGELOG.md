# Changelog

## 1.1.0 — 2026-10-07

- Diseño unificado con PF2e para los talleres Core y Extendido: misma portada, tarjetas ilustradas, iconografía, colores y sonidos.
- Core muestra pasos de fabricación, búsqueda con contador y limpieza, ficha de receta y tres golpes numerados con indicaciones de precisión.
- Navegación protegida durante fabricación y selección de recetas; foco de teclado y movimiento reducido en la presentación compartida.

- Modo Core: taller sencillo y nuevo modo por defecto. El jugador elige un oficio, busca el objeto en los compendios que puede ver (o lo arrastra), paga la mitad de su precio en monedas, tira y juega el mini-juego de tres golpes.
- Ajuste de mundo "Modo de crafteo" para elegir entre Core y Extendido (el taller completo de siempre).
- Core usa la tirada nativa de D&D5e: la herramienta de artesano adecuada si el personaje la tiene, Inteligencia si no. Cancelar la tirada devuelve las monedas.
- Tres aciertos entregan el objeto; dos devuelven la mitad de las monedas, uno un tercio.
- El botín (gemas, bienes comerciales) y los objetos sin precio no se pueden fabricar en Core.
- `/craft` funciona en Foundry v14, que envía el mensaje del chat como HTML; si el taller falla al abrir, se muestra el motivo.
- API: `api.open()` sigue el ajuste; `api.openCore()` y `api.openExtended()` fuerzan un modo.
- Compatibilidad de APIs Foundry v13/v14 con selección segura de Dialog y AudioHelper.
- Fondos e iconos locales reutilizados de la edición PF2e; portada de taller nueva.
- 20 efectos sonoros originales con volumen y activación por usuario.
- Selección de herramientas por receta, identificadores nativos y nombres ES/EN.
- Tiradas nativas D&D5e de herramientas y habilidades, diálogo con característica/ventaja/bono, competencia y pericia del sistema, y natural del d20 conservado.
- Cancelar el diálogo de tirada devuelve materiales y permite reintentar; herramientas incorrectas o agotadas no gastan recursos.
- Una sola ventana por actor, comprobación de propiedad y apertura por API o `/craft`.
- Acciones de inventario protegidas frente a doble clic, restauración al cancelar o fallar y limpieza de temporizadores.
- Fabricación entrega una unidad automáticamente y elimina el identificador del objeto fuente.
- Eliminadas tiradas aleatorias de respaldo: un error al publicar en chat no repite una tirada.
- Recursos y estructuras del módulo no se pueden fabricar mediante la receta genérica; reciclaje limitado a objetos físicos con existencias.
- Botones del mini-juego utilizables con teclado, foco visible y respeto a movimiento reducido.
- Soft gate existente integrado con el hub opcional, con pruebas de fallo de autenticación y registro del módulo confirmado en el backend.
- Pruebas, CI, empaquetado reproducible, checksums y documentación para publicación.
