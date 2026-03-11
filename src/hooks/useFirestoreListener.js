/**
 * useFirestoreListener.js
 * Subscribes to a Firestore document and returns its data in real-time.
 */
'use client'
import { useEffect, useState } from 'react'
import { db, onSnapshot, doc } from '@/services/FirebaseService'

export default function useFirestoreListener(path) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!path) {
      setLoading(false)
      return
    }

    const segments = path.split('/')
    const ref = doc(db, ...segments)

    const unsub = onSnapshot(ref, (snap) => {
      setData(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    }, (err) => {
      console.error('[useFirestoreListener] Error:', err)
      setLoading(false)
    })

    return () => unsub()
  }, [path])

  return { data, loading }
}
