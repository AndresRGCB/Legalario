const API_BASE = '/api'

export const api = {
  /**
   * Crear transacción síncrona
   */
  async createTransaction(data) {
    const response = await fetch(`${API_BASE}/transactions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.detail?.message || result.detail || 'Error al crear transacción')
    }

    return result
  },

  /**
   * Crear transacción asíncrona (con Celery)
   */
  async createAsyncTransaction(data) {
    const response = await fetch(`${API_BASE}/transactions/async-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.detail?.message || result.detail || 'Error al crear transacción async')
    }

    return result
  },

  /**
   * Obtener lista de transacciones
   */
  async getTransactions(filters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })

    const response = await fetch(`${API_BASE}/transactions/?${params}`)

    if (!response.ok) {
      throw new Error('Error al obtener transacciones')
    }

    return response.json()
  },

  /**
   * Verificar salud del API
   */
  async healthCheck() {
    const response = await fetch(`${API_BASE}/health`)
    return response.json()
  }
}
