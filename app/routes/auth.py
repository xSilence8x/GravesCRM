from flask import Blueprint

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/ping", methods=["GET"])
def ping():
    return {"message": "Auth route works"}