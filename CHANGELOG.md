# Changelog

## 1.1.0 — 2026-10-07

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
