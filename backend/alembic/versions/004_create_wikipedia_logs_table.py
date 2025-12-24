"""Create wikipedia_logs table

Revision ID: 004
Revises: 003
Create Date: 2024-01-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS wikipedia_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            search_term VARCHAR(500) NOT NULL,
            wikipedia_url VARCHAR(1000),
            extracted_text TEXT NOT NULL,
            summary TEXT NOT NULL,
            model_used VARCHAR(100),
            processing_time_ms INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_wikipedia_logs_user_id ON wikipedia_logs (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_wikipedia_logs_created_at ON wikipedia_logs (created_at)")


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS wikipedia_logs')
