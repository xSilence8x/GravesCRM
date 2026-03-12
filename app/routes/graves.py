from flask import Blueprint, request, jsonify
from flask_login import login_required
from app.extensions import db
from app.models import Grave, Client

graves_bp = Blueprint("graves", __name__)


def grave_to_dict(g):
    client_name = ""
    if g.client:
        client_name = f"{g.client.first_name or ''} {g.client.last_name or ''}".strip() or g.client.company or ""
    return {
        "id": g.id,
        "client_id": g.client_id,
        "clients": {"full_name": client_name},
        "cemetery_name": g.cemetery_name,
        "grave_number": g.grave_number,
        "latitude": g.latitude,
        "longitude": g.longitude,
        "cleaning_frequency": g.cleaning_frequency,
        "custom_frequency_months": g.custom_frequency_months,
        "base_price": float(g.base_price),
        "notes": g.notes or "",
        "created_at": g.created_at.isoformat(),
    }


@graves_bp.route("/", methods=["GET"])
@login_required
def get_graves():
    graves = Grave.query.order_by(Grave.created_at.desc()).all()
    return jsonify({"graves": [grave_to_dict(g) for g in graves]})


@graves_bp.route("/<int:grave_id>", methods=["GET"])
@login_required
def get_grave(grave_id):
    g = Grave.query.get_or_404(grave_id)
    return jsonify(grave_to_dict(g))


@graves_bp.route("/", methods=["POST"])
@login_required
def create_grave():
    data = request.get_json()
    g = Grave(
        client_id=data["client_id"],
        cemetery_name=data["cemetery_name"],
        grave_number=data["grave_number"],
        latitude=data.get("latitude", 49.170529),
        longitude=data.get("longitude", 16.594459),
        cleaning_frequency=data.get("cleaning_frequency", "2x"),
        custom_frequency_months=data.get("custom_frequency_months"),
        base_price=data.get("base_price", 0),
        notes=data.get("notes", ""),
    )
    db.session.add(g)
    db.session.commit()
    return jsonify(grave_to_dict(g)), 201


@graves_bp.route("/<int:grave_id>", methods=["PATCH"])
@login_required
def update_grave(grave_id):
    g = Grave.query.get_or_404(grave_id)
    data = request.get_json()
    for field in ["client_id", "cemetery_name", "grave_number", "latitude", "longitude",
                  "cleaning_frequency", "custom_frequency_months", "base_price", "notes"]:
        if field in data:
            setattr(g, field, data[field])
    db.session.commit()
    return jsonify(grave_to_dict(g))


@graves_bp.route("/<int:grave_id>", methods=["DELETE"])
@login_required
def delete_grave(grave_id):
    g = Grave.query.get_or_404(grave_id)
    db.session.delete(g)
    db.session.commit()
    return jsonify({"message": "Deleted."})