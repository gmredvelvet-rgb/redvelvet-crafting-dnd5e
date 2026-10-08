# RedVelvet Crafting — D&D5e

Taller de crafting para Foundry VTT **v13 y v14**, con interfaz ES/EN. Cinco oficios, recolección, reciclaje, piezas de construcción, 23 estructuras con tres niveles, cultivos y despiece. Las tiradas determinan la ventana de precisión de los mini-juegos.

## Modos: Core y Extendido

El módulo tiene dos talleres y el GM elige cuál se usa en **Configuración → RedVelvet Crafting → Modo de crafteo**:

- **Core (por defecto):** el taller sencillo. El jugador elige un oficio, busca el objeto en los compendios que puede ver (o lo arrastra a la ventana), paga **la mitad de su precio en monedas**, hace la tirada y juega el mini-juego de tres golpes. Tres aciertos entregan el objeto; dos devuelven la mitad de las monedas, uno un tercio y ninguno nada. No usa materiales ni exige herramientas: si el personaje lleva la herramienta de artesano adecuada se tira con ella, y si no, con Inteligencia. El botín (gemas, bienes comerciales) y los objetos sin precio no se pueden fabricar.
- **Extendido:** el taller completo descrito en el resto de este documento, con materiales por oficio, herramientas, recolección, reciclaje, construcciones, cultivos y despiece.

`/craft` y `api.open()` abren el modo elegido. `api.openCore()` y `api.openExtended()` fuerzan uno.

Los dos modos comparten su diseño con la edición PF2e: portada del taller, tarjetas ilustradas, iconos, colores, foco y sonidos. Core incorpora búsqueda con limpieza rápida, contador de recetas, pasos de fabricación y tres golpes numerados con avisos «Ahora», «Tarde», «Acierto» y «Fallo». Cada sistema conserva sus tiradas, habilidades y reglas de inventario. Véase [verificación visual compartida](docs/VISUAL-QA.md).

## Uso (modo Extendido)

1. Activa el módulo en un mundo D&D5e. Usa una versión del sistema compatible con tu Foundry: la serie 4.4/5 en v13, la serie 6 en v14.
2. Selecciona un token que controles o asigna tu personaje de usuario.
3. Escribe **`/craft`** en el chat. Como GM puedes seleccionar cualquier token.
4. Para fabricar, lleva la herramienta correspondiente y reúne los materiales mediante Recolección. Elige un oficio y arrastra un objeto físico desde un compendio.
5. Pulsa **Iniciar Creación** y confirma la tirada de D&D5e. Activa cada icono en su ventana dorada, con clic o con **Tab + Enter/Espacio**. Un éxito entrega automáticamente **una unidad** al inventario.

Macro alternativa:

```js
game.modules.get("redvelvet-crafting-dnd5e").api.open();
// También acepta {actor: game.actors.get("ID_DEL_ACTOR")}.
```

La herramienta depende de la receta. Llevarla permite intentar la fabricación; la competencia y pericia se obtienen de la ficha D&D5e y no se conceden automáticamente por llevarla. Si tienes varias herramientas válidas, el selector permite elegir cuál usar. Equipo Vario permite consultar recetas, pero también exige la herramienta apropiada para fabricarlas. Los identificadores nativos funcionan aunque cambies sus nombres; objetos antiguos sin identificador se reconocen por nombres ES/EN.

| Trabajo | Herramienta |
|---|---|
| Armas metálicas y armaduras | Herrero / Smith |
| Arcos, bastones y garrotes | Tallador de madera o carpintero |
| Tablas, muebles, puertas y escaleras | Carpintero; alternativas según la pieza |
| Muros, pisos y edificios | Albañil o carpintero |
| Ventanas de vidrio | Soplador de vidrio |
| Pociones curativas | Herborista o alquimista |
| Otros preparados / venenos | Alquimista / envenenador o alquimista |
| Raciones / cerveza y vino | Cocinero / cervecero |
| Joyas | Joyero |
| Cuero / tela / calzado | Curtidor / tejedor / zapatero o curtidor |
| Mapas / libros / retratos / cerámica | Cartógrafo / calígrafo / pintor / alfarero |
| Equipo mecánico, maquinaria y defensas | Manitas; herrero en recetas de defensa |

Al iniciar se abre el diálogo **nativo de D&D5e**. Allí puedes escoger característica, tirada normal, ventaja/desventaja y bono adicional. El sistema calcula competencia, pericia, efectos y bonos con dados; el módulo utiliza el total resultante y el d20 conservado. Recolección usa su habilidad configurada (Supervivencia, Atletismo, Naturaleza o Investigación); Cultivos usa Naturaleza y Despiece, Supervivencia. Las integraciones que escuchen los hooks nativos reciben esas tiradas; cada integración externa necesita su propia prueba.

Cancelar ese diálogo devuelve los materiales y permite volver a intentar. El bono mostrado en el taller es orientativo: cambiar característica o añadir dados en el diálogo puede cambiar el resultado final. D&D5e no tiene una habilidad universal «Crafting»; cada oficio usa su herramienta. Los costes, DC, mini-juegos y grados de éxito del módulo siguen siendo **homebrew**, no una implementación de las reglas oficiales de fabricación de 2014/2024.

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
