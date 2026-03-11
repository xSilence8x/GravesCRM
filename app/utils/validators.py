from app.models import (
    CLEANING_FREQUENCIES,
    ORDER_STATUSES,
    PHOTO_TYPES,
    REMINDER_STATUSES,
)


def validate_order_status(value: str) -> str:
    if value not in ORDER_STATUSES:
        raise ValueError(f"Invalid order status: {value}")
    return value


def validate_cleaning_frequency(value: str) -> str:
    if value not in CLEANING_FREQUENCIES:
        raise ValueError(f"Invalid cleaning frequency: {value}")
    return value


def validate_photo_type(value: str) -> str:
    if value not in PHOTO_TYPES:
        raise ValueError(f"Invalid photo type: {value}")
    return value


def validate_reminder_status(value: str) -> str:
    if value not in REMINDER_STATUSES:
        raise ValueError(f"Invalid reminder status: {value}")
    return value