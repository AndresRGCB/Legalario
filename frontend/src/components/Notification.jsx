const NOTIFICATION_STYLES = {
  success: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    color: '#155724'
  },
  error: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    color: '#721c24'
  },
  info: {
    backgroundColor: '#cce5ff',
    borderColor: '#b8daff',
    color: '#004085'
  },
  warning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    color: '#856404'
  }
}

export default function Notification({ type = 'info', message, onClose }) {
  const typeStyles = NOTIFICATION_STYLES[type] || NOTIFICATION_STYLES.info

  return (
    <div style={{ ...styles.notification, ...typeStyles }}>
      <span style={styles.message}>{message}</span>
      <button onClick={onClose} style={styles.closeButton}>
        x
      </button>
    </div>
  )
}

const styles = {
  notification: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '10px',
    border: '1px solid',
    animation: 'slideIn 0.3s ease-out'
  },
  message: {
    flex: 1
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    opacity: 0.5,
    marginLeft: '10px'
  }
}
