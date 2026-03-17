"""add graveyard coords and nullable grave coords

Revision ID: 7c2b9db2f5aa
Revises: f34b68bdb6da
Create Date: 2026-03-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7c2b9db2f5aa'
down_revision = 'f34b68bdb6da'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('graveyards', schema=None) as batch_op:
        batch_op.add_column(sa.Column('latitude', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('longitude', sa.Float(), nullable=True))

    with op.batch_alter_table('graves', schema=None) as batch_op:
        batch_op.alter_column('latitude', existing_type=sa.Float(), nullable=True)
        batch_op.alter_column('longitude', existing_type=sa.Float(), nullable=True)


def downgrade():
    with op.batch_alter_table('graves', schema=None) as batch_op:
        batch_op.alter_column('longitude', existing_type=sa.Float(), nullable=False)
        batch_op.alter_column('latitude', existing_type=sa.Float(), nullable=False)

    with op.batch_alter_table('graveyards', schema=None) as batch_op:
        batch_op.drop_column('longitude')
        batch_op.drop_column('latitude')
