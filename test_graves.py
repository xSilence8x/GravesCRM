from app import create_app, db
from app.models import Grave

app = create_app()
ctx = app.app_context()
ctx.push()

graves = db.session.query(Grave).all()
print("Graves in DB:", len(graves))
for g in graves[:5]:
    if g.client:
        client_name = getattr(g.client, 'full_name', None) or f"{g.client.first_name} {g.client.last_name}".strip()
    else:
        client_name = "no client"
    print(f"  ID {g.id}: {g.grave_number} - {client_name}")
