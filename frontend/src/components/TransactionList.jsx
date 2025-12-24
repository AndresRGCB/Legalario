import { useState, useEffect, useRef } from 'react'

const STATUS_COLORS = {
  pendiente: '#ffc107',
  procesado: '#28a745',
  fallido: '#dc3545'
}

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  procesado: 'Procesado',
  fallido: 'Fallido'
}

const TYPE_LABELS = {
  deposito: 'Deposito',
  retiro: 'Retiro',
  transferencia: 'Transferencia'
}

// CSS para animaciones
const animationStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 200px;
    }
  }

  .transaction-item {
    animation: slideIn 0.3s ease-out forwards;
  }

  .transaction-item-existing {
    transition: transform 0.3s ease-out;
  }
`

export default function TransactionList({ transactions, loading, error }) {
  const [animatedIds, setAnimatedIds] = useState(new Set())
  const prevTransactionsRef = useRef([])

  // Detectar nuevas transacciones para animarlas
  useEffect(() => {
    const prevIds = new Set(prevTransactionsRef.current.map(t => t.id))
    const newIds = transactions.filter(t => !prevIds.has(t.id)).map(t => t.id)

    if (newIds.length > 0) {
      setAnimatedIds(new Set(newIds))
      // Limpiar animación después de que termine
      setTimeout(() => {
        setAnimatedIds(new Set())
      }, 300)
    }

    prevTransactionsRef.current = transactions
  }, [transactions])

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Cargando transacciones...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Transacciones</h2>
        <div style={styles.empty}>No hay transacciones aun. Crea una nueva!</div>
      </div>
    )
  }

  return (
    <>
      <style>{animationStyles}</style>
      <div style={styles.container}>
        <h2 style={styles.title}>Transacciones ({transactions.length})</h2>
        <div style={styles.list}>
          {transactions.map(transaction => (
            <div
              key={transaction.id}
              className={animatedIds.has(transaction.id) ? 'transaction-item' : 'transaction-item-existing'}
              style={styles.item}
            >
              <div style={styles.itemHeader}>
                <span style={styles.userId}>{transaction.user_id || 'Cargando...'}</span>
                <span
                  style={{
                    ...styles.status,
                    backgroundColor: STATUS_COLORS[transaction.status] || '#6c757d'
                  }}
                >
                  {STATUS_LABELS[transaction.status] || transaction.status || 'Procesando'}
                </span>
              </div>
              <div style={styles.itemBody}>
                <div style={styles.amount}>
                  ${transaction.monto != null ? transaction.monto.toFixed(2) : '...'}
                </div>
                <div style={styles.type}>
                  {TYPE_LABELS[transaction.tipo] || transaction.tipo || 'Cargando...'}
                </div>
              </div>
              <div style={styles.itemFooter}>
                <span style={styles.date}>
                  {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : 'Procesando...'}
                </span>
                <span style={styles.id}>
                  ID: {transaction.id ? String(transaction.id).slice(0, 8) : '...'}...
                </span>
              </div>
              {transaction.error_message && (
                <div style={styles.errorMessage}>
                  {transaction.error_message}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '1.25rem'
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    padding: '40px'
  },
  error: {
    textAlign: 'center',
    color: '#dc3545',
    padding: '40px'
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    padding: '40px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  item: {
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '15px',
    transition: 'box-shadow 0.2s',
    minHeight: '120px'
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    height: '28px'
  },
  userId: {
    fontWeight: '600',
    color: '#333',
    minWidth: '120px'
  },
  status: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: '500',
    minWidth: '80px',
    textAlign: 'center'
  },
  itemBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    height: '36px'
  },
  amount: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#333',
    minWidth: '100px'
  },
  type: {
    color: '#666',
    fontSize: '0.9rem',
    minWidth: '100px',
    textAlign: 'right'
  },
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#999',
    height: '20px'
  },
  date: {
    minWidth: '150px'
  },
  id: {
    fontFamily: 'monospace',
    minWidth: '120px',
    textAlign: 'right'
  },
  errorMessage: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#fff3f3',
    borderRadius: '4px',
    color: '#dc3545',
    fontSize: '0.85rem'
  }
}
