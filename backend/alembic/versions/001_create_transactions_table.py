"""Create transactions table

Revision ID: 001
Revises:
Create Date: 2024-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear enum types con SQL directo para evitar problemas
    op.execute("DO $$ BEGIN CREATE TYPE transactionstatus AS ENUM ('pendiente', 'procesado', 'fallido'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE transactiontype AS ENUM ('deposito', 'retiro', 'transferencia'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    # Crear tabla transactions con SQL directo
    op.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            idempotency_key VARCHAR(255) NOT NULL UNIQUE,
            user_id VARCHAR(255) NOT NULL,
            monto FLOAT NOT NULL,
            tipo transactiontype NOT NULL,
            status transactionstatus NOT NULL DEFAULT 'pendiente',
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            processed_at TIMESTAMP,
            celery_task_id VARCHAR(255),
            error_message VARCHAR(500)
        )
    """)

    # Crear indices
    op.execute("CREATE INDEX IF NOT EXISTS ix_transactions_idempotency_key ON transactions (idempotency_key)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_transactions_user_id ON transactions (user_id)")


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS transactions')
    op.execute('DROP TYPE IF EXISTS transactionstatus')
    op.execute('DROP TYPE IF EXISTS transactiontype')
