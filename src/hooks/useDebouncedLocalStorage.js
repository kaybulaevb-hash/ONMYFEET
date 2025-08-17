import { useEffect } from 'react'

export default function useDebouncedLocalStorage(key, value, delay = 300) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(key, value)
    }, delay)
    return () => clearTimeout(timeout)
  }, [key, value, delay])
}
