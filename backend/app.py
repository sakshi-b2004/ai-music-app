from flask import Flask, request, jsonify, send_from_directory
import sqlite3

# IMPORTANT: frontend parent folder me hai
app = Flask(__name__, static_folder="../")

# =========================
# FRONTEND SERVE
# =========================
@app.route("/")
def home():
    return send_from_directory("../", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory("../", path)

# =========================
# DB INIT
# =========================
def init_db():
    conn = sqlite3.connect("database.db")
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS history(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        title TEXT,
        videoId TEXT
    )''')

    conn.commit()
    conn.close()

init_db()

# =========================
# REGISTER
# =========================
@app.route("/register", methods=["POST"])
def register():
    data = request.json

    conn = sqlite3.connect("database.db")
    c = conn.cursor()

    try:
        c.execute("INSERT INTO users(username,password) VALUES(?,?)",
                  (data["username"], data["password"]))
        conn.commit()
        return jsonify({"status":"success"})
    except:
        return jsonify({"status":"exists"})
    finally:
        conn.close()

# =========================
# LOGIN
# =========================
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    conn = sqlite3.connect("database.db")
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE username=? AND password=?",
              (data["username"], data["password"]))

    user = c.fetchone()
    conn.close()

    return jsonify({"status":"success" if user else "fail"})

# =========================
# SAVE HISTORY
# =========================
@app.route("/save-history", methods=["POST"])
def save_history():
    data = request.json

    if not data.get("username"):
        return jsonify({"status":"no-user"})

    conn = sqlite3.connect("database.db")
    c = conn.cursor()

    c.execute(
        "INSERT INTO history(username,title,videoId) VALUES(?,?,?)",
        (data["username"], data["title"], data["videoId"])
    )

    conn.commit()
    conn.close()

    return jsonify({"status":"saved"})

# =========================
# GET HISTORY
# =========================
@app.route("/get-history/<username>")
def get_history(username):
    conn = sqlite3.connect("database.db")
    c = conn.cursor()

    c.execute(
        "SELECT title, videoId FROM history WHERE username=? ORDER BY id DESC LIMIT 20",
        (username,)
    )

    data = c.fetchall()
    conn.close()

    return jsonify(data)

# =========================
# RUN
# =========================
if __name__ == "__main__":
    print("🚀 Server starting...")
    app.run(debug=True, host="127.0.0.1", port=5000)