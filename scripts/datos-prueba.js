// Datos de prueba para ver el panel con contenido.
//
//   node scripts/datos-prueba.js poner    → crea clientes, vehículos, órdenes y reservas
//   node scripts/datos-prueba.js quitar   → borra exactamente lo que creó
//
// Todo lo que crea lleva una placa de la lista PLACAS o un teléfono de la lista
// RESERVAS, y «quitar» busca solo por eso: no puede llevarse por delante una
// orden de verdad.
//
// Las órdenes se abren con `recepcionar_vehiculo` y se mueven con
// `cambiar_estado_orden`, las mismas funciones que usa el panel, así que cada
// una queda con sus eventos en la bitácora. Ningún estado se escribe a mano.
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

for (const linea of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const PLACAS = ["V1K-482", "A4Z-119", "C9P-330", "B7T-905", "T8M-204", "K3R-771"];

const FLOTA = [
  {
    placa: "V1K-482", marca: "Toyota", modelo: "Hilux", anio: 2018, tipo: "GRANDE",
    cliente: "Marco Quispe", telefono: "959960390", km: 84500,
    motivo: "Suena al frenar — pastillas y disco", hasta: "EN_TRABAJO",
  },
  {
    placa: "A4Z-119", marca: "Hyundai", modelo: "i20", anio: 2021, tipo: "SEDAN",
    cliente: "Lucía Ramos", telefono: "984221507", km: 31200,
    motivo: "Cambio de aceite y filtros", hasta: "DIAGNOSTICO",
  },
  {
    placa: "C9P-330", marca: "Nissan", modelo: "Frontier", anio: 2015, tipo: "GRANDE",
    cliente: "Julio Paredes", telefono: "930118642", km: 142800,
    motivo: "Reparación de frenos y suspensión", hasta: "ESPERANDO_APROBACION",
    conPresupuesto: true,
  },
  {
    placa: "B7T-905", marca: "Suzuki", modelo: "Swift", anio: 2019, tipo: "SEDAN",
    cliente: "Rosa Mamani", telefono: "951480226", km: 48900,
    motivo: "Alineación y balanceo", hasta: "RECIBIDO",
  },
  {
    placa: "T8M-204", marca: "Mitsubishi", modelo: "L200", anio: 2016, tipo: "GRANDE",
    cliente: "Enrique Ticona", telefono: "976330481", km: 118400,
    motivo: "No sé qué tiene / suena raro", hasta: "DIAGNOSTICO",
  },
  {
    placa: "K3R-771", marca: "Chevrolet", modelo: "Sail", anio: 2020, tipo: "SEDAN",
    cliente: "Diego Flores", telefono: "942775013", km: 67300,
    motivo: "Sistema eléctrico — no arranca en frío", hasta: "EN_TRABAJO",
  },
];

const CAMINO = ["RECIBIDO", "DIAGNOSTICO", "ESPERANDO_APROBACION", "EN_TRABAJO", "LISTO"];

const RESERVAS = [
  {
    nombre: "Ana Cárdenas", telefono: "965118742", placa: "W2C-773",
    vehiculo: "Kia Rio 2019", tipo: "SEDAN", motivo: "Cambio de aceite y filtros",
    dia: 0, hora: "09:00", estado: "CONFIRMADA",
  },
  {
    nombre: "Percy Huamán", telefono: "917640228", placa: "R5D-118",
    vehiculo: "Toyota Yaris 2017", tipo: "SEDAN", motivo: "No sé qué tiene / suena raro",
    dia: 0, hora: "15:00", estado: "PENDIENTE",
  },
  {
    nombre: "Silvia Condori", telefono: "938220514", placa: "L7N-902",
    vehiculo: "Hyundai Tucson 2020", tipo: "GRANDE", motivo: "Revisión de frenos",
    dia: 1, hora: "10:00", estado: "PENDIENTE",
  },
  {
    nombre: "Óscar Zevallos", telefono: "989114370", placa: "M2J-655",
    vehiculo: "Nissan Versa 2018", tipo: "SEDAN", motivo: "Diagnóstico con escáner",
    dia: 2, hora: "11:00", estado: "CONFIRMADA",
  },
];

const TELEFONOS_RESERVA = RESERVAS.map((r) => r.telefono);

/** La fecha de dentro de `dias`, en la hora de Lima (UTC-5). */
function enLima(dias) {
  const d = new Date(Date.now() + dias * 86400000 - 5 * 3600000);
  return d.toISOString().slice(0, 10);
}

async function poner() {
  const { data: boxes } = await db
    .from("box")
    .select("id, nombre, tipo, activo")
    .order("orden_visual");

  const { data: ocupadas } = await db
    .from("orden_servicio")
    .select("box_id")
    .not("box_id", "is", null)
    .neq("estado", "LISTO");

  const tomados = new Set((ocupadas ?? []).map((o) => o.box_id));
  const libres = (boxes ?? []).filter((b) => b.activo && !tomados.has(b.id));

  for (const auto of FLOTA) {
    const { data: yaEsta } = await db
      .from("vehiculo")
      .select("id")
      .eq("placa", auto.placa)
      .maybeSingle();

    if (yaEsta) {
      console.log("ya estaba:", auto.placa);
      continue;
    }

    // Un box del tipo que corresponde si queda alguno; si no, al patio. Es lo
    // mismo que haría el recepcionista un día con el taller lleno.
    const i = libres.findIndex((b) => b.tipo === auto.tipo);
    const box = i >= 0 ? libres.splice(i, 1)[0] : null;

    const { data: ordenId, error } = await db.rpc("recepcionar_vehiculo", {
      p_motivo: auto.motivo,
      p_ubicacion: box ? "BOX" : "PATIO",
      p_box_id: box ? box.id : null,
      p_cliente_nombre: auto.cliente,
      p_cliente_telefono: auto.telefono,
      p_placa: auto.placa,
      p_marca: auto.marca,
      p_modelo: auto.modelo,
      p_anio: auto.anio,
      p_tipo: auto.tipo,
      p_kilometraje: auto.km,
    });

    if (error) {
      console.log("ERROR recepción", auto.placa, error.message);
      continue;
    }

    // Se avanza paso a paso, como en el panel: no hay saltos (decisión 23).
    let actual = "RECIBIDO";
    while (actual !== auto.hasta) {
      const siguiente = CAMINO[CAMINO.indexOf(actual) + 1];
      const { error: fallo } = await db.rpc("cambiar_estado_orden", {
        p_orden_id: ordenId,
        p_estado_esperado: actual,
        p_estado_nuevo: siguiente,
      });
      if (fallo) {
        console.log("ERROR estado", auto.placa, fallo.message);
        break;
      }
      actual = siguiente;
    }

    if (auto.conPresupuesto) await presupuestar(ordenId);

    console.log("orden:", auto.placa, "→", actual, box ? `· ${box.nombre}` : "· patio");
  }

  for (const reserva of RESERVAS) {
    const { error } = await db.from("reserva").insert({
      nombre: reserva.nombre,
      telefono: reserva.telefono,
      placa: reserva.placa,
      vehiculo: reserva.vehiculo,
      tipo_vehiculo: reserva.tipo,
      motivo: reserva.motivo,
      fecha: enLima(reserva.dia),
      hora: reserva.hora,
      estado: reserva.estado,
    });

    console.log(
      error ? `ERROR reserva ${reserva.nombre}: ${error.message}` : `reserva: ${reserva.nombre}`,
    );
  }
}

/** Un diagnóstico y un presupuesto ya enviado, para ver esa pantalla llena. */
async function presupuestar(ordenId) {
  await db.from("diagnostico").insert({
    orden_id: ordenId,
    hallazgos:
      "Pastillas delanteras al límite y disco derecho con alabeo. " +
      "Amortiguador trasero izquierdo con fuga leve de aceite.",
    recomendacion:
      "Cambiar pastillas y rectificar discos. Reemplazar el amortiguador trasero izquierdo.",
    mecanico: "J. Huamán",
  });

  // En céntimos, como todo el dinero del sistema (regla 4).
  const lineas = [
    { concepto: "Cambio de pastillas delanteras", cantidad: 1, precio: 14000 },
    { concepto: "Rectificado de discos", cantidad: 2, precio: 4500 },
    { concepto: "Amortiguador trasero izquierdo", cantidad: 1, precio: 28000 },
  ];

  const subtotal = lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0);
  const igv = Math.round(subtotal * 0.18);

  const { data: presupuesto, error } = await db
    .from("presupuesto")
    .insert({
      orden_id: ordenId,
      version: 1,
      estado: "ENVIADO",
      subtotal_centimos: subtotal,
      igv_centimos: igv,
      total_centimos: subtotal + igv,
      igv_incluido: false,
      igv_tasa_bp: 1800,
      tiempo_estimado_min: 180,
      enviado_en: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.log("ERROR presupuesto:", error.message);
    return;
  }

  await db.from("linea_presupuesto").insert(
    lineas.map((l, i) => ({
      presupuesto_id: presupuesto.id,
      concepto: l.concepto,
      cantidad: l.cantidad,
      precio_unitario_centimos: l.precio,
      orden_visual: i,
    })),
  );
}

async function quitar() {
  const { data: autos } = await db
    .from("vehiculo")
    .select("id, cliente_id, placa")
    .in("placa", PLACAS);

  for (const auto of autos ?? []) {
    await db.from("orden_servicio").delete().eq("vehiculo_id", auto.id);
    await db.from("vehiculo").delete().eq("id", auto.id);
    if (auto.cliente_id) await db.from("cliente").delete().eq("id", auto.cliente_id);
    console.log("borrado:", auto.placa);
  }

  const { count } = await db
    .from("reserva")
    .delete({ count: "exact" })
    .in("telefono", TELEFONOS_RESERVA);

  console.log("reservas borradas:", count ?? 0);
}

const orden = process.argv[2];
if (orden === "poner") poner();
else if (orden === "quitar") quitar();
else console.log("uso: node scripts/datos-prueba.js poner|quitar");
