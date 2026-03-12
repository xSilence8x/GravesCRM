from flask import Blueprint, request, jsonify
from flask_login import login_required
from app.extensions import db
from app.models import Invoice

invoices_bp = Blueprint("invoices", __name__)


def invoice_to_dict(i):
    order_data = None
    if i.order:
        o = i.order
        client_name = ""
        if o.client:
            client_name = f"{o.client.first_name or ''} {o.client.last_name or ''}".strip() or o.client.company or ""
        order_data = {
            "id": o.id,
            "total_price": float(o.total_price),
            "clients": {
                "full_name": client_name,
                "billing_address": o.client.address or "" if o.client else "",
                "email": o.client.email or "" if o.client else "",
                "phone": o.client.phone or "" if o.client else "",
            },
            "graves": {
                "cemetery_name": o.grave.cemetery_name if o.grave else "",
                "grave_number": o.grave.grave_number if o.grave else "",
            },
            "additional_services": [
                {"id": s.id, "name": s.name, "price": float(s.price), "note": s.note or ""}
                for s in o.additional_services
            ],
        }
    return {
        "id": i.id,
        "order_id": i.order_id,
        "invoice_number": i.invoice_number,
        "issue_date": i.issue_date.isoformat() if i.issue_date else None,
        "due_date": i.due_date.isoformat() if i.due_date else None,
        "total_price": float(i.total_price),
        "notes": i.notes or "",
        "maintenance_orders": order_data,
        "created_at": i.created_at.isoformat(),
    }


@invoices_bp.route("/", methods=["GET"])
@login_required
def get_invoices():
    invoices = Invoice.query.order_by(Invoice.created_at.desc()).all()
    return jsonify({"invoices": [invoice_to_dict(i) for i in invoices]})


@invoices_bp.route("/", methods=["POST"])
@login_required
def create_invoice():
    data = request.get_json()
    from datetime import date, timedelta
    inv = Invoice(
        order_id=data["order_id"],
        invoice_number=data["invoice_number"],
        issue_date=date.today(),
        due_date=date.today() + timedelta(days=30),
        total_price=data.get("total_price", 0),
        notes=data.get("notes", ""),
    )
    db.session.add(inv)
    db.session.commit()
    return jsonify(invoice_to_dict(inv)), 201