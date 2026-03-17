from flask import Blueprint, jsonify, request
from flask_login import login_required
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import Graveyard


graveyards_bp = Blueprint("graveyards", __name__)


def graveyard_to_dict(graveyard: Graveyard):
    return {
        "id": graveyard.id,
        "name": graveyard.name,
        "latitude": graveyard.latitude,
        "longitude": graveyard.longitude,
        "created_at": graveyard.created_at.isoformat(),
    }


@graveyards_bp.route("/", methods=["GET"])
@login_required
def get_graveyards():
    graveyards = Graveyard.query.order_by(Graveyard.name.asc()).all()
    return jsonify({"graveyards": [graveyard_to_dict(g) for g in graveyards]})


@graveyards_bp.route("/", methods=["POST"])
@login_required
def create_graveyard():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if not name:
        return jsonify({"error": "Název hřbitova je povinný."}), 400

    try:
        latitude = float(latitude) if latitude is not None else None
        longitude = float(longitude) if longitude is not None else None
    except (TypeError, ValueError):
        return jsonify({"error": "Souřadnice musí být číslo."}), 400

    graveyard = Graveyard(name=name, latitude=latitude, longitude=longitude)
    db.session.add(graveyard)
    db.session.commit()
    return jsonify(graveyard_to_dict(graveyard)), 201


@graveyards_bp.route("/<int:graveyard_id>", methods=["PATCH"])
@login_required
def update_graveyard(graveyard_id):
    graveyard = Graveyard.query.get_or_404(graveyard_id)
    data = request.get_json() or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Název hřbitova je povinný."}), 400
        graveyard.name = name

    if "latitude" in data:
        try:
            graveyard.latitude = float(data["latitude"]) if data["latitude"] is not None else None
        except (TypeError, ValueError):
            return jsonify({"error": "Souřadnice musí být číslo."}), 400

    if "longitude" in data:
        try:
            graveyard.longitude = float(data["longitude"]) if data["longitude"] is not None else None
        except (TypeError, ValueError):
            return jsonify({"error": "Souřadnice musí být číslo."}), 400

    db.session.commit()
    return jsonify(graveyard_to_dict(graveyard))


@graveyards_bp.route("/<int:graveyard_id>", methods=["DELETE"])
@login_required
def delete_graveyard(graveyard_id):
    graveyard = Graveyard.query.get_or_404(graveyard_id)
    db.session.delete(graveyard)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Hřbitov nelze smazat, protože je přiřazen k hrobům."}), 400

    return jsonify({"message": "Hřbitov byl smazán."})
