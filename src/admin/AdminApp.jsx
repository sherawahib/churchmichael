import { useMemo, useState } from 'react'
import { useCMS } from '../cms/ContentContext'
import { BIBLE_VERSIONS, DEFAULT_ADMIN_PASSWORD } from '../cms/store'
import './admin.css'

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'site', label: 'Site & Worship' },
  { id: 'prayer', label: 'Prayer Request' },
  { id: 'hero', label: 'Hero Slides' },
  { id: 'ticker', label: 'Top Ticker / Events Scroll' },
  { id: 'sermons', label: 'Sermons (Audio/Video)' },
  { id: 'events', label: 'Events' },
  { id: 'beliefs', label: 'Beliefs' },
  { id: 'holy', label: 'Holy Days Calendar' },
  { id: 'memorial', label: 'In Memory Pages' },
  { id: 'bible', label: 'Bible Versions' },
  { id: 'ministry', label: 'Ministry' },
  { id: 'contact', label: 'Contact Team' },
  { id: 'donate', label: 'Donate' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'settings', label: 'Settings' },
]

function Field({ label, children, full }) {
  return (
    <div className={`admin-field${full ? ' full' : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  )
}

function LoginScreen() {
  const { login } = useCMS()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const ok = await login(password)
    setBusy(false)
    if (!ok) setError('Incorrect password. Try again.')
  }

  return (
    <div className="admin-shell admin-login">
      <form className="admin-login-card" onSubmit={onSubmit}>
        <img src="/cgi-logo.png" alt="CGI logo" />
        <h1>Admin Panel</h1>
        <p>Sign in to manage website content, sermons, events, and more.</p>
        {error && <div className="admin-error">{error}</div>}
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" autoFocus />
        </label>
        <button className="admin-btn block" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        <p className="admin-hint" style={{ marginTop: 16, textAlign: 'center' }}>Default password: <code>{DEFAULT_ADMIN_PASSWORD}</code></p>
      </form>
    </div>
  )
}

function Dashboard() {
  const { site, sermons, heroSlides } = useCMS()
  const stats = [
    { label: 'Sermons', value: sermons.length },
    { label: 'Events', value: site.events?.length || 0 },
    { label: 'Beliefs', value: site.beliefs?.length || 0 },
    { label: 'Hero slides', value: heroSlides.length },
  ]
  return (
    <>
      <div className="admin-grid">
        {stats.map((item) => (
          <div className="admin-stat" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Quick guide</h2></div>
        <p className="admin-hint">
          From this panel you can manage audio/video sermons, events, header ticker, worship time &amp; Casey Center room, prayer request email, holy day calendar, Bible versions, memorial pages, contacts, and more.
          Changes save immediately. Use <strong>Export JSON</strong> in Settings, replace <code>public/cms-data.json</code>, and redeploy so every visitor sees the same content.
        </p>
        <p className="admin-hint">
          Current worship: {site.worship?.time} · {site.worship?.place} · {site.worship?.room} · {site.worship?.phone}
        </p>
      </div>
    </>
  )
}

function SiteEditor() {
  const { site, persist } = useCMS()
  const worship = site.worship || {}

  function updateWorship(key, value) {
    persist((draft) => {
      draft.site.worship = { ...draft.site.worship, [key]: value }
      return draft
    })
  }

  const fields = [
    ['place', 'Place / building name'],
    ['room', 'Room / location note (can change anytime)'],
    ['address', 'Street address'],
    ['city', 'City / ZIP'],
    ['time', 'Service time (full, e.g. Saturday at 1:45 PM)'],
    ['timeShort', 'Service time short (header, e.g. Sat 1:45 PM)'],
    ['phone', 'Phone'],
    ['email', 'Email'],
    ['directions', 'Directions / Google Maps URL'],
    ['virtual', 'Virtual meeting notes'],
  ]

  return (
    <div className="admin-panel">
      <div className="admin-panel-head"><h2>Worship, Casey Center & service time</h2></div>
      <p className="admin-hint">Update service time, room location, and address here. Changes appear across the whole website (header, footer, contact, events).</p>
      <div className="admin-fields">
        {fields.map(([key, label]) => (
          <Field key={key} label={label} full={key === 'virtual' || key === 'directions' || key === 'address'}>
            <input value={worship[key] || ''} onChange={(e) => updateWorship(key, e.target.value)} />
          </Field>
        ))}
        <Field label="Home scripture text" full>
          <textarea value={site.scripture || ''} onChange={(e) => persist((d) => { d.site.scripture = e.target.value; return d })} rows={6} />
        </Field>
      </div>
    </div>
  )
}

function PrayerEditor() {
  const { content, persist } = useCMS()
  const settings = content.settings || {}
  function setSetting(key, value) {
    persist((d) => {
      d.settings = { ...(d.settings || {}), [key]: value }
      return d
    })
  }
  return (
    <div className="admin-panel">
      <div className="admin-panel-head"><h2>Request Prayer link</h2></div>
      <p className="admin-hint">Footer “Request Prayer” opens an email. Set the destination email and subject here so the link always works.</p>
      <div className="admin-fields">
        <Field label="Prayer request email">
          <input value={settings.prayerEmail || ''} onChange={(e) => setSetting('prayerEmail', e.target.value)} placeholder="elder@cgimaryland.org" />
        </Field>
        <Field label="Email subject">
          <input value={settings.prayerSubject || ''} onChange={(e) => setSetting('prayerSubject', e.target.value)} />
        </Field>
      </div>
    </div>
  )
}

function HeroEditor() {
  const { heroSlides, persist } = useCMS()
  const [editIndex, setEditIndex] = useState(null)
  const editing = editIndex === null ? null : heroSlides[editIndex]

  function saveSlide(slide) {
    persist((draft) => {
      if (editIndex === null) draft.heroSlides.push(slide)
      else draft.heroSlides[editIndex] = slide
      return draft
    })
    setEditIndex(null)
  }

  function remove(index) {
    if (!confirm('Delete this hero slide?')) return
    persist((draft) => {
      draft.heroSlides.splice(index, 1)
      return draft
    })
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Hero slider</h2>
        <button className="admin-btn small gold" type="button" onClick={() => setEditIndex(-1)}>Add slide</button>
      </div>
      {heroSlides.map((slide, index) => (
        <div className="admin-list-card" key={`${slide.titleLine1}-${index}`}>
          <strong>{slide.titleLine1} {slide.titleLine2}</strong>
          <span className="muted">{slide.eyebrow}</span>
          <div className="admin-row-actions">
            <button className="admin-btn small ghost" type="button" onClick={() => setEditIndex(index)}>Edit</button>
            <button className="admin-btn small danger" type="button" onClick={() => remove(index)}>Delete</button>
          </div>
        </div>
      ))}
      {(editIndex === -1 || editing) && (
        <SlideForm
          initial={editIndex === -1 ? {
            eyebrow: '', titleLine1: '', titleLine2: '', text: '', primaryLabel: 'Learn More', primaryTo: '/events',
            secondaryLabel: 'Contact', secondaryTo: '/contact-us', image: '', position: 'center',
          } : editing}
          onCancel={() => setEditIndex(null)}
          onSave={saveSlide}
        />
      )}
    </div>
  )
}

function SlideForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial)
  function set(key, value) { setForm((f) => ({ ...f, [key]: value })) }
  return (
    <div className="admin-editor">
      <div className="admin-fields">
        {Object.keys(form).map((key) => (
          <Field key={key} label={key} full={['text', 'image'].includes(key)}>
            {key === 'text' ? (
              <textarea value={form[key] || ''} onChange={(e) => set(key, e.target.value)} />
            ) : (
              <input value={form[key] || ''} onChange={(e) => set(key, e.target.value)} />
            )}
          </Field>
        ))}
      </div>
      <div className="admin-row-actions">
        <button className="admin-btn" type="button" onClick={() => onSave(form)}>Save slide</button>
        <button className="admin-btn ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function TickerEditor() {
  const { ticker, persist } = useCMS()
  const [text, setText] = useState(ticker.join('\n'))
  return (
    <div className="admin-panel">
      <div className="admin-panel-head"><h2>Top bar ticker</h2></div>
      <p className="admin-hint">One message per line.</p>
      <Field label="Ticker lines" full>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} />
      </Field>
      <button
        className="admin-btn"
        type="button"
        onClick={() => persist((d) => {
          d.ticker = text.split('\n').map((line) => line.trim()).filter(Boolean)
          return d
        })}
      >
        Save ticker
      </button>
    </div>
  )
}

function ListCrud({
  title,
  items,
  columns,
  blank,
  renderRow,
  fields,
  onSaveAll,
}) {
  const [editIndex, setEditIndex] = useState(null)
  const [form, setForm] = useState(blank)
  const editing = editIndex !== null && editIndex >= 0

  function startAdd() {
    setEditIndex(-1)
    setForm(blank)
  }

  function startEdit(index) {
    setEditIndex(index)
    setForm({ ...items[index] })
  }

  function save() {
    const next = [...items]
    if (editIndex === -1) next.unshift(form)
    else next[editIndex] = form
    onSaveAll(next)
    setEditIndex(null)
  }

  function remove(index) {
    if (!confirm('Delete this item?')) return
    onSaveAll(items.filter((_, i) => i !== index))
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>{title}</h2>
        <button className="admin-btn small gold" type="button" onClick={startAdd}>Add new</button>
      </div>
      {!items.length && <div className="admin-empty">No items yet. Click Add new.</div>}
      {!!items.length && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((col) => <th key={col}>{col}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  {renderRow(item).map((cell, i) => <td key={i}>{cell}</td>)}
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-btn small ghost" type="button" onClick={() => startEdit(index)}>Edit</button>
                      <button className="admin-btn small danger" type="button" onClick={() => remove(index)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(editIndex === -1 || editing) && (
        <div className="admin-editor">
          <div className="admin-fields">
            {fields.map((field) => (
              <Field key={field.key} label={field.label} full={field.full}>
                {field.type === 'textarea' ? (
                  <textarea value={form[field.key] || ''} onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))} />
                ) : (
                  <input value={form[field.key] || ''} onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))} />
                )}
              </Field>
            ))}
          </div>
          <div className="admin-row-actions">
            <button className="admin-btn" type="button" onClick={save}>Save</button>
            <button className="admin-btn ghost" type="button" onClick={() => setEditIndex(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function SermonsEditor() {
  const { sermons, persist } = useCMS()
  return (
    <ListCrud
      title={`Sermons (${sermons.length})`}
      items={sermons}
      columns={['Date', 'Title', 'Speaker']}
      blank={{ date: '', title: '', speaker: '', audio: '', video: '' }}
      renderRow={(item) => [
        item.date,
        <><strong>{item.title}</strong><div className="muted">{[item.audio ? 'Audio' : null, item.video ? 'Video' : null].filter(Boolean).join(' + ') || 'No media'}</div></>,
        item.speaker,
      ]}
      fields={[
        { key: 'date', label: 'Date' },
        { key: 'speaker', label: 'Speaker' },
        { key: 'title', label: 'Title', full: true },
        { key: 'audio', label: 'Audio URL (mp3 / Dropbox / hosted file)', full: true },
        { key: 'video', label: 'Video URL (YouTube / Vimeo / embed link)', full: true },
      ]}
      onSaveAll={(next) => persist((d) => { d.sermons = next; return d })}
    />
  )
}

function EventsEditor() {
  const { site, persist } = useCMS()
  const events = site.events || []
  return (
    <ListCrud
      title={`Events (${events.length})`}
      items={events}
      columns={['Name', 'Start', 'End']}
      blank={{ name: '', description: '', url: '', start: '', end: '' }}
      renderRow={(item) => [item.name, item.start, item.end]}
      fields={[
        { key: 'name', label: 'Name', full: true },
        { key: 'start', label: 'Start (ISO datetime)' },
        { key: 'end', label: 'End (ISO datetime)' },
        { key: 'url', label: 'URL', full: true },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
      ]}
      onSaveAll={(next) => persist((d) => { d.site.events = next; return d })}
    />
  )
}

function BeliefsEditor() {
  const { site, persist } = useCMS()
  const beliefs = site.beliefs || []
  return (
    <ListCrud
      title={`Beliefs (${beliefs.length})`}
      items={beliefs}
      columns={['Title', 'Summary']}
      blank={{ title: '', text: '', verses: '', body: '' }}
      renderRow={(item) => [item.title, <span className="muted">{(item.text || '').slice(0, 90)}…</span>]}
      fields={[
        { key: 'title', label: 'Title' },
        { key: 'verses', label: 'Verses' },
        { key: 'text', label: 'Short text', type: 'textarea', full: true },
        { key: 'body', label: 'Full body', type: 'textarea', full: true },
      ]}
      onSaveAll={(next) => persist((d) => {
        d.site.beliefs = next.map((item) => ({
          ...item,
          body: item.body || `${item.text || ''}\n\n${item.verses || ''}`.trim(),
        }))
        return d
      })}
    />
  )
}

function HolyEditor() {
  const { site, persist } = useCMS()
  const year = site.calendarYear || '2027'
  const calendarKey = `calendar${year}`
  const holyDays = site.holyDays || []
  const calendar = site[calendarKey] || site.calendar2027 || []

  return (
    <>
      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Holy Days intro & year</h2></div>
        <p className="admin-hint">Official reference: <a href="https://www.cgi.org/holy-days" target="_blank" rel="noreferrer">cgi.org/holy-days</a>. Set the active year (e.g. 2027) and edit that year’s dates below.</p>
        <div className="admin-fields">
          <Field label="Active calendar year">
            <input value={year} onChange={(e) => persist((d) => { d.site.calendarYear = e.target.value; return d })} />
          </Field>
          <Field label="Calendar download / official link" full>
            <input
              value={site.calendarDownload || ''}
              onChange={(e) => persist((d) => { d.site.calendarDownload = e.target.value; return d })}
            />
          </Field>
          <Field label="Intro paragraphs (separate with blank line)" full>
            <textarea
              rows={6}
              value={(site.holyIntro || []).join('\n\n')}
              onChange={(e) => persist((d) => {
                d.site.holyIntro = e.target.value.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
                return d
              })}
            />
          </Field>
        </div>
      </div>

      <ListCrud
        title={`Holy day details (${holyDays.length})`}
        items={holyDays}
        columns={['Name', 'Meaning']}
        blank={{ name: '', summary: '', meaning: '', scriptures: '', body: '' }}
        renderRow={(item) => [item.name, <span className="muted">{(item.summary || item.meaning || '').slice(0, 80)}</span>]}
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'summary', label: 'Short summary' },
          { key: 'scriptures', label: 'Scriptures' },
          { key: 'body', label: 'Body', type: 'textarea', full: true },
        ]}
        onSaveAll={(next) => persist((d) => { d.site.holyDays = next; return d })}
      />

      <ListCrud
        title={`${year} calendar dates (${calendar.length})`}
        items={calendar}
        columns={['Name', 'Date', 'Ends']}
        blank={{ name: '', date: '', ends: '' }}
        renderRow={(item) => [item.name, item.date, item.ends || '—']}
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'date', label: 'Date' },
          { key: 'ends', label: 'Ends' },
        ]}
        onSaveAll={(next) => persist((d) => { d.site[calendarKey] = next; return d })}
      />
    </>
  )
}

function MemorialEditor() {
  const { content, persist } = useCMS()
  const pages = content.memorialPages || []
  const settings = content.settings || {}
  return (
    <>
      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Memorial menu settings</h2></div>
        <div className="admin-fields">
          <Field label="Menu label">
            <input
              value={settings.memorialMenuLabel || 'In Memory'}
              onChange={(e) => persist((d) => { d.settings = { ...d.settings, memorialMenuLabel: e.target.value }; return d })}
            />
          </Field>
          <Field label="Show in main menu">
            <select
              value={settings.showMemorialInMenu === false ? 'no' : 'yes'}
              onChange={(e) => persist((d) => { d.settings = { ...d.settings, showMemorialInMenu: e.target.value === 'yes' }; return d })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>
      </div>
      <ListCrud
        title={`Memorial / special pages (${pages.length})`}
        items={pages}
        columns={['Title', 'Honoree', 'Slug']}
        blank={{ slug: 'in-memory', title: 'In Loving Memory', subtitle: '', honoree: '', dates: '', body: '', image: '', published: true }}
        renderRow={(item) => [item.title, item.honoree || '—', `/in-memory/${item.slug}`]}
        fields={[
          { key: 'title', label: 'Page title' },
          { key: 'slug', label: 'URL slug (e.g. john-smith)' },
          { key: 'subtitle', label: 'Subtitle / eyebrow' },
          { key: 'honoree', label: 'Name being honored' },
          { key: 'dates', label: 'Dates (e.g. 1940 – 2026)' },
          { key: 'image', label: 'Image URL', full: true },
          { key: 'body', label: 'Tribute / page body', type: 'textarea', full: true },
        ]}
        onSaveAll={(next) => persist((d) => { d.memorialPages = next; return d })}
      />
    </>
  )
}

function BibleSettingsEditor() {
  const { content, persist } = useCMS()
  const settings = content.settings || {}
  const enabled = settings.bibleEnabledVersions || ['kjv', 'web', 'NKJV', 'NIV']
  function toggleVersion(id) {
    const next = enabled.includes(id) ? enabled.filter((item) => item !== id) : [...enabled, id]
    persist((d) => { d.settings = { ...d.settings, bibleEnabledVersions: next }; return d })
  }
  return (
    <div className="admin-panel">
      <div className="admin-panel-head"><h2>Bible versions</h2></div>
      <p className="admin-hint">Choose which translations appear in the Bible reader. KJV/WEB are most reliable. NKJV and NIV depend on third-party availability.</p>
      <Field label="Default version">
        <select
          value={settings.bibleDefaultVersion || 'kjv'}
          onChange={(e) => persist((d) => { d.settings = { ...d.settings, bibleDefaultVersion: e.target.value }; return d })}
        >
          {BIBLE_VERSIONS.map((version) => <option key={version.id} value={version.id}>{version.label}</option>)}
        </select>
      </Field>
      <div className="admin-fields" style={{ marginTop: 16 }}>
        {BIBLE_VERSIONS.map((version) => (
          <label key={version.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={enabled.includes(version.id)} onChange={() => toggleVersion(version.id)} />
            <span>{version.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function MinistryEditor() {
  const { site, persist } = useCMS()
  const ministry = site.ministry || []
  return (
    <ListCrud
      title={`Ministry sections (${ministry.length})`}
      items={ministry}
      columns={['Heading', 'Preview']}
      blank={{ title: '', body: '' }}
      renderRow={(item) => [item.title || item.heading || 'Section', <span className="muted">{(item.body || '').slice(0, 90)}…</span>]}
      fields={[
        { key: 'title', label: 'Title', full: true },
        { key: 'body', label: 'Body', type: 'textarea', full: true },
      ]}
      onSaveAll={(next) => persist((d) => { d.site.ministry = next; return d })}
    />
  )
}

function ContactEditor() {
  const { site, persist } = useCMS()
  const people = site.contact?.people || []
  return (
    <ListCrud
      title={`Contact team (${people.length})`}
      items={people}
      columns={['Role', 'Name', 'Email']}
      blank={{ role: '', name: '', phone: '', email: '' }}
      renderRow={(item) => [item.role, item.name, item.email]}
      fields={[
        { key: 'role', label: 'Role' },
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
      ]}
      onSaveAll={(next) => persist((d) => {
        d.site.contact = { ...(d.site.contact || {}), people: next }
        return d
      })}
    />
  )
}

function DonateEditor() {
  const { site, persist } = useCMS()
  const donate = site.donate || {}
  const mailTo = donate.mailTo || {}

  function setDonate(key, value) {
    persist((d) => {
      d.site.donate = { ...d.site.donate, [key]: value }
      return d
    })
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head"><h2>Donate settings</h2></div>
      <div className="admin-fields">
        <Field label="Checkout public key" full>
          <input value={donate.checkoutKey || ''} onChange={(e) => setDonate('checkoutKey', e.target.value)} />
        </Field>
        <Field label="QR image URL" full>
          <input value={(donate.qr && donate.qr[0]) || ''} onChange={(e) => setDonate('qr', [e.target.value])} />
        </Field>
        <Field label="Mail payable to">
          <input value={mailTo.payable || ''} onChange={(e) => setDonate('mailTo', { ...mailTo, payable: e.target.value })} />
        </Field>
        <Field label="Mail name">
          <input value={mailTo.name || ''} onChange={(e) => setDonate('mailTo', { ...mailTo, name: e.target.value })} />
        </Field>
        <Field label="Mail address">
          <input value={mailTo.address || ''} onChange={(e) => setDonate('mailTo', { ...mailTo, address: e.target.value })} />
        </Field>
        <Field label="Mail city">
          <input value={mailTo.city || ''} onChange={(e) => setDonate('mailTo', { ...mailTo, city: e.target.value })} />
        </Field>
        <Field label="Donate paragraphs (one per line break group)" full>
          <textarea
            rows={8}
            value={(donate.paragraphs || []).join('\n\n')}
            onChange={(e) => setDonate('paragraphs', e.target.value.split(/\n\n+/).map((p) => p.trim()).filter(Boolean))}
          />
        </Field>
      </div>
    </div>
  )
}

function PrivacyEditor() {
  const { site, persist } = useCMS()
  const [text, setText] = useState((site.privacy || []).join('\n\n'))

  return (
    <div className="admin-panel">
      <div className="admin-panel-head"><h2>Privacy policy</h2></div>
      <p className="admin-hint">Separate paragraphs with a blank line.</p>
      <Field label="Privacy paragraphs" full>
        <textarea rows={16} value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <button
        className="admin-btn"
        type="button"
        onClick={() => persist((d) => {
          d.site.privacy = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
          return d
        })}
      >
        Save privacy policy
      </button>
    </div>
  )
}

function SettingsEditor() {
  const { changePassword, exportFile, importFromFile, resetToDefaults, content } = useCMS()
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function onChangePassword(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    const result = await changePassword(currentPassword, nextPassword)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMessage('Password updated.')
    setCurrentPassword('')
    setNextPassword('')
  }

  async function onImport(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await importFromFile(file)
      setMessage('Content imported.')
      setError('')
    } catch (err) {
      setError(err.message || 'Import failed')
    }
    event.target.value = ''
  }

  return (
    <>
      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Backup & publish</h2></div>
        <p className="admin-hint">
          Last updated: {content.updatedAt ? new Date(content.updatedAt).toLocaleString() : '—'}.
          Export downloads <code>cms-data.json</code>. Replace <code>public/cms-data.json</code> in the project and redeploy to update every visitor worldwide.
        </p>
        <div className="admin-row-actions">
          <button className="admin-btn gold" type="button" onClick={exportFile}>Export JSON</button>
          <label className="admin-btn ghost" style={{ cursor: 'pointer' }}>
            Import JSON
            <input type="file" accept="application/json,.json" hidden onChange={onImport} />
          </label>
          <button
            className="admin-btn danger"
            type="button"
            onClick={() => {
              if (confirm('Reset all content to the original website copy?')) resetToDefaults()
            }}
          >
            Reset to defaults
          </button>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Change password</h2></div>
        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-toast">{message}</div>}
        <form className="admin-fields" onSubmit={onChangePassword}>
          <Field label="Current password">
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </Field>
          <Field label="New password">
            <input type="password" value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} />
          </Field>
          <div className="admin-field full">
            <button className="admin-btn" type="submit">Update password</button>
          </div>
        </form>
      </div>
    </>
  )
}

function AdminShell() {
  const { logout, saveMessage, site, sermons, heroSlides } = useCMS()
  const [section, setSection] = useState('dashboard')

  const title = useMemo(() => NAV.find((item) => item.id === section)?.label || 'Admin', [section])

  return (
    <div className="admin-shell">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-brand">
            <img src="/cgi-logo.png" alt="" />
            <div>
              <strong>CGI Admin</strong>
              <small>Content manager</small>
            </div>
          </div>
          <nav className="admin-nav" aria-label="Admin sections">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={section === item.id ? 'is-active' : ''}
                onClick={() => setSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{ marginTop: 24, padding: '0 8px', display: 'grid', gap: 8 }}>
            <a className="admin-btn ghost" href="/" style={{ textDecoration: 'none' }}>View website</a>
            <button className="admin-btn danger" type="button" onClick={logout}>Sign out</button>
          </div>
        </aside>

        <main className="admin-main">
          <div className="admin-topbar">
            <div>
              <h1>{title}</h1>
              <p>{sermons.length} sermons · {(site.events || []).length} events · {heroSlides.length} slides</p>
            </div>
            <div className="admin-top-actions">
              {saveMessage && <span className="admin-toast">{saveMessage}</span>}
            </div>
          </div>

          {section === 'dashboard' && <Dashboard />}
          {section === 'site' && <SiteEditor />}
          {section === 'prayer' && <PrayerEditor />}
          {section === 'hero' && <HeroEditor />}
          {section === 'ticker' && <TickerEditor />}
          {section === 'sermons' && <SermonsEditor />}
          {section === 'events' && <EventsEditor />}
          {section === 'beliefs' && <BeliefsEditor />}
          {section === 'holy' && <HolyEditor />}
          {section === 'memorial' && <MemorialEditor />}
          {section === 'bible' && <BibleSettingsEditor />}
          {section === 'ministry' && <MinistryEditor />}
          {section === 'contact' && <ContactEditor />}
          {section === 'donate' && <DonateEditor />}
          {section === 'privacy' && <PrivacyEditor />}
          {section === 'settings' && <SettingsEditor />}
        </main>
      </div>
    </div>
  )
}

export default function AdminApp() {
  const { auth, loading } = useCMS()
  if (loading) {
    return <div className="admin-shell admin-login"><div className="admin-login-card"><p>Loading admin…</p></div></div>
  }
  return auth ? <AdminShell /> : <LoginScreen />
}
