"""Add status and completion_date columns to graves

Revision ID: 2a5f8a9c7d11
Revises: a9d41c3e2b88
Create Date: 2026-04-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2a5f8a9c7d11'
down_revision = 'a9d41c3e2b88'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('graves', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=30), nullable=False, server_default='plánováno'))
        batch_op.add_column(sa.Column('completion_date', sa.Date(), nullable=True))


def downgrade():
    with op.batch_alter_table('graves', schema=None) as batch_op:
        batch_op.drop_column('completion_date')
        batch_op.drop_column('status')
