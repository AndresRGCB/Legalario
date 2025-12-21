import { useState, useEffect, useRef, useCallback } from 'react'

export function useWebSocket(path, options = {}) {
  const [lastMessage, setLastMessage] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    // Construir URL del WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}${path}`

    console.log('Connecting to WebSocket:', wsUrl)

    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      setConnectionStatus('connected')
      console.log('WebSocket connected')
    }

    wsRef.current.onmessage = (event) => {
      console.log('WebSocket message:', event.data)
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
      } catch (e) {
        // Si no es JSON, ignorar (probablemente es "pong")
        if (event.data !== 'pong') {
          console.log('Non-JSON message:', event.data)
        }
      }
    }

    wsRef.current.onclose = () => {
      setConnectionStatus('disconnected')
      console.log('WebSocket disconnected, reconnecting in 3s...')
      // Reconectar después de 3 segundos
      reconnectTimeoutRef.current = setTimeout(connect, 3000)
    }

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('error')
    }
  }, [path])

  useEffect(() => {
    connect()

    // Ping cada 30 segundos para mantener conexión viva
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping')
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message))
    }
  }, [])

  return { lastMessage, connectionStatus, sendMessage }
}
