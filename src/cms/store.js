import defaultSite from '../data/site-content.json'
import defaultSermons from '../data/sermons.json'

export const CMS_STORAGE_KEY = 'cgi-cms-v1'
export const CMS_AUTH_KEY = 'cgi-cms-auth-v1'
export const DEFAULT_ADMIN_PASSWORD = 'CGI@Admin2026'

export const defaultHeroSlides = [
  {
    eyebrow: 'Faith · Fellowship · Truth',
    titleLine1: 'A place to belong.',
    titleLine2: 'A faith to live.',
    text: 'Join a welcoming community seeking to follow Jesus Christ, honor God’s Word, and grow together in faith.',
    primaryLabel: 'Plan Your Visit',
    primaryTo: '/events',
    secondaryLabel: 'Watch Online',
    secondaryHref: 'https://www.cgi.org/',
    image: 'https://images.unsplash.com/photo-1438232993091-fece05f0b1d3?auto=format&fit=crop&w=1800&q=85',
    position: 'center',
  },
  {
    eyebrow: 'Worship this Sabbath',
    titleLine1: 'Gather in worship.',
    titleLine2: 'Grow in the Word.',
    text: 'Join us Saturday at 1:45 PM in Gaithersburg — or connect online for Bible teaching and fellowship.',
    primaryLabel: 'Service Details',
    primaryTo: '/events',
    secondaryLabel: 'Contact Us',
    secondaryTo: '/contact-us',
    image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1800&q=85',
    position: 'center 40%',
  },
  {
    eyebrow: 'Holy Day season',
    titleLine1: 'Remember His works.',
    titleLine2: 'Rejoice in His plan.',
    text: 'Discover the annual Holy Days that reveal God’s plan of salvation and deepen our walk with Christ.',
    primaryLabel: 'Holy Days Calendar',
    primaryTo: '/annual-holy-days',
    secondaryLabel: 'Our Beliefs',
    secondaryTo: '/beliefs',
    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1800&q=85',
    position: 'center',
  },
]

export const defaultTicker = [
  'Friday Night Prayer · 7:15 PM',
  'Online Bible Study · Sat 1:45 PM',
  'Weekly Sabbath Service · Sat 1:45 PM',
]

export function createDefaultContent() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    site: structuredClone(defaultSite),
    sermons: structuredClone(defaultSermons),
    heroSlides: structuredClone(defaultHeroSlides),
    ticker: [...defaultTicker],
    admin: {
      passwordHash: '',
    },
  }
}

export async function hashPassword(password) {
  const data = new TextEncoder().encode(String(password || ''))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function readLocalContent() {
  try {
    const raw = localStorage.getItem(CMS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.site || !Array.isArray(parsed?.sermons)) return null
    return parsed
  } catch {
    return null
  }
}

export function writeLocalContent(content) {
  const next = {
    ...content,
    version: content.version || 1,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('cgi-cms-updated', { detail: next }))
  return next
}

export function clearLocalContent() {
  localStorage.removeItem(CMS_STORAGE_KEY)
}

export function downloadContent(content, filename = 'cms-data.json') {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function loadRemoteContent() {
  try {
    const response = await fetch(`/cms-data.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!response.ok) return null
    const parsed = await response.json()
    if (!parsed?.site || !Array.isArray(parsed?.sermons)) return null
    return parsed
  } catch {
    return null
  }
}

export function mergeContent(base, override) {
  if (!override) return base
  return {
    ...base,
    ...override,
    site: { ...base.site, ...(override.site || {}) },
    sermons: Array.isArray(override.sermons) ? override.sermons : base.sermons,
    heroSlides: Array.isArray(override.heroSlides) ? override.heroSlides : base.heroSlides,
    ticker: Array.isArray(override.ticker) ? override.ticker : base.ticker,
    admin: { ...base.admin, ...(override.admin || {}) },
  }
}
