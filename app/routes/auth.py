from flask import Blueprint, request, jsonify, session, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from app.extensions import db
from app.models import User
 
auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/config", methods=["GET"])
def get_config():
    """Vrátit konfiguraci registrace pro frontend"""
    return jsonify({
        "registration_enabled": current_app.config.get("REGISTRATION_ENABLED", True),
        "environment": current_app.config.get("ENVIRONMENT", "development")
    })

@auth_bp.route("/register", methods=["POST"])
def register():
    if not current_app.config["REGISTRATION_ENABLED"]:
        return jsonify(
            {"error": "Registrace je momentálně zakázána."}
        ), 403
    
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    nickname = data.get("nickname", email.split("@")[0])

    if not email or not password:
        return jsonify(
            {"error": "E-mail a heslo jsou povinné."}
        ), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify(
            {"error": "Tento e-mail už je registrován pod jiným účtem."}
        ), 409
    
    user = User(
        nickname=nickname,
        email=email,
        password_hash=generate_password_hash(password),
    )

    db.session.add(user)
    db.session.commit()

    login_user(user, remember=True)
    return jsonify(
        {"user": {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
        }}
    ), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify(
            {"error": "Neplatný e-mail nebo heslo."}
        ), 401
    
    login_user(user, remember=True)
    return jsonify(
        {"user": {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname
        }}
    )


@auth_bp.route("/logout", methods=["POST"])
def logout():
    logout_user()
    return jsonify(
        {"message": "Byli jste odhlášeni."}
    )


@auth_bp.route("/me", methods=["GET"])
def me():
    if current_user.is_authenticated:
        return jsonify(
            {"user": {
                "id": current_user.id,
                "email": current_user.email,
                "nickname": current_user.nickname
            }}
        )
    
    return jsonify(
        {"user": None}
    ), 200