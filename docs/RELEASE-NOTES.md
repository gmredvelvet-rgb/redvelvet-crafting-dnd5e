RedVelvet Crafting — D&D5e 1.1.1 corrige el taller Extendido, que se abría pero no respondía.

- **Botones del taller Extendido:** al abrir con `/craft` solo funcionaba el botón de idioma. Foundry define el inventario del actor como propiedad de solo lectura, y la capa que protege el inventario durante un intento respondía con otro valor; el error detenía la ventana antes de conectar el resto de botones. Ahora todas las categorías, Recolección, Reciclaje, Cultivos, Despiece y las Reglas responden.
- **Idioma:** el botón 🌐 traduce también Construcciones (Building), Cultivos (Farming) y Despiece (Scavenging).
- El taller Core no estaba afectado y no cambia.

**English:** the Extended workshop opened but only the language button worked. Every menu button now responds, and the language toggle also translates Building, Farming and Scavenging. Update from the module manager; no world changes are needed.

Pruebas automatizadas: **42 aprobadas**, con un inventario de solo lectura como el de Foundry, que reproduce el fallo sin la corrección. El fallo se confirmó contra el código fuente de Foundry 14.368; no se ha ejecutado un mundo real de Foundry v13 para esta versión.

**Compatibilidad:** Foundry v13 como mínimo y 14.999 como máximo.

Archivos: `redvelvet-crafting-dnd5e.zip`, `module.json` y `SHA256SUMS.txt`. Manifiesto de instalación: `https://github.com/gmredvelvet-rgb/redvelvet-crafting-dnd5e/releases/latest/download/module.json`.

Uso: selecciona un token y escribe `/craft` (abre el modo elegido en los ajustes); o ejecuta `game.modules.get("redvelvet-crafting-dnd5e").api.open()`.
