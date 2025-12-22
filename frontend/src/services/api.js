const API_BASE = '/api'

// Obtener token del localStorage
const getToken = () => localStorage.getItem('token')

// Headers con autenticacion
const getAuthHeaders = () => {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

export const api = {
  /**
   * Registrar nuevo usuario
   */
  async register(data) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.detail?.message || result.detail || 'Error al registrar')
    }

    return result
  },

  /**
   * Iniciar sesion
   */
  async login(data) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.detail?.message || result.detail || 'Error al iniciar sesion')
    }

    return result
  },

  /**
   * Obtener usuario actual
   */
  async getMe() {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('No autenticado')
    }

    return response.json()
  },

  /**
   * Crear transaccion sincrona
   */
  async createTransaction(data) {
    const response = await fetch(`${API_BASE}/transactions/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.detail?.message || result.detail || 'Error al crear transaccion')
    }

    return result
  },

  /**
   * Crear transaccion asincrona (con Celery)
   */
  async createAsyncTransaction(data) {
    const response = await fetch(`${API_BASE}/transactions/async-process`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.detail?.message || result.detail || 'Error al crear transaccion async')
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

    const response = await fetch(`${API_BASE}/transactions/?${params}`, {
      headers: getAuthHeaders()
    })

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
