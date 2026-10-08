# Comparación y auditoría — 1.1.0

Referencia revisada: edición PF2e local, versión 1.8.1. Punto de partida D&D5e: 1.0.0. Se conserva el identificador del módulo y los flags de cultivos existentes.

| Área | PF2e de referencia | D&D5e actualizado |
|---|---|---|
| Oficios | Cinco; habilidad Crafting y rangos PF2e | Cinco; herramienta nativa D&D5e y alternativa de característica/competencia |
| Dificultad | DC de su edición | DC por precio en gp: 13/15/17/20 |
| Recolección | Nueve recursos, conversión de raciones | Mismas actividades; habilidades D&D5e |
| Materiales | Esquema PF2e, bulk/slug | Loot D&D5e; raciones consumibles tipo food; flags de identificación |
| Construcción | Piezas y 23 estructuras de tres niveles | Misma biblioteca de recetas y mejoras |
| Cultivos | Ciclo de cinco tiradas diarias | Ciclo persistente en actor y entrega protegida |
| Despiece | Supervivencia y Monster Scavenger | Misma regla y bonus, supervisión del GM |
| Imágenes | 13 fondos locales y 15 SVG | Copias locales, más un fondo de taller nuevo |
| Audio | Desactivado; rutas externas de respaldo | 20 OGG originales, nueve actividades y navegación |
| Autenticación | Soft gate y hub | Soft gate mantenido, hub recomendado, sin denegación de funciones |

Problemas corregidos: desbloqueo de todos los oficios por cualquier nombre que incluyese “tools”; copia de pilas enteras y entrega repetida; gasto antes de protección contra doble clic; temporizadores activos al cerrar; campos PF2e en nuevos materiales D&D5e; tiradas reemplazadas por Math.random tras un error de chat; posibilidad de fabricar recursos/estructuras como recetas genéricas; reciclaje de tipos no físicos o cantidades vacías; nombres sin escape en varias salidas HTML; rareza veryRare y nombres localizados de herramientas.

Se conservó Dialog de Application V1 mediante su namespace compatible. Foundry v14 aún publica esta API; se resuelve con alternativa global para v13. Esto evita migrar a medias una interfaz extensa con jQuery. [API oficial de Dialog v14](https://foundryvtt.com/api/v14/classes/foundry.appv1.api.Dialog.html), [AudioHelper v14](https://foundryvtt.com/api/v14/classes/foundry.audio.AudioHelper.html). El gate utiliza ApplicationV2/DialogV2 y su adaptación de interpolación v13/v14.

El código D&D5e 6.0.5 instalado confirma `system.tools[id].total`, `system.type.baseItem` y las características por herramienta en `CONFIG.DND5E.tools`. Se mantiene alternativa para los datos antiguos `system.baseItem`, `system.ability` y `system.proficient`.

La fuente del backend de licencias consultada contiene el ID D&D5e en `MODULE_FEATURES`. La comprobación no es una autenticación Patreon real ni certifica el estado de despliegue del servidor.

Validación automatizada: 21 casos de lógica, inventario y aplicación con adaptadores v13/v14; referencias locales y sintaxis de todo el runtime. Hay cobertura de fabricación, conversión, recolección, piezas, mejora de estructuras, ciclo de cultivo, bonus de despiece, restauración de reciclaje y fallo del gate. Las pruebas que fuerzan errores de chat, escritura y servidor de licencia producen avisos esperados en la consola del runner.

Los aspectos que dependen de una sesión real —dos generaciones de Foundry, sockets entre clientes, OAuth Patreon y comportamiento visual del sistema instalado— están en [RELEASE-QA.md](RELEASE-QA.md). No se presenta una simulación como prueba de un mundo real.
