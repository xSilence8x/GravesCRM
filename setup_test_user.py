from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Nastav heslo všem uživatelům
    test_password = "test123"
    users = User.query.all()
    
    for user in users:
        user.password_hash = generate_password_hash(test_password)
        print(f"✓ {user.email}: heslo nastaveno na {test_password}")
    
    db.session.commit()
    print("\n✓ Všechna hesla nastavena!")
