from flask import Blueprint, request, jsonify
from flask_login import login_required
from app.extensions import db
from app.models import Reminder

reminders_bp = Blueprint("reminders", __name__)

# Map from React English values to any stored values (keep English)
VALID_STATUSES = {"upcoming", "due-soon", "overdue"}


def reminder_to_dict(r):
    client_name = ""
    if r.client:
        client_name = f"{r.client.first_name or ''} {r.client.last_name or ''}".strip() or r.client.company or ""
    grave_data = {}
    if r.grave:
        grave_data = {
            "cemetery_name": r.grave.graveyard.name if r.grave.graveyard else "",
            "name_on_grave": r.grave.name_on_grave,
            "grave_number": r.grave.grave_number,
            "base_price": float(r.grave.base_price),
            "cleaning_frequency": r.grave.cleaning_frequency,
        }
    return {
        "id": r.id,
        "client_id": r.client_id,
        "grave_id": r.grave_id,
        "clients": {"full_name": client_name},
        "graves": grave_data,
        "next_date": r.next_date.isoformat() if r.next_date else None,
        "status": r.status,
        "created_at": r.created_at.isoformat(),
    }


@reminders_bp.route("/", methods=["GET"])
@login_required
def get_reminders():
    reminders = Reminder.query.order_by(Reminder.next_date.asc()).all()
    return jsonify({"reminders": [reminder_to_dict(r) for r in reminders]})


@reminders_bp.route("/", methods=["POST"])
@login_required
def create_reminder():
    data = request.get_json()
    from datetime import date
    status = data.get("status", "upcoming")
    r = Reminder(
        client_id=data["client_id"],
        grave_id=data["grave_id"],
        next_date=date.fromisoformat(data["next_date"]),
        status=status,
    )
    db.session.add(r)
    db.session.commit()
    return jsonify(reminder_to_dict(r)), 201


@reminders_bp.route("/<int:reminder_id>", methods=["PATCH"])
@login_required
def update_reminder(reminder_id):
    r = Reminder.query.get_or_404(reminder_id)
    data = request.get_json()
    from datetime import date
    if "next_date" in data:
        r.next_date = date.fromisoformat(data["next_date"])
    if "status" in data:
        r.status = data["status"]
    db.session.commit()
    return jsonify(reminder_to_dict(r))