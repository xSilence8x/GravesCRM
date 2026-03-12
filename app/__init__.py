import os
from flask import Flask, send_from_directory

from app.config import Config
from app.extensions import db, migrate, login_manager, cors
from app.routes.auth import auth_bp
from app.routes.clients import clients_bp
from app.routes.graves import graves_bp
from app.routes.invoices import invoices_bp
from app.routes.orders import orders_bp
from app.routes.reminders import reminders_bp


def create_app():
    # Point Flask static folder to the React build output
    app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(__file__), "static", "react"),
        static_url_path="",
    )
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)
    
    # CORS
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    from app import models

    migrate.init_app(app, db)

    from app.routes.auth import auth_bp
    from app.routes.clients import clients_bp

    # API blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(clients_bp, url_prefix="/api/clients")
    app.register_blueprint(graves_bp, url_prefix="/api/graves")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(invoices_bp, url_prefix="/api/invoices")
    app.register_blueprint(reminders_bp, url_prefix="/api/reminders")

    # Serve React app
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        static_dir = app.static_folder
        file_path = os.path.join(static_dir, path)

        if path and os.path.exists(file_path):
            return send_from_directory(static_dir, path)
        
        return send_from_directory(static_dir, "index.html")

    return app