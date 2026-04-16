# extensions.py 
from flask import jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_cors import CORS
from flask_mail import Mail
import ssl


db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
login_manager.session_protection = "strong"
cors = CORS()
mail = Mail()


# SSL Context for Flask-Mail - nutné pro TLS na portu 587
_ssl_context = None

def get_ssl_context():
    """Vrácí SSL context pro TLS připojení"""
    global _ssl_context
    if _ssl_context is None:
        _ssl_context = ssl.create_default_context()
    return _ssl_context


@login_manager.user_loader
def load_user(user_id):
    from app.models import User
    return User.query.get(int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify(
        {"error": "Pro pokračování se přihlašte."}
    ), 401