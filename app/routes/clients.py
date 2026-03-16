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
        "ico": c.ico or "",
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
    client = Client(
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        company=data.get("company", ""),
        ico=data.get("ico", ""),
        email=data.get("email", ""),
        phone=data.get("phone", ""),
        address=data.get("billing_address", ""),
        notes=data.get("notes", ""),
    )
    db.session.add(client)
    db.session.commit()
    return jsonify(client_to_dict(client)), 201


@clients_bp.route("/<int:client_id>", methods=["PATCH"])
@login_required
def update_client(client_id):
    c = Client.query.get_or_404(client_id)
    data = request.get_json()

    if "first_name" in data:
        c.first_name = data["first_name"]
    if "last_name" in data:
        c.last_name = data["last_name"]
    if "company" in data:
        c.company = data["company"]
    if "ico" in data:
        c.ico = data["ico"]
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