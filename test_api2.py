from app import create_app, db
from app.models import Grave
import json

app = create_app()

with app.test_client() as client:
    # Zkusme bez přihlášení
    response = client.get('/api/graves/')
    print("Status:", response.status_code)
    print("Response:", response.get_json())
