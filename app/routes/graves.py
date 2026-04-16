import os
from flask import Blueprint, request, jsonify
from flask_login import login_required
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models import Grave, Graveyard, Photo, AdditionalService

graves_bp = Blueprint("graves", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def photo_to_dict(p):
    return {"id": p.id, "grave_id": p.grave_id, "url": p.url, "type": p.photo_type, "note": p.note or ""}


def service_to_dict(s):
    return {"id": s.id, "grave_id": s.grave_id, "name": s.name, "price": float(s.price), "note": s.note or ""}


def grave_to_dict(g):
    client_name = ""
    if g.client:
        client_name = f"{g.client.first_name or ''} {g.client.last_name or ''}".strip() or g.client.company or ""
    cemetery_name = g.graveyard.name if g.graveyard else ""
    
    # Načti reminders pro tento hrob
    reminders = []
    if g.reminders:
        reminders = [
            {
                "id": r.id,
                "next_date": r.next_date.isoformat() if r.next_date else None,
                "status": r.status,
            }
            for r in g.reminders
        ]
    
    # Načti fotky
    photos = [photo_to_dict(p) for p in g.photos] if g.photos else []
    
    # Načti additional_services
    services = [service_to_dict(s) for s in g.additional_services] if g.additional_services else []
    
    return {
        "id": g.id,
        "client_id": g.client_id,
        "graveyard_id": g.graveyard_id,
        "clients": {"full_name": client_name},
        "graveyard": {"name": cemetery_name},
        "cemetery_name": cemetery_name,
        "name_on_grave": g.name_on_grave,
        "grave_number": g.grave_number,
        "latitude": g.latitude,
        "longitude": g.longitude,
        "cleaning_frequency": g.cleaning_frequency,
        "custom_frequency_months": g.custom_frequency_months,
        "base_price": float(g.base_price),
        "notes": g.notes or "",
        "status": g.status,
        "completion_date": g.completion_date.isoformat() if g.completion_date else None,
        "photos": photos,
        "additional_services": services,
        "reminders": reminders,
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
    graveyard_id = data.get("graveyard_id")

    if not graveyard_id and data.get("cemetery_name"):
        graveyard = Graveyard.query.filter_by(name=data.get("cemetery_name")).first()
        graveyard_id = graveyard.id if graveyard else None

    if not graveyard_id:
        return jsonify({"error": "Hřbitov je povinný."}), 400

    g = Grave(
        client_id=int(data["client_id"]),
        graveyard_id=int(graveyard_id),
        name_on_grave=data.get("name_on_grave"),
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
    
    if "graveyard_id" in data:
        g.graveyard_id = int(data["graveyard_id"])

    for field in ["client_id", "name_on_grave", "grave_number", "latitude", "longitude",
                  "cleaning_frequency", "custom_frequency_months", "base_price", "notes", "status"]:
        if field in data:
            setattr(g, field, data[field])
    
    # Aktualizuj completion_date pokud je status "dokončeno"
    if "completion_date" in data:
        from datetime import date
        val = data["completion_date"]
        g.completion_date = date.fromisoformat(val) if val else None
    
    db.session.commit()
    return jsonify(grave_to_dict(g))


@graves_bp.route("/<int:grave_id>", methods=["DELETE"])
@login_required
def delete_grave(grave_id):
    g = Grave.query.get_or_404(grave_id)
    db.session.delete(g)
    db.session.commit()
    return jsonify({"message": "Deleted."})


# ── Photo Management ───────────────────────────────────────────────────────

@graves_bp.route("/<int:grave_id>/photos", methods=["POST"])
@login_required
def upload_photo(grave_id):
    g = Grave.query.get_or_404(grave_id)
    
    if "file" not in request.files:
        return jsonify({"error": "Soubor chybí."}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Soubor nebyl vybrán."}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Nepodporovaný formát souboru."}), 400
    
    # Vytvoř upload folder pokud neexistuje
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    
    # Uloži soubor se zabezpečeným jménem
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    # Vytvoř Photo záznam v DB
    photo = Photo(
        grave_id=grave_id,
        url=f"/static/uploads/{filename}",
        photo_type=request.form.get("photo_type", "před"),
        note=request.form.get("note", ""),
    )
    db.session.add(photo)
    db.session.commit()
    
    return jsonify(photo_to_dict(photo)), 201


@graves_bp.route("/photos/<int:photo_id>", methods=["DELETE"])
@login_required
def delete_photo(photo_id):
    photo = Photo.query.get_or_404(photo_id)
    
    # Smaž fyzický soubor
    try:
        filepath = os.path.join(os.path.dirname(__file__), "..", "static", "uploads", os.path.basename(photo.url))
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception as e:
        print(f"Chyba při smazání souboru: {e}")
    
    db.session.delete(photo)
    db.session.commit()
    return jsonify({"message": "Deleted."})


# ── Additional Services ────────────────────────────────────────────────────

@graves_bp.route("/<int:grave_id>/services", methods=["POST"])
@login_required
def add_service(grave_id):
    Grave.query.get_or_404(grave_id)
    data = request.get_json()
    s = AdditionalService(
        grave_id=grave_id,
        name=data["name"],
        price=data.get("price", 0),
        note=data.get("note", ""),
    )
    db.session.add(s)
    db.session.commit()
    return jsonify(service_to_dict(s)), 201


@graves_bp.route("/services/<int:service_id>", methods=["DELETE"])
@login_required
def delete_service(service_id):
    service = AdditionalService.query.get_or_404(service_id)
    db.session.delete(service)
    db.session.commit()
    return jsonify({"message": "Deleted."})