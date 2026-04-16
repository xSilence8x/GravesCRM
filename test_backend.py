from app import create_app, db
from app.models import User, Grave
import json

app = create_app()

# Vytvoř test uživatele
with app.app_context():
    # Zkontroluj, zda existuje uživatel
    user = User.query.first()
    if not user:
        print("❌ V DB není žádný uživatel!")
        exit(1)
    print(f"✓ Uživatel: {user.email}")

# Test s Flask test client
with app.test_client() as client:
    # 1. Přihlášení
    print("\n1. Přihlášení...")
    response = client.post('/api/auth/login', json={
        'email': user.email,
        'password': 'test123'  # Heslo které jsme právě nastavili
    })
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.get_json()}")
    
    # 2. Zavolej /api/graves/
    print("\n2. Načítání hrobů...")
    response = client.get('/api/graves/')
    print(f"   Status: {response.status_code}")
    data = response.get_json()
    if data:
        if 'graves' in data:
            print(f"   Počet hrobů: {len(data['graves'])}")
            for g in data['graves'][:2]:
                print(f"     - {g.get('grave_number')}: {g.get('cemetery_name')}")
        else:
            print(f"   Response: {data}")
    else:
        print(f"   Žádná data")
