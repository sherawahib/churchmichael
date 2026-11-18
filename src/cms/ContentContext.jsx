import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  CMS_AUTH_KEY,
  DEFAULT_ADMIN_PASSWORD,
  clearLocalContent,
  createDefaultContent,
  downloadContent,
  hashPassword,
  loadRemoteContent,
  mergeContent,
  readLocalContent,
  writeLocalContent,
} from './store'

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const defaults = useMemo(() => createDefaultContent(), [])
  const [content, setContent] = useState(defaults)
  const [loading, setLoading] = useState(true)
  const [auth, setAuth] = useState(() => localStorage.getItem(CMS_AUTH_KEY) === '1')
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      const local = readLocalContent()
      const remote = await loadRemoteContent()
      if (!active) return

      let next = defaults
      if (remote) next = mergeContent(defaults, remote)
      if (local) {
        const localTime = Date.parse(local.updatedAt || 0) || 0
        const remoteTime = Date.parse(remote?.updatedAt || 0) || 0
        if (!remote || localTime >= remoteTime) next = mergeContent(defaults, local)
      }

      if (!next.admin?.passwordHash) {
        next = {
          ...next,
          admin: {
            ...next.admin,
            passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
          },
        }
      }

      setContent(next)
      setLoading(false)
    })()

    const onUpdate = (event) => {
      if (event.detail) setContent(event.detail)
    }
    const onStorage = (event) => {
      if (event.key === 'cgi-cms-v1' && event.newValue) {
        try { setContent(JSON.parse(event.newValue)) } catch { /* ignore */ }
      }
    }
    window.addEventListener('cgi-cms-updated', onUpdate)
    window.addEventListener('storage', onStorage)
    return () => {
      active = false
      window.removeEventListener('cgi-cms-updated', onUpdate)
      window.removeEventListener('storage', onStorage)
    }
  }, [defaults])

  const persist = useCallback((updater) => {
    setContent((current) => {
      const draft = typeof updater === 'function' ? updater(structuredClone(current)) : updater
      const saved = writeLocalContent(draft)
      setSaveMessage('Saved — website updated')
      window.setTimeout(() => setSaveMessage(''), 2200)
      return saved
    })
  }, [])

  const login = useCallback(async (password) => {
    const hash = await hashPassword(password)
    const expected = content.admin?.passwordHash || await hashPassword(DEFAULT_ADMIN_PASSWORD)
    if (hash !== expected) return false
    localStorage.setItem(CMS_AUTH_KEY, '1')
    setAuth(true)
    return true
  }, [content.admin?.passwordHash])

  const logout = useCallback(() => {
    localStorage.removeItem(CMS_AUTH_KEY)
    setAuth(false)
  }, [])

  const changePassword = useCallback(async (currentPassword, nextPassword) => {
    const currentHash = await hashPassword(currentPassword)
    const expected = content.admin?.passwordHash || await hashPassword(DEFAULT_ADMIN_PASSWORD)
    if (currentHash !== expected) return { ok: false, error: 'Current password is incorrect.' }
    if (!nextPassword || nextPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
    const passwordHash = await hashPassword(nextPassword)
    persist((draft) => {
      draft.admin = { ...draft.admin, passwordHash }
      return draft
    })
    return { ok: true }
  }, [content.admin?.passwordHash, persist])

  const resetToDefaults = useCallback(async () => {
    clearLocalContent()
    const fresh = createDefaultContent()
    fresh.admin.passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD)
    const saved = writeLocalContent(fresh)
    setContent(saved)
    setSaveMessage('Reset to original content')
    window.setTimeout(() => setSaveMessage(''), 2200)
  }, [])

  const importFromFile = useCallback(async (file) => {
    const text = await file.text()
    const parsed = JSON.parse(text)
    if (!parsed?.site || !Array.isArray(parsed?.sermons)) throw new Error('Invalid CMS file')
    const merged = mergeContent(defaults, parsed)
    if (!merged.admin?.passwordHash) {
      merged.admin = {
        ...merged.admin,
        passwordHash: content.admin?.passwordHash || await hashPassword(DEFAULT_ADMIN_PASSWORD),
      }
    }
    const saved = writeLocalContent(merged)
    setContent(saved)
    setSaveMessage('Imported successfully')
    window.setTimeout(() => setSaveMessage(''), 2200)
  }, [content.admin?.passwordHash, defaults])

  const exportFile = useCallback(() => {
    downloadContent(content)
  }, [content])

  const value = useMemo(() => ({
    content,
    site: content.site,
    sermons: content.sermons,
    heroSlides: content.heroSlides,
    ticker: content.ticker,
    memorialPages: content.memorialPages || [],
    settings: content.settings || {},
    loading,
    auth,
    saveMessage,
    persist,
    login,
    logout,
    changePassword,
    resetToDefaults,
    importFromFile,
    exportFile,
  }), [auth, changePassword, content, exportFile, importFromFile, loading, login, logout, persist, resetToDefaults, saveMessage])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useCMS() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useCMS must be used within ContentProvider')
  return ctx
}
