from flask import Flask, request, jsonify, session, send_from_directory
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import mysql.connector
import mysql.connector.pooling
from datetime import timedelta

app = Flask(__name__, static_folder="static")

#Secret Key to change in production
app.secret_key = "change_this_in_production_use_env_var"

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=2)

bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True, origins=["http://localhost:5000"])

#db_config
db_config = {
    "host":     "localhost",
    "user":     "root",
    "password": "nikhil@123",  
    "database": "auth_system",
}

def get_cursor():
    """Return a fresh cursor, reconnecting if the connection dropped."""
    try:
        conn = mysql.connector.connect(**db_config)
        return conn, conn.cursor(dictionary=True)
    except mysql.connector.Error as e:
        raise RuntimeError(f"DB connection failed: {e}")


#page routes
@app.route("/")
def home():
    return send_from_directory("static", "login.html")

@app.route("/login-page")
def login_page():
    return send_from_directory("static", "login.html")

@app.route("/register-page")
def register_page():
    return send_from_directory("static", "register.html")

@app.route("/dashboard-page")
def dashboard_page():
    return send_from_directory("static", "dashboard.html")


#register
@app.route("/register", methods=["POST"])
def register():
    data     = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    email    = data.get("email",    "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    conn, cursor = get_cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE email=%s OR username=%s",
                       (email, username))
        if cursor.fetchone():
            return jsonify({"message": "Username or email already exists"}), 409

        hashed = bcrypt.generate_password_hash(password).decode("utf-8")
        cursor.execute(
            "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
            (username, email, hashed)
        )
        conn.commit()
        return jsonify({"message": "Registration successful"}), 201
    finally:
        cursor.close()
        conn.close()


#login
@app.route("/login", methods=["POST"])
def login():
    data     = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    remember = data.get("remember", False)

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    conn, cursor = get_cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username=%s", (username,))
        user = cursor.fetchone()

        if not user or not bcrypt.check_password_hash(user["password"], password):
            return jsonify({"message": "Invalid username or password"}), 401

        session.permanent = bool(remember)
        session["user_id"]  = user["id"]
        session["username"] = user["username"]
        session["role"]     = user["role"]

        return jsonify({
            "message":  "Login successful",
            "username": user["username"],
            "role":     user["role"]
        }), 200
    finally:
        cursor.close()
        conn.close()


@app.route("/dashboard", methods=["GET"])
def dashboard():
    if "user_id" not in session:
        return jsonify({"message": "Unauthorized"}), 401
    return jsonify({
        "username": session["username"],
        "role":     session["role"]
    }), 200


@app.route("/profile", methods=["GET"])
def profile():
    if "user_id" not in session:
        return jsonify({"message": "Unauthorized"}), 401

    conn, cursor = get_cursor()
    try:
        cursor.execute(
            "SELECT username, email, role, created_at FROM users WHERE id=%s",
            (session["user_id"],)
        )
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "User not found"}), 404

        # Serialize datetime so JSON doesn't choke
        user["created_at"] = str(user["created_at"])
        return jsonify(user), 200
    finally:
        cursor.close()
        conn.close()


@app.route("/admin/users", methods=["GET"])
def admin_users():
    if "user_id" not in session:
        return jsonify({"message": "Unauthorized"}), 401
    if session.get("role") != "admin":
        return jsonify({"message": "Forbidden – admins only"}), 403

    conn, cursor = get_cursor()
    try:
        cursor.execute(
            "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC"
        )
        users = cursor.fetchall()
        for u in users:
            u["created_at"] = str(u["created_at"])
        return jsonify(users), 200
    finally:
        cursor.close()
        conn.close()


@app.route("/logout", methods=["GET"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True)