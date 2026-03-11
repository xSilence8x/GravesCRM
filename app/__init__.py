from flask import Flask
from app.config import Config
from app.extensions import db, migrate, login_manager

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)

    from app import models

    migrate.init_app(app, db)

    from app.routes.auth import auth_bp
    from app.routes.clients import clients_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(clients_bp, url_prefix="/api/clients")

    @app.route("/")
    def home():
        return {"message": "CRM API is running"}

    return app