"""add name_on_grave to graves

Revision ID: 2d3f4a9b1c77
Revises: 7c2b9db2f5aa
Create Date: 2026-03-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2d3f4a9b1c77'
down_revision = '7c2b9db2f5aa'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('graves', schema=None) as batch_op:
        batch_op.add_column(sa.Column('name_on_grave', sa.String(length=255), nullable=True))


def downgrade():
    with op.batch_alter_table('graves', schema=None) as batch_op:
        batch_op.drop_column('name_on_grave')
