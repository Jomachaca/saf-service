# Roadmap

## Estado actual

**Fase 0 en curso.** Diseño cerrado, decisiones abiertas resueltas
(ver `DECISIONES.md`), andamiaje iniciado.

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
- **`evento_orden.actor`.** Las funciones lo llenan con `auth.uid()`, pero las
  pruebas corrieron con clave de servicio, que no tiene sesión: quedó en NULL.
  Al entrar como staff debería aparecer el perfil en cada evento. Vale la pena
  mirarlo en la primera orden real, porque es la trazabilidad de la decisión 14.
- **No hay pruebas automatizadas.** Las funciones de la base se verificaron con
  un script descartable. Si la Fase 2 crece, conviene decidir si eso se
  formaliza.

## Fase 2 — Diagnóstico, presupuesto y cliente

- [ ] Catálogo de servicios editable `/admin/catalogo`
- [ ] Diagnóstico: hallazgos y recomendación
- [ ] Presupuesto con líneas (catálogo + libres), total en céntimos, tiempo estimado
- [ ] Generación de token público
- [ ] Vista pública `/o/{token}` resuelta en servidor
- [ ] Botón de aprobar/rechazar con registro de quién y cuándo
- [ ] Botón de WhatsApp con `wa.me` y plantilla editable

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
