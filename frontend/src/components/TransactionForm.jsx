import { useState } from 'react'
import { api } from '../services/api'

const TRANSACTION_TYPES = [
  { value: 'deposito', label: 'Deposito' },
  { value: 'retiro', label: 'Retiro' },
  { value: 'transferencia', label: 'Transferencia' }
]

export default function TransactionForm({ onSuccess, onError }) {
  const [formData, setFormData] = useState({
    user_id: '',
    monto: '',
    tipo: 'deposito'
  })
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('sync') // 'sync' o 'async'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        user_id: formData.user_id,
        monto: parseFloat(formData.monto),
        tipo: formData.tipo
      }

      let result
      if (mode === 'sync') {
        result = await api.createTransaction(data)
      } else {
        result = await api.createAsyncTransaction(data)
      }

      onSuccess(result, mode)
      setFormData({ user_id: '', monto: '', tipo: 'deposito' })
    } catch (err) {
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Nueva Transaccion</h2>

      <div style={styles.modeSelector}>
        <button
          type="button"
          style={{
            ...styles.modeButton,
            ...(mode === 'sync' ? styles.modeButtonActive : {})
          }}
          onClick={() => setMode('sync')}
        >
          Sincrono
        </button>
        <button
          type="button"
          style={{
            ...styles.modeButton,
            ...(mode === 'async' ? styles.modeButtonActive : {})
          }}
          onClick={() => setMode('async')}
        >
          Asincrono (Celery)
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>User ID</label>
          <input
            type="text"
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="ej: user123"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Monto</label>
          <input
            type="number"
            name="monto"
            value={formData.monto}
            onChange={handleChange}
            required
            min="0.01"
            step="0.01"
            style={styles.input}
            placeholder="ej: 100.00"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Tipo</label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            style={styles.input}
          >
            {TRANSACTION_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.submitButton,
            ...(loading ? styles.submitButtonDisabled : {})
          }}
        >
          {loading ? 'Procesando...' : `Crear (${mode === 'sync' ? 'Sincrono' : 'Asincrono'})`}
        </button>
      </form>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  title: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '1.25rem'
  },
  modeSelector: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  modeButton: {
    flex: 1,
    padding: '10px',
    border: '2px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  },
  modeButtonActive: {
    borderColor: '#007bff',
    backgroundColor: '#007bff',
    color: '#fff'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '500',
    color: '#555'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  submitButton: {
    padding: '12px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  }
}
