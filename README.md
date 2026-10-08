# RedVelvet Crafting — D&D5e

Taller de crafting para Foundry VTT **v13 y v14**, con interfaz ES/EN. Cinco oficios, recolección, reciclaje, piezas de construcción, 23 estructuras con tres niveles, cultivos y despiece. Las tiradas determinan la ventana de precisión de los mini-juegos.

## Uso

1. Activa el módulo en un mundo D&D5e. Usa una versión del sistema compatible con tu Foundry: la serie 4.4/5 en v13, la serie 6 en v14.
2. Selecciona un token que controles o asigna tu personaje de usuario.
3. Escribe **`/craft`** en el chat. Como GM puedes seleccionar cualquier token.
4. Para fabricar, lleva la herramienta correspondiente y reúne los materiales mediante Recolección. Elige un oficio y arrastra un objeto físico desde un compendio.
5. Pulsa **Iniciar Creación**. Activa cada icono en su ventana dorada, con clic o con **Tab + Enter/Espacio**. Un éxito entrega automáticamente **una unidad** al inventario.

Macro alternativa:

```js
game.modules.get("redvelvet-crafting-dnd5e").api.open();
// También acepta {actor: game.actors.get("ID_DEL_ACTOR")}.
```

Herrería requiere herramientas de herrero; Alquimia acepta suministros de alquimista o kit de herborista; Joyería requiere herramientas de joyero; Piel/Tela acepta herramientas de curtidor o tejedor. Construir requiere herramientas de carpintero, albañil, herrero o tallador. Equipo Vario está disponible para todos. Los identificadores nativos de herramientas funcionan aunque cambies sus nombres.

El modificador usa el total preparado de la herramienta en la ficha D&D5e, incluidos los bonos numéricos del sistema. Si no existe ese total, usa la característica de la herramienta y su competencia; sin herramienta, usa INT. Conserva las reglas de costes y grados de éxito del módulo: son **homebrew**, no una implementación de las reglas oficiales de fabricación de 2014/2024. Bonos con dados adicionales, ventaja y automatizaciones de otros módulos no se aplican automáticamente a estas tiradas personalizadas.

## Sonidos y accesibilidad

Ajustes del módulo → Sonidos de crafting y Volumen de crafting. Cada usuario controla su volumen; los efectos no se retransmiten al resto de la mesa. Hay 20 sonidos originales: navegación y acierto/fallo de nueve actividades. Los iconos son botones de teclado, el foco es visible y las animaciones respetan `prefers-reduced-motion`.

## Inventario y actividades

Cerrar un mini-juego antes de completar el resultado cancela sus temporizadores y devuelve los materiales reservados. Un fallo normal consume los materiales que establecen sus reglas; cerrar después de completar el resultado no deshace ese resultado. Si Foundry rechaza una escritura, el módulo intenta restaurar el inventario y avisa al GM si no puede completarlo.

Building Assets produce objetos contables, no coloca automáticamente tiles en la escena. Las mejoras de estructuras reemplazan el nivel anterior únicamente al completarse con éxito. Los cultivos guardan el ciclo en el actor y avanzan con el botón de tirada diaria: el GM decide cuándo corresponde cada día. El GM también controla la regla de **un despiece por monstruo**; el módulo no identifica automáticamente cadáveres ni bloquea la misma criatura para toda la mesa.

La protección contra acciones simultáneas opera en cada cliente. Evita que dos usuarios gestionen el inventario del mismo actor a la vez. Esto no introduce un servidor autoritativo de inventario ni protección contra clientes modificados.

## Autenticación

Se integra con **Velvet License Hub** si está activo. Sin el hub mantiene el cliente Patreon individual. Es un **soft gate**: la falta de licencia o un servidor de autenticación fuera de servicio no bloquea ninguna función de crafting. El hub es una dependencia recomendada, no obligatoria. El identificador `redvelvet-crafting-dnd5e` ya figura en el registro del backend de licencias consultado.

## Instalación y desarrollo

El manifiesto estable será `https://github.com/gmredvelvet-rgb/redvelvet-crafting-dnd5e/releases/latest/download/module.json` después de publicar la release. Para la prueba local, conserva esta carpeta en `Data/modules/redvelvet-crafting-dnd5e` y recarga Foundry.

```sh
npm ci
npm test
npm run check
npm run build
```

Node 24 y Python 3 para desarrollo y empaquetado. Regenerar audio requiere además numpy y ffmpeg: `python tools/generate_audio.py`. Foundry no necesita Node, Python, numpy ni las dependencias de desarrollo para ejecutar el módulo.

La carpeta `dist` contiene ZIP, manifiesto y SHA-256. CI valida y empaqueta los cambios. Véanse [comparación y auditoría](docs/AUDIT.md), [prueba en Foundry](docs/RELEASE-QA.md) y [procedencia de recursos](docs/ASSETS.md).

El paquete está preparado como **candidato de release**. Las pruebas automatizadas usan adaptadores de las APIs v13/v14; la validación en dos mundos reales y el login Patreon real se registran por separado en RELEASE-QA.md.
