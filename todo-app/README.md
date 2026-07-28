# To-Do List App

SPA de gestión de tareas con CRUD completo y filtro en tiempo real.

## Stack
- **Frontend:** HTML + CSS + JavaScript vanilla (SPA, sin frameworks)
- **Backend:** Python + Flask (API REST)
- **Base de datos:** PostgreSQL

## Estructura
```
todo-app/
├── backend/
│   ├── app.py            # API Flask (endpoints CRUD)
│   ├── wsgi.py           # Entry point para gunicorn
│   ├── schema.sql        # Script de creación de la tabla tasks
│   ├── requirements.txt  # Dependencias Python
│   └── .env.example      # Variables de entorno (copiar a .env)
└── frontend/
    ├── index.html
    ├── style.css
    ├── app.js
    └── config.js         # URL del API (ajustar en producción)
```

## Ejecución local

### 1. Base de datos
```bash
sudo -u postgres psql
CREATE DATABASE todo_db;
CREATE USER todo_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE todo_db TO todo_user;
\q

psql -U todo_user -d todo_db -f backend/schema.sql
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # y edita con tus credenciales
python app.py
```
La API queda disponible en `http://localhost:5000/api`.

### 3. Frontend
Solo abre `frontend/index.html` en el navegador, o sírvelo con:
```bash
cd frontend
python -m http.server 8080
```

## Endpoints de la API
| Método | Ruta               | Descripción             |
|--------|---------------------|--------------------------|
| GET    | /api/tasks           | Lista todas las tareas  |
| POST   | /api/tasks           | Crea una tarea          |
| PUT    | /api/tasks/:id        | Actualiza una tarea     |
| DELETE | /api/tasks/:id        | Elimina una tarea       |
| GET    | /api/health           | Chequeo de salud        |

## Próximos pasos (fuera de este entregable)
- Desplegar en el VPS: Nginx sirviendo `frontend/`, backend corriendo con gunicorn + systemd, PostgreSQL local.
- Pipeline de GitHub Actions para el despliegue automático por SSH/rsync.


#
