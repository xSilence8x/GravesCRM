from flask import Blueprint, request, jsonify, session, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from datetime import datetime, timedelta
from app.extensions import db
from app.models import User
from app.services.email_service import send_password_reset_email
 
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

    # Při registraci taky nastavit permanent session
    session.permanent = True
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
    remember_me = data.get("remember_me", False)

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify(
            {"error": "Neplatný e-mail nebo heslo."}
        ), 401
    
    # Pokud je "Remember me" zaškrtnuté, nastavit session jako permanent
    if remember_me:
        session.permanent = True
    
    login_user(user, remember=remember_me)
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
        {"error": "Uživatel není přihlášen."}
    ), 401


def generate_password_reset_token(email: str) -> str:
    """Generuje token pro obnovu hesla"""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='password-reset-salt')


def verify_password_reset_token(token: str, expiration: int = 3600) -> str | None:
    """Ověřuje token pro obnovu hesla. Expiration je v sekundách (default 1 hodina)"""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(token, salt='password-reset-salt', max_age=expiration)
        return email
    except (SignatureExpired, BadSignature):
        return None


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Požadavek na obnovu hesla - uživatel zadá svůj e-mail"""
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    
    if not email:
        return jsonify(
            {"error": "E-mail je povinný."}
        ), 400
    
    user = User.query.filter_by(email=email).first()
    
    # Vrátit vždy stejnou zprávu (z bezpečnostních důvodů)
    if not user:
        return jsonify(
            {"message": "Pokud je e-mail registrován, obdrží instrukcí na obnovení hesla."}
        ), 200
    
    # Generovat token
    token = generate_password_reset_token(email)
    user.password_reset_token = token
    user.password_reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    
    db.session.commit()
    
    # Odeslat email s reset linkem
    email_sent = send_password_reset_email(email, token)
    
    if not email_sent:
        current_app.logger.warning(f"Neúspěšné odeslání reset emailu pro {email}")
    
    return jsonify(
        {"message": "Pokud je e-mail registrován, obdrží instrukcí na obnovení hesla."}
    ), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """Resetování hesla pomocí tokenu"""
    data = request.get_json()
    token = data.get("token", "").strip()
    new_password = data.get("password", "")
    
    if not token or not new_password:
        return jsonify(
            {"error": "Token a heslo jsou povinné."}
        ), 400
    
    if len(new_password) < 6:
        return jsonify(
            {"error": "Heslo musí mít alespoň 6 znaků."}
        ), 400
    
    # Ověřit token
    email = verify_password_reset_token(token)
    if not email:
        return jsonify(
            {"error": "Platnost tokenu vypršela nebo je token neplatný."}
        ), 400
    
    user = User.query.filter_by(email=email).first()
    if not user or user.password_reset_token != token:
        return jsonify(
            {"error": "Token je neplatný."}
        ), 400
    
    # Zkontrolovat expiraci tokenu v DB
    if user.password_reset_token_expiry and user.password_reset_token_expiry < datetime.utcnow():
        return jsonify(
            {"error": "Platnost tokenu vypršela."}
        ), 400
    
    # Aktualizovat heslo
    user.password_hash = generate_password_hash(new_password)
    user.password_reset_token = None
    user.password_reset_token_expiry = None
    
    db.session.commit()
    
    return jsonify(
        {"message": "Heslo bylo úspěšně změněno. Nyní se můžete přihlásit novým heslem."}
    ), 200


@auth_bp.route("/verify-reset-token", methods=["POST"])
def verify_reset_token():
    """Ověří, jestli je token ještě platný (bez resetování hesla)"""
    data = request.get_json()
    token = data.get("token", "").strip()
    
    if not token:
        return jsonify(
            {"error": "Token je povinný."}
        ), 400
    
    email = verify_password_reset_token(token)
    if not email:
        return jsonify(
            {"error": "Token je neplatný nebo vypršel."}
        ), 400
    
    user = User.query.filter_by(email=email).first()
    if not user or user.password_reset_token != token:
        return jsonify(
            {"error": "Token je neplatný."}
        ), 400
    
    if user.password_reset_token_expiry and user.password_reset_token_expiry < datetime.utcnow():
        return jsonify(
            {"error": "Token vypršel."}
        ), 400
    
    return jsonify(
        {"valid": True}
    ), 200