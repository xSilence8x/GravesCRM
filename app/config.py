import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    JSON_AS_ASCII = False

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_OAUTH_REDIRECT_URI = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:5000/api/google-calendar/oauth/callback")
    GOOGLE_TOKEN_ENCRYPTION_KEY = os.getenv("GOOGLE_TOKEN_ENCRYPTION_KEY", "")
    FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")

    # Email Configuration
    MAIL_SERVER = os.getenv("MAIL_SERVER", "localhost")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "noreply@gravecare.local")

    REGISTRATION_ENABLED = os.getenv("REGISTRATION_ENABLED", "true").lower() == "true"
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")  # development, staging, production

    # Flask-Login session configuration
    # Jak dlouho trvá session (pro "Remember me" je jinak)
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)  # 30 dní pro "Remember me"
    SESSION_COOKIE_SECURE = False  # Pro localhost (vývojové prostředí)
    SESSION_COOKIE_HTTPONLY = True  # Jen HTTP, ne JavaScript
    SESSION_COOKIE_SAMESITE = "Lax"  # CSRF ochrana
    REMEMBER_COOKIE_DURATION = timedelta(days=30)  # Cookie trvá 30 dní