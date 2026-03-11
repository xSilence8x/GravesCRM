from flask import Blueprint, request
from app.extensions import db
from app.models import Client

clients_bp = Blueprint("clients", __name__)

@clients_bp.route("/", methods=["GET"])
def get_clients():
    clients = Client.query.order_by(Client.created_at.desc()).all()
    
    result = []
    for client in clients:
        result.append({
            "id": client.id,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "company": client.company,
            "ico": client.ico,
            "address": client.address,
            "email": client.email,
            "phone": client.phone,
            "note": client.note,
            "created_at": client.created_at.isoformat(),
            "update_at": client.updated_at.isoformat(),
        })
    
    return {"clients": result}


@clients_bp.route("/", methods=["POST"])
def create_client():
    data = request.get_json()

    client = Client(
        first_name = data.get("first_name"),
        last_name = data.get("last_name"),
        company = data.get("company"),
        ico = data.get("ico"),
        address = data.get("address"),
        email = data.get("email"),
        phone = data.get("phone"),
        note = data.get("note"),
    )

    db.session.add(client)
    db.session.commit()

    return {
        "message": "Klient byl uložen.",
        "client": {
            "id": client.id,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "company": client.company,
            "ico": client.ico,
            "address": client.address,
            "email": client.email,
            "phone": client.phone,
            "note": client.note,
        }
    }, 201