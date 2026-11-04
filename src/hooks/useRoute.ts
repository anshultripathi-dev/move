import { useEffect, useState, useCallback } from 'react'

const read = () => {
  const h = window.location.hash.replace(/^#/, '')
  return h === '' ? '/' : h.startsWith('/') ? h : `/${h}`
}

export function navigate(path: string) {
  if (read() === path) return
  window.location.hash = path
}

export function useRoute() {
  const [path, setPath] = useState(read())
  useEffect(() => {
    const on = () => setPath(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const go = useCallback((p: string) => navigate(p), [])
  return { path, go }
}
