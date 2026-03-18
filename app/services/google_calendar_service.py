from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from cryptography.fernet import Fernet
from flask import current_app
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.extensions import db
from app.models import GoogleCalendarConnection, GoogleCalendarEvent

GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/calendar.readonly",
]

USER_COLORS = [
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
]


class GoogleCalendarConfigError(RuntimeError):
    pass


def get_google_client_config() -> dict[str, Any]:
    client_id = current_app.config.get("GOOGLE_CLIENT_ID", "")
    client_secret = current_app.config.get("GOOGLE_CLIENT_SECRET", "")
    redirect_uri = current_app.config.get("GOOGLE_OAUTH_REDIRECT_URI", "")

    if not client_id or not client_secret or not redirect_uri:
        raise GoogleCalendarConfigError("Google OAuth není nakonfigurován (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI).")

    return {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri],
        }
    }


def _get_fernet() -> Fernet:
    key = current_app.config.get("GOOGLE_TOKEN_ENCRYPTION_KEY", "")
    if not key:
        raise GoogleCalendarConfigError("Chybí GOOGLE_TOKEN_ENCRYPTION_KEY pro bezpečné uložení tokenů.")
    return Fernet(key.encode("utf-8"))


def encrypt_secret(value: str | None) -> str | None:
    if not value:
        return None
    return _get_fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_secret(value: str | None) -> str | None:
    if not value:
        return None
    return _get_fernet().decrypt(value.encode("utf-8")).decode("utf-8")


def choose_user_color(user_id: int) -> str:
    return USER_COLORS[(user_id - 1) % len(USER_COLORS)]


def _parse_google_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).replace(tzinfo=None)


def _parse_google_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def _serialize_google_credentials(connection: GoogleCalendarConnection) -> Credentials:
    access_token = decrypt_secret(connection.encrypted_access_token)
    refresh_token = decrypt_secret(connection.encrypted_refresh_token)

    credentials = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=current_app.config.get("GOOGLE_CLIENT_ID"),
        client_secret=current_app.config.get("GOOGLE_CLIENT_SECRET"),
        scopes=GOOGLE_SCOPES,
    )

    if connection.token_expiry_utc:
        expiry = connection.token_expiry_utc
        if expiry.tzinfo is not None:
            expiry = expiry.astimezone(timezone.utc).replace(tzinfo=None)
        credentials.expiry = expiry

    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        connection.encrypted_access_token = encrypt_secret(credentials.token)
        connection.token_expiry_utc = credentials.expiry.replace(tzinfo=None) if credentials.expiry else None
        db.session.commit()

    return credentials


def _upsert_event(connection: GoogleCalendarConnection, item: dict[str, Any]) -> None:
    google_event_id = item.get("id")
    if not google_event_id:
        return

    event = GoogleCalendarEvent.query.filter_by(
        connection_id=connection.id,
        google_event_id=google_event_id,
    ).first()

    if event is None:
        event = GoogleCalendarEvent(connection_id=connection.id, google_event_id=google_event_id)
        db.session.add(event)

    event_status = item.get("status", "confirmed")
    transparency = item.get("transparency")
    is_busy = event_status != "cancelled" and transparency != "transparent"

    if not is_busy:
        if event.id is not None:
            db.session.delete(event)
        return

    start = item.get("start", {})
    end = item.get("end", {})
    is_all_day = "date" in start

    event.i_cal_uid = item.get("iCalUID")
    event.status = event_status
    event.summary = item.get("summary") or ""
    event.visibility = item.get("visibility")
    event.transparency = transparency
    event.is_all_day = is_all_day
    event.timezone = start.get("timeZone") or end.get("timeZone")
    event.updated_at_google = _parse_google_datetime(item.get("updated"))

    if is_all_day:
        event.start_date = _parse_google_date(start.get("date"))
        event.end_date = _parse_google_date(end.get("date"))
        event.starts_at_utc = None
        event.ends_at_utc = None
    else:
        event.starts_at_utc = _parse_google_datetime(start.get("dateTime"))
        event.ends_at_utc = _parse_google_datetime(end.get("dateTime"))
        event.start_date = None
        event.end_date = None


def _sync_full(calendar_service: Any, connection: GoogleCalendarConnection) -> str | None:
    page_token = None
    next_sync_token = None
    time_min = (datetime.utcnow() - timedelta(days=180)).replace(microsecond=0).isoformat() + "Z"
    time_max = (datetime.utcnow() + timedelta(days=365)).replace(microsecond=0).isoformat() + "Z"

    GoogleCalendarEvent.query.filter_by(connection_id=connection.id).delete()

    while True:
        response = (
            calendar_service.events()
            .list(
                calendarId=connection.google_calendar_id or "primary",
                singleEvents=True,
                showDeleted=True,
                maxResults=2500,
                timeMin=time_min,
                timeMax=time_max,
                pageToken=page_token,
            )
            .execute()
        )

        for item in response.get("items", []):
            _upsert_event(connection, item)

        page_token = response.get("nextPageToken")
        next_sync_token = response.get("nextSyncToken", next_sync_token)
        if not page_token:
            break

    return next_sync_token


def _sync_incremental(calendar_service: Any, connection: GoogleCalendarConnection) -> str | None:
    page_token = None
    next_sync_token = connection.sync_token

    while True:
        response = (
            calendar_service.events()
            .list(
                calendarId=connection.google_calendar_id or "primary",
                singleEvents=True,
                showDeleted=True,
                maxResults=2500,
                syncToken=connection.sync_token,
                pageToken=page_token,
            )
            .execute()
        )

        for item in response.get("items", []):
            _upsert_event(connection, item)

        page_token = response.get("nextPageToken")
        next_sync_token = response.get("nextSyncToken", next_sync_token)
        if not page_token:
            break

    return next_sync_token


def sync_google_calendar(connection: GoogleCalendarConnection, *, full_sync: bool = False) -> dict[str, Any]:
    credentials = _serialize_google_credentials(connection)
    calendar_service = build("calendar", "v3", credentials=credentials, cache_discovery=False)

    try:
        if full_sync or not connection.sync_token:
            next_sync_token = _sync_full(calendar_service, connection)
        else:
            next_sync_token = _sync_incremental(calendar_service, connection)
    except HttpError as error:
        status = getattr(error, "status_code", None) or getattr(error.resp, "status", None)
        if status == 410 and not full_sync:
            connection.sync_token = None
            db.session.commit()
            return sync_google_calendar(connection, full_sync=True)
        connection.sync_status = "error"
        connection.sync_error = f"Google API error: {error}"
        connection.last_synced_at = datetime.utcnow()
        db.session.commit()
        raise

    connection.sync_token = next_sync_token
    connection.sync_status = "connected"
    connection.sync_error = None
    connection.last_synced_at = datetime.utcnow()
    db.session.commit()

    return {
        "last_synced_at": connection.last_synced_at.isoformat() if connection.last_synced_at else None,
        "sync_status": connection.sync_status,
    }


def get_connection_events_for_range(start_date: date, end_date: date, viewer_user_id: int) -> list[dict[str, Any]]:
    connections = GoogleCalendarConnection.query.filter(
        GoogleCalendarConnection.sync_status == "connected"
    ).all()

    output: list[dict[str, Any]] = []

    for connection in connections:
        for event in connection.cached_events:
            if event.is_all_day:
                if not event.start_date or not event.end_date:
                    continue
                event_start = event.start_date
                event_end = event.end_date - timedelta(days=1)
                if event_end < start_date or event_start > end_date:
                    continue
            else:
                if not event.starts_at_utc or not event.ends_at_utc:
                    continue
                event_start = event.starts_at_utc.date()
                event_end = (event.ends_at_utc - timedelta(seconds=1)).date()
                if event_end < start_date or event_start > end_date:
                    continue

            is_owner = connection.user_id == viewer_user_id
            summary = event.summary if is_owner else "Obsazeno"

            output.append(
                {
                    "id": event.google_event_id,
                    "user_id": connection.user_id,
                    "user_nickname": connection.user.nickname if connection.user else f"Uživatel {connection.user_id}",
                    "user_color": connection.calendar_color,
                    "is_owner": is_owner,
                    "summary": summary or "Obsazeno",
                    "is_all_day": event.is_all_day,
                    "starts_at": event.starts_at_utc.isoformat() if event.starts_at_utc else None,
                    "ends_at": event.ends_at_utc.isoformat() if event.ends_at_utc else None,
                    "start_date": event.start_date.isoformat() if event.start_date else None,
                    "end_date": event.end_date.isoformat() if event.end_date else None,
                }
            )

    return output
