"""Create transactions table

Revision ID: 001
Revises:
Create Date: 2024-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Crear enum types con checkfirst=True para evitar error si ya existen
    transaction_status = postgresql.ENUM('pendiente', 'procesado', 'fallido', name='transactionstatus', create_type=False)
    transaction_type = postgresql.ENUM('deposito', 'retiro', 'transferencia', name='transactiontype', create_type=False)

    # Crear tipos solo si no existen
    transaction_status.create(op.get_bind(), checkfirst=True)
    transaction_type.create(op.get_bind(), checkfirst=True)

    # Crear tabla transactions
    op.create_table(
        'transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('idempotency_key', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('user_id', sa.String(255), nullable=False, index=True),
        sa.Column('monto', sa.Float(), nullable=False),
        sa.Column('tipo', sa.Enum('deposito', 'retiro', 'transferencia', name='transactiontype', create_constraint=False), nullable=False),
        sa.Column('status', sa.Enum('pendiente', 'procesado', 'fallido', name='transactionstatus', create_constraint=False), nullable=False, server_default='pendiente'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('celery_task_id', sa.String(255), nullable=True),
        sa.Column('error_message', sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('transactions')

    # Eliminar enum types
    op.execute('DROP TYPE IF EXISTS transactionstatus')
    op.execute('DROP TYPE IF EXISTS transactiontype')
