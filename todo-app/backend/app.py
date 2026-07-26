import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "dbname": os.getenv("DB_NAME", "todo_db"),
    "user": os.getenv("DB_USER", "todo_user"),
    "password": os.getenv("DB_PASSWORD", ""),
}


def get_connection():
    return psycopg2.connect(**DB_CONFIG)
    
def log_activity(cur, task_id, task_title, action, details=None):
    cur.execute(
        "INSERT INTO activity_log (task_id, task_title, action, details) "
        "VALUES (%s, %s, %s, %s)",
        (task_id, task_title, action, details),
    )

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Muestra: todas las pendientes (de cualquier día) +
            # las completadas SOLO si fueron completadas hoy.
            # Las completadas de días anteriores quedan fuera del listado
            # (pero no se borran, siguen en la base de datos como historial).
            cur.execute(
                "SELECT id, title, description, completed, completed_at, created_at "
                "FROM tasks "
                "WHERE completed = FALSE "
                "   OR completed_at::date = CURRENT_DATE "
                "ORDER BY completed ASC, created_at DESC"
            )
            tasks = cur.fetchall()
        return jsonify(tasks)
    finally:
        conn.close()


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json(force=True)
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()

    if not title:
        return jsonify({"error": "El título es obligatorio"}), 400

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "INSERT INTO tasks (title, description) VALUES (%s, %s) "
                "RETURNING id, title, description, completed, completed_at, created_at",
                (title, description),
            )
            new_task = cur.fetchone()

        log_activity(cur, new_task["id"], new_task["title"], "creada")
        conn.commit()
        return jsonify(new_task), 201
    finally:
        conn.close()


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    data = request.get_json(force=True)
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id FROM tasks WHERE id = %s", (task_id,))
            if cur.fetchone() is None:
                return jsonify({"error": "Tarea no encontrada"}), 404

            completed = data.get("completed")
            if completed is True:
                # Se marca como hecha ahora mismo
                cur.execute(
                    """
                    UPDATE tasks
                    SET title = COALESCE(%s, title),
                        description = COALESCE(%s, description),
                        completed = TRUE,
                        completed_at = NOW()
                    WHERE id = %s
                    RETURNING id, title, description, completed, completed_at, created_at
                    """,
                    (data.get("title"), data.get("description"), task_id),
                )
            elif completed is False:
                # Se desmarca: vuelve a estar pendiente
                cur.execute(
                    """
                    UPDATE tasks
                    SET title = COALESCE(%s, title),
                        description = COALESCE(%s, description),
                        completed = FALSE,
                        completed_at = NULL
                    WHERE id = %s
                    RETURNING id, title, description, completed, completed_at, created_at
                    """,
                    (data.get("title"), data.get("description"), task_id),
                )
            else:
                cur.execute(
                    """
                    UPDATE tasks
                    SET title = COALESCE(%s, title),
                        description = COALESCE(%s, description)
                    WHERE id = %s
                    RETURNING id, title, description, completed, completed_at, created_at
                    """,
                    (data.get("title"), data.get("description"), task_id),
                )
            updated_task = cur.fetchone()
        accion = "completada" if data.get("completed") else "actualizada"
        log_activity(cur, updated_task["id"], updated_task["title"], accion)
        conn.commit()
        return jsonify(updated_task)
    finally:
        conn.close()


@app.route("/api/tasks/<int:task_id>/updates", methods=["GET"])
def list_task_updates(task_id):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id FROM tasks WHERE id = %s", (task_id,))
            if cur.fetchone() is None:
                return jsonify({"error": "Tarea no encontrada"}), 404

            cur.execute(
                "SELECT id, task_id, note, created_at FROM task_updates "
                "WHERE task_id = %s ORDER BY created_at ASC",
                (task_id,),
            )
            updates = cur.fetchall()
        return jsonify(updates)
    finally:
        conn.close()


@app.route("/api/tasks/<int:task_id>/updates", methods=["POST"])
def create_task_update(task_id):
    data = request.get_json(force=True)
    note = (data.get("note") or "").strip()
    if not note:
        return jsonify({"error": "El avance no puede estar vacío"}), 400

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id FROM tasks WHERE id = %s", (task_id,))
            if cur.fetchone() is None:
                return jsonify({"error": "Tarea no encontrada"}), 404

            cur.execute(
                "INSERT INTO task_updates (task_id, note) VALUES (%s, %s) "
                "RETURNING id, task_id, note, created_at",
                (task_id, note),
            )
            new_update = cur.fetchone()
        conn.commit()
        return jsonify(new_update), 201
    finally:
        conn.close()


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT title FROM tasks WHERE id = %s", (task_id,))
            task = cur.fetchone()
            if task is None:
                return jsonify({"error": "Tarea no encontrada"}), 404

            cur.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
            log_activity(cur, task_id, task["title"], "eliminada")
        conn.commit()
        return "", 204
    finally:
        conn.close()

@app.route("/api/activity", methods=["GET"])
def list_activity():
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, task_id, task_title, action, details, created_at "
                "FROM activity_log ORDER BY created_at DESC LIMIT 100"
            )
            activity = cur.fetchall()
        return jsonify(activity)
    finally:
        conn.close()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
