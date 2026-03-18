from __future__ import annotations

import os
import secrets
from datetime import date, datetime

from flask import Blueprint, current_app, jsonify, redirect, request, session
from flask_login import current_user, login_required
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from app.extensions import db
from app.models import GoogleCalendarConnection, GoogleCalendarEvent
from app.services.google_calendar_service import (
    GOOGLE_SCOPES,
    GoogleCalendarConfigError,
    choose_user_color,
    encrypt_secret,
    get_connection_events_for_range,
    get_google_client_config,
    sync_google_calendar,
)


google_calendar_bp = Blueprint("google_calendar", __name__)


def _frontend_redirect(path: str) -> str:
    base_url = current_app.config.get("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
    normalized_path = path if path.startswith("/") else f"/{path}"
    return f"{base_url}{normalized_path}"


@google_calendar_bp.route("/oauth/start", methods=["GET"])
@login_required
def oauth_start():
    try:
        flow = Flow.from_client_config(
            get_google_client_config(),
            scopes=GOOGLE_SCOPES,
            redirect_uri=get_google_client_config()["web"]["redirect_uris"][0],
        )
    except GoogleCalendarConfigError as error:
        return jsonify({"error": str(error)}), 500

    state_nonce = secrets.token_urlsafe(24)
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state_nonce,
    )

    session["google_oauth_state"] = state
    return redirect(authorization_url)


@google_calendar_bp.route("/oauth/callback", methods=["GET"])
@login_required
def oauth_callback():
    expected_state = session.get("google_oauth_state")
    incoming_state = request.args.get("state")

    if not expected_state or expected_state != incoming_state:
        return redirect(_frontend_redirect("/reminders?google=state_error"))

    redirect_uri = get_google_client_config()["web"]["redirect_uris"][0]
    if redirect_uri.startswith("http://localhost") or redirect_uri.startswith("http://127.0.0.1"):
        os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    try:
        flow = Flow.from_client_config(
            get_google_client_config(),
            scopes=GOOGLE_SCOPES,
            state=incoming_state,
            redirect_uri=redirect_uri,
        )
        flow.fetch_token(code=request.args.get("code"))
    except Exception as error:
        current_app.logger.exception("Google OAuth callback failed")
        return redirect(_frontend_redirect(f"/reminders?google=oauth_error&detail={type(error).__name__}"))

    credentials = flow.credentials

    userinfo_service = build("oauth2", "v2", credentials=credentials, cache_discovery=False)
    userinfo = userinfo_service.userinfo().get().execute()

    connection = GoogleCalendarConnection.query.filter_by(user_id=current_user.id).first()
    if connection is None:
        connection = GoogleCalendarConnection(user_id=current_user.id, calendar_color=choose_user_color(current_user.id))
        db.session.add(connection)

    connection.google_email = userinfo.get("email")
    connection.google_calendar_id = "primary"
    connection.encrypted_access_token = encrypt_secret(credentials.token)
    connection.encrypted_refresh_token = encrypt_secret(credentials.refresh_token)
    connection.token_expiry_utc = credentials.expiry.replace(tzinfo=None) if credentials.expiry else None
    connection.sync_status = "connected"
    connection.sync_error = None
    connection.sync_token = None
    db.session.commit()

    try:
        sync_google_calendar(connection, full_sync=True)
    except Exception:
        current_app.logger.exception("Google initial sync failed")
        return redirect(_frontend_redirect("/reminders?google=sync_error"))

    session.pop("google_oauth_state", None)
    return redirect(_frontend_redirect("/reminders?google=connected"))


@google_calendar_bp.route("/status", methods=["GET"])
@login_required
def status():
    connection = GoogleCalendarConnection.query.filter_by(user_id=current_user.id).first()

    team_connections = GoogleCalendarConnection.query.filter(
        GoogleCalendarConnection.sync_status == "connected"
    ).all()

    return jsonify(
        {
            "connected": bool(connection and connection.sync_status == "connected"),
            "google_email": connection.google_email if connection else None,
            "sync_status": connection.sync_status if connection else "disconnected",
            "last_synced_at": connection.last_synced_at.isoformat() if connection and connection.last_synced_at else None,
            "calendar_color": connection.calendar_color if connection else choose_user_color(current_user.id),
            "team": [
                {
                    "user_id": conn.user_id,
                    "nickname": conn.user.nickname if conn.user else f"Uživatel {conn.user_id}",
                    "color": conn.calendar_color,
                    "connected": conn.sync_status == "connected",
                    "last_synced_at": conn.last_synced_at.isoformat() if conn.last_synced_at else None,
                }
                for conn in team_connections
            ],
        }
    )


@google_calendar_bp.route("/sync", methods=["POST"])
@login_required
def sync_now():
    connection = GoogleCalendarConnection.query.filter_by(user_id=current_user.id).first()
    if not connection:
        return jsonify({"error": "Kalendář není spárovaný."}), 400

    try:
        result = sync_google_calendar(connection)
    except Exception as error:
        return jsonify({"error": f"Synchronizace selhala: {error}"}), 500

    return jsonify({"message": "Synchronizace dokončena.", **result})


@google_calendar_bp.route("/events", methods=["GET"])
@login_required
def events():
    start_raw = request.args.get("start")
    end_raw = request.args.get("end")

    if not start_raw or not end_raw:
        return jsonify({"error": "Parametry start a end jsou povinné (YYYY-MM-DD)."}), 400

    try:
        start_date = date.fromisoformat(start_raw)
        end_date = date.fromisoformat(end_raw)
    except ValueError:
        return jsonify({"error": "Neplatný formát data. Použij YYYY-MM-DD."}), 400

    events_data = get_connection_events_for_range(start_date, end_date, current_user.id)
    return jsonify({"events": events_data})


@google_calendar_bp.route("/disconnect", methods=["DELETE"])
@login_required
def disconnect():
    connection = GoogleCalendarConnection.query.filter_by(user_id=current_user.id).first()
    if not connection:
        return jsonify({"message": "Kalendář nebyl spárován."})

    GoogleCalendarEvent.query.filter_by(connection_id=connection.id).delete()
    db.session.delete(connection)
    db.session.commit()

    return jsonify({"message": "Google kalendář byl odpojen."})
