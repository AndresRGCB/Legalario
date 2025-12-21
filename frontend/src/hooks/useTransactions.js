import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

export function useTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getTransactions()
      setTransactions(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const addTransaction = useCallback((transaction) => {
    setTransactions(prev => [transaction, ...prev])
  }, [])

  const updateTransaction = useCallback((updatedTransaction) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === updatedTransaction.id
          ? { ...t, ...updatedTransaction }
          : t
      )
    )
  }, [])

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    addTransaction,
    updateTransaction
  }
}
