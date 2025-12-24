export default function LoadingOverlay({ message = 'Procesando...' }) {
  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={styles.overlay}>
        <div style={styles.content}>
          <div style={styles.spinner}></div>
          <p style={styles.message}>{message}</p>
        </div>
      </div>
    </>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)'
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px 60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #7c3aed',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  message: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '300px',
    lineHeight: '1.5'
  }
}
