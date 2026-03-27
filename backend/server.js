const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'pedidos-app-secret-key-2024';

app.use(cors());
app.use(express.json());

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ error: 'Se requieren permisos de administrador' });
  }
  next();
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const user = db.getUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const payload = { id: user.id, nombre: user.nombre, username: user.username, rol: user.rol };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  console.log(`[${new Date().toLocaleString()}] 🔑 Login: ${user.nombre} (${user.rol})`);
  res.json({ token, user: payload });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ─── WEBHOOK DESDE N8N (público, sin auth) ────────────────────────────────────
app.post('/webhook/pedido', (req, res) => {
  const { cliente, telefono, productos, total, direccion, notas, fuente, atendido_por } = req.body;

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
    fuente: fuente || 'whatsapp',
    atendido_por: atendido_por || ''
  };

  db.insertPedido(pedido);
  console.log(`[${new Date().toLocaleString()}] ✅ Nuevo pedido: ${cliente}${atendido_por ? ` (por ${atendido_por})` : ''}`);
  res.json({ success: true, id: pedido.id });
});

// ─── PEDIDOS (requiere auth) ───────────────────────────────────────────────────
app.get('/api/pedidos', requireAuth, (req, res) => {
  res.json(db.getPedidos(req.query.estado));
});

app.get('/api/pedidos/:id', requireAuth, (req, res) => {
  const pedido = db.getPedido(req.params.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(pedido);
});

app.patch('/api/pedidos/:id/estado', requireAuth, (req, res) => {
  const { estado } = req.body;
  const validos = ['nuevo', 'en_proceso', 'listo', 'entregado', 'cancelado'];

  if (!validos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const ok = db.updateEstado(req.params.id, estado);
  if (!ok) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json({ success: true });
});

// Solo admin puede eliminar pedidos
app.delete('/api/pedidos/:id', requireAuth, requireAdmin, (req, res) => {
  const ok = db.deletePedido(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json({ success: true });
});

// Solo admin — vaciar TODOS los pedidos (para reset de producción)
app.delete('/api/pedidos', requireAuth, requireAdmin, (req, res) => {
  const count = db.deleteAllPedidos();
  console.log(`[${new Date().toLocaleString()}] 🗑️ Reset: ${count} pedidos eliminados por ${req.user.nombre}`);
  res.json({ success: true, eliminados: count });
});

app.get('/api/stats', requireAuth, (req, res) => {
  res.json(db.getStats());
});

// Primera letra de cada palabra en mayúscula
const toTitleCase = (str) =>
  str.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// ─── MENÚ (solo admin puede modificar) ────────────────────────────────────────
app.get('/api/menu', requireAuth, (req, res) => {
  res.json(db.getItems());
});

app.post('/api/menu', requireAuth, requireAdmin, (req, res) => {
  const { nombre, descripcion, categoria, precio } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El campo "nombre" es requerido' });

  const item = {
    id: uuidv4(),
    nombre: toTitleCase(nombre),
    descripcion: descripcion ? descripcion.trim() : '',
    categoria: toTitleCase(categoria || 'General'),
    precio: Number(precio) || 0,
    disponible: true
  };
  db.insertItem(item);
  console.log(`[${new Date().toLocaleString()}] ✅ Ítem de menú agregado: ${nombre}`);
  res.json({ success: true, id: item.id });
});

app.patch('/api/menu/:id', requireAuth, requireAdmin, (req, res) => {
  const campos = {};
  const permitidos = ['nombre', 'descripcion', 'categoria', 'precio', 'disponible'];
  for (const k of permitidos) {
    if (req.body[k] !== undefined) campos[k] = req.body[k];
  }
  if (campos.precio !== undefined) campos.precio = Number(campos.precio);
  if (campos.nombre !== undefined) campos.nombre = toTitleCase(campos.nombre);
  if (campos.categoria !== undefined) campos.categoria = toTitleCase(campos.categoria);

  const ok = db.updateItem(req.params.id, campos);
  if (!ok) return res.status(404).json({ error: 'Ítem no encontrado' });
  res.json({ success: true });
});

app.delete('/api/menu/:id', requireAuth, requireAdmin, (req, res) => {
  const ok = db.deleteItem(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Ítem no encontrado' });
  res.json({ success: true });
});

// ─── WEBHOOKS MENÚ (para n8n, públicos) ───────────────────────────────────────
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

app.post('/webhook/verificar-disponibilidad', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El campo "items" debe ser un arreglo con al menos un ítem' });
  }
  const resultado = db.verificarDisponibilidad(items);
  console.log(`[${new Date().toLocaleString()}] 🔍 Verificación de ${items.length} ítem(s): ${resultado.todos_disponibles ? 'todos disponibles' : 'algunos no disponibles'}`);
  res.json(resultado);
});

// ─── USUARIOS (solo admin) ────────────────────────────────────────────────────
app.get('/api/usuarios', requireAuth, requireAdmin, (req, res) => {
  res.json(db.getUsuarios());
});

app.post('/api/usuarios', requireAuth, requireAdmin, (req, res) => {
  const { nombre, username, password, rol } = req.body;
  if (!nombre || !username || !password) {
    return res.status(400).json({ error: 'nombre, username y password son requeridos' });
  }
  if (!['admin', 'mesero'].includes(rol)) {
    return res.status(400).json({ error: 'rol debe ser "admin" o "mesero"' });
  }
  if (db.getUserByUsername(username)) {
    return res.status(409).json({ error: 'El username ya está en uso' });
  }
  const id = `usr-${uuidv4()}`;
  db.createUsuario({ id, nombre, username, password, rol });
  console.log(`[${new Date().toLocaleString()}] 👤 Usuario creado: ${nombre} (${rol})`);
  res.status(201).json({ success: true, id });
});

app.patch('/api/usuarios/:id/password', requireAuth, requireAdmin, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
  }
  const ok = db.updateUsuarioPassword(req.params.id, password);
  if (!ok) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ success: true });
});

app.delete('/api/usuarios/:id', requireAuth, requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }
  const ok = db.deleteUsuario(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ success: true });
});

// Normalizar nombres existentes en el menú (one-time, admin)
app.post('/api/menu/normalizar', requireAuth, requireAdmin, (req, res) => {
  const items = db.getItems();
  let count = 0;
  for (const item of items) {
    db.updateItem(item.id, {
      nombre: toTitleCase(item.nombre),
      categoria: toTitleCase(item.categoria),
    });
    count++;
  }
  res.json({ success: true, normalizados: count });
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
  console.log(`✅ Webhook verificar items: POST http://localhost:${PORT}/webhook/verificar-disponibilidad`);
  console.log(`🔑 Login:                   POST http://localhost:${PORT}/api/auth/login\n`);
});
