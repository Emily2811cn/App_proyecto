-- Migración: agrega funcionalidad de línea de tiempo y reinicio diario
-- Ejecutar en el servidor UNA SOLA VEZ:
-- psql -U todo_user -d todo_db -h localhost -f migration_01.sql

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS task_updates (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_updates_task_id ON task_updates (task_id, created_at);
