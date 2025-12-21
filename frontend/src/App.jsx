import { useState, useEffect } from 'react'
import TransactionList from './components/TransactionList'
import TransactionForm from './components/TransactionForm'
import Notification from './components/Notification'
import { useWebSocket } from './hooks/useWebSocket'
import { useTransactions } from './hooks/useTransactions'

function App() {
  const [notifications, setNotifications] = useState([])
  const { transactions, loading, error, refetch, addTransaction, updateTransaction } = useTransactions()

  // WebSocket para actualizaciones en tiempo real
  const { lastMessage, connectionStatus } = useWebSocket('/api/transactions/stream')

  // Procesar mensajes del WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'STATUS_CHANGE') {
      const data = lastMessage.data

      // Actualizar la transacción en la lista
      updateTransaction({
        id: data.id,
        status: data.status,
        updated_at: data.updated_at,
        processed_at: data.processed_at,
        error_message: data.error_message
      })

      // Mostrar notificación
      const notificationType = data.status === 'procesado' ? 'success' : 'error'
      addNotification({
        type: notificationType,
        message: `Transaccion ${data.id.slice(0, 8)}... cambio a: ${data.status.toUpperCase()}`
      })
    }
  }, [lastMessage, updateTransaction])

  const addNotification = (notification) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { ...notification, id }])

    // Auto-remove después de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const handleSuccess = (result, mode) => {
    if (mode === 'sync') {
      // Transacción síncrona - agregar a la lista
      addTransaction(result)
      addNotification({
        type: 'success',
        message: 'Transaccion creada y procesada exitosamente'
      })
    } else {
      // Transacción asíncrona - agregar con status pendiente
      addTransaction({
        id: result.transaction_id,
        status: 'pendiente',
        ...result
      })
      addNotification({
        type: 'info',
        message: `Transaccion encolada. Task ID: ${result.task_id.slice(0, 8)}...`
      })

      // Refetch para obtener la transacción completa
      setTimeout(() => refetch(), 500)
    }
  }

  const handleError = (error) => {
    addNotification({
      type: 'error',
      message: error.message
    })
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>Sistema de Transacciones</h1>
        <div style={styles.statusContainer}>
          <span style={styles.statusLabel}>WebSocket:</span>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: connectionStatus === 'connected' ? '#28a745' : '#dc3545'
          }}>
            {connectionStatus}
          </span>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.formColumn}>
          <TransactionForm onSuccess={handleSuccess} onError={handleError} />
        </div>

        <div style={styles.listColumn}>
          <TransactionList
            transactions={transactions}
            loading={loading}
            error={error}
          />
        </div>
      </main>

      <div style={styles.notifications}>
        {notifications.map(n => (
          <Notification
            key={n.id}
            type={n.type}
            message={n.message}
            onClose={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
          />
        ))}
      </div>
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    backgroundColor: '#343a40',
    color: '#fff',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem'
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statusLabel: {
    fontSize: '0.9rem',
    opacity: 0.8
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    color: '#fff'
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '20px',
    padding: '20px 30px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  formColumn: {},
  listColumn: {},
  notifications: {
    position: 'fixed',
    top: '80px',
    right: '20px',
    width: '350px',
    zIndex: 1000
  }
}

export default App
