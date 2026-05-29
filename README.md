# Petnumy

<div align="center">

<img src="./frontend/src/assets/logo/Logo%20Petnumy.png" alt="Petnumy Logo" width="180"/>

### Gestión inteligente para el cuidado de mascotas

Aplicación web desarrollada como Trabajo de Fin de Grado (TFG) para facilitar la gestión sanitaria y el seguimiento de mascotas.

![Vue 3](https://img.shields.io/badge/Vue%203-42b883?style=for-the-badge\&logo=vuedotjs\&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge\&logo=supabase\&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge\&logo=vercel)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge\&logo=render\&logoColor=000000)

</div>

---

## Descripción

Petnumy es una plataforma desarrollada como Trabajo de Fin de Grado (TFG) cuyo objetivo es ayudar a los propietarios de mascotas a gestionar toda la información relacionada con su salud y bienestar desde una única aplicación.

La plataforma permite administrar mascotas, controlar vacunas, generar recordatorios, gestionar citas veterinarias y localizar clínicas cercanas mediante una interfaz moderna, intuitiva y completamente responsive.

---

## Funcionalidades principales

### Gestión de mascotas

* Crear mascotas
* Editar información
* Eliminar mascotas
* Historial completo de cada mascota
* Gestión de fotografías de perfil

### Control de vacunas

* Registro de vacunas
* Historial de vacunación
* Estado de vacunas:

  * Al día
  * Pendiente
  * Atrasada
* Cálculo automático de próximas dosis
* Certificados de vacunación

### Recordatorios

* Sistema de recordatorios personalizados
* Configuración por:

  * Minutos
  * Horas
  * Días
  * Semanas
  * Meses
* Avisos previos a la administración de vacunas

### Gestión de citas

* Solicitud de citas veterinarias
* Calendario personalizado
* Selección de fecha y hora
* Gestión de revisiones y consultas

### Clínicas veterinarias

* Búsqueda de clínicas cercanas
* Visualización en mapa interactivo
* Ordenación por relevancia, distancia y valoración
* Filtros por urgencias y peluquería
* Ficha detallada de cada clínica

### Configuración

* Gestión de perfil
* Cambio de idioma
* Modo claro y oscuro

---

## Tecnologías utilizadas

### Frontend

* Vue 3
* Composition API
* Vue Router
* Pinia
* Axios
* Leaflet
* Vite

### Backend

* Node.js
* Express.js
* JWT Authentication
* REST API

### Base de datos

* PostgreSQL
* Supabase

### Despliegue

* Frontend: Vercel
* Backend: Render

---

## Estructura del proyecto

```text
Petnumy
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.js
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── services/
│   └── app.js
│
└── README.md
```

---

## Instalación

### Clonar repositorio

```bash
git clone https://github.com/code-deivid/Petnumy.git
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicación disponible en:

```text
http://localhost:5173
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Servidor disponible en:

```text
http://localhost:3000
```

---

## Variables de entorno

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

### Backend (.env)

```env
PORT=3000

SUPABASE_URL=
SUPABASE_ANON_KEY=

JWT_SECRET=
```

---

## Diseño Responsive

La aplicación ha sido diseñada siguiendo una filosofía responsive para ofrecer una experiencia óptima en:

* Smartphones
* Tablets
* Equipos de escritorio

---

## Trabajo de Fin de Grado

Proyecto desarrollado para aplicar conocimientos relacionados con:

* Desarrollo Frontend
* Desarrollo Backend
* Bases de Datos
* APIs REST
* Autenticación JWT
* UX/UI
* Responsive Design

---

## Autor

**David Mejías**

Desarrollo de Aplicaciones Web (DAW)

