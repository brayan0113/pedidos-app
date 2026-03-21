# 📦 Pedidos WhatsApp App

App web responsive para visualizar y gestionar pedidos recibidos por WhatsApp via n8n.

## Arquitectura

```
WhatsApp → n8n (agente) → POST /webhook/pedido → Backend (Express + SQLite) → Frontend (React)
```

## Inicio rápido

```bash
chmod +x start.sh
./start.sh
```

Abre http://localhost:5173 en tu navegador (funciona en móvil también).

---

## Configurar n8n

En tu workflow de n8n, agrega un nodo **HTTP Request** con:

- **Method:** POST
- **URL:** `http://TU_IP:3001/webhook/pedido`

### Cuerpo del JSON (ejemplo):

```json
{
  "cliente": "Juan Pérez",
  "telefono": "573001234567",
  "productos": [
    { "nombre": "Hamburguesa clásica", "cantidad": 2, "precio": 15000 },
    { "nombre": "Gaseosa", "cantidad": 2, "precio": 4000 }
  ],
  "total": 38000,
  "direccion": "Calle 10 # 5-20",
  "notas": "Sin cebolla por favor",
  "fuente": "whatsapp"
}
```

### Mapeo desde variables de n8n:

```json
{
  "cliente": "{{ $json.nombreCliente }}",
  "telefono": "{{ $json.telefono }}",
  "productos": "{{ $json.productos }}",
  "total": "{{ $json.total }}",
  "direccion": "{{ $json.direccion }}",
  "notas": "{{ $json.notas }}"
}
```

---

## Estados de pedidos

| Estado | Color | Descripción |
|--------|-------|-------------|
| `nuevo` | 🔵 Azul | Recién llegado |
| `en_proceso` | 🟡 Amarillo | En preparación |
| `listo` | 🟢 Verde | Listo para entregar |
| `entregado` | 🟣 Morado | Entregado al cliente |
| `cancelado` | 🔴 Rojo | Cancelado |

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/webhook/pedido` | Recibir pedido desde n8n |
| GET | `/api/pedidos` | Listar todos los pedidos |
| GET | `/api/pedidos?estado=nuevo` | Filtrar por estado |
| GET | `/api/pedidos/:id` | Ver un pedido |
| PATCH | `/api/pedidos/:id/estado` | Cambiar estado |
| DELETE | `/api/pedidos/:id` | Eliminar pedido |
| GET | `/api/stats` | Estadísticas |

---

## Instalación manual

```bash
# Backend
cd backend
npm install
npm start

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```
