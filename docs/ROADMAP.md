# Roadmap

## Estado actual

**Fase 2 casi terminada.** Funcionan la recepción, el tablero, el detalle de
orden, el diagnóstico, el presupuesto y la vista del cliente con aprobación por
enlace. Falta la pantalla para editar el catálogo, y el despliegue en Vercel de
la Fase 0.

Lo que está cerrado:

- Modelo de dominio y máquina de estados.
- Modelo de datos en borrador.
- Stack y estrategia de despliegue.
- Flujo de WhatsApp y de presupuesto.
- Alcance de v1 y lo que queda fuera.

---

## Fase 0 — Andamiaje

- [x] Proyecto Next.js con App Router + TypeScript + Tailwind
- [x] Documentos de diseño dentro del repo (`docs/`)
- [x] Clientes de Supabase separados (navegador, servidor, servicio) y `.env.example`
- [x] Migraciones iniciales: `perfil`, `cliente`, `vehiculo`, `box`, `servicio_catalogo`,
      `orden_servicio`, `evento_orden`
- [x] RLS restrictivo por defecto en todas las tablas
- [x] Seed: 4 boxes sedán + 1 grande, catálogo básico de servicios
- [x] Auth de staff y layout protegido de `/admin`
- [x] Proyecto en Supabase creado, migraciones aplicadas y seed cargado
- [ ] Despliegue en Vercel funcionando desde el día uno

### Lo que falta para cerrar la fase

Solo el despliegue en Vercel; los pasos están en `PUESTA_EN_MARCHA.md` §7.

Lo verificado contra el proyecto remoto: las tres migraciones aplicadas, 5 boxes
y 14 servicios en el seed, la cuenta de staff con su fila en `perfil`, la clave
pública leyendo el catálogo y RLS devolviendo vacío en `orden_servicio` y
`cliente`. `npm run build` pasa con `/admin` en prerenderizado parcial.

## Fase 1 — Núcleo operativo

Es la fase que hace útil el sistema. Si solo se construye esto, ya sirve.

- [x] Recepción rápida `/admin/ingreso` — una sola pantalla, búsqueda por placa,
      teléfono o nombre
- [x] Tablero `/admin` — resumen, grilla de boxes, lista de órdenes activas
      filtrable
- [x] Detalle de orden `/admin/orden/{id}` — estado, ubicación y bitácora
- [x] Máquina de estados como función pura con transiciones validadas
- [x] Registro de eventos en cada transición
- [x] Asignación y liberación de box (independiente del estado)

### Lo que no está verificado

- **El objetivo de los 60 segundos.** Hace falta cronometrar una recepción real,
  con un auto delante y alguien del taller escribiendo. Es el riesgo número dos
  de la tabla de abajo y no se cierra desde el escritorio.
- ~~**`evento_orden.actor`**~~ — **verificado** con la primera orden real
  (`OS-2026-0001`): los ocho eventos del recorrido completo, incluidos los de
  box, quedaron atribuidos al perfil del staff. La trazabilidad de la decisión 14
  funciona de punta a punta.
- **No hay pruebas automatizadas.** Las funciones de la base se verificaron con
  un script descartable. Si la Fase 2 crece, conviene decidir si eso se
  formaliza.

## Fase 2 — Diagnóstico, presupuesto y cliente

- [ ] Catálogo de servicios editable `/admin/catalogo` — el catálogo ya se usa
      desde el presupuesto, falta la pantalla para editarlo
- [x] Diagnóstico: hallazgos y recomendación
- [x] Presupuesto con líneas (catálogo + libres), total en céntimos, tiempo estimado
- [x] Generación de token público
- [x] Vista pública `/o/{token}` resuelta en servidor
- [x] Botón de aprobar/rechazar con registro de quién y cuándo
- [x] Botón de WhatsApp con `wa.me` y plantilla editable

`config_sitio` se adelantó desde la Fase 3 porque ahí viven la configuración del
IGV y las plantillas de mensaje. La tabla existe con valores por defecto; la
pantalla que la edita sigue siendo de la Fase 3.

## Fase 3 — Landing configurable

- [ ] `config_sitio` con esquema fijo
- [ ] `/admin/config` — campos, logo, galería, horarios, plantillas de mensaje
- [ ] Subida de imágenes a Storage con redimensionado y límite de peso
- [ ] Landing consumiendo config + botón "Publicar cambios" (decisión 2)
- [ ] Página pública de servicios desde el catálogo

## Fase 4 — Reservas

- [ ] Tabla `reserva` y cupos configurables por franja
- [ ] Formulario público `/reservar` con "No sé qué tiene" como primera opción
- [ ] Agenda `/admin/agenda`
- [ ] Conversión reserva → orden en un click desde la agenda
- [ ] Marcar no-asistencia

## Fase 5 — Fotos e historial

- [ ] Fotos de ingreso (frontal, posterior, laterales, interior, daños)
- [ ] Fotos durante diagnóstico
- [ ] Historial de órdenes por vehículo
- [ ] Búsqueda por placa desde el panel

---

## Backlog v2 (no tocar en v1)

- Estados `ESPERANDO_REPUESTOS` y `ENTREGADO`
- Aprobación parcial por ítem del presupuesto
- Inventario de repuestos
- Notificaciones automáticas por evento
- WhatsApp Cloud API con plantillas aprobadas
- Asignación de mecánico responsable y especialidades
- Cálculo de capacidad real para reservas
- Reportes: ingresos por período, servicios más frecuentes, tiempo promedio
- Facturación electrónica (proyecto aparte)
- Roles `mecanico` y `recepcion` (decisión 4)

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Scope creep hacia scheduling real | Cupos fijos, revisar `DECISIONES.md` |
| El taller no usa el sistema porque es lento | La recepción en 60 s es requisito, no aspiración |
| Fotos pesadas matan el rendimiento | Redimensionar en cliente + límite de peso |
| Fuga de datos por RLS mal configurado | Restrictivo por defecto; el token va por servidor |
| El admin rompe el landing | CMS de campos fijos |
| Confusión presupuesto/boleta con el cliente | Nomenclatura explícita en toda la UI |
