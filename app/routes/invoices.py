from flask import Blueprint, request, jsonify
from flask_login import login_required
from app.extensions import db
from app.models import Invoice, Grave

invoices_bp = Blueprint("invoices", __name__)


def invoice_to_dict(i):
    grave_data = None
    if i.grave:
        g = i.grave
        client_name = ""
        if g.client:
            client_name = f"{g.client.first_name or ''} {g.client.last_name or ''}".strip() or g.client.company or ""
        grave_data = {
            "id": g.id,
            "base_price": float(g.base_price),
            "status": g.status,
            "clients": {
                "full_name": client_name,
                "billing_address": g.client.address or "" if g.client else "",
                "email": g.client.email or "" if g.client else "",
                "phone": g.client.phone or "" if g.client else "",
            },
            "graveyard": {
                "name": g.graveyard.name if g.graveyard else "",
            },
            "grave_number": g.grave_number,
            "name_on_grave": g.name_on_grave,
            "additional_services": [
                {"id": s.id, "name": s.name, "price": float(s.price), "note": s.note or ""}
                for s in g.additional_services
            ],
        }
    return {
        "id": i.id,
        "grave_id": i.grave_id,
        "invoice_number": i.invoice_number,
        "issue_date": i.issue_date.isoformat() if i.issue_date else None,
        "due_date": i.due_date.isoformat() if i.due_date else None,
        "total_price": float(i.total_price),
        "notes": i.notes or "",
        "grave": grave_data,
        "created_at": i.created_at.isoformat(),
    }


@invoices_bp.route("/", methods=["GET"])
@login_required
def get_invoices():
    invoices = Invoice.query.order_by(Invoice.created_at.desc()).all()
    return jsonify({"invoices": [invoice_to_dict(i) for i in invoices]})


@invoices_bp.route("/<int:invoice_id>", methods=["GET"])
@login_required
def get_invoice(invoice_id):
    i = Invoice.query.get_or_404(invoice_id)
    return jsonify(invoice_to_dict(i))


@invoices_bp.route("/", methods=["POST"])
@login_required
def create_invoice():
    data = request.get_json()
    from datetime import date, timedelta
    
    # Ověř, že Grave existuje
    Grave.query.get_or_404(data["grave_id"])
    
    inv = Invoice(
        grave_id=data["grave_id"],
        invoice_number=data["invoice_number"],
        issue_date=date.today(),
        due_date=date.today() + timedelta(days=30),
        total_price=data.get("total_price", 0),
        notes=data.get("notes", ""),
    )
    db.session.add(inv)
    db.session.commit()
    return jsonify(invoice_to_dict(inv)), 201


@invoices_bp.route("/<int:invoice_id>", methods=["PATCH"])
@login_required
def update_invoice(invoice_id):
    inv = Invoice.query.get_or_404(invoice_id)
    data = request.get_json()
    
    for field in ["total_price", "notes"]:
        if field in data:
            setattr(inv, field, data[field])
    
    db.session.commit()
    return jsonify(invoice_to_dict(inv))


@invoices_bp.route("/<int:invoice_id>", methods=["DELETE"])
@login_required
def delete_invoice(invoice_id):
    inv = Invoice.query.get_or_404(invoice_id)
    db.session.delete(inv)
    db.session.commit()
    return jsonify({"message": "Deleted."})