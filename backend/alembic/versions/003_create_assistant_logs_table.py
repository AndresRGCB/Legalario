"""Create assistant_logs table

Revision ID: 003
Revises: 002
Create Date: 2024-01-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS assistant_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            original_text TEXT NOT NULL,
            summary TEXT NOT NULL,
            model_used VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-20250514',
            tokens_input INTEGER,
            tokens_output INTEGER,
            processing_time_ms INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_assistant_logs_user_id ON assistant_logs (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_assistant_logs_created_at ON assistant_logs (created_at)")


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS assistant_logs')
