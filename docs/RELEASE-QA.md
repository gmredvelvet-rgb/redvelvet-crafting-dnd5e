# Validación del candidato de release 1.1.0

## Completado

- [x] Pruebas automatizadas del código real de la interfaz con adaptadores de APIs v13/v14.
- [x] 21 casos: inventario, doble clic, cancelar, escritura fallida, herramientas, costes, grados, fabricación, conversión, recolección, estructuras, cultivo, despiece y soft gate.
- [x] Referencias de fondos, SVG, OGG, JS, CSS e idiomas locales completas.
- [x] Sin dependencia de audio de BG3, Dice So Nice, Maestro o carpetas de un mundo.
- [x] Registro del ID del módulo presente en la fuente del backend de licencia consultada.
- [x] Navegador real sobre el harness aislado: carga de arte local, cancelación con devolución 2000 → 1996 → 2000, activación con Enter y entrega de una sola espada. Evidencias en `docs/screenshots/`.

## Prueba en mundos reales antes de publicar

No se ha ejecutado un mundo de Foundry v13 ni un mundo D&D5e v14 durante esta preparación. El entorno instalado contiene D&D5e 6.0.5; la matriz siguiente necesita la sesión real correspondiente. Las versiones del sistema deben ser compatibles con la generación de Foundry.

- [ ] Foundry v13 + D&D5e 4.4/5: activar, `/craft`, todos los oficios y un resultado de éxito/fallo.
- [ ] Foundry v14 + D&D5e 6: repetir las actividades y comprobar consola sin excepciones.
- [ ] GM y jugador propietario: fabricar un objeto de pila 50 y comprobar que entrega solamente uno.
- [ ] Cerrar cada mini-juego antes del resultado: comprobar devolución de materiales y que no entregue nada después.
- [ ] Dos clientes sobre actores distintos; no editar el mismo inventario simultáneamente.
- [ ] Reciclar última unidad; mejorar una estructura de nivel 1 a 2; guardar/cargar un cultivo y cosechar al quinto día.
- [ ] Validar despiece bajo supervisión del GM y bonus Monster Scavenger.
- [ ] Sonidos: los nueve timbres, volumen 0/0.45/1, sonido desactivado y navegador que bloquee audio.
- [ ] Teclado y movimiento reducido; resultados legibles en ventana pequeña.
- [ ] OAuth Patreon real con hub activo: licencia compartida, una sola tarjeta y jugador sin llamadas al servidor.
- [ ] Sin hub: licencia individual, cerrar aviso de prueba y comprobar que crafting continúa.
- [ ] Instalar ZIP en carpeta vacía y comprobar que el manifiesto publicado descarga ese mismo paquete.

Publicar el borrador GitHub después de registrar estos resultados. Al publicar, el enlace `/releases/latest/download/module.json` será utilizable por Foundry. El estado draft conserva la posibilidad de corregir el paquete antes de anunciarlo.
