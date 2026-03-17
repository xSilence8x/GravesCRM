import os
from flask import Blueprint, request, jsonify
from flask_login import login_required
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models import MaintenanceOrder, AdditionalService, Photo

orders_bp = Blueprint("orders", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "..", "static", "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def service_to_dict(s):
    return {"id": s.id, "order_id": s.order_id, "name": s.name, "price": float(s.price), "note": s.note or ""}


def photo_to_dict(p):
    return {"id": p.id, "order_id": p.order_id, "url": p.url, "type": p.photo_type, "note": p.note or ""}


def order_to_dict(o):
    client_name = ""
    if o.client:
        client_name = f"{o.client.first_name or ''} {o.client.last_name or ''}".strip() or o.client.company or ""
    grave_info = {}
    if o.grave:
        grave_info = {
            "cemetery_name": o.grave.graveyard.name if o.grave.graveyard else "",
            "grave_number": o.grave.grave_number,
        }
    return {
        "id": o.id,
        "client_id": o.client_id,
        "grave_id": o.grave_id,
        "clients": {"full_name": client_name},
        "graves": grave_info,
        "planned_date": o.planned_date.isoformat() if o.planned_date else None,
        "completion_date": o.completion_date.isoformat() if o.completion_date else None,
        "total_price": float(o.total_price),
        "notes": o.notes or "",
        "status": o.status,
        "additional_services": [service_to_dict(s) for s in o.additional_services],
        "photos": [photo_to_dict(p) for p in o.photos],
        "created_at": o.created_at.isoformat(),
    }


@orders_bp.route("/", methods=["GET"])
@login_required
def get_orders():
    orders = MaintenanceOrder.query.order_by(MaintenanceOrder.created_at.desc()).all()
    return jsonify({"orders": [order_to_dict(o) for o in orders]})


@orders_bp.route("/<int:order_id>", methods=["GET"])
@login_required
def get_order(order_id):
    o = MaintenanceOrder.query.get_or_404(order_id)
    return jsonify(order_to_dict(o))


@orders_bp.route("/", methods=["POST"])
@login_required
def create_order():
    data = request.get_json()
    from datetime import date
    planned = data.get("planned_date")
    o = MaintenanceOrder(
        client_id=data["client_id"],
        grave_id=data["grave_id"],
        planned_date=date.fromisoformat(planned) if planned else date.today(),
        notes=data.get("notes", ""),
        status=data.get("status", "planned"),
        total_price=data.get("total_price", 0),
    )
    db.session.add(o)
    db.session.commit()

    # Vytvoření reminderu
    from app.models import Reminder
    reminder = Reminder(
        client_id=o.client_id,
        grave_id=o.grave_id,
        next_date=o.planned_date,
        status="nadcházející",
    )
    db.session.add(reminder)
    db.session.commit()

    return jsonify(order_to_dict(o)), 201


@orders_bp.route("/<int:order_id>", methods=["PATCH"])
@login_required
def update_order(order_id):
    o = MaintenanceOrder.query.get_or_404(order_id)
    data = request.get_json()
    from datetime import date
    if "status" in data:
        o.status = data["status"]
        # Pokud je objednávka dokončena, deaktivuj reminder
        if data["status"] in {"hotový", "completed"}:
            from app.models import Reminder
            reminder = Reminder.query.filter_by(client_id=o.client_id, grave_id=o.grave_id, next_date=o.planned_date).first()
            if reminder:
                reminder.status = "deaktivovaný"
                db.session.commit()
    if "planned_date" in data:
        o.planned_date = date.fromisoformat(data["planned_date"])
    if "completion_date" in data:
        val = data["completion_date"]
        o.completion_date = date.fromisoformat(val) if val else None
    if "total_price" in data:
        o.total_price = data["total_price"]
    if "notes" in data:
        o.notes = data["notes"]
    db.session.commit()
    return jsonify(order_to_dict(o))


@orders_bp.route("/<int:order_id>", methods=["DELETE"])
@login_required
def delete_order(order_id):
    o = MaintenanceOrder.query.get_or_404(order_id)
    db.session.delete(o)
    db.session.commit()
    return jsonify({"message": "Deleted."})


# ── Additional Services ───────────────────────────────────────────────────────

@orders_bp.route("/<int:order_id>/services", methods=["POST"])
@login_required
def add_service(order_id):
    MaintenanceOrder.query.get_or_404(order_id)
    data = request.get_json()
    s = AdditionalService(
        order_id=order_id,
        name=data["name"],
        price=data.get("price", 0),
        note=data.get("note", ""),
    )
    db.session.add(s)
    db.session.commit()
    return jsonify(service_to_dict(s)), 201


# ── Photo upload ──────────────────────────────────────────────────────────────

@orders_bp.route("/<int:order_id>/photos", methods=["POST"])
@login_required
def upload_photo(order_id):
    MaintenanceOrder.query.get_or_404(order_id)
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    file = request.files["file"]
    if not file or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type."}), 400

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    filename = secure_filename(f"{order_id}_{file.filename}")
    file.save(os.path.join(UPLOAD_FOLDER, filename))

    photo_type = request.form.get("type", "před")
    note = request.form.get("note", "")
    url = f"/static/uploads/{filename}"

    p = Photo(order_id=order_id, url=url, photo_type=photo_type, note=note)
    db.session.add(p)
    db.session.commit()
    return jsonify(photo_to_dict(p)), 201