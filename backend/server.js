const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── WEBHOOK DESDE N8N ────────────────────────────────────────────────────────
app.post('/webhook/pedido', (req, res) => {
  const { cliente, telefono, productos, total, direccion, notas, fuente } = req.body;

  if (!cliente) {
    return res.status(400).json({ error: 'El campo "cliente" es requerido' });
  }

  const pedido = {
    id: uuidv4(),
    cliente,
    telefono: telefono || '',
    productos: productos || [],
    total: total || 0,
    direccion: direccion || '',
    notas: notas || '',
    estado: 'nuevo',
    fecha: new Date().toISOString(),
    fuente: fuente || 'whatsapp'
  };

  db.insertPedido(pedido);
  console.log(`[${new Date().toLocaleString()}] ✅ Nuevo pedido: ${cliente}`);
  res.json({ success: true, id: pedido.id });
});

// ─── LISTAR PEDIDOS ───────────────────────────────────────────────────────────
app.get('/api/pedidos', (req, res) => {
  res.json(db.getPedidos(req.query.estado));
});

// ─── OBTENER UN PEDIDO ────────────────────────────────────────────────────────
app.get('/api/pedidos/:id', (req, res) => {
  const pedido = db.getPedido(req.params.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(pedido);
});

// ─── CAMBIAR ESTADO ───────────────────────────────────────────────────────────
app.patch('/api/pedidos/:id/estado', (req, res) => {
  const { estado } = req.body;
  const validos = ['nuevo', 'en_proceso', 'listo', 'entregado', 'cancelado'];

  if (!validos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const ok = db.updateEstado(req.params.id, estado);
  if (!ok) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json({ success: true });
});

// ─── ELIMINAR PEDIDO ──────────────────────────────────────────────────────────
app.delete('/api/pedidos/:id', (req, res) => {
  const ok = db.deletePedido(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json({ success: true });
});

// ─── ESTADÍSTICAS ─────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  res.json(db.getStats());
});

// ─── MENÚ (Admin) ─────────────────────────────────────────────────────────────
app.get('/api/menu', (req, res) => {
  res.json(db.getItems());
});

app.post('/api/menu', (req, res) => {
  const { nombre, descripcion, categoria, precio } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El campo "nombre" es requerido' });

  const item = {
    id: uuidv4(),
    nombre,
    descripcion: descripcion || '',
    categoria: categoria || 'General',
    precio: Number(precio) || 0,
    disponible: true
  };
  db.insertItem(item);
  console.log(`[${new Date().toLocaleString()}] ✅ Ítem de menú agregado: ${nombre}`);
  res.json({ success: true, id: item.id });
});

app.patch('/api/menu/:id', (req, res) => {
  const campos = {};
  const permitidos = ['nombre', 'descripcion', 'categoria', 'precio', 'disponible'];
  for (const k of permitidos) {
    if (req.body[k] !== undefined) campos[k] = req.body[k];
  }
  if (campos.precio !== undefined) campos.precio = Number(campos.precio);

  const ok = db.updateItem(req.params.id, campos);
  if (!ok) return res.status(404).json({ error: 'Ítem no encontrado' });
  res.json({ success: true });
});

app.delete('/api/menu/:id', (req, res) => {
  const ok = db.deleteItem(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Ítem no encontrado' });
  res.json({ success: true });
});

// ─── WEBHOOKS MENÚ (para n8n) ─────────────────────────────────────────────────

// Consultar menú completo disponible (el agente lo usa para saber qué hay)
app.get('/webhook/menu', (req, res) => {
  const items = db.getItemsDisponibles();
  res.json({
    total: items.length,
    items: items.map(i => ({
      nombre: i.nombre,
      categoria: i.categoria,
      precio: i.precio,
      descripcion: i.descripcion
    }))
  });
});

// Verificar si ítems pedidos por el cliente están disponibles
// Body: { "items": ["Arepa de Choclo", "Arepa Boyacense"] }
app.post('/webhook/verificar-disponibilidad', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El campo "items" debe ser un arreglo con al menos un ítem' });
  }
  const resultado = db.verificarDisponibilidad(items);
  console.log(`[${new Date().toLocaleString()}] 🔍 Verificación de ${items.length} ítem(s): ${resultado.todos_disponibles ? 'todos disponibles' : 'algunos no disponibles'}`);
  res.json(resultado);
});

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── FRONTEND (producción) ────────────────────────────────────────────────────
const DIST = path.join(__dirname, '../frontend/dist');
if (require('fs').existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor en http://localhost:${PORT}`);
  console.log(`📲 Webhook pedido:          POST http://localhost:${PORT}/webhook/pedido`);
  console.log(`📋 Webhook menú disponible: GET  http://localhost:${PORT}/webhook/menu`);
  console.log(`✅ Webhook verificar items: POST http://localhost:${PORT}/webhook/verificar-disponibilidad\n`);
});
