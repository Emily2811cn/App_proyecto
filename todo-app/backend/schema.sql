-- Esquema de base de datos para la aplicación To-Do List
-- Ejecutar como: psql -U todo_user -d todo_db -f schema.sql

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at DESC);

-- Línea de tiempo / avances de cada tarea
CREATE TABLE IF NOT EXISTS task_updates (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_updates_task_id ON task_updates (task_id, created_at);
