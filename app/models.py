from flask_login import UserMixin
from datetime import datetime, date, timedelta
from app.extensions import db

GRAVE_STATUSES = {"plánováno", "probíhá", "dokončeno", "zrušeno"}
CLEANING_FREQUENCIES = {"1x", "2x", "4x", "vlastní"}
PHOTO_TYPES = {"před", "po"}
REMINDER_STATUSES = {"nadcházející", "brzy", "po termínu", "deaktivovaný"}


class AdditionalService(db.Model):
    __tablename__ = "additional_services"

    id = db.Column(db.Integer, primary_key=True)
    grave_id = db.Column(
        db.Integer,
        db.ForeignKey("graves.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    note = db.Column(db.Text, nullable=False, default="")
    url_photo = db.Column(db.String(255), nullable=True, default="")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    grave = db.relationship("Grave", back_populates="additional_services")

    def __repr__(self):
        return f"<AdditionalService id={self.id} name={self.name}>"


class Client(db.Model):
    __tablename__ = "clients"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    company = db.Column(db.String(255), nullable=True)
    ico = db.Column(db.String(8), nullable=True)
    address = db.Column(db.Text, nullable=True)
    email = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    graves = db.relationship(
        "Grave",
        back_populates="client",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    reminders = db.relationship(
        "Reminder",
        back_populates="client",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Client {self.first_name} {self.last_name} {self.company}>"
    
    @property
    def full_name(self):
        name = f"{self.first_name or ''} {self.last_name or ''}".strip()
        return name or self.company or ""
    

class Grave(db.Model):
    __tablename__ = "graves"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(
        db.Integer,
        db.ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    graveyard_id = db.Column(
        db.Integer,
        db.ForeignKey("graveyards.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name_on_grave = db.Column(db.String(255), nullable=True)
    grave_number = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    cleaning_frequency = db.Column(db.String(20), nullable=False)
    custom_frequency_months = db.Column(db.Integer, nullable=True)
    base_price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    notes = db.Column(db.Text, nullable=False, default="")
    status = db.Column(db.String(50), nullable=False, default="plánováno")
    completion_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    client = db.relationship("Client", back_populates="graves")
    graveyard = db.relationship("Graveyard", back_populates="graves")
    additional_services = db.relationship(
        "AdditionalService",
        back_populates="grave",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    photos = db.relationship(
        "Photo",
        back_populates="grave",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    invoices = db.relationship(
        "Invoice",
        back_populates="grave",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    reminders = db.relationship(
        "Reminder",
        back_populates="grave",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    cleanings = db.relationship(
        "Cleaning",
        back_populates="grave",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Grave id={self.id} graveyard_id={self.graveyard_id} grave_number={self.grave_number} status={self.status}>"


class Graveyard(db.Model):
    __tablename__ = "graveyards"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, default="Ústřední hřbitov")
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    graves = db.relationship(
        "Grave",
        back_populates="graveyard",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Graveyard id={self.id} name={self.name}>"


class Cleaning(db.Model):
    __tablename__ = "cleanings"

    id = db.Column(db.Integer, primary_key=True)
    grave_id = db.Column(
        db.Integer,
        db.ForeignKey("graves.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    cleaning_number = db.Column(db.Integer, nullable=False)  # 1, 2, 3, ...
    performed_date = db.Column(db.Date, nullable=True)  # Datum provedení úklidu
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    grave = db.relationship("Grave", back_populates="cleanings")
    photos = db.relationship(
        "Photo",
        back_populates="cleaning",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Cleaning id={self.id} grave_id={self.grave_id} cleaning_number={self.cleaning_number}>"


class Invoice(db.Model):
    __tablename__ = "invoices"

    id = db.Column(db.Integer, primary_key=True)
    grave_id = db.Column(
        db.Integer,
        db.ForeignKey("graves.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    issue_date = db.Column(db.Date, nullable=False, default=date.today)
    due_date = db.Column(
        db.Date,
        nullable=False,
        default=lambda: date.today() + timedelta(days=14),
    )
    total_price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    notes = db.Column(db.Text, nullable=False, default="")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    grave = db.relationship("Grave", back_populates="invoices")

    def __repr__(self):
        return f"<Invoice id={self.id} invoice_number={self.invoice_number}>"





class Photo(db.Model):
    __tablename__ = "photos"

    id = db.Column(db.Integer, primary_key=True)
    cleaning_id = db.Column(
        db.Integer,
        db.ForeignKey("cleanings.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    grave_id = db.Column(
        db.Integer,
        db.ForeignKey("graves.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    url = db.Column(db.Text, nullable=False)
    photo_type = db.Column(db.String(20), nullable=False, default="před")
    note = db.Column(db.Text, nullable=False, default="")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    grave = db.relationship("Grave", back_populates="photos")
    cleaning = db.relationship("Cleaning", back_populates="photos")

    def __repr__(self):
        return f"<Photo id={self.id} type={self.photo_type}>"


class Reminder(db.Model):
    __tablename__ = "reminders"

    id = db.Column(db.Integer, primary_key=True)
    grave_id = db.Column(
        db.Integer,
        db.ForeignKey("graves.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    client_id = db.Column(
        db.Integer,
        db.ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    next_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="nadcházející")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    grave = db.relationship("Grave", back_populates="reminders")
    client = db.relationship("Client", back_populates="reminders")

    def __repr__(self):
        return f"<Reminder id={self.id} next_date={self.next_date} status={self.status}>"


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    password_reset_token = db.Column(db.String(255), nullable=True)
    password_reset_token_expiry = db.Column(db.DateTime, nullable=True)

    google_calendar_connection = db.relationship(
        "GoogleCalendarConnection",
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
        lazy="selectin",
    )

    def __repr__(self):
        return f"<User {self.nickname} ({self.email})>"


class GoogleCalendarConnection(db.Model):
    __tablename__ = "google_calendar_connections"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    google_email = db.Column(db.String(255), nullable=True)
    google_calendar_id = db.Column(db.String(255), nullable=False, default="primary")
    encrypted_access_token = db.Column(db.Text, nullable=True)
    encrypted_refresh_token = db.Column(db.Text, nullable=True)
    token_expiry_utc = db.Column(db.DateTime, nullable=True)
    sync_token = db.Column(db.Text, nullable=True)
    sync_status = db.Column(db.String(30), nullable=False, default="disconnected")
    sync_error = db.Column(db.Text, nullable=True)
    last_synced_at = db.Column(db.DateTime, nullable=True)
    calendar_color = db.Column(db.String(32), nullable=False, default="#3b82f6")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    user = db.relationship("User", back_populates="google_calendar_connection")
    cached_events = db.relationship(
        "GoogleCalendarEvent",
        back_populates="connection",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<GoogleCalendarConnection user_id={self.user_id} status={self.sync_status}>"


class GoogleCalendarEvent(db.Model):
    __tablename__ = "google_calendar_events"

    id = db.Column(db.Integer, primary_key=True)
    connection_id = db.Column(
        db.Integer,
        db.ForeignKey("google_calendar_connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    google_event_id = db.Column(db.String(255), nullable=False)
    i_cal_uid = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(30), nullable=False, default="confirmed")
    summary = db.Column(db.Text, nullable=True)
    visibility = db.Column(db.String(30), nullable=True)
    transparency = db.Column(db.String(30), nullable=True)
    is_all_day = db.Column(db.Boolean, nullable=False, default=False)
    starts_at_utc = db.Column(db.DateTime, nullable=True)
    ends_at_utc = db.Column(db.DateTime, nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    timezone = db.Column(db.String(80), nullable=True)
    updated_at_google = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    connection = db.relationship("GoogleCalendarConnection", back_populates="cached_events")

    __table_args__ = (
        db.UniqueConstraint("connection_id", "google_event_id", name="uq_gcal_connection_event"),
    )

    def __repr__(self):
        return f"<GoogleCalendarEvent connection_id={self.connection_id} google_event_id={self.google_event_id}>"