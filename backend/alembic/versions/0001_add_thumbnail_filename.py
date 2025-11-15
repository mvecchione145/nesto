"""add thumbnail_filename column to photos

Revision ID: 0001_add_thumbnail_filename
Revises:
Create Date: 2025-11-14 00:00:00.000000
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0001_add_thumbnail_filename"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # add nullable thumbnail_filename column
    op.add_column("photos", sa.Column("thumbnail_filename", sa.String(), nullable=True))


def downgrade():
    op.drop_column("photos", "thumbnail_filename")
