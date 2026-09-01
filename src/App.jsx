import { useEffect, useMemo, useState } from 'react'
import sermonArchive from './data/sermons.json'
import siteContent from './data/site-content.json'
import { bibleBooks, oldTestamentCount } from './data/bibleBooks.js'

const SITE = {
  address: `${siteContent.worship.address}, ${siteContent.worship.city}`,
  phone: siteContent.worship.phone,
  email: siteContent.worship.email,
  directions: siteContent.worship.directions,
  place: siteContent.worship.place,
  serviceTime: siteContent.worship.time,
  virtual: siteContent.worship.virtual,
}

const icons = {
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Zm0 0V6.5M8 8h8',
  calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
  chevron: 'm9 18 6-6-6-6',
  clock: 'M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21l8.84-8.61a5.5 5.5 0 0 0 0-7.78Z',
  check: 'm5 12 4 4L19 6',
  card: 'M3 6h18v12H3V6Zm0 4h18M7 15h3',
  lock: 'M6 10h12v11H6V10Zm3 0V7a3 3 0 0 1 6 0v3',
  mail: 'M3 5h18v14H3V5Zm0 2 9 6 9-6',
  map: 'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92Z',
  play: 'm9 7 8 5-8 5V7Z',
  search: 'm21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  x: 'M18 6 6 18M6 6l12 12',
}

function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]} /></svg>
}

function Link({ to, children, className = '', onClick, ...props }) {
  const internal = to?.startsWith('/')
  function handleClick(event) {
    onClick?.(event)
    if (!internal || event.defaultPrevented || event.ctrlKey || event.metaKey) return
    event.preventDefault()
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  return <a href={to} className={className} onClick={handleClick} {...props}>{children}</a>
}

const beliefItems = siteContent.beliefs
const holyDayCalendar = siteContent.calendar2026
const holyDayDetails = siteContent.holyDays
const ministrySections = siteContent.ministry
const siteEvents = siteContent.events
const donateInfo = siteContent.donate
const privacyParas = siteContent.privacy
const contactPeople = siteContent.contact.people
const scriptureFull = siteContent.scripture
const holyIntro = siteContent.holyIntro || []

const decodeHtml = (value = '') => value
  .replace(/&#8217;/g, "'")
  .replace(/&#8216;/g, "'")
  .replace(/&#8220;/g, '"')
  .replace(/&#8221;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/&nbsp;/g, ' ')

function formatEventParts(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return { month: '', day: '', time: '' }
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: String(date.getDate()),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }
}

function Paras({ text }) {
  return String(text || '').split(/\n\n+/).filter(Boolean).map((para, i) => <p key={i}>{para}</p>)
}

const latestSermons = sermonArchive.slice(0, 3)

function BrandLogo({ light = false }) {
  return (
    <Link to="/" className={`brand${light ? ' brand-light' : ''}`} aria-label="Church of God International — Gaithersburg, Maryland home">
      <img src="/cgi-logo.png" alt="" className="brand-logo" width="60" height="60" />
      <span className="brand-copy">
        <strong>Church of God International</strong>
        <small>Gaithersburg, Maryland</small>
      </span>
    </Link>
  )
}

function usePath() {
  const [path, setPath] = useState(window.location.pathname.replace(/\/+$/, '') || '/')
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [path])
  return path
}

function Header() {
  const path = usePath()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)

  useEffect(() => {
    const close = () => { setOpen(false); setOpenMenu(null) }
    window.addEventListener('popstate', close)
    return () => window.removeEventListener('popstate', close)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const isActive = (href) => path === href || (href !== '/' && path.startsWith(href))

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="topbar">
      <div className="container topbar-inner">
        <div className="topbar-left">
          <span className="topbar-pill"><Icon name="clock" size={14} /> Sabbath · Sat 1:45 PM</span>
          <span className="topbar-divider" aria-hidden="true" />
          <a className="topbar-item" href={SITE.directions} target="_blank" rel="noreferrer"><Icon name="map" size={14} /> Casey Community Center</a>
        </div>
        <div className="topbar-ticker" aria-live="polite">
          <span className="topbar-ticker-label">This week</span>
          <span className="topbar-ticker-track">
            <span>Friday Night Prayer · Jul 24, 7:15 PM</span>
            <span>Online Bible Study · Jul 25, 1:45 PM</span>
            <span>Weekly Sabbath Service · Sat 1:45 PM</span>
            <span>Friday Night Prayer · Jul 24, 7:15 PM</span>
            <span>Online Bible Study · Jul 25, 1:45 PM</span>
            <span>Weekly Sabbath Service · Sat 1:45 PM</span>
          </span>
        </div>
        <div className="topbar-right">
          <a className="topbar-item" href={`tel:${SITE.phone}`}><Icon name="phone" size={14} /> {SITE.phone}</a>
          <a className="topbar-item" href={`mailto:${SITE.email}`}><Icon name="mail" size={14} /> {SITE.email}</a>
          <Link to="/events" className="topbar-cta">View Calendar</Link>
        </div>
      </div>
    </div>
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="container nav-wrap">
        <BrandLogo />
        <div className="nav-actions">
          <Link to="/donate" className="button button-small header-donate-mobile">Donate</Link>
          <button className={`menu-button ${open ? 'is-active' : ''}`} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
            <span /><span /><span />
          </button>
        </div>
        <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          <div className={`nav-group ${openMenu === 'who' ? 'is-open' : ''}`}>
            <button className={`nav-parent ${isActive('/ministry') || isActive('/beliefs') ? 'is-active' : ''}`} aria-expanded={openMenu === 'who'} onClick={() => setOpenMenu(openMenu === 'who' ? null : 'who')}>
              Who We Are <Icon name="chevron" size={14} />
            </button>
            <div className="dropdown mega-dropdown">
              <div className="mega-intro">
                <span className="eyebrow">Our foundation</span>
                <strong>Know our faith</strong>
                <p>Learn about our Sabbath-keeping ministry and core biblical beliefs.</p>
              </div>
              <div className="mega-links">
                <Link to="/ministry" className={isActive('/ministry') ? 'is-active' : ''} onClick={() => setOpen(false)}>
                  <Icon name="users" size={18} />
                  <span><strong>Our Ministry</strong><small>Who we are &amp; how we worship</small></span>
                </Link>
                <Link to="/beliefs" className={isActive('/beliefs') ? 'is-active' : ''} onClick={() => setOpen(false)}>
                  <Icon name="book" size={18} />
                  <span><strong>Statement of Beliefs</strong><small>Scripture-rooted convictions</small></span>
                </Link>
              </div>
            </div>
          </div>
          <div className={`nav-group ${openMenu === 'teach' ? 'is-open' : ''}`}>
            <button className={`nav-parent ${isActive('/sermons') || isActive('/bible') ? 'is-active' : ''}`} aria-expanded={openMenu === 'teach'} onClick={() => setOpenMenu(openMenu === 'teach' ? null : 'teach')}>
              Teachings <Icon name="chevron" size={14} />
            </button>
            <div className="dropdown mega-dropdown mega-wide">
              <div className="mega-intro">
                <span className="eyebrow">Grow in the Word</span>
                <strong>Study &amp; listen</strong>
                <p>Sermons and CGI teaching resources for deeper understanding.</p>
              </div>
              <div className="mega-links">
                <Link to="/sermons" className={isActive('/sermons') ? 'is-active' : ''} onClick={() => setOpen(false)}>
                  <Icon name="play" size={18} />
                  <span><strong>Sermons</strong><small>Local message archive</small></span>
                </Link>
                <Link to="/bible" className={isActive('/bible') ? 'is-active' : ''} onClick={() => setOpen(false)}>
                  <Icon name="book" size={18} />
                  <span><strong>Read the Bible</strong><small>Interactive KJV reader</small></span>
                </Link>
                <a href="https://www.cgi.org/home-bible-study" target="_blank" rel="noreferrer">
                  <Icon name="book" size={18} />
                  <span><strong>Home Bible Studies</strong><small>cgi.org resource</small></span>
                </a>
                <a href="https://www.cgi.org/armor-of-god" target="_blank" rel="noreferrer">
                  <Icon name="heart" size={18} />
                  <span><strong>Armor of God</strong><small>cgi.org resource</small></span>
                </a>
                <a href="https://www.cgi.org/prove-all-things" target="_blank" rel="noreferrer">
                  <Icon name="search" size={18} />
                  <span><strong>Prove All Things</strong><small>cgi.org resource</small></span>
                </a>
              </div>
            </div>
          </div>
          <Link to="/bible" className={isActive('/bible') ? 'is-active' : ''} onClick={() => setOpen(false)}>Read Bible</Link>
          <Link to="/annual-holy-days" className={isActive('/annual-holy-days') ? 'is-active' : ''} onClick={() => setOpen(false)}>Annual Holy Days</Link>
          <Link to="/contact-us" className={isActive('/contact-us') ? 'is-active' : ''} onClick={() => setOpen(false)}>Contact</Link>
          <a href="https://www.cgi.org/" target="_blank" rel="noreferrer" className="nav-external">CGI.org</a>
          <div className="nav-cta-group">
            <Link to="/events" className="nav-secondary" onClick={() => setOpen(false)}>Events</Link>
            <Link to="/donate" className="button button-small" onClick={() => setOpen(false)}>Donate</Link>
          </div>
        </nav>
      </div>
      {open && <button className="nav-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
    </header>
  </>
}

function Footer() {
  return <footer className="site-footer">
    <div className="footer-glow" aria-hidden="true" />
    <div className="container footer-invitation">
      <div className="footer-invitation-copy">
        <span className="footer-kicker">There is a place for you here</span>
        <h2>Come worship with us this Sabbath.</h2>
        <p>Experience biblical teaching, meaningful fellowship, and a warm welcome in Gaithersburg.</p>
      </div>
      <div className="footer-invitation-actions">
        <a href={SITE.directions} className="button button-light" target="_blank" rel="noreferrer"><Icon name="map" /> Plan Your Visit</a>
        <Link to="/contact-us" className="footer-prayer-link">Request Prayer <Icon name="arrow" size={17} /></Link>
      </div>
    </div>

    <div className="container footer-quick-grid">
      <a href={SITE.directions} target="_blank" rel="noreferrer" className="footer-quick-card">
        <span className="footer-quick-icon"><Icon name="map" size={21} /></span>
        <span><small>Our location</small><strong>Casey Community Center</strong><em>810 S. Frederick Ave. · Aspen Room</em></span>
        <Icon name="arrow" size={18} />
      </a>
      <Link to="/events" className="footer-quick-card">
        <span className="footer-quick-icon"><Icon name="calendar" size={21} /></span>
        <span><small>Weekly worship</small><strong>Saturday at 1:45 PM</strong><em>In person and virtual connection</em></span>
        <Icon name="arrow" size={18} />
      </Link>
      <a href={`tel:${SITE.phone}`} className="footer-quick-card">
        <span className="footer-quick-icon"><Icon name="phone" size={21} /></span>
        <span><small>We are here to help</small><strong>{SITE.phone}</strong><em>Call the CGI Maryland congregation</em></span>
        <Icon name="arrow" size={18} />
      </a>
    </div>

    <div className="container footer-main">
      <div className="footer-intro">
        <BrandLogo light />
        <p>A Sabbath-keeping congregation serving Maryland, Virginia, Washington, DC, and worshipers joining online.</p>
        <blockquote>“Call the sabbath a delight, the holy of the LORD, honourable.”<cite>Isaiah 58:13</cite></blockquote>
      </div>
      <div className="footer-link-column">
        <h3>Discover</h3>
        <Link to="/ministry">Our Ministry <Icon name="arrow" size={14} /></Link>
        <Link to="/beliefs">Statement of Beliefs <Icon name="arrow" size={14} /></Link>
        <Link to="/bible">Read the Bible <Icon name="arrow" size={14} /></Link>
        <Link to="/annual-holy-days">Annual Holy Days <Icon name="arrow" size={14} /></Link>
        <Link to="/sermons">Sermon Archive <Icon name="arrow" size={14} /></Link>
      </div>
      <div className="footer-link-column">
        <h3>Connect</h3>
        <Link to="/events">Events &amp; Services <Icon name="arrow" size={14} /></Link>
        <Link to="/contact-us">Contact Us <Icon name="arrow" size={14} /></Link>
        <Link to="/donate">Support the Mission <Icon name="arrow" size={14} /></Link>
        <a href="https://www.cgi.org/" target="_blank" rel="noreferrer">Visit CGI.org <Icon name="arrow" size={14} /></a>
      </div>
      <div className="footer-contact">
        <h3>Stay Connected</h3>
        <p>Questions about services, online access, or our congregation? We would be glad to hear from you.</p>
        <a className="footer-contact-row" href={`mailto:${SITE.email}`}><span><Icon name="mail" size={18} /></span><span><small>Email us</small><strong>{SITE.email}</strong></span></a>
        <a className="footer-contact-row" href={`tel:${SITE.phone}`}><span><Icon name="phone" size={18} /></span><span><small>Call us</small><strong>{SITE.phone}</strong></span></a>
      </div>
    </div>

    <div className="container footer-bottom">
      <span>© 2026 Church of God International, Gaithersburg, Maryland.</span>
      <div><Link to="/privacy-policy">Privacy Policy</Link><span aria-hidden="true">·</span><span>All Rights Reserved</span></div>
      <button type="button" className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">Back to top <Icon name="arrow" size={15} /></button>
    </div>
  </footer>
}

function PageHero({ eyebrow, title, text, image }) {
  return <section className="page-hero" style={{ '--page-image': `url("${image}")` }}><div className="page-hero-shade" /><div className="container page-hero-content"><span className="eyebrow light">{eyebrow}</span><h1>{title}</h1>{text && <p>{text}</p>}</div></section>
}

const heroSlides = [
  {
    eyebrow: 'Faith · Fellowship · Truth',
    title: <>A place to belong.<br />A faith to live.</>,
    text: 'Join a welcoming community seeking to follow Jesus Christ, honor God’s Word, and grow together in faith.',
    primary: ['Plan Your Visit', '/events'],
    secondary: ['Watch a Sermon', '/sermons'],
    image: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=2000&q=88',
    position: 'center 42%',
  },
  {
    eyebrow: 'Worship with us each Sabbath',
    title: <>Gather in worship.<br />Grow in the Word.</>,
    text: 'Join us Saturdays at 1:45 PM for biblical teaching, prayer, fellowship, and encouragement.',
    primary: ['Service Details', '/events'],
    secondary: ['Get Directions', SITE.directions],
    image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=2000&q=88',
    position: 'center 52%',
  },
  {
    eyebrow: 'God’s appointed times',
    title: <>Remember His works.<br />Rejoice in His plan.</>,
    text: 'Explore the annual holy days and the story of salvation they reveal throughout Scripture.',
    primary: ['Explore Holy Days', '/annual-holy-days'],
    secondary: ['Our Beliefs', '/beliefs'],
    image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=2000&q=88',
    position: 'center 48%',
  },
]

function HeroSlider() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return undefined
    const timer = window.setInterval(() => setActive(current => (current + 1) % heroSlides.length), 6500)
    return () => window.clearInterval(timer)
  }, [paused])

  const changeSlide = direction => setActive(current => (current + direction + heroSlides.length) % heroSlides.length)
  const slide = heroSlides[active]
  const secondaryExternal = slide.secondary[1].startsWith('http')

  return <section className="hero-home hero-slider" aria-roledescription="carousel" aria-label="Featured church messages" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }}>
    <div className="hero-slides" aria-hidden="true">
      {heroSlides.map((item, index) => <div key={item.image} className={`hero-slide ${index === active ? 'is-active' : ''}`} style={{ backgroundImage: `url("${item.image}")`, backgroundPosition: item.position }} />)}
    </div>
    <div className="hero-overlay" />
    <div className="container hero-content" aria-live="polite" aria-atomic="true">
      <div className="hero-content-inner" key={active}>
        <span className="eyebrow light">{slide.eyebrow}</span>
        <h1>{slide.title}</h1>
        <p>{slide.text}</p>
        <div className="hero-actions">
          <Link to={slide.primary[1]} className="button">{slide.primary[0]} <Icon name="arrow" /></Link>
          {secondaryExternal
            ? <a href={slide.secondary[1]} className="button button-ghost" target="_blank" rel="noreferrer"><Icon name="map" /> {slide.secondary[0]}</a>
            : <Link to={slide.secondary[1]} className="button button-ghost"><Icon name={active === 0 ? 'play' : 'book'} /> {slide.secondary[0]}</Link>}
        </div>
      </div>
    </div>
    <div className="hero-slider-controls">
      <button type="button" className="hero-slider-arrow is-prev" onClick={() => changeSlide(-1)} aria-label="Previous slide"><Icon name="arrow" size={19} /></button>
      <div className="hero-slider-dots" role="tablist" aria-label="Choose a slide">
        {heroSlides.map((item, index) => <button key={item.eyebrow} type="button" className={index === active ? 'is-active' : ''} role="tab" aria-selected={index === active} aria-label={`Show slide ${index + 1}`} onClick={() => setActive(index)}><span /></button>)}
      </div>
      <span className="hero-slide-count"><strong>0{active + 1}</strong><i />0{heroSlides.length}</span>
      <button type="button" className="hero-slider-arrow" onClick={() => changeSlide(1)} aria-label="Next slide"><Icon name="arrow" size={19} /></button>
    </div>
    <div className={`hero-slider-progress ${paused ? 'is-paused' : ''}`} key={`progress-${active}`} />
    <div className="service-card"><span className="service-icon"><Icon name="calendar" size={24} /></span><span><small>Worship with us</small><strong>Saturdays at 1:45 PM</strong><a href={SITE.directions} target="_blank" rel="noreferrer">Casey Community Center · Get directions</a></span></div>
  </section>
}

function Home() {
  return <>
    <HeroSlider />
    <section className="welcome section"><div className="container two-col"><div><span className="eyebrow">Welcome to CGI Maryland</span><h2>Growing in truth.<br />Living with purpose.</h2></div><div className="prose lead"><p>We are a Sabbath-keeping church family rooted in the whole Bible. Whether you are exploring faith, returning to church, or looking for a community to call home, there is a place for you here.</p><Link to="/ministry" className="text-link">Discover who we are <Icon name="arrow" size={17} /></Link></div></div><div className="container value-grid"><article><Icon name="book" size={28} /><h3>Biblically grounded</h3><p>Learning from both the Old and New Testaments as the inspired Word of God.</p></article><article><Icon name="users" size={28} /><h3>Genuinely welcoming</h3><p>A warm local congregation where faith, fellowship, and service come together.</p></article><article><Icon name="heart" size={28} /><h3>Christ centered</h3><p>Following Jesus Christ as Savior, High Priest, and coming King.</p></article></div></section>
    <section className="scripture-band"><div className="container scripture-inner"><span className="quote-mark">“</span><blockquote>{(scriptureFull || "").replace(/^“|”$/g, "").replace(/\s*ISAIAH\s*58:13-14\s*$/i, "").trim()}</blockquote><cite>Isaiah 58:13–14</cite></div></section>
    <section className="section events-section"><div className="container section-heading"><div><span className="eyebrow">Come together</span><h2>Upcoming events</h2></div><Link to="/events" className="text-link">View full calendar <Icon name="arrow" size={17} /></Link></div><div className="container event-grid">{siteEvents.slice(0, 3).map(event => { const start = formatEventParts(event.start); const end = formatEventParts(event.end); const type = event.name.toLowerCase().includes('prayer') ? 'Prayer' : event.name.toLowerCase().includes('bible') ? 'Study' : 'Service'; return <EventCard key={`${event.name}-${event.start}`} day={start.day} month={start.month} type={type} title={event.name} time={`${start.time}${end.time ? `–${end.time}` : ''}`} /> })}</div></section>
    <section className="section holy-preview"><div className="container holy-preview-grid"><div className="holy-image" role="img" aria-label="Open Bible in warm sunlight" /><div><span className="eyebrow">God’s appointed times</span><h2>2026 Holy Day calendar</h2><p>Discover the annual holy days and how each one reveals a part of God’s plan of salvation.</p><div className="mini-calendar">{holyDayCalendar.map(item => <div key={item.name}><strong>{item.name}</strong><span>{item.date}</span></div>)}</div><Link to="/annual-holy-days" className="button">Explore the Holy Days <Icon name="arrow" /></Link></div></div></section>
    <section className="section sermons-preview">
      <div className="container intro-center">
        <span className="eyebrow">Listen and grow</span>
        <h2>Listen To Our Latest Sermons</h2>
        <p>Play recent messages from CGI Maryland elders and guest speakers.</p>
      </div>
      <div className="container sermon-grid">
        {latestSermons.map(sermon => (
          <article className="sermon-listen-card" key={sermon.title}>
            <small>{sermon.date}</small>
            <h3>{decodeHtml(sermon.title)}</h3>
            <p><strong>Speaker:</strong> {sermon.speaker}</p>
            <audio controls preload="metadata" src={sermon.audio}>Your browser does not support audio.</audio>
          </article>
        ))}
      </div>
      <div className="container sermons-archive-cta">
        <Link to="/sermons" className="button">View Our Online Archive of Sermons <Icon name="arrow" /></Link>
      </div>
    </section>
    <VisitCta />
  </>
}

function EventCard({ day, month, type, title, time }) {
  return <article className="event-card"><div className="date-box"><strong>{day}</strong><span>{month}</span></div><div><span className="event-type">{type}</span><h3>{title}</h3><p><Icon name="clock" size={16} /> {time}</p></div></article>
}

function VisitCta() {
  return <section className="visit-cta"><div className="container visit-inner"><div><span className="eyebrow light">You are welcome here</span><h2>Join us this Sabbath</h2><p>Saturday at 1:45 PM · Casey Community Center, Aspen Room</p></div><a href={SITE.directions} className="button button-light" target="_blank" rel="noreferrer"><Icon name="map" /> Get Directions</a></div></section>
}

function Ministry() {
  const sections = ministrySections.filter(section => section.title.toLowerCase() !== 'statement of beliefs')
  return <>
    <PageHero eyebrow="Who we are" title="Our Ministry" text="A Bible-centered, Sabbath-keeping church committed to faith, truth, and service." image="https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1800&q=85" />
    <section className="section"><div className="container article-layout">
      <aside className="article-aside"><span>On this page</span>{sections.map(section => <a key={section.title} href={`#${section.title.toLowerCase().replace(/\s+/g, '-')}`}>{section.title}</a>)}</aside>
      <article className="longform">{sections.map(section => (
        <section key={section.title} id={section.title.toLowerCase().replace(/\s+/g, '-')}>
          <span className="eyebrow">From CGI Maryland</span>
          <h2>{section.title}</h2>
          <Paras text={section.body} />
          {section.title === 'Church Philosophy' && <Link to="/beliefs" className="button">Read our Statement of Beliefs <Icon name="arrow" /></Link>}
        </section>
      ))}</article>
    </div></section><VisitCta />
  </>
}

function Beliefs() {
  const [query, setQuery] = useState('')
  const filtered = beliefItems.filter(item => `${item.title} ${item.text || item.body}`.toLowerCase().includes(query.toLowerCase()))
  return <><PageHero eyebrow="What we believe" title="Statement of Beliefs" text="A clear summary of the biblical convictions that shape our worship, community, and way of life." image="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1800&q=85" /><section className="section"><div className="container intro-center"><span className="eyebrow">Rooted in Scripture</span><h2>The whole Bible. A living faith.</h2><p>Search or explore the beliefs below. Scripture references accompany every statement for continued personal study.</p><label className="search-box"><Icon name="search" /><span className="sr-only">Search beliefs</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search beliefs or keywords…" /></label></div><div className="container belief-list">{filtered.map((item, i) => <details key={`${item.title}-${i}`} open={i === 0 && !query}><summary><span>{String(i + 1).padStart(2, '0')}</span><strong>{item.title}</strong><span className="detail-plus">+</span></summary><div><Paras text={item.text || item.body} />{item.verses && <small>{item.verses}</small>}</div></details>)}</div>{!filtered.length && <p className="empty-state">No beliefs match “{query}”. Try another keyword.</p>}</section></>
}

function HolyDays() {
  const observanceDates = [
    new Date('2026-03-31T00:00:00'),
    new Date('2026-04-02T00:00:00'),
    new Date('2026-05-24T00:00:00'),
    new Date('2026-09-12T00:00:00'),
    new Date('2026-09-21T00:00:00'),
    new Date('2026-09-26T00:00:00'),
    new Date('2026-10-03T00:00:00'),
  ]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextIndex = today.getFullYear() === 2026 ? observanceDates.findIndex(date => date >= today) : -1

  return <>
    <PageHero eyebrow="God’s appointed times" title="Annual Holy Days" text="Seven annual festivals that illuminate God’s plan of salvation for mankind." image="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=85" />
    <section className="section"><div className="container narrow longform">
      {holyIntro.map((para, i) => i === 0 && /Speak unto/i.test(para)
        ? <blockquote key={i}>{para.replace(/\s*Leviticus.*/i, '').trim()}<cite>Leviticus 23:2–4</cite></blockquote>
        : <p key={i} className={i === 1 ? 'lead' : undefined}>{para}</p>)}
    </div></section>
    <section className="calendar-band calendar-advanced">
      <div className="calendar-decoration" aria-hidden="true"><i /><i /><i /></div>
      <div className="container">
        <div className="calendar-advanced-heading">
          <div>
            <span className="eyebrow light">God’s appointed times</span>
            <h2>2026 Holy Day Calendar</h2>
            <p>Seven annual observances. One unfolding picture of God’s plan of salvation.</p>
          </div>
          <div className="calendar-year-seal" aria-label="Calendar year 2026">
            <small>Sacred calendar</small>
            <strong>2026</strong>
            <span>Leviticus 23</span>
          </div>
        </div>

        {nextIndex >= 0 && <div className="calendar-next-banner">
          <span className="calendar-next-icon"><Icon name="calendar" size={22} /></span>
          <div><small>Next observance</small><strong>{holyDayCalendar[nextIndex].name}</strong></div>
          <span>{holyDayCalendar[nextIndex].date}</span>
        </div>}

        <div className="holy-calendar-journey">
          {holyDayCalendar.map((item, index) => (
            <article className={`holy-calendar-card ${index === nextIndex ? 'is-next' : ''}`} data-number={`0${index + 1}`} key={item.name}>
              <div className="holy-calendar-card-top">
                <span className="holy-calendar-number">0{index + 1}</span>
                <span className="holy-calendar-season">{index < 3 ? 'Spring' : 'Fall'}</span>
              </div>
              <span className="holy-calendar-date">{item.date}</span>
              <h3>{item.name}</h3>
              <p>{holyDayDetails[index]?.summary || 'An appointed feast of the LORD.'}</p>
              <a href={`#holy-day-${index + 1}`} aria-label={`Read about ${item.name}`}>Explore meaning <Icon name="arrow" size={15} /></a>
              {index === nextIndex && <span className="holy-calendar-upcoming">Upcoming</span>}
            </article>
          ))}
        </div>

        <div className="calendar-download-row">
          <div><Icon name="book" size={23} /><span><small>Plan ahead</small><strong>View holy day dates through 2030</strong></span></div>
          <a className="button button-light" href={siteContent.calendarDownload || 'https://cgimaryland.org/annual-holy-days/'} target="_blank" rel="noreferrer">Download Full Calendar <Icon name="arrow" /></a>
        </div>
      </div>
    </section>
    <section className="section"><div className="container narrow">
      <div className="section-heading left"><div><span className="eyebrow">Meaning and observance</span><h2>The seven appointed feasts</h2></div></div>
      <div className="holy-accordion">{holyDayDetails.map((item, i) => {
        const date = holyDayCalendar.find(c => item.name.toLowerCase().includes(c.name.toLowerCase().replace('new testament ', '')) || c.name.toLowerCase().includes(item.name.split(' ')[0].toLowerCase()))?.date || ''
        return <details id={`holy-day-${i + 1}`} key={item.name} open={i === 0}><summary><span>{String(i + 1).padStart(2, '0')}</span><span><strong>{item.name}</strong><small>{date}{item.summary ? ` · ${item.summary}` : ''}</small></span><span className="detail-plus">+</span></summary><div><Paras text={item.body} /></div></details>
      })}</div>
    </div></section>
  </>
}

function Sermons() {
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(24)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sermonArchive
    return sermonArchive.filter(sermon => `${sermon.title} ${sermon.speaker} ${sermon.date}`.toLowerCase().includes(q))
  }, [query])
  const visible = filtered.slice(0, visibleCount)
  return <>
    <PageHero eyebrow="Messages for life" title="Sermon Archive" text="Listen to biblical teaching from CGI Maryland elders, deacons, and guest speakers." image="https://cgimarylandv2.s3.amazonaws.com/wp-content/uploads/2022/03/06155747/sermons-banner.jpg" />
    <section className="section"><div className="container">
      <div className="archive-tools">
        <div><span className="eyebrow">Recent messages</span><h2>Listen, learn, and grow</h2></div>
        <label className="search-box"><Icon name="search" /><span className="sr-only">Search sermons</span><input value={query} onChange={e => { setQuery(e.target.value); setVisibleCount(24) }} placeholder="Search sermons or speakers…" /></label>
      </div>
      <div className="archive-grid">
        {visible.map((sermon, i) => (
          <article className="archive-card" key={`${sermon.title}-${sermon.date}`}>
            <div className={`archive-art art-${(i % 3) + 1}`}>
              <span className="play-circle"><Icon name="play" size={25} /></span>
              <small>{sermon.date}</small>
            </div>
            <div className="archive-copy">
              <h3>{decodeHtml(sermon.title)}</h3>
              <p><strong>Speaker:</strong> {sermon.speaker}</p>
              <audio controls preload="metadata" src={sermon.audio}>Your browser does not support audio.</audio>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && <p className="empty-state">No sermons match “{query}”.</p>}
      {visibleCount < filtered.length && (
        <div className="load-more">
          <button className="button button-outline" type="button" onClick={() => setVisibleCount(count => count + 24)}>Load More Sermons</button>
        </div>
      )}
    </div></section>
  </>
}

function Events() {
  const [filter, setFilter] = useState('All')
  const now = new Date()
  const upcomingEvents = siteEvents
    .filter(event => new Date(event.end || event.start) >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))

  function categoryOf(event) {
    const name = event.name.toLowerCase()
    if (name.includes('prayer')) return 'Prayer'
    if (name.includes('bible')) return 'Bible Study'
    if (name.includes('sabbath')) return 'Sabbath'
    return 'Gathering'
  }

  function calendarUrl(event) {
    const stamp = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const details = event.description || `${event.name} with CGI Maryland`
    const location = categoryOf(event) === 'Sabbath' ? SITE.address : 'Online'
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${stamp(event.start)}/${stamp(event.end || event.start)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`
  }

  const featured = upcomingEvents[0] || siteEvents[0]
  const featuredStart = featured ? new Date(featured.start) : null
  const daysUntil = featuredStart ? Math.max(0, Math.ceil((featuredStart - now) / 86400000)) : 0
  const categories = ['All', 'Sabbath', 'Prayer', 'Bible Study']
  const filteredEvents = upcomingEvents.filter(event => event !== featured && (filter === 'All' || categoryOf(event) === filter))

  return <>
    <PageHero eyebrow="Gather with us" title="Events & Services" text="Worship, learn, pray, and grow in community throughout the week." image="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1800&q=85" />

    {featured && <section className="event-featured-wrap">
      <div className="container event-featured">
        <div className="event-featured-visual">
          <div className="event-featured-date">
            <span>{featuredStart.toLocaleDateString('en-US', { month: 'short' })}</span>
            <strong>{featuredStart.getDate()}</strong>
            <small>{featuredStart.toLocaleDateString('en-US', { weekday: 'long' })}</small>
          </div>
          <span className="event-featured-countdown">{daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil === 1 ? '' : 's'} away`}</span>
        </div>
        <div className="event-featured-copy">
          <span className="eyebrow">Next gathering</span>
          <span className="event-category">{categoryOf(featured)}</span>
          <h2>{featured.name}</h2>
          <div className="event-meta-row">
            <span><Icon name="clock" size={17} /> {featuredStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
            <span><Icon name="map" size={17} /> {categoryOf(featured) === 'Sabbath' ? `${SITE.place} · Aspen Room` : 'Online / Virtual meeting'}</span>
          </div>
          {featured.description && <p>{featured.description.slice(0, 320)}{featured.description.length > 320 ? '…' : ''}</p>}
          <div className="event-featured-actions">
            {featured.url && <a href={featured.url} className="button" target="_blank" rel="noreferrer">View Event <Icon name="arrow" /></a>}
            <a href={calendarUrl(featured)} className="button button-outline" target="_blank" rel="noreferrer"><Icon name="calendar" size={18} /> Add to Calendar</a>
          </div>
        </div>
      </div>
    </section>}

    <section className="section events-archive-section">
      <div className="container">
        <div className="events-toolbar">
          <div><span className="eyebrow">Mark your calendar</span><h2>Upcoming events</h2><p>Find your next opportunity to worship, learn, and pray with us.</p></div>
          <div className="event-filters" aria-label="Filter events">
            {categories.map(category => <button key={category} type="button" className={filter === category ? 'is-active' : ''} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}
          </div>
        </div>

        <div className="events-card-grid">
          {filteredEvents.map(event => {
            const startDate = new Date(event.start)
            const endDate = new Date(event.end || event.start)
            return <article className="event-advanced-card" key={`${event.name}-${event.start}`}>
              <div className="event-card-head">
                <div className="event-card-date"><span>{startDate.toLocaleDateString('en-US', { month: 'short' })}</span><strong>{startDate.getDate()}</strong></div>
                <span className="event-category">{categoryOf(event)}</span>
              </div>
              <small className="event-weekday">{startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</small>
              <h3>{event.name}</h3>
              <div className="event-card-meta">
                <span><Icon name="clock" size={16} /> {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}–{endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                <span><Icon name="map" size={16} /> {categoryOf(event) === 'Sabbath' ? SITE.place : 'Online'}</span>
              </div>
              {event.description && <p>{event.description.slice(0, 145)}{event.description.length > 145 ? '…' : ''}</p>}
              <div className="event-card-actions">
                {event.url ? <a href={event.url} target="_blank" rel="noreferrer">Event details <Icon name="arrow" size={15} /></a> : <Link to="/contact-us">Contact us <Icon name="arrow" size={15} /></Link>}
                <a href={calendarUrl(event)} target="_blank" rel="noreferrer" aria-label={`Add ${event.name} to Google Calendar`}><Icon name="calendar" size={17} /></a>
              </div>
            </article>
          })}
        </div>
        {!filteredEvents.length && <div className="events-empty"><Icon name="calendar" size={28} /><h3>No additional events in this category</h3><p>Choose another filter or contact us for upcoming dates.</p></div>}
      </div>
    </section>

    <section className="events-weekly-band">
      <div className="container events-weekly-grid">
        <div className="events-weekly-intro"><span className="eyebrow light">Every Sabbath</span><h2>Weekly worship<br />at 1:45 PM.</h2><p>Join us in person at the Casey Community Center or connect virtually.</p></div>
        <div className="events-weekly-details">
          <div><span><Icon name="map" size={21} /></span><p><small>In person</small><strong>Casey Community Center</strong><em>810 S. Frederick Ave. · Aspen Room</em></p></div>
          <div><span><Icon name="users" size={21} /></span><p><small>Join online</small><strong>Virtual meeting available</strong><em>Open an event to find connection details</em></p></div>
        </div>
        <div className="events-weekly-actions"><a href={SITE.directions} className="button button-light" target="_blank" rel="noreferrer">Get Directions <Icon name="arrow" /></a><Link to="/contact-us" className="footer-prayer-link">Need help connecting? <Icon name="arrow" size={16} /></Link></div>
      </div>
    </section>
  </>
}

function Contact() {
  const [sent, setSent] = useState(false)
  function submit(e) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const topic = data.get('topic')
    const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone') || 'Not provided'}\n\n${data.get('message')}`
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(`${topic} — message from ${data.get('name')}`)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return <>
    <PageHero
      eyebrow="We would love to hear from you"
      title="Let’s connect."
      text="Whether you have a question, need prayer, or are planning your first visit, our church family is here for you."
      image="https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=1800&q=85"
    />

    <section className="contact-channels">
      <div className="container contact-channel-grid">
        <a href={SITE.directions} target="_blank" rel="noreferrer" className="contact-channel-card">
          <span className="contact-channel-icon"><Icon name="map" size={23} /></span>
          <span><small>Visit our congregation</small><strong>{SITE.place}</strong><em>Open directions</em></span>
          <Icon name="arrow" size={18} />
        </a>
        <a href={`tel:${SITE.phone}`} className="contact-channel-card">
          <span className="contact-channel-icon"><Icon name="phone" size={23} /></span>
          <span><small>Speak with us</small><strong>{SITE.phone}</strong><em>Call CGI Maryland</em></span>
          <Icon name="arrow" size={18} />
        </a>
        <a href={`mailto:${SITE.email}`} className="contact-channel-card">
          <span className="contact-channel-icon"><Icon name="mail" size={23} /></span>
          <span><small>Write to us</small><strong>{SITE.email}</strong><em>Send an email</em></span>
          <Icon name="arrow" size={18} />
        </a>
      </div>
    </section>

    <section className="section contact-main-section">
      <div className="container contact-grid">
        <div className="contact-intro">
          <span className="eyebrow">Get in touch</span>
          <h2>How can we help?</h2>
          <p className="lead">Have questions or need help? Use the form and we will be in touch as quickly as possible.</p>

          <div className="contact-service-panel">
            <div className="contact-service-top">
              <span><Icon name="calendar" size={23} /></span>
              <div><small>Weekly Sabbath service</small><strong>Saturday at 1:45 PM</strong></div>
            </div>
            <div className="contact-service-details">
              <p><Icon name="map" size={16} /> Casey Community Center, 2nd Floor · Aspen Room</p>
              <p><Icon name="users" size={16} /> In-person worship and virtual connection</p>
            </div>
            <Link to="/events" className="text-link">View service calendar <Icon name="arrow" size={16} /></Link>
          </div>

          <div className="contact-assurance">
            <Icon name="heart" size={22} />
            <p><strong>Need prayer?</strong> Select “Prayer request” in the form. Your message will be received with care.</p>
          </div>
        </div>

        <form className="contact-form contact-form-advanced" onSubmit={submit}>
          <div className="contact-form-heading">
            <span className="form-step">Message us</span>
            <h2>Start a conversation</h2>
            <p>Fields marked with an asterisk are required.</p>
          </div>
          <div className="form-row">
            <label>Full name <span aria-hidden="true">*</span><input name="name" required autoComplete="name" placeholder="Your name" /></label>
            <label>Email address <span aria-hidden="true">*</span><input name="email" required type="email" autoComplete="email" placeholder="you@example.com" /></label>
          </div>
          <div className="form-row">
            <label>Phone number <input name="phone" type="tel" autoComplete="tel" placeholder="Optional" /></label>
            <label>How can we help? <span aria-hidden="true">*</span>
              <select name="topic" required defaultValue="">
                <option value="" disabled>Select a topic</option>
                <option>General question</option>
                <option>Prayer request</option>
                <option>Plan a visit</option>
                <option>Online service access</option>
                <option>Donation question</option>
              </select>
            </label>
          </div>
          <label>Message <span aria-hidden="true">*</span><textarea name="message" required rows="7" placeholder="Tell us how we can help…" /></label>
          <div className="contact-form-footer">
            <button className="button" type="submit">Send Message <Icon name="arrow" /></button>
            <span><Icon name="mail" size={15} /> Opens your email app securely</span>
          </div>
          {sent && <p className="form-note" role="status">Your email app has been opened with your message prepared.</p>}
        </form>
      </div>
    </section>

    <section className="contact-team-section">
      <div className="container">
        <div className="contact-team-heading">
          <div><span className="eyebrow">Ministry contacts</span><h2>Reach the right person</h2></div>
          <p>Connect directly with the team member best suited to answer your question.</p>
        </div>
        <div className="contact-team-grid">
          {contactPeople.map((person, index) => (
            <article className="contact-person-card" key={person.email}>
              <span className="contact-person-number">0{index + 1}</span>
              <span className="contact-person-avatar">{person.name.split(' ').map(part => part[0]).join('')}</span>
              <div>
                <small>{person.role}</small>
                <h3>{person.name}</h3>
                <a href={`mailto:${person.email}`}><Icon name="mail" size={15} /> {person.email}</a>
                <a href={`tel:${person.phone}`}><Icon name="phone" size={15} /> {person.phone}</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="contact-map-section">
      <div className="contact-map">
        <iframe
          title="Map showing Casey Community Center in Gaithersburg, Maryland"
          src="https://www.google.com/maps?q=Casey+Community+Center,+810+S+Frederick+Ave,+Gaithersburg,+MD+20877&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="contact-map-card">
        <span className="eyebrow light">Worship with us</span>
        <h2>Find your way here.</h2>
        <p><strong>{SITE.place}</strong><br />810 S. Frederick Ave.<br />2nd Floor · Aspen Room<br />Gaithersburg, MD 20877</p>
        <div><Icon name="clock" size={18} /><span><small>Service begins</small><strong>Saturday · 1:45 PM</strong></span></div>
        <a href={SITE.directions} className="button button-light" target="_blank" rel="noreferrer">Open in Google Maps <Icon name="arrow" /></a>
      </div>
    </section>
  </>
}

function Donate() {
  const qr = donateInfo.qr?.[0]
  const [checkoutReady, setCheckoutReady] = useState(Boolean(window.CollectCheckout))
  const [checkoutError, setCheckoutError] = useState('')

  useEffect(() => {
    if (window.CollectCheckout) {
      setCheckoutReady(true)
      return undefined
    }
    const existing = document.querySelector('script[data-cgi-checkout]')
    if (existing) {
      const ready = () => setCheckoutReady(Boolean(window.CollectCheckout))
      existing.addEventListener('load', ready)
      return () => existing.removeEventListener('load', ready)
    }
    const script = document.createElement('script')
    script.src = 'https://secure.networkmerchants.com/token/CollectCheckout.js'
    script.dataset.checkoutKey = donateInfo.checkoutKey
    script.dataset.cgiCheckout = 'true'
    script.async = true
    script.onload = () => setCheckoutReady(Boolean(window.CollectCheckout))
    script.onerror = () => setCheckoutError('Secure checkout could not load. Please use the QR code or try again.')
    document.head.appendChild(script)
    return undefined
  }, [])

  function openCheckout() {
    setCheckoutError('')
    if (!window.CollectCheckout) {
      setCheckoutError('Secure checkout is still loading. Please wait a moment or use the QR code.')
      return
    }
    window.CollectCheckout.redirectToCheckout({
      type: 'sale',
      lineItems: [{ lineItemType: 'customPayment', description: 'Donation Amount', currency: 'USD' }],
      successUrl: null,
      cancelUrl: null,
      customerVault: { addCustomer: true },
      receipt: { showReceipt: true, sendToCustomer: true },
      useKount: false,
      promptRecurringPayment: true,
      paymentMethods: [{ type: 'creditCard', use3DSecure: false }],
      fields: [],
    }).then(error => {
      if (error) setCheckoutError('The checkout could not be opened. Please try again or use the QR code.')
    })
  }

  return <>
    <section className="donate-hero">
      <div className="donate-hero-image" />
      <div className="donate-hero-overlay" />
      <div className="container donate-hero-content">
        <span className="eyebrow light">Support the mission</span>
        <h1>Give with purpose.<br />Make a difference.</h1>
        <p>Your generosity helps sustain the work of the Church of God International in Gaithersburg and share the gospel with others.</p>
        <div className="donate-trust-row">
          <span><Icon name="lock" size={17} /> Secure checkout</span>
          <span><Icon name="card" size={17} /> One-time or recurring</span>
          <span><Icon name="mail" size={17} /> Receipt by email</span>
        </div>
      </div>
    </section>

    <section className="donate-main-section">
      <div className="container donate-layout">
        <div className="donate-story">
          <span className="eyebrow">Thank you for giving</span>
          <h2>Your support moves the work forward.</h2>
          <p className="lead">Every contribution helps CGI Gaithersburg continue serving the congregation and making biblical teaching available to those seeking God’s Word.</p>

          <div className="donate-impact-list">
            <div><span><Icon name="book" size={22} /></span><div><strong>Share biblical teaching</strong><p>Support sermons, Bible studies, and resources that help people grow in truth.</p></div></div>
            <div><span><Icon name="users" size={22} /></span><div><strong>Serve the congregation</strong><p>Help sustain local worship, fellowship, and ministry in the community.</p></div></div>
            <div><span><Icon name="heart" size={22} /></span><div><strong>Continue the mission</strong><p>Partner in the ongoing work of sharing the gospel and serving others.</p></div></div>
          </div>

          <blockquote>
            “Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.”
            <cite>2 Corinthians 9:7</cite>
          </blockquote>
        </div>

        <div className="donate-checkout-card">
          <div className="donate-checkout-head">
            <span className="donate-secure-icon"><Icon name="lock" size={24} /></span>
            <div><small>Protected payment</small><h2>Donate Online</h2></div>
          </div>
          <p>Give securely by credit card. The checkout lets you choose your donation amount and set up an optional recurring gift.</p>

          <div className="donate-steps">
            <div><span>01</span><p><strong>Open secure checkout</strong><small>Choose your donation amount</small></p></div>
            <div><span>02</span><p><strong>Enter billing details</strong><small>Please use your billing address</small></p></div>
            <div><span>03</span><p><strong>Receive your receipt</strong><small>A copy can be sent by email</small></p></div>
          </div>

          <button className="button donate-checkout-button" type="button" onClick={openCheckout} disabled={!checkoutReady && !checkoutError}>
            <Icon name="card" size={19} /> {checkoutReady ? 'Continue to Secure Checkout' : 'Loading Secure Checkout…'} <Icon name="arrow" size={18} />
          </button>
          {checkoutError && <p className="donate-error" role="alert">{checkoutError}</p>}
          <div className="donate-security-note"><Icon name="lock" size={14} /> Payment details are handled by the church’s secure payment provider.</div>

          {qr && <div className="donate-qr-block">
            <img src={qr} alt="CGI Maryland secure donation QR code" />
            <div><small>Giving from your phone?</small><strong>Scan to donate securely</strong><p>Open your camera and point it at the QR code.</p></div>
          </div>}
        </div>
      </div>
    </section>

    <section className="donate-alternative">
      <div className="container donate-mail-grid">
        <div className="donate-mail-visual">
          <span><Icon name="mail" size={34} /></span>
          <div className="donate-mail-lines" aria-hidden="true"><i /><i /><i /></div>
        </div>
        <div className="donate-mail-copy">
          <span className="eyebrow">Prefer to give by mail?</span>
          <h2>Donate by check or money order.</h2>
          <p>Make your check or money order payable to <strong>“{donateInfo.mailTo.payable}”</strong> and mail it to:</p>
          <address>
            <span><Icon name="map" size={18} /></span>
            <div><strong>{donateInfo.mailTo.name}</strong><br />{donateInfo.mailTo.address}<br />{donateInfo.mailTo.city}</div>
          </address>
        </div>
      </div>
    </section>

    <section className="donate-assurance-section">
      <div className="container donate-assurance-grid">
        <div><span><Icon name="lock" size={22} /></span><h3>Secure processing</h3><p>Your payment is processed through the church’s third-party secure checkout provider.</p></div>
        <div><span><Icon name="check" size={22} /></span><h3>Privacy respected</h3><p>CGI Maryland does not sell, share, or trade donors’ personal information.</p></div>
        <div><span><Icon name="mail" size={22} /></span><h3>Questions about giving?</h3><p>Contact Treasurer Tom Bettinger at <a href="mailto:treasurer@cgimaryland.org">treasurer@cgimaryland.org</a>.</p></div>
      </div>
    </section>
  </>
}

function BibleReader() {
  const [bookIndex, setBookIndex] = useState(42)
  const [chapter, setChapter] = useState(3)
  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flip, setFlip] = useState('')
  const [fontScale, setFontScale] = useState(1)
  const [ready, setReady] = useState(false)

  const currentBook = bibleBooks[bookIndex]
  const isFirst = bookIndex === 0 && chapter === 1
  const isLast = bookIndex === bibleBooks.length - 1 && chapter === currentBook.chapters

  const loadChapter = async (nextBookIndex, nextChapter, direction = 'next') => {
    const nextBook = bibleBooks[nextBookIndex]
    setLoading(true)
    setError('')
    try {
      const reference = encodeURIComponent(`${nextBook.name} ${nextChapter}`)
      const response = await fetch(`https://bible-api.com/${reference}?translation=kjv`)
      if (!response.ok) throw new Error('Bible passage unavailable')
      const data = await response.json()
      if (!Array.isArray(data.verses)) throw new Error('Bible passage unavailable')

      const showChapter = () => {
        setBookIndex(nextBookIndex)
        setChapter(nextChapter)
        setVerses(data.verses)
        setLoading(false)
        setReady(true)
      }

      if (ready) {
        setFlip(direction)
        window.setTimeout(showChapter, 280)
        window.setTimeout(() => setFlip(''), 760)
      } else {
        showChapter()
      }
    } catch {
      setLoading(false)
      setError('We could not load this chapter. Check your connection and try again.')
    }
  }

  useEffect(() => {
    loadChapter(42, 3)
    // Initial reader load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pageBreak = useMemo(() => {
    if (!verses.length) return 0
    const total = verses.reduce((sum, verse) => sum + verse.text.length, 0)
    let running = 0
    const index = verses.findIndex(verse => {
      running += verse.text.length
      return running >= total / 2
    })
    return Math.min(Math.max(index + 1, 1), verses.length - 1)
  }, [verses])

  const goPrevious = () => {
    if (isFirst || loading) return
    if (chapter > 1) loadChapter(bookIndex, chapter - 1, 'previous')
    else loadChapter(bookIndex - 1, bibleBooks[bookIndex - 1].chapters, 'previous')
  }

  const goNext = () => {
    if (isLast || loading) return
    if (chapter < currentBook.chapters) loadChapter(bookIndex, chapter + 1, 'next')
    else loadChapter(bookIndex + 1, 1, 'next')
  }

  const renderVerses = list => list.map(verse => (
    <span className="bible-verse" key={verse.verse}>
      <sup>{verse.verse}</sup>{verse.text.replace(/\s+/g, ' ').trim()}{' '}
    </span>
  ))

  return <>
    <section className="bible-hero">
      <div className="container bible-hero-inner">
        <span className="eyebrow light">The living Word</span>
        <h1>Read the Holy Bible</h1>
        <p>Turn the pages, select any of the 66 books, and read the King James Version in a quiet, book-inspired experience.</p>
      </div>
    </section>

    <section className="bible-reader-section">
      <div className="container bible-reader-wrap">
        <div className="bible-toolbar" aria-label="Bible reading controls">
          <div className="bible-select-group">
            <label htmlFor="bible-book">Book</label>
            <select id="bible-book" value={bookIndex} disabled={loading} onChange={event => loadChapter(Number(event.target.value), 1, Number(event.target.value) >= bookIndex ? 'next' : 'previous')}>
              <optgroup label="Old Testament">
                {bibleBooks.slice(0, oldTestamentCount).map((book, index) => <option value={index} key={book.name}>{book.name}</option>)}
              </optgroup>
              <optgroup label="New Testament">
                {bibleBooks.slice(oldTestamentCount).map((book, index) => <option value={index + oldTestamentCount} key={book.name}>{book.name}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="bible-select-group">
            <label htmlFor="bible-chapter">Chapter</label>
            <select id="bible-chapter" value={chapter} disabled={loading} onChange={event => loadChapter(bookIndex, Number(event.target.value), Number(event.target.value) >= chapter ? 'next' : 'previous')}>
              {Array.from({ length: currentBook.chapters }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1}</option>)}
            </select>
          </div>
          <div className="bible-text-size" aria-label="Text size">
            <span>Text size</span>
            <div>
              <button type="button" onClick={() => setFontScale(Math.max(.85, fontScale - .1))} aria-label="Decrease text size">A−</button>
              <button type="button" onClick={() => setFontScale(Math.min(1.35, fontScale + .1))} aria-label="Increase text size">A+</button>
            </div>
          </div>
          <span className="bible-translation"><Icon name="book" size={17} /> King James Version</span>
        </div>

        <div className={`bible-book ${flip ? `is-turning-${flip}` : ''}`} style={{ '--bible-font-scale': fontScale }}>
          <div className="bible-cover-edge bible-cover-left" />
          <div className="bible-page bible-page-left">
            <div className="bible-page-heading"><span>Holy Bible</span><strong>{currentBook.name}</strong></div>
            <div className="bible-page-content">
              {loading && !verses.length ? <div className="bible-loading">Opening the Bible…</div> : renderVerses(verses.slice(0, pageBreak))}
            </div>
            <span className="bible-page-number">{(bookIndex * 2) + chapter * 2 - 1}</span>
          </div>
          <div className="bible-spine" aria-hidden="true" />
          <div className="bible-page bible-page-right">
            <div className="bible-page-heading"><strong>Chapter {chapter}</strong><span>KJV</span></div>
            <div className="bible-page-content">
              {error ? <div className="bible-error"><p>{error}</p><button type="button" onClick={() => loadChapter(bookIndex, chapter)}>Try again</button></div> : renderVerses(verses.slice(pageBreak))}
            </div>
            <span className="bible-page-number">{(bookIndex * 2) + chapter * 2}</span>
          </div>
          {flip && <div className={`bible-turning-page ${flip}`} aria-hidden="true" />}
        </div>

        <div className="bible-navigation">
          <button type="button" onClick={goPrevious} disabled={isFirst || loading}><Icon name="arrow" size={18} /> Previous chapter</button>
          <div aria-live="polite"><strong>{currentBook.name} {chapter}</strong><span>King James Version</span></div>
          <button type="button" onClick={goNext} disabled={isLast || loading}>Next chapter <Icon name="arrow" size={18} /></button>
        </div>
        <p className="bible-credit">Scripture text: King James Version (Public Domain). An internet connection is required to load new chapters.</p>
      </div>
    </section>
  </>
}

function Privacy() {
  return <>
    <PageHero eyebrow="Your information" title="Privacy Policy" text="How CGI Maryland respects and protects the privacy of our visitors and donors." image="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=85" />
    <section className="section"><article className="container narrow longform">
      {privacyParas.map((para, i) => {
        const isHeading = /^(Technical Limits|IP Addresses|Sharing of Information|Notification of Changes|Your Consent|Visitors from outside)/i.test(para)
        if (isHeading) {
          const [title, ...rest] = para.split(/\n/)
          return <div key={i}><h2>{title}</h2>{rest.join(' ') ? <p>{rest.join(' ')}</p> : null}</div>
        }
        return <p key={i} className={i === 0 ? 'lead' : undefined}>{para}</p>
      })}
    </article></section>
  </>
}

function NotFound() {
  return <section className="not-found"><div><span className="eyebrow">404</span><h1>Page not found</h1><p>The page you are looking for may have moved.</p><Link to="/" className="button">Return Home <Icon name="arrow" /></Link></div></section>
}

function App() {
  const path = usePath()
  const pages = { '/': <Home />, '/home-page': <Home />, '/ministry': <Ministry />, '/beliefs': <Beliefs />, '/sermons': <Sermons />, '/bible': <BibleReader />, '/annual-holy-days': <HolyDays />, '/events': <Events />, '/contact-us': <Contact />, '/donate': <Donate />, '/privacy-policy': <Privacy /> }
  return <><Header /><main id="main">{pages[path] || <NotFound />}</main><Footer /></>
}

export default App
