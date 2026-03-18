"""add google calendar tables

Revision ID: a9d41c3e2b88
Revises: 2d3f4a9b1c77
Create Date: 2026-03-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a9d41c3e2b88'
down_revision = '2d3f4a9b1c77'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'google_calendar_connections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('google_email', sa.String(length=255), nullable=True),
        sa.Column('google_calendar_id', sa.String(length=255), nullable=False),
        sa.Column('encrypted_access_token', sa.Text(), nullable=True),
        sa.Column('encrypted_refresh_token', sa.Text(), nullable=True),
        sa.Column('token_expiry_utc', sa.DateTime(), nullable=True),
        sa.Column('sync_token', sa.Text(), nullable=True),
        sa.Column('sync_status', sa.String(length=30), nullable=False),
        sa.Column('sync_error', sa.Text(), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(), nullable=True),
        sa.Column('calendar_color', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    with op.batch_alter_table('google_calendar_connections', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_google_calendar_connections_user_id'), ['user_id'], unique=False)

    op.create_table(
        'google_calendar_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('connection_id', sa.Integer(), nullable=False),
        sa.Column('google_event_id', sa.String(length=255), nullable=False),
        sa.Column('i_cal_uid', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('visibility', sa.String(length=30), nullable=True),
        sa.Column('transparency', sa.String(length=30), nullable=True),
        sa.Column('is_all_day', sa.Boolean(), nullable=False),
        sa.Column('starts_at_utc', sa.DateTime(), nullable=True),
        sa.Column('ends_at_utc', sa.DateTime(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('timezone', sa.String(length=80), nullable=True),
        sa.Column('updated_at_google', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['connection_id'], ['google_calendar_connections.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('connection_id', 'google_event_id', name='uq_gcal_connection_event')
    )

    with op.batch_alter_table('google_calendar_events', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_google_calendar_events_connection_id'), ['connection_id'], unique=False)


def downgrade():
    with op.batch_alter_table('google_calendar_events', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_google_calendar_events_connection_id'))

    op.drop_table('google_calendar_events')

    with op.batch_alter_table('google_calendar_connections', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_google_calendar_connections_user_id'))

    op.drop_table('google_calendar_connections')
