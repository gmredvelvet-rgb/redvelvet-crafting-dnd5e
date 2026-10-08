RedVelvet Crafting — D&D5e 1.1.0 prepara el taller para Foundry v13/v14 y conserva sus oficios, recolección, construcción, cultivos, despiece y reglas homebrew.

- Arte propio de la edición PF2e reutilizado localmente: 13 fondos y 15 SVG, más una portada nueva.
- 20 efectos sonoros originales, diferenciados por actividad y con volumen por usuario.
- Herramientas nativas de D&D5e, iconos con teclado y animaciones con movimiento reducido.
- Correcciones de pilas duplicadas, doble clic, temporizadores al cerrar, recuperación de inventario y tiradas de respaldo.
- Soft gate Patreon con Velvet License Hub opcional: crafting funciona durante la prueba gratuita y durante fallos de autenticación.

Pruebas automatizadas: **21 aprobadas**, más revisión en navegador sobre un inventario simulado. GitHub Actions valida el código y genera el paquete.

**Candidato en borrador:** faltan las pruebas en mundos reales de Foundry v13 y v14 y OAuth Patreon real descritas en `docs/RELEASE-QA.md`. No se anuncian esas comprobaciones como realizadas.

Archivos: `redvelvet-crafting-dnd5e.zip`, `module.json` y `SHA256SUMS.txt`. Para comprobar integridad, compara los SHA-256 del archivo de checksums. Al publicar la release, el manifiesto estable de Foundry será `/releases/latest/download/module.json`.

Uso: selecciona un token y escribe `/craft`; o ejecuta `game.modules.get("redvelvet-crafting-dnd5e").api.open()`.
