# 🐾 Petnumy — Backend API

Backend REST de Petnumy construido con **Node.js + Express + Supabase**.

---

## Estructura del proyecto

```
petnumy-backend/
├── src/
│   ├── config/
│   │   └── supabase.js          # Clientes anon y service_role
│   ├── controllers/
│   │   └── auth.controller.js   # Lógica de autenticación
│   ├── middleware/
│   │   ├── auth.middleware.js   # Verificación JWT
│   │   └── error.middleware.js  # Manejo de errores centralizado
│   ├── routes/
│   │   └── auth.routes.js       # Rutas de auth
│   └── app.js                   # Punto de entrada
├── .env.example
├── .gitignore
└── package.json
```

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno
cp .env.example .env
# Edita .env con tus credenciales reales de Supabase

# 3. Arrancar en modo desarrollo (con hot reload)
npm run dev

# 4. Arrancar en producción
npm start
```

---

## Variables de entorno (.env)

| Variable | Dónde encontrarla |
|---|---|
| `PORT` | Puerto local, por defecto `3000` |
| `SUPABASE_URL` | Supabase > Project Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | Supabase > Project Settings > API > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API > service_role secret |
| `CORS_ORIGIN` | URL del frontend Vue, por defecto `http://localhost:5173` |

---

## Referencia de endpoints

### Health check

```
GET /health
```
Respuesta:
```json
{
  "status": "ok",
  "project": "Petnumy API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Autenticación — `/api/auth`

#### `POST /api/auth/registro`
Crea una cuenta nueva.

Body:
```json
{
  "email": "usuario@email.com",
  "password": "minimo6caracteres",
  "nombre": "María",
  "apellidos": "García López"
}
```
Respuesta `201`:
```json
{
  "message": "Cuenta creada correctamente. Revisa tu email para confirmarla.",
  "usuario": { "id": "uuid", "email": "...", "nombre": "...", "apellidos": "..." }
}
```

---

#### `POST /api/auth/login`
Inicia sesión y devuelve los tokens.

Body:
```json
{
  "email": "usuario@email.com",
  "password": "mipassword"
}
```
Respuesta `200`:
```json
{
  "message": "Login correcto",
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_at": 1234567890
  },
  "usuario": { "id": "uuid", "email": "...", "nombre": "...", "foto": null }
}
```

---

#### `POST /api/auth/refresh`
Renueva el access_token.

Body:
```json
{ "refresh_token": "eyJ..." }
```

---

#### `POST /api/auth/logout` 🔒
Cierra la sesión activa.

Header: `Authorization: Bearer <access_token>`

---

#### `GET /api/auth/me` 🔒
Devuelve el perfil del usuario autenticado.

Header: `Authorization: Bearer <access_token>`

Respuesta `200`:
```json
{
  "usuario": {
    "id": "uuid",
    "email": "usuario@email.com",
    "nombre": "María",
    "apellidos": "García López",
    "foto": null,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### `PATCH /api/auth/me` 🔒
Actualiza nombre, apellidos o foto del perfil.

Header: `Authorization: Bearer <access_token>`

Body (todos los campos son opcionales):
```json
{
  "nombre": "María",
  "apellidos": "García",
  "foto": "https://..."
}
```

---

> 🔒 Los endpoints marcados con este icono requieren el header `Authorization: Bearer <token>`

---

## Próximos módulos

- `POST /api/mascotas` — gestión de mascotas
- `GET  /api/clinicas` — búsqueda de clínicas
- `POST /api/citas`    — reservas de citas
- `GET  /api/vacunas`  — catálogo y estado de vacunas
