import { useState, useEffect } from 'react'
import TransactionList from './components/TransactionList'
import TransactionForm from './components/TransactionForm'
import Notification from './components/Notification'
import { Login } from './components/Login'
import { useWebSocket } from './hooks/useWebSocket'
import { useTransactions } from './hooks/useTransactions'

// Estilos globales para resetear margenes del body
const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body, #root {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100vh;
  }
`

function App() {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const { transactions, loading, error, refetch, addTransaction, updateTransaction } = useTransactions()

  // Verificar si hay sesion guardada al cargar
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // WebSocket para actualizaciones en tiempo real
  const { lastMessage, connectionStatus } = useWebSocket('/api/transactions/stream')

  // Procesar mensajes del WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'STATUS_CHANGE' && lastMessage.data) {
      try {
        const data = lastMessage.data

        // Actualizar la transaccion en la lista
        updateTransaction({
          id: data.id,
          status: data.status,
          updated_at: data.updated_at,
          processed_at: data.processed_at,
          error_message: data.error_message
        })

        // Mostrar notificacion
        const notificationType = data.status === 'procesado' ? 'success' : 'error'
        const shortId = String(data.id || '').slice(0, 8)
        const statusText = String(data.status || '').toUpperCase()
        addNotification({
          type: notificationType,
          message: `Transaccion ${shortId}... cambio a: ${statusText}`
        })
      } catch (err) {
        console.error('Error procesando mensaje WebSocket:', err)
      }
    }
  }, [lastMessage, updateTransaction])

  const addNotification = (notification) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { ...notification, id }])

    // Auto-remove despues de 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    refetch()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const handleSuccess = (result, mode) => {
    if (mode === 'sync') {
      // Transaccion sincrona - agregar a la lista
      addTransaction(result)
      addNotification({
        type: 'success',
        message: 'Transaccion creada y procesada exitosamente'
      })
    } else {
      // Transaccion asincrona - agregar con status pendiente
      addTransaction({
        id: result.transaction_id,
        status: 'pendiente',
        ...result
      })
      const shortTaskId = String(result.task_id || '').slice(0, 8)
      addNotification({
        type: 'info',
        message: `Transaccion encolada. Task ID: ${shortTaskId}...`
      })

      // Refetch para obtener la transaccion completa
      setTimeout(() => refetch(), 500)
    }
  }

  const handleError = (error) => {
    addNotification({
      type: 'error',
      message: error.message
    })
  }

  // Si no hay usuario, mostrar login
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div style={styles.app}>
        <header style={styles.header}>
          <h1 style={styles.title}>Sistema de Transacciones</h1>
          <div style={styles.headerRight}>
            <div style={styles.statusContainer}>
              <span style={styles.statusLabel}>WebSocket:</span>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: connectionStatus === 'connected' ? '#28a745' : '#dc3545'
              }}>
                {connectionStatus}
              </span>
            </div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user.full_name || user.email}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Cerrar Sesion
              </button>
            </div>
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
    </>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#343a40',
    color: '#fff',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
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
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    color: '#fff',
    fontWeight: 500
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    borderLeft: '1px solid rgba(255,255,255,0.2)',
    paddingLeft: '20px'
  },
  userName: {
    fontSize: '0.95rem',
    fontWeight: 500
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    transition: 'all 0.2s ease'
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '20px',
    padding: '20px 30px',
    paddingTop: '80px',
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
