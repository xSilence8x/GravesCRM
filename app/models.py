from flask_login import UserMixin
from datetime import datetime, date, timedelta
from app.extensions import db

ORDER_STATUSES = {"plánovaný", "probíhá", "hotový", "zrušený"}
CLEANING_FREQUENCIES = {"1x", "2x", "4x", "vlastní"}
PHOTO_TYPES = {"před", "po"}
REMINDER_STATUSES = {"nadcházející", "brzy", "po termínu", "deaktivovaný"}


class AdditionalService(db.Model):
    __tablename__ = "additional_services"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(
        db.Integer,
        db.ForeignKey("maintenance_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    note = db.Column(db.Text, nullable=False, default="")
    url_photo = db.Column(db.String(255), nullable=True, default="")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    order = db.relationship("MaintenanceOrder", back_populates="additional_services")

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
    maintenance_orders = db.relationship(
        "MaintenanceOrder",
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
    grave_number = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False, default=49.170529066991264)
    longitude = db.Column(db.Float, nullable=False, default=16.594459112480603)
    cleaning_frequency = db.Column(db.String(20), nullable=False)
    custom_frequency_months = db.Column(db.Integer, nullable=True)
    base_price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    notes = db.Column(db.Text, nullable=False, default="")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    client = db.relationship("Client", back_populates="graves")
    graveyard = db.relationship("Graveyard", back_populates="graves")
    maintenance_orders = db.relationship(
        "MaintenanceOrder",
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

    def __repr__(self):
        return f"<Grave id={self.id} graveyard_id={self.graveyard_id} grave_number={self.grave_number}>"


class Graveyard(db.Model):
    __tablename__ = "graveyards"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, default="Ústřední hřbitov")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    graves = db.relationship(
        "Grave",
        back_populates="graveyard",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Graveyard id={self.id} name={self.name}>"


class Invoice(db.Model):
    __tablename__ = "invoices"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(
        db.Integer,
        db.ForeignKey("maintenance_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    issue_date = db.Column(db.Date, nullable=False, default=date.today)
    due_date = db.Column(
        db.Date,
        nullable=False,
        default=lambda: date.today() + timedelta(days=30),
    )
    total_price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    notes = db.Column(db.Text, nullable=False, default="")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    order = db.relationship("MaintenanceOrder", back_populates="invoices")

    def __repr__(self):
        return f"<Invoice id={self.id} invoice_number={self.invoice_number}>"


class MaintenanceOrder(db.Model):
    __tablename__ = "maintenance_orders"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(
        db.Integer,
        db.ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    grave_id = db.Column(
        db.Integer,
        db.ForeignKey("graves.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    planned_date = db.Column(db.Date, nullable=False)
    completion_date = db.Column(db.Date, nullable=True)
    total_price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    notes = db.Column(db.Text, nullable=False, default="")
    status = db.Column(db.String(30), nullable=False, default="plánovaný")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    client = db.relationship("Client", back_populates="maintenance_orders")
    grave = db.relationship("Grave", back_populates="maintenance_orders")
    additional_services = db.relationship(
        "AdditionalService",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    photos = db.relationship(
        "Photo",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    invoices = db.relationship(
        "Invoice",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<MaintenanceOrder id={self.id} status={self.status}>"


class Photo(db.Model):
    __tablename__ = "photos"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(
        db.Integer,
        db.ForeignKey("maintenance_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url = db.Column(db.Text, nullable=False)
    photo_type = db.Column(db.String(20), nullable=False, default="před")
    note = db.Column(db.Text, nullable=False, default="")
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)

    order = db.relationship("MaintenanceOrder", back_populates="photos")

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

    def __repr__(self):
        return f"<User {self.nickname} ({self.email})>"