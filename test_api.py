from app import create_app
from app.routes.graves import get_graves
import json

app = create_app()
ctx = app.app_context()
ctx.push()

# Simuluj login
from unittest.mock import patch
with patch('flask_login.login_required', lambda x: x):
    response = get_graves()
    print("API Response:", response)
