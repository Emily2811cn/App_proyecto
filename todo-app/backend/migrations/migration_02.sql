-- Migración: tabla de historial/auditoría de acciones sobre las tareas
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    task_id INTEGER,
    task_title VARCHAR(255) NOT NULL,
    action VARCHAR(20) NOT NULL,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at DESC);
 