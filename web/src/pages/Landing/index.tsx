import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// ── Scroll-reveal hook ─────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref  = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ── Animated counter ───────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const { ref, inView } = useInView(0.3)
  const [val, setVal]   = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const dur   = 1800
    let raf: number
    function tick(now: number) {
      const pct  = Math.min((now - start) / dur, 1)
      const ease = 1 - Math.pow(1 - pct, 3)
      setVal(Math.floor(ease * to))
      if (pct < 1) raf = requestAnimationFrame(tick)
      else setVal(to)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to])
  return <div ref={ref} className="inline-block">{val.toLocaleString()}{suffix}</div>
}

// ── Scroll-reveal wrapper ──────────────────────────────────────────────────
function Reveal({
  children, className = '', delay = 0,
  dir = 'up',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  dir?: 'up' | 'left' | 'right' | 'scale'
}) {
  const { ref, inView } = useInView()
  const cls = inView
    ? { up: 'anim-visible-up', left: 'anim-visible-left', right: 'anim-visible-right', scale: 'anim-visible-scale' }[dir]
    : 'anim-hidden'
  return (
    <div
      ref={ref}
      className={`${cls} ${className}`}
      style={inView && delay ? { animationDelay: `${delay}ms` } : {}}
    >
      {children}
    </div>
  )
}

// ── Shared gear SVG ────────────────────────────────────────────────────────
function GearSVG({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

// ── TICKER ─────────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'Engine Components', 'Filters & Oils', 'Brake Systems', 'Electrical Parts',
  'Body & Exterior', 'Suspension', 'Toyota', 'Nissan', 'Mitsubishi', 'Isuzu',
  'Subaru', 'Genuine OEM Parts', 'Sondu Nyamira',
]

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="bg-red-600 py-3 overflow-hidden select-none" aria-hidden>
      <div className="animate-marquee items-center whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center text-white font-bold text-xs uppercase tracking-widest px-5">
            {item}
            <span className="ml-5 text-red-400 text-[10px]">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── NAVBAR ─────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 70)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-slate-950/95 backdrop-blur-lg border-b border-white/[0.07] shadow-2xl shadow-black/20' : ''
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
            <GearSVG className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-[13px] leading-tight">Blessed Auto Spares</p>
            <p className="text-red-500/60 text-[8px] uppercase tracking-widest font-bold hidden sm:block">Sondu · Nyamira · Kenya</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7">
          {[['parts', 'Parts'], ['brands', 'Brands'], ['about', 'About'], ['contact', 'Contact']].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="text-slate-400 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
            >{label}</button>
          ))}
        </nav>

        <Link to="/login"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-600/20 transition-all"
        >
          Staff Portal
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </header>
  )
}

// ── HERO ───────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060a14 0%, #0d1424 60%, #0f0208 100%)' }}
    >
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Animated red glow */}
      <div className="absolute animate-hero-glow bottom-0 right-0 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 70%)', transform: 'translate(20%, 20%)' }} />
      <div className="absolute top-1/4 right-1/3 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)' }} />

      {/* Large background gear — right */}
      <div className="absolute right-[-100px] top-1/2 -translate-y-1/2 w-[560px] h-[560px] opacity-[0.055] animate-spin-slow pointer-events-none">
        <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={0.3} className="w-full h-full">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      {/* Small gear — left */}
      <div className="absolute left-[-60px] bottom-1/4 w-[280px] h-[280px] opacity-[0.04] pointer-events-none"
        style={{ animation: 'spinSlow 35s linear infinite reverse' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={0.4} className="w-full h-full">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 w-full grid lg:grid-cols-[1fr_auto] gap-12 items-center">

        {/* Left — text */}
        <div className="max-w-2xl">

          <div className="inline-flex items-center gap-2 bg-red-600/15 border border-red-600/25 rounded-full px-4 py-1.5 mb-8 anim-visible-up">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
            <span className="text-red-400 text-[11px] font-bold uppercase tracking-widest">Est. · Sondu Nyamira, Kenya</span>
          </div>

          <h1
            className="font-black text-white leading-[0.93] tracking-tight anim-visible-up"
            style={{ fontSize: 'clamp(54px, 9vw, 100px)', animationDelay: '80ms' }}
          >
            Blessed<br />
            <span className="text-red-500">Auto</span><br />
            Spares<span className="text-red-700">.</span>
          </h1>

          <p className="text-slate-200 text-xl font-bold mt-6 leading-snug anim-visible-up" style={{ animationDelay: '160ms' }}>
            Your Road, Perfected.
          </p>
          <p className="text-slate-500 text-[15px] mt-3 leading-relaxed max-w-lg anim-visible-up" style={{ animationDelay: '220ms' }}>
            Sondu Nyamira's most trusted auto parts &amp; accessories dealer.
            Genuine filters, oils, brakes, engine components, electrical and body parts —
            for Toyota, Nissan, Mitsubishi, Isuzu, Subaru and more.
          </p>

          <div className="flex flex-wrap gap-4 mt-8 anim-visible-up" style={{ animationDelay: '300ms' }}>
            <button
              onClick={() => document.getElementById('parts')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[15px] shadow-xl shadow-red-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse Our Parts
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Link to="/login"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.13] border border-white/15 text-white font-bold text-[15px] transition-all"
            >
              Staff Portal →
            </Link>
          </div>

          <div className="flex items-center gap-6 mt-10 anim-visible-up" style={{ animationDelay: '380ms' }}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-slate-500 text-sm">Sondu, Nyamira County</span>
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-slate-500 text-sm">+254 700 225849</span>
            </div>
          </div>
        </div>

        {/* Right — floating info cards */}
        <div className="hidden xl:flex flex-col gap-4">
          {[
            { top: '500+',   sub: 'Parts in Stock',   gradient: 'from-red-600/25 to-red-900/15', border: 'border-red-600/25' },
            { top: 'OEM',    sub: 'Genuine Parts Only', gradient: 'from-white/[0.07] to-white/[0.03]', border: 'border-white/10' },
            { top: 'No. 1',  sub: 'In Nyamira County', gradient: 'from-white/[0.07] to-white/[0.03]', border: 'border-white/10' },
          ].map((c, i) => (
            <div
              key={c.top}
              className={`bg-gradient-to-br ${c.gradient} border ${c.border} rounded-2xl px-7 py-5 text-center anim-visible-right backdrop-blur-sm`}
              style={{ animationDelay: `${200 + i * 150}ms` }}
            >
              <p className="text-3xl font-black text-white">{c.top}</p>
              <p className="text-slate-400 text-xs mt-1 font-semibold">{c.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-700 animate-bounce">
        <span className="text-[9px] uppercase tracking-widest font-bold">Scroll</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  )
}

// ── STATS ──────────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { to: 500,  suffix: '+', label: 'Parts in Stock',   sub: 'Across all categories'           },
    { to: 10,   suffix: '+', label: 'Years of Service', sub: 'Trusted since 2014'              },
    { to: 50,   suffix: '+', label: 'Clients Daily',    sub: 'Walk-ins & regular customers'    },
    { to: 5,    suffix: '',  label: 'Vehicle Brands',   sub: 'Toyota · Nissan · Mitsubishi'    },
  ]
  return (
    <section className="py-14" style={{ background: '#dc2626' }}>
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <Reveal key={s.label} dir="scale" delay={i * 90} className="text-center">
            <div className="text-5xl lg:text-6xl font-black text-white leading-none">
              <Counter to={s.to} suffix={s.suffix} />
            </div>
            <p className="text-white font-black text-sm mt-2 uppercase tracking-wide">{s.label}</p>
            <p className="text-red-200/50 text-xs mt-1">{s.sub}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ── CATEGORIES ─────────────────────────────────────────────────────────────
const CATS: { iconBg: string; title: string; desc: string; icon: () => React.ReactElement }[] = [
  {
    iconBg: '#dc2626',
    title: 'Engine Components',
    desc: 'Pistons, gaskets, timing belts, oil seals, engine bearings, camshafts and full rebuild kits for all makes.',
    icon: () => (
      <svg fill="none" stroke="white" strokeWidth={1.6} viewBox="0 0 24 24" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    iconBg: '#2563eb',
    title: 'Filters & Lubricants',
    desc: 'Air, oil and fuel filters. Engine oils, transmission fluids, coolants and brake fluids for every vehicle.',
    icon: () => (
      <svg fill="none" stroke="white" strokeWidth={1.6} viewBox="0 0 24 24" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    iconBg: '#ea580c',
    title: 'Brake Systems',
    desc: 'Brake pads, discs, drums, calipers, master cylinders and brake hoses for safe, reliable stopping power.',
    icon: () => (
      <svg fill="none" stroke="white" strokeWidth={1.6} viewBox="0 0 24 24" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    iconBg: '#d97706',
    title: 'Electrical Parts',
    desc: 'Batteries, alternators, starters, sensors, fuses, wiring harnesses and all lighting components.',
    icon: () => (
      <svg fill="none" stroke="white" strokeWidth={1.6} viewBox="0 0 24 24" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    iconBg: '#059669',
    title: 'Body & Exterior',
    desc: 'Bumpers, panels, doors, mirrors, wipers, headlights and all exterior trim for a clean-looking vehicle.',
    icon: () => (
      <svg fill="none" stroke="white" strokeWidth={1.6} viewBox="0 0 24 24" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    iconBg: '#7c3aed',
    title: 'Suspension & Steering',
    desc: 'Shock absorbers, struts, springs, tie rod ends, ball joints, control arms and complete steering racks.',
    icon: () => (
      <svg fill="none" stroke="white" strokeWidth={1.6} viewBox="0 0 24 24" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    ),
  },
]

function Categories() {
  return (
    <section id="parts" className="py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal className="text-center mb-16">
          <p className="text-red-600 text-[11px] font-black uppercase tracking-widest mb-3">What We Stock</p>
          <h2 className="text-4xl lg:text-[52px] font-black text-slate-900 tracking-tight leading-tight">
            Everything Your<br/><span className="text-red-600">Vehicle Needs</span>
          </h2>
          <p className="text-slate-500 text-lg mt-5 max-w-xl mx-auto leading-relaxed">
            From the engine to the bodywork — we carry genuine OEM and high-quality aftermarket parts for every job.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATS.map((cat, i) => (
            <Reveal key={cat.title} delay={i * 75} className="group">
              <div className="h-full border border-slate-100 rounded-2xl p-7 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden bg-white">
                {/* Hover bottom line */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl"
                  style={{ background: cat.iconBg }} />
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                  style={{ width: 52, height: 52, background: cat.iconBg, boxShadow: `0 10px 30px ${cat.iconBg}40` }}
                >
                  {cat.icon()}
                </div>
                <h3 className="text-slate-900 font-black text-[17px] mb-2">{cat.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{cat.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── VEHICLE BRANDS ─────────────────────────────────────────────────────────
const BRANDS = [
  { letter: 'T', name: 'Toyota',     color: '#cc0a1a', models: 'Corolla · Hilux · Prado · Land Cruiser · Vitz · Rush',  note: 'Most popular make in Nyamira — full parts coverage always in stock.' },
  { letter: 'N', name: 'Nissan',     color: '#b01030', models: 'X-Trail · Navara · Patrol · NP300 · Tiida · Dualis',   note: 'Reliable range from daily commuters to heavy-duty pickups.'          },
  { letter: 'M', name: 'Mitsubishi', color: '#c8000e', models: 'L200 · Pajero · Outlander · Canter · Galant · Eclipse', note: 'Complete catalog for the full Mitsubishi lineup.'                    },
  { letter: 'I', name: 'Isuzu',      color: '#aa0000', models: 'D-Max · MU-X · NPR · NKR · Forward · ELF',             note: 'Commercial and 4×4 parts always available. Fast sourcing.'           },
  { letter: 'S', name: 'Subaru',     color: '#1a2eaa', models: 'Forester · Legacy · Impreza · Outback · XV · BRZ',     note: 'AWD specialists — oil, filters, engine and drivetrain parts.'       },
]

function Brands() {
  return (
    <section id="brands" className="py-20 lg:py-28" style={{ background: '#080c1a' }}>
      <div className="max-w-6xl mx-auto px-6">
        <Reveal className="text-center mb-16">
          <p className="text-red-500/60 text-[11px] font-black uppercase tracking-widest mb-3">Vehicle Compatibility</p>
          <h2 className="text-4xl lg:text-[52px] font-black text-white tracking-tight leading-tight">
            Parts for Every<br/><span className="text-red-500">Make &amp; Model</span>
          </h2>
          <p className="text-slate-500 text-lg mt-5 max-w-xl mx-auto leading-relaxed">
            Whatever you drive, we have the right part. We cover the most popular vehicles on Kenyan roads.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {BRANDS.map((b, i) => (
            <Reveal key={b.name} delay={i * 90} className="group">
              <div className="h-full bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 hover:border-red-600/40 hover:bg-white/[0.07] transition-all duration-300 hover:shadow-2xl hover:shadow-red-900/15 hover:-translate-y-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl mb-4 shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${b.color} 0%, #3d0000 100%)`, boxShadow: `0 8px 24px ${b.color}40` }}
                >{b.letter}</div>
                <h3 className="text-white font-black text-base mb-1">{b.name}</h3>
                <p className="text-slate-600 text-[10px] leading-relaxed mb-3 font-medium">{b.models}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{b.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── ABOUT / WHY US ─────────────────────────────────────────────────────────
const WHY = [
  { title: 'Genuine OEM Parts',     desc: 'Authentic manufacturer-grade parts that meet original factory specifications — no counterfeits.', icon: '✓' },
  { title: 'Expert Knowledge',      desc: 'Our team knows vehicles inside out. Get the right part the first time, every single time.',       icon: '◎' },
  { title: 'Competitive Pricing',   desc: 'Best prices in Nyamira County. No hidden costs. Clear, honest pricing on every single part.',     icon: '₭' },
  { title: 'Wide Availability',     desc: 'Most parts available same-day. Rare items sourced quickly from our trusted supplier network.',     icon: '◈' },
]

function About() {
  return (
    <section id="about" className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left text */}
          <Reveal dir="left">
            <p className="text-red-600 text-[11px] font-black uppercase tracking-widest mb-3">Our Story</p>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
              Nyamira's Most<br/><span className="text-red-600">Trusted Parts Dealer</span>
            </h2>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-5">
              Blessed Auto Spares has been serving drivers across Nyamira County from our home in
              Sondu Township. We built our reputation on three things: genuine parts, honest prices,
              and service you can count on.
            </p>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-8">
              Whether you're a mechanic, a fleet owner, or simply keeping your personal vehicle on the
              road — we have the parts you need, in stock, today. Toyota, Nissan, Mitsubishi, Isuzu,
              Subaru and more — we serve every make on Kenyan roads.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm flex-1">
                <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-slate-900 font-bold text-sm">Sondu Township</p>
                  <p className="text-slate-500 text-xs">Nyamira County, Kenya</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm flex-1">
                <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-slate-900 font-bold text-sm">Mon–Sat 7am–7pm</p>
                  <p className="text-slate-500 text-xs">Sunday 9am–2pm</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right — why cards */}
          <div className="grid grid-cols-2 gap-4">
            {WHY.map((w, i) => (
              <Reveal key={w.title} dir="right" delay={i * 90}>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all h-full">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 font-black text-base mb-3">
                    {w.icon}
                  </div>
                  <h3 className="text-slate-900 font-black text-sm mb-1.5">{w.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── CONTACT / CTA ──────────────────────────────────────────────────────────
function Contact() {
  const info = [
    {
      label: 'Call Us',
      value: '+254 700 225849',
      sub: 'Mon–Sat 7am–7pm · Sun 9am–2pm',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      label: 'Visit Us',
      value: 'Sondu Township',
      sub: 'Nyamira County, Kenya',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Business Hours',
      value: 'Mon–Sat 7am–7pm',
      sub: 'Sunday 9am–2pm',
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <section id="contact" className="py-20 lg:py-28 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060a14 0%, #0d1424 60%, #0f0208 100%)' }}>
      <div className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] animate-hero-glow"
        style={{ background: 'radial-gradient(ellipse, rgba(220,38,38,0.2) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <Reveal>
          <p className="text-red-500/60 text-[11px] font-black uppercase tracking-widest mb-3">Get In Touch</p>
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Visit Us in<br/><span className="text-red-500">Sondu, Nyamira</span>
          </h2>
          <p className="text-slate-500 text-[15px] mb-12 max-w-lg mx-auto leading-relaxed">
            We're open six days a week. Walk in, call ahead, or send us a message.
            Our team is ready to help you find the right part for your vehicle.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {info.map((c, i) => (
            <Reveal key={c.label} delay={i * 100}>
              <div className="bg-white/[0.05] border border-white/[0.09] rounded-2xl p-6 hover:bg-white/[0.08] hover:border-red-600/30 transition-all">
                <div className="w-11 h-11 rounded-xl bg-red-600/20 border border-red-600/20 flex items-center justify-center text-red-500 mx-auto mb-4">
                  {c.icon}
                </div>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">{c.label}</p>
                <p className="text-white font-black text-base">{c.value}</p>
                <p className="text-slate-600 text-xs mt-0.5">{c.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <Link to="/login"
            className="inline-flex items-center gap-3 px-9 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-2xl shadow-red-600/25 transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            Access Staff Portal
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <p className="text-slate-700 text-xs mt-4">Staff &amp; management access only</p>
        </Reveal>
      </div>
    </section>
  )
}

// ── FOOTER ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
            <GearSVG className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-[13px] leading-tight">Blessed Auto Spares</p>
            <p className="text-slate-600 text-[10px] mt-0.5">Genuine Parts &amp; Accessories · Sondu Nyamira, Kenya</p>
          </div>
        </div>

        <p className="text-slate-700 text-xs text-center">
          © {new Date().getFullYear()} Blessed Auto Spares. All rights reserved. · +254 700 225849
        </p>

        <Link to="/login" className="text-red-500/60 hover:text-red-500 text-xs font-semibold transition-colors">
          Staff Portal →
        </Link>
      </div>
    </footer>
  )
}

// ── PAGE EXPORT ────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Ticker />
      <Stats />
      <Categories />
      <Brands />
      <About />
      <Contact />
      <Footer />
    </div>
  )
}
