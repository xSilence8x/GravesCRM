from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    users = User.query.all()
    print(f"Celkem uživatelů: {len(users)}")
    for u in users:
        print(f"  - {u.email}")
