# Sales App

App de toma de pedidos para vendedores en campo.

## Estructura

```
sales-app/
├── backend/    FastAPI + PostgreSQL
├── mobile/     React Native (Expo)
└── web/        Panel admin (React + Vite)
```

## Levantar backend

```bash
docker-compose up -d
```

API en: http://localhost:8001
Docs: http://localhost:8001/docs

## App móvil

```bash
cd mobile
npm install
npx expo start
```

Escanea el QR con Expo Go.

## Panel web

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

Panel en: http://localhost:3001

## Credenciales por defecto

Al iniciar por primera vez, crear vendedor admin:
```
POST /vendedores
{ "nombre": "Admin", "email": "admin@sales.app", "password": "admin123" }
```
