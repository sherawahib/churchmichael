import defaultSite from '../data/site-content.json'
import defaultSermons from '../data/sermons.json'

export const CMS_STORAGE_KEY = 'cgi-cms-v2'
export const CMS_AUTH_KEY = 'cgi-cms-auth-v1'
export const DEFAULT_ADMIN_PASSWORD = 'CGI@Admin2026'

export const BIBLE_VERSIONS = [
  { id: 'kjv', label: 'King James Version', short: 'KJV', source: 'bible-api' },
  { id: 'web', label: 'World English Bible', short: 'WEB', source: 'bible-api' },
  { id: 'NKJV', label: 'New King James Version', short: 'NKJV', source: 'bolls' },
  { id: 'NIV', label: 'New International Version', short: 'NIV', source: 'bolls' },
]

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
    text: 'Join us for Sabbath worship in Gaithersburg — or connect online for Bible teaching and fellowship.',
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
  'Online Bible Study · Sabbath afternoon',
  'Weekly Sabbath Service · See service time below',
]

export const defaultMemorialPages = [
  {
    slug: 'in-memory',
    title: 'In Loving Memory',
    subtitle: 'Remembering those who rested in the Lord',
    honoree: '',
    dates: '',
    body: 'This page is reserved to honor beloved members of our congregation. The administrator can update this memorial with a name, dates, tribute, and photo.',
    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1600&q=85',
    published: true,
  },
]

export const defaultSettings = {
  prayerEmail: 'elder@cgimaryland.org',
  prayerSubject: 'Prayer Request — CGI Maryland',
  bibleDefaultVersion: 'kjv',
  bibleEnabledVersions: ['kjv', 'web', 'NKJV', 'NIV'],
  memorialMenuLabel: 'In Memory',
  showMemorialInMenu: true,
}

export function normalizeSite(site) {
  const next = structuredClone(site || {})
  next.worship = {
    place: 'Casey Community Center',
    room: 'Aspen Room',
    address: '810 S. Frederick Ave. (2nd Floor)',
    city: 'Gaithersburg, MD 20877',
    time: 'Saturday at 1:45 PM',
    timeShort: 'Sat 1:45 PM',
    phone: '240-780-6910',
    email: 'info@cgimaryland.org',
    directions: 'https://www.google.com/maps/place/Casey+Community+Center/@39.124029,-77.181646,15z',
    virtual: 'Virtual Meeting (GoTo Meeting): Open View Calendar and click the event title to join.',
    ...(next.worship || {}),
  }
  if (!next.worship.room) next.worship.room = 'Aspen Room'
  if (!next.worship.timeShort) next.worship.timeShort = 'Sat 1:45 PM'
  if (!Array.isArray(next.calendar2027) || !next.calendar2027.length) {
    next.calendar2027 = next.calendar2026 || []
  }
  if (!next.calendarYear) next.calendarYear = '2027'
  return next
}

export function createDefaultContent() {
  const site = normalizeSite(defaultSite)
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    site,
    sermons: structuredClone(defaultSermons).map((sermon) => ({
      video: '',
      ...sermon,
    })),
    heroSlides: structuredClone(defaultHeroSlides),
    ticker: [...defaultTicker],
    memorialPages: structuredClone(defaultMemorialPages),
    settings: structuredClone(defaultSettings),
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
    const raw = localStorage.getItem(CMS_STORAGE_KEY) || localStorage.getItem('cgi-cms-v1')
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
    version: content.version || 2,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('cgi-cms-updated', { detail: next }))
  return next
}

export function clearLocalContent() {
  localStorage.removeItem(CMS_STORAGE_KEY)
  localStorage.removeItem('cgi-cms-v1')
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
  const site = normalizeSite({ ...base.site, ...(override.site || {}) })
  if (override.site?.worship) site.worship = { ...site.worship, ...override.site.worship }
  if (override.site?.contact) site.contact = { ...site.contact, ...override.site.contact, people: override.site.contact.people || site.contact?.people }
  if (override.site?.donate) site.donate = { ...site.donate, ...override.site.donate, mailTo: { ...site.donate?.mailTo, ...override.site.donate?.mailTo } }
  return {
    ...base,
    ...override,
    site,
    sermons: Array.isArray(override.sermons) ? override.sermons : base.sermons,
    heroSlides: Array.isArray(override.heroSlides) ? override.heroSlides : base.heroSlides,
    ticker: Array.isArray(override.ticker) ? override.ticker : base.ticker,
    memorialPages: Array.isArray(override.memorialPages) ? override.memorialPages : base.memorialPages,
    settings: { ...base.settings, ...(override.settings || {}) },
    admin: { ...base.admin, ...(override.admin || {}) },
  }
}
