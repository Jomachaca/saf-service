# Arquitectura

## 1. Modelo de dominio

La entidad central es la **Orden de Servicio**. Todo lo demás gira alrededor de ella.

```
CLIENTE  1 ─── N  VEHICULO  1 ─── N  ORDEN_SERVICIO
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                    DIAGNOSTICO     PRESUPUESTO       EVENTOS
                                          │
                                    LINEA_PRESUPUESTO
```

Un cliente tiene varios vehículos. Un vehículo tiene un historial de órdenes.
La orden acompaña al vehículo durante todo su paso por el taller y al cerrarse
pasa a formar parte del historial.

## 2. Canales de entrada

Un vehículo puede entrar por reserva web, walk-in, llamada o WhatsApp. Todos
convergen en el mismo punto:

```
RESERVA ──┐
WALK-IN ──┼──► RECEPCIÓN ──► ORDEN DE SERVICIO ──► [flujo común]
LLAMADA ──┘
```

La reserva es opcional y desechable. La orden es lo que importa.

## 3. Máquina de estados

### Estados de v1 (cinco)

| Estado | Color | Significado |
|---|---|---|
| `RECIBIDO` | 🟢 verde | El vehículo llegó y está registrado |
| `DIAGNOSTICO` | 🟠 naranja | El mecánico está revisando |
| `ESPERANDO_APROBACION` | 🟣 morado | Presupuesto enviado, falta decisión del cliente |
| `EN_TRABAJO` | 🔵 azul | Trabajo aprobado y en ejecución |
| `LISTO` | ⚫ gris | Terminado; incluye esperando recojo y entregado |

### Transiciones válidas

```
RECIBIDO ──► DIAGNOSTICO ──► ESPERANDO_APROBACION ──► EN_TRABAJO ──► LISTO
    │              │                    │                  │
    └──────────────┴────────────────────┴──────────────────┘
                    (cualquiera puede ir a LISTO:
                     rechazo, cancelación, derivación externa)
```

Implementar las transiciones como una función pura que valide origen → destino.
No permitir cambios arbitrarios desde la UI.

### Estados diferidos a v2

`RESERVADO`, `ESPERANDO_REPUESTOS`, `ESPERANDO_RECOJO`, `ENTREGADO`.

Razón: `RESERVADO` vive en la tabla de reservas, no en la de órdenes.
`LISTO` y `ESPERANDO_RECOJO` describían lo mismo. Los otros dos se agregan
cuando el taller los pida en uso real. Ver `DECISIONES.md` #3.

## 4. Ubicación (separada del estado)

```
ubicacion ∈ { BOX, PATIO, FUERA }
box_id    → solo cuando ubicacion = BOX
```

Un auto esperando un repuesto está en `PATIO` sin ocupar box. Si atas el box al
estado, el taller mentirá al sistema para liberar espacio.

Los boxes son datos, no constantes en código:

```
box: { id, nombre, tipo: SEDAN | GRANDE, activo }
```

Arranca con 4 SEDAN + 1 GRANDE, pero el taller debe poder agregar más sin tocar código.

## 5. Modelo de datos (borrador)

```
cliente
  id, nombre, telefono, email?, creado_en

vehiculo
  id, cliente_id, placa (única), marca, modelo, anio?, tipo (SEDAN|GRANDE), creado_en

box
  id, nombre, tipo, activo, orden_visual

orden_servicio
  id, anio, correlativo, numero (OS-2026-0182, generado)   -- decision 20
  vehiculo_id, cliente_id
  estado, ubicacion, box_id?
  motivo_ingreso, kilometraje
  token_publico (aleatorio, único, indexado)
  tiempo_estimado_min?
  recibido_en, cerrado_en?

diagnostico
  id, orden_id, hallazgos (texto), recomendacion (texto), mecanico, creado_en

presupuesto
  id, orden_id, version, tiempo_estimado_min
  subtotal_centimos, igv_centimos, total_centimos   -- materializados, decision 16
  estado (BORRADOR|ENVIADO|APROBADO|RECHAZADO)
  enviado_en?, respondido_en?

linea_presupuesto
  id, presupuesto_id, concepto, cantidad
  precio_unitario_centimos      -- COPIADO del catálogo, no referencia
  servicio_catalogo_id?          -- solo trazabilidad, nunca para leer el precio

servicio_catalogo
  id, categoria, nombre, precio_base_centimos, duracion_min, activo

foto_orden
  id, orden_id, url, etapa (INGRESO|DIAGNOSTICO|ENTREGA), subido_en

evento_orden                     -- append-only, nunca se edita ni borra
  id, orden_id, tipo, payload (jsonb), actor, creado_en

reserva
  id, nombre, telefono, tipo_vehiculo, servicio_id?, fecha, franja
  estado (PENDIENTE|CONFIRMADA|CONVERTIDA|NO_ASISTIO|CANCELADA)
  orden_id?                      -- se llena al convertirse

perfil                           -- staff, ligado a auth.users (decisiones 18 y 19)
  id (= auth.users.id), nombre, rol, activo

config_sitio                     -- fila única, esquema fijo
  nombre_taller, slogan, descripcion, logo_url, telefono, whatsapp,
  direccion, horarios (jsonb), galeria (jsonb), plantillas_mensaje (jsonb)
  igv_incluido, igv_tasa_bp                        -- decision 16
  actualizado_en, publicado_en                     -- decision 17
```

### Sobre `evento_orden`

Append-only. Cada cambio de estado, envío de presupuesto, aprobación y edición
relevante genera un evento. Beneficios: el historial de cambios sale gratis,
hay trazabilidad frente a reclamos, y la reconstrucción de "qué pasó" no depende
de la memoria del recepcionista.

## 6. Categorías de servicio

Taxonomía del catálogo (visible al cliente con nombres simples):

1. **Mantenimiento Programado** — aceite y filtros, frenos (revisión), revisiones
   periódicas, neumáticos (rotación, balanceo, alineación).
2. **Reparaciones y Diagnóstico** — diagnóstico con escáner, motor y transmisión,
   frenos y suspensión, sistema eléctrico, escape.
3. **Carrocería y Estética** — chapa y pintura, lavado y detallado.
4. **Especializados** — Pre-ITV, instalación de accesorios.

**Opción obligatoria y primera en el formulario de reserva:**
*"No sé qué tiene / suena raro"* → entra como Diagnóstico.
Es la opción que más se va a usar. No la escondas.

## 7. Reservas: cupos, no scheduling

No resolver asignación de recursos. Para cada franja horaria hay un número máximo
de cupos configurable; una reserva ocupa un cupo si hay disponibilidad.

```
franja: 08:00 | 09:00 | 10:00 | ... | 17:00
cupos_por_franja: configurable (arranca en 2)
```

Con 5 boxes nadie nota la diferencia frente a un motor de capacidad real, y
ahorra semanas de trabajo. Ver `DECISIONES.md` #4.

## 8. Flujo de WhatsApp

```
1. Admin termina el diagnóstico y arma el presupuesto en el panel
2. Click en "Enviar por WhatsApp"
3. Se genera el token público (si no existe) y se abre wa.me con texto corto:

   "Hola {nombre}, ya revisamos tu {marca} {modelo} {placa}.
    El diagnóstico y presupuesto están acá: {url}"

4. Se registra evento LINK_GENERADO (no "notificado")
5. El cliente abre el link, ve detalle + total + tiempo, y aprueba o rechaza
6. La aprobación queda registrada: cuándo y sobre qué versión del presupuesto
```

El mensaje **nunca** lleva el presupuesto detallado como texto. Se ve mal, queda
congelado ante correcciones, y no deja constancia de aprobación.

Las plantillas de mensaje son editables desde el panel (`config_sitio.plantillas_mensaje`).

## 9. Presupuesto: un solo flujo

El mecánico arma líneas de presupuesto. Puede:

- Agregar un ítem del catálogo → precio y duración se llenan solos (rutina)
- Escribir una línea libre con concepto y precio (caso especial)
- Editar cualquier línea, venga de donde venga

Misma tabla, mismo formulario. El catálogo es solo autocompletado.

## 10. Rutas

### Público
```
/                       landing (contenido desde config_sitio)
/servicios              catálogo público
/reservar               formulario de reserva
/o/{token}              consulta de orden + aprobación   [server-side]
```

### Panel
```
/admin                  tablero: resumen + boxes + órdenes activas
/admin/ingreso          recepción rápida (flujo de 6 pasos)
/admin/orden/{id}       detalle: diagnóstico, presupuesto, fotos, eventos
/admin/agenda           reservas futuras
/admin/catalogo         servicios, precios, duraciones
/admin/config           CMS del landing + plantillas de mensaje
```

### Recepción rápida — objetivo: menos de 60 segundos
```
1. Buscar cliente (por teléfono o placa) o crear
2. Seleccionar vehículo o crear
3. Motivo de ingreso
4. Kilometraje
5. Fotos (opcional, saltable)
6. Asignar box → crear orden
```

## 11. Tablero

Tres bloques, en este orden:

```
RESUMEN HOY      contadores por estado
ESPACIOS         grilla de boxes con color y placa
ÓRDENES ACTIVAS  lista filtrable por estado
```

El administrador debe poder responder en segundos: qué vehículos tengo, dónde
están, qué problema tienen, qué necesita aprobación, qué está listo.

**Tablero = presente. Agenda = futuro.** Son pantallas distintas.

## 12. Seguridad

- RLS restrictivo por defecto en todas las tablas.
- El landing lee `config_sitio` y `servicio_catalogo` (solo activos) con anon key.
- Todo lo demás requiere sesión de staff.
- `/o/{token}` se resuelve **en el servidor**: route handler con service role que
  valida el token y devuelve solo los campos que el cliente debe ver.
- Nunca exponer `orden_servicio` al cliente vía anon key.
- Token público: aleatorio, mínimo 128 bits, url-safe.

## 13. Imágenes

Supabase Storage. Redimensionar en el cliente antes de subir y aplicar límite de
peso. Sin esto, el dueño sube fotos de 8 MB desde el celular y el landing tarda
15 segundos en cargar.

## 14. Caché del landing

El landing es mayormente estático. Al guardar en `/admin/config` hay que
revalidar, o el admin cambia el slogan y no ve nada.

**Resuelto (decisión 17): botón explícito de "Publicar cambios".** Guardar escribe
en la base sin publicar; el botón revalida. `config_sitio.actualizado_en` y
`publicado_en` permiten avisar en el panel que hay cambios sin publicar.
