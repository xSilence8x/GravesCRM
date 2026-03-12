from flask import Blueprint, request, jsonify
from flask_login import login_required
from app.extensions import db
from app.models import Client
 
clients_bp = Blueprint("clients", __name__)


def client_to_dict(c):
    return {
        "id": c.id,
        "full_name": f"{c.first_name or ''} {c.last_name or ''}".strip() or c.company or "",
        "first_name": c.first_name,
        "last_name": c.last_name,
        "company": c.company,
        "email": c.email or "",
        "phone": c.phone or "",
        "billing_address": c.address or "",
        "notes": c.notes or "",
        "created_at": c.created_at.isoformat(),
    }


@clients_bp.route("/", methods=["GET"])
def get_clients():
    clients = Client.query.order_by(Client.created_at.desc()).all()
    return jsonify(
        {"clients": [client_to_dict(c) for c in clients]}
    )


@clients_bp.route("/<int:client_id>", methods=["GET"])
@login_required
def get_client(client_id):
    c = Client.query.get_or_404(client_id)
    return jsonify(client_to_dict(c))


@clients_bp.route("/", methods=["POST"])
@login_required
def create_client():
    data = request.get_json()
    full_name = data.get("full_name", "")
    parts = full_name.strip().split(" ", 1)
    client = Client(
        first_name=parts[0] if parts else "",
        last_name=parts[1] if len(parts) > 1 else "",
        company=data.get("company"),
        email=data.get("email"),
        phone=data.get("phone"),
        address=data.get("billing_address"),
        notes=data.get("notes"),
    )
    db.session.add(client)
    db.session.commit()
    return jsonify(client_to_dict(client)), 201


@clients_bp.route("/<int:client_id>", methods=["PATCH"])
@login_required
def update_client(client_id):
    c = Client.query.get_or_404(client_id)
    data = request.get_json()

    if "full_name" in data:
        parts = data["full_name"].strip().split(" ", 1)
        c.first_name = parts[0] if parts else ""
        c.last_name = parts[1] if len(parts) > 1 else ""
    if "email" in data:
        c.email = data["email"]
    if "phone" in data:
        c.phone = data["phone"]
    if "billing_address" in data:
        c.address = data["billing_address"]
    if "notes" in data:
        c.notes = data["notes"]
    db.session.commit()
    return jsonify(client_to_dict(c))


@clients_bp.route("/<int:client_id>", methods=["DELETE"])
@login_required
def delete_client(client_id):
    c = Client.query.get_or_404(client_id)
    db.session.delete(c)
    db.session.commit()
    return jsonify(
        {"message": "Klient byl smazán."}
    )