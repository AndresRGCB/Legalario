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

// Funcion para cerrar sesion y redirigir al login
const forceLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/'
}

// Wrapper para manejar respuestas con verificacion de autorizacion
const handleResponse = async (response, skipAuthCheck = false) => {
  // Si es 401 Unauthorized, forzar logout
  if (response.status === 401 && !skipAuthCheck) {
    forceLogout()
    throw new Error('Sesion expirada. Redirigiendo al login...')
  }
  return response
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
    let response = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    })
    response = await handleResponse(response)

    if (!response.ok) {
      throw new Error('No autenticado')
    }

    return response.json()
  },

  /**
   * Crear transaccion sincrona
   */
  async createTransaction(data) {
    let response = await fetch(`${API_BASE}/transactions/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    response = await handleResponse(response)

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
    let response = await fetch(`${API_BASE}/transactions/async-process`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    response = await handleResponse(response)

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

    let response = await fetch(`${API_BASE}/transactions/?${params}`, {
      headers: getAuthHeaders()
    })
    response = await handleResponse(response)

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
  },

  /**
   * Generar resumen con IA (Claude)
   */
  async summarizeText(data) {
    let response = await fetch(`${API_BASE}/assistant/summarize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    response = await handleResponse(response)

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.detail?.message || result.detail || 'Error al generar resumen')
    }

    return result
  },

  /**
   * Obtener historial de resumenes
   */
  async getSummaryHistory(skip = 0, limit = 20) {
    let response = await fetch(`${API_BASE}/assistant/history?skip=${skip}&limit=${limit}`, {
      headers: getAuthHeaders()
    })
    response = await handleResponse(response)

    if (!response.ok) {
      throw new Error('Error al obtener historial')
    }

    return response.json()
  },

  /**
   * Buscar en Wikipedia y generar resumen con IA
   */
  async wikipediaSearch(data) {
    let response = await fetch(`${API_BASE}/wikipedia/search`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    response = await handleResponse(response)

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.detail?.message || result.detail || 'Error al buscar en Wikipedia')
    }

    return result
  },

  /**
   * Obtener historial de busquedas en Wikipedia
   */
  async getWikipediaHistory(skip = 0, limit = 20) {
    let response = await fetch(`${API_BASE}/wikipedia/history?skip=${skip}&limit=${limit}`, {
      headers: getAuthHeaders()
    })
    response = await handleResponse(response)

    if (!response.ok) {
      throw new Error('Error al obtener historial de Wikipedia')
    }

    return response.json()
  }
}
