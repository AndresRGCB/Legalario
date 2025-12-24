import { useState, useEffect } from 'react'
import { api } from '../services/api'
import LoadingOverlay from './LoadingOverlay'

export default function AssistantSummary({ onSuccess, onError }) {
  const [text, setText] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [expandedItems, setExpandedItems] = useState({})

  // Cargar historial al montar
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoadingHistory(true)
      const data = await api.getSummaryHistory(0, 10)
      setHistory(data)
    } catch (err) {
      console.error('Error cargando historial:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (text.trim().length < 10) {
      onError({ message: 'El texto debe tener al menos 10 caracteres' })
      return
    }

    setLoading(true)
    setSummary(null)

    try {
      const result = await api.summarizeText({ text, max_tokens: 500 })
      setSummary(result)
      onSuccess({ message: 'Resumen generado exitosamente' })
      // Recargar historial
      loadHistory()
    } catch (err) {
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div style={styles.container}>
      {/* Loading Overlay */}
      {loading && <LoadingOverlay message="Generando resumen con IA..." />}

      {/* Seccion principal - Formulario y Resultado */}
      <div style={styles.mainSection}>
        <h2 style={styles.title}>Resumen con IA</h2>
        <p style={styles.subtitle}>Ingresa un texto y Claude generara un resumen conciso</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ingresa el texto que deseas resumir (minimo 10 caracteres)..."
            style={styles.textarea}
            disabled={loading}
          />

          <div style={styles.charCount}>
            {text.length} caracteres
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading || text.trim().length < 10 ? 0.6 : 1,
              cursor: loading || text.trim().length < 10 ? 'not-allowed' : 'pointer'
            }}
            disabled={loading || text.trim().length < 10}
          >
            {loading ? 'Generando resumen...' : 'Generar Resumen'}
          </button>
        </form>

        {summary && (
          <div style={styles.resultContainer}>
            <h3 style={styles.resultTitle}>Resumen Generado</h3>
            <p style={styles.resultText}>{summary.summary}</p>
            <div style={styles.meta}>
              <span style={styles.metaItem}>Modelo: {summary.model_used}</span>
              <span style={styles.metaItem}>Tokens: {summary.tokens_input} entrada / {summary.tokens_output} salida</span>
              <span style={styles.metaItem}>Tiempo: {summary.processing_time_ms}ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Seccion de Historial */}
      <div style={styles.historySection}>
        <h3 style={styles.historyTitle}>Historial de Resumenes</h3>

        {loadingHistory ? (
          <div style={styles.loadingHistory}>Cargando historial...</div>
        ) : history.length === 0 ? (
          <div style={styles.emptyHistory}>No hay resumenes anteriores</div>
        ) : (
          <div style={styles.historyList}>
            {history.map((item) => {
              const isExpanded = expandedItems[item.id]
              return (
                <div key={item.id} style={styles.historyItem}>
                  <div style={styles.historyHeader}>
                    <span style={styles.historyDate}>
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      style={styles.expandButton}
                    >
                      {isExpanded ? 'Colapsar' : 'Expandir'}
                    </button>
                  </div>

                  {isExpanded ? (
                    <>
                      <div style={styles.historyLabel}>Texto Original:</div>
                      <div style={styles.historyOriginal}>{item.original_text}</div>
                      <div style={styles.historyLabel}>Resumen:</div>
                      <div style={styles.historySummaryFull}>{item.summary}</div>
                    </>
                  ) : (
                    <div style={styles.historySummaryCollapsed}>
                      {item.summary.length > 100 ? item.summary.slice(0, 100) + '...' : item.summary}
                    </div>
                  )}

                  <div style={styles.historyMeta}>
                    <span style={styles.historyModelBadge}>{item.model_used}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    padding: '20px'
  },
  mainSection: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '25px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '1.5rem'
  },
  subtitle: {
    margin: '0 0 20px 0',
    color: '#666',
    fontSize: '0.9rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  textarea: {
    width: '100%',
    minHeight: '150px',
    padding: '14px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    boxSizing: 'border-box'
  },
  charCount: {
    textAlign: 'right',
    fontSize: '0.8rem',
    color: '#999'
  },
  button: {
    backgroundColor: '#7c3aed',
    color: '#fff',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  resultContainer: {
    marginTop: '25px',
    padding: '20px',
    backgroundColor: '#f8f5ff',
    borderRadius: '8px',
    border: '1px solid #e9e3ff'
  },
  resultTitle: {
    margin: '0 0 12px 0',
    fontSize: '1rem',
    color: '#5b21b6'
  },
  resultText: {
    margin: '0 0 15px 0',
    lineHeight: '1.7',
    color: '#333',
    fontSize: '0.95rem'
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    paddingTop: '12px',
    borderTop: '1px solid #e9e3ff'
  },
  metaItem: {
    fontSize: '0.75rem',
    color: '#7c3aed',
    backgroundColor: '#ede9fe',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  historySection: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '25px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  historyTitle: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '1.1rem'
  },
  loadingHistory: {
    textAlign: 'center',
    color: '#666',
    padding: '30px'
  },
  emptyHistory: {
    textAlign: 'center',
    color: '#999',
    padding: '30px',
    fontStyle: 'italic'
  },
  historyList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px'
  },
  historyItem: {
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  historyDate: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  expandButton: {
    padding: '4px 10px',
    fontSize: '0.7rem',
    backgroundColor: '#e5e7eb',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#374151',
    fontWeight: '500'
  },
  historyLabel: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: '4px',
    fontWeight: '600'
  },
  historyOriginal: {
    fontSize: '0.8rem',
    color: '#6b7280',
    marginBottom: '12px',
    padding: '8px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
    maxHeight: '100px',
    overflowY: 'auto',
    lineHeight: '1.4'
  },
  historySummaryFull: {
    fontSize: '0.85rem',
    color: '#333',
    lineHeight: '1.5',
    marginBottom: '10px',
    padding: '8px',
    backgroundColor: '#f0fdf4',
    borderRadius: '4px',
    border: '1px solid #bbf7d0'
  },
  historySummaryCollapsed: {
    fontSize: '0.85rem',
    color: '#333',
    lineHeight: '1.4',
    marginBottom: '10px'
  },
  historyMeta: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  historyModelBadge: {
    fontSize: '0.65rem',
    color: '#7c3aed',
    backgroundColor: '#ede9fe',
    padding: '2px 6px',
    borderRadius: '4px'
  }
}
