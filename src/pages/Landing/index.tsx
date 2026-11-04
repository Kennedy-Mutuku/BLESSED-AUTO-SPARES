import { Phone, MapPin, Package, ShoppingCart, BarChart2, Bell, ChevronRight, Shield, Clock, Star } from 'lucide-react'
import logoImg   from '@/assets/logo.png'
import heroImg   from '@/assets/hero.png'
import dominionLogo from '@/assets/dominion softwares main logo.png'

interface LandingPageProps {
  onLogin: () => void
}

export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── TOP BAR ── */}
      <div className="bg-slate-900 text-white text-xs py-2 px-4 hidden sm:block">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> +254 700 225849
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Sondu Nyamira, Kenya
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Mon–Sat 8am–6pm</span>
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo + Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-md border-2 border-red-100">
              <img src={logoImg} alt="Blessed Auto Spares" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[15px] font-black text-slate-900 uppercase tracking-wide leading-tight">
                Blessed Auto Spares
              </p>
              <p className="text-[9px] text-red-600 font-semibold uppercase tracking-widest leading-tight">
                Auto Parts &amp; Accessories
              </p>
            </div>
          </div>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-6 text-[13px] font-semibold text-slate-600">
            <a href="#features" className="hover:text-red-600 transition-colors">Features</a>
            <a href="#about"    className="hover:text-red-600 transition-colors">About</a>
            <a href="#contact"  className="hover:text-red-600 transition-colors">Contact</a>
          </nav>

          {/* Login button */}
          <button
            onClick={onLogin}
            className="flex items-center gap-2 h-10 px-5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[13px] font-bold rounded-lg shadow transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            Login to Dashboard
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, #dc2626 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #dc2626 0%, transparent 40%)`,
          }}
        />
        {/* Tyre track watermark */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #fff 0px, #fff 4px, transparent 4px, transparent 40px)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20 flex flex-col md:flex-row items-center gap-8">

          {/* Left — copy */}
          <div className="flex-1 text-white z-10">
            <span className="inline-block text-red-400 text-[11px] font-bold uppercase tracking-[3px] mb-4">
              Auto Parts &amp; Accessories
            </span>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Your Complete<br />
              <span className="text-red-500">Auto Spares</span><br />
              Solution
            </h1>
            <p className="text-slate-300 text-[15px] leading-relaxed mb-8 max-w-md">
              Manage your entire inventory, process sales, track profits, and monitor
              stock levels — all from one powerful, easy-to-use system built for
              Blessed Auto Spares.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onLogin}
                className="flex items-center justify-center gap-2 h-13 px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white text-[15px] font-black rounded-xl shadow-lg shadow-red-900/40 transition-all active:scale-[0.98]"
              >
                <Shield className="w-4 h-4" />
                Access Dashboard
                <ChevronRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="flex items-center justify-center gap-2 h-13 px-8 py-3.5 border border-white/20 hover:border-white/40 text-white text-[15px] font-semibold rounded-xl transition-all"
              >
                Learn More
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-4 mt-8">
              {[
                { icon: Star,    label: 'Trusted by Mechanics' },
                { icon: Shield,  label: 'Secure & Private'     },
                { icon: Clock,   label: 'Works Offline'        },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                  <Icon className="w-3.5 h-3.5 text-red-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — hero image */}
          <div className="flex-shrink-0 w-full md:w-[46%] flex items-center justify-center">
            <div className="relative">
              {/* Glow behind image */}
              <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-90" />
              <img
                src={heroImg}
                alt="Auto Parts"
                className="relative w-full max-w-xs sm:max-w-sm md:max-w-md object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" fill="white">
            <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="bg-red-600 text-white py-5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { value: '194+', label: 'Products in Stock'  },
              { value: '100%', label: 'Real-time Tracking' },
              { value: '24/7', label: 'Works Offline'      },
              { value: '1 App', label: 'Everything Managed'},
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-black leading-tight">{value}</p>
                <p className="text-red-200 text-[11px] font-semibold uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-red-600 text-[11px] font-bold uppercase tracking-[3px]">What You Get</span>
            <h2 className="text-3xl font-black text-slate-900 mt-2">Everything You Need to Run Your Shop</h2>
            <p className="text-slate-500 mt-2 max-w-xl mx-auto text-[14px]">
              A complete management system designed specifically for auto spares businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Package,
                title: 'Inventory Management',
                desc:  'Track every part, set reorder levels, and get alerts when stock runs low. Never run out of a fast-moving item again.',
                color: 'bg-blue-50 text-blue-600',
                border: 'border-blue-100',
              },
              {
                icon: ShoppingCart,
                title: 'Point of Sale',
                desc:  'Serve customers fast with a clean POS. Add items, apply payment methods, print receipts, and record every sale.',
                color: 'bg-red-50 text-red-600',
                border: 'border-red-100',
              },
              {
                icon: BarChart2,
                title: 'Sales & Reports',
                desc:  'See today\'s revenue, profit margins, top-selling products, and full sales history — all in real time.',
                color: 'bg-emerald-50 text-emerald-600',
                border: 'border-emerald-100',
              },
              {
                icon: Bell,
                title: 'Stock Alerts',
                desc:  'Instant alerts for low or out-of-stock items. Restock directly from the alert with one tap.',
                color: 'bg-amber-50 text-amber-600',
                border: 'border-amber-100',
              },
            ].map(({ icon: Icon, title, desc, color, border }) => (
              <div key={title} className={`bg-white rounded-2xl p-6 border ${border} shadow-sm hover:shadow-md transition-shadow`}>
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 text-[13px] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / CTA ── */}
      <section id="about" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #dc2626 0%, transparent 60%)' }}
            />
            <div className="flex-1 text-white relative">
              <span className="text-red-400 text-[11px] font-bold uppercase tracking-[3px]">About the System</span>
              <h2 className="text-3xl font-black mt-2 mb-4 leading-tight">
                Built for<br />
                <span className="text-red-400">Blessed Auto Spares</span>
              </h2>
              <p className="text-slate-300 text-[14px] leading-relaxed mb-6 max-w-md">
                This is a private management dashboard for Blessed Auto Spares, Sondu Nyamira.
                Only authorised staff can log in. If you're a customer, visit us in person or call us directly.
              </p>
              <div className="flex flex-col gap-2 text-slate-300 text-[13px]">
                <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-red-400" /> +254 700 225849</span>
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-400" /> Sondu Nyamira, Kenya</span>
              </div>
            </div>
            <div className="relative shrink-0">
              <button
                onClick={onLogin}
                className="flex items-center gap-2 h-14 px-8 bg-red-600 hover:bg-red-500 text-white text-[16px] font-black rounded-2xl shadow-xl shadow-red-900/40 transition-all active:scale-[0.97]"
              >
                <Shield className="w-5 h-5" />
                Staff Login
              </button>
              <p className="text-slate-500 text-[11px] text-center mt-3">Authorised staff only</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contact" className="bg-slate-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-600 shrink-0">
                <img src={logoImg} alt="logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[14px] font-black uppercase tracking-wide">Blessed Auto Spares</p>
                <p className="text-[10px] text-slate-400 font-medium">Auto Parts &amp; Accessories</p>
              </div>
            </div>

            {/* Contact */}
            <div className="flex flex-col items-center sm:items-end gap-1 text-slate-400 text-[12px]">
              <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-red-500" /> +254 700 225849</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-red-500" /> Sondu Nyamira, Kenya</span>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-500 text-[11px]">
              © {new Date().getFullYear()} Blessed Auto Spares. All rights reserved.
            </p>
            <a
              href="https://dominionsoftwares.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              <span className="text-[9px] text-slate-400 uppercase tracking-widest">Powered by</span>
              <img src={dominionLogo} alt="Dominion Softwares" className="h-5 w-auto object-contain" />
              <span className="text-[11px] font-semibold text-slate-300">Dominion Softwares</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
