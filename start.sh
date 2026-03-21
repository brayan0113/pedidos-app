#!/bin/bash
# Script para arrancar backend + frontend juntos

echo "🚀 Iniciando Pedidos WhatsApp App..."
echo ""

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
  echo "❌ Node.js no encontrado. Instálalo desde https://nodejs.org"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Instalar dependencias si no existen
if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
  echo "📦 Instalando dependencias del backend..."
  cd "$SCRIPT_DIR/backend" && npm install
fi

if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
  echo "📦 Instalando dependencias del frontend..."
  cd "$SCRIPT_DIR/frontend" && npm install
fi

echo ""
echo "✅ Backend: http://localhost:3001"
echo "✅ Frontend: http://localhost:5173"
echo "📲 Webhook n8n: POST http://localhost:3001/webhook/pedido"
echo ""
echo "Presiona Ctrl+C para detener"
echo ""

# Arrancar backend en background
cd "$SCRIPT_DIR/backend" && npm start &
BACKEND_PID=$!

# Pequeña espera para que el backend inicie
sleep 2

# Arrancar frontend
cd "$SCRIPT_DIR/frontend" && npm run dev

# Al salir, matar el backend
kill $BACKEND_PID 2>/dev/null
