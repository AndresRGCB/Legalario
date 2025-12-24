import { useState, useEffect } from 'react'
import { api } from '../services/api'
import LoadingOverlay from './LoadingOverlay'

export default function WikipediaSearch({ onSuccess, onError }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [result, setResult] = useState(null)
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
      const data = await api.getWikipediaHistory(0, 10)
      setHistory(data)
    } catch (err) {
      console.error('Error cargando historial:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (searchTerm.trim().length < 1) {
      onError({ message: 'Ingresa un termino de busqueda' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const data = await api.wikipediaSearch({ search_term: searchTerm, max_tokens: 500 })
      // Quitar loading ANTES de mostrar resultado
      setLoading(false)
      setResult(data)
      onSuccess({ message: 'Busqueda completada exitosamente' })
      // Recargar historial en background (sin bloquear)
      loadHistory()
    } catch (err) {
      setLoading(false)
      onError(err)
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
      {loading && <LoadingOverlay message="Extrayendo información de Wikipedia y generando resumen..." />}

      {/* Seccion principal - Formulario y Resultado */}
      <div style={styles.mainSection}>
        <h2 style={styles.title}>Busqueda Wikipedia + Resumen IA</h2>
        <p style={styles.subtitle}>Busca un termino en Wikipedia y obtiene un resumen generado por Claude</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej: Inteligencia artificial, Mexico, Python..."
              style={styles.input}
              disabled={loading}
            />
            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading || searchTerm.trim().length < 1 ? 0.6 : 1,
                cursor: loading || searchTerm.trim().length < 1 ? 'not-allowed' : 'pointer'
              }}
              disabled={loading || searchTerm.trim().length < 1}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>

        {result && (
          <div style={styles.resultContainer}>
            <h3 style={styles.resultTitle}>Resultado para: {result.search_term}</h3>

            <div style={styles.urlContainer}>
              <span style={styles.urlLabel}>URL:</span>
              <a
                href={result.wikipedia_url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.urlLink}
              >
                {result.wikipedia_url}
              </a>
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Texto Extraido de Wikipedia:</h4>
              <p style={styles.extractedText}>{result.extracted_text}</p>
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>Resumen Generado por IA:</h4>
              <p style={styles.summaryText}>{result.summary}</p>
            </div>

            <div style={styles.meta}>
              <span style={styles.metaItem}>Modelo: {result.model_used}</span>
              <span style={styles.metaItem}>Tiempo: {result.processing_time_ms}ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Seccion de Historial */}
      <div style={styles.historySection}>
        <h3 style={styles.historyTitle}>Historial de Busquedas</h3>

        {loadingHistory ? (
          <div style={styles.loadingHistory}>Cargando historial...</div>
        ) : history.length === 0 ? (
          <div style={styles.emptyHistory}>No hay busquedas anteriores</div>
        ) : (
          <div style={styles.historyList}>
            {history.map((item) => {
              const isExpanded = expandedItems[item.id]
              return (
                <div key={item.id} style={styles.historyItem}>
                  <div style={styles.historyHeader}>
                    <span style={styles.historyTerm}>{item.search_term}</span>
                    <div style={styles.historyHeaderRight}>
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
                  </div>

                  {isExpanded ? (
                    <>
                      <div style={styles.historyUrl}>
                        <a href={item.wikipedia_url} target="_blank" rel="noopener noreferrer">
                          {item.wikipedia_url}
                        </a>
                      </div>
                      <div style={styles.historyLabel}>Texto Extraido:</div>
                      <div style={styles.historyExtracted}>{item.extracted_text}</div>
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
    marginBottom: '20px'
  },
  inputGroup: {
    display: 'flex',
    gap: '12px'
  },
  input: {
    flex: 1,
    padding: '14px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  button: {
    backgroundColor: '#059669',
    color: '#fff',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    gap: '15px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #059669',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#666',
    fontSize: '0.9rem'
  },
  resultContainer: {
    marginTop: '25px',
    padding: '20px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #bbf7d0'
  },
  resultTitle: {
    margin: '0 0 15px 0',
    fontSize: '1.1rem',
    color: '#166534'
  },
  urlContainer: {
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #d1fae5'
  },
  urlLabel: {
    fontSize: '0.8rem',
    color: '#666',
    marginRight: '8px'
  },
  urlLink: {
    color: '#059669',
    textDecoration: 'none',
    fontSize: '0.85rem',
    wordBreak: 'break-all'
  },
  section: {
    marginBottom: '15px'
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '0.9rem',
    color: '#166534',
    fontWeight: '600'
  },
  extractedText: {
    margin: 0,
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #d1fae5',
    lineHeight: '1.6',
    color: '#333',
    fontSize: '0.9rem'
  },
  summaryText: {
    margin: 0,
    padding: '12px',
    backgroundColor: '#dcfce7',
    borderRadius: '4px',
    lineHeight: '1.6',
    color: '#166534',
    fontSize: '0.95rem',
    fontWeight: '500'
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    paddingTop: '12px',
    borderTop: '1px solid #bbf7d0'
  },
  metaItem: {
    fontSize: '0.75rem',
    color: '#059669',
    backgroundColor: '#d1fae5',
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
    alignItems: 'flex-start',
    marginBottom: '10px',
    gap: '10px'
  },
  historyTerm: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#059669'
  },
  historyHeaderRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '5px'
  },
  historyDate: {
    fontSize: '0.7rem',
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
  historyUrl: {
    fontSize: '0.75rem',
    marginBottom: '10px',
    wordBreak: 'break-all'
  },
  historyLabel: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: '4px',
    fontWeight: '600'
  },
  historyExtracted: {
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
    color: '#059669',
    backgroundColor: '#d1fae5',
    padding: '2px 6px',
    borderRadius: '4px'
  }
}
