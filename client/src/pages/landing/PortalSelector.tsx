import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const PORTALS = [
  {
    role: 'donor',
    emoji: '🍽️',
    title: 'Food Donor',
    subtitle: 'Restaurant / Hotel / Event',
    description: 'List surplus food, manage pickups, and track real-time impact. Turn waste into community nourishment.',
    features: ['Post food listings in 60 sec', 'Real-time NGO pickup tracking', 'Detailed impact analytics'],
    gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    border: 'border-orange-500/30',
    hoverBorder: 'hover:border-orange-400/60',
    glow: 'shadow-orange-500/10',
    accentBg: 'bg-orange-500/20',
    accentText: 'text-orange-400',
    buttonBg: 'bg-orange-600 hover:bg-orange-500',
    badgeBg: 'bg-orange-500/10 text-orange-400',
    loginPath: '/login',
    registerPath: '/register',
    tag: 'For Restaurants & Hotels',
  },
  {
    role: 'ngo',
    emoji: '🏛️',
    title: 'NGO / Organization',
    subtitle: 'Food redistribution hub',
    description: 'Manage volunteers, claim surplus food, track deliveries live on the map, and measure community impact.',
    features: ['Live volunteer tracking map', 'AI-powered task assignment', 'Full analytics & impact reports'],
    gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent',
    border: 'border-teal-500/30',
    hoverBorder: 'hover:border-teal-400/60',
    glow: 'shadow-teal-500/10',
    accentBg: 'bg-teal-500/20',
    accentText: 'text-teal-400',
    buttonBg: 'bg-teal-600 hover:bg-teal-500',
    badgeBg: 'bg-teal-500/10 text-teal-400',
    loginPath: '/ngo/login',
    registerPath: '/ngo/register',
    tag: 'For NGOs & Trusts',
    featured: true,
  },
  {
    role: 'volunteer',
    emoji: '🚴',
    title: 'Field Volunteer',
    subtitle: 'Pickup & delivery agent',
    description: 'Accept tasks, navigate to donors, verify pickups with OTP, and deliver food to those who need it most.',
    features: ['Turn-by-turn navigation', 'OTP-based food verification', 'Personal impact stats'],
    gradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
    border: 'border-purple-500/30',
    hoverBorder: 'hover:border-purple-400/60',
    glow: 'shadow-purple-500/10',
    accentBg: 'bg-purple-500/20',
    accentText: 'text-purple-400',
    buttonBg: 'bg-purple-600 hover:bg-purple-500',
    badgeBg: 'bg-purple-500/10 text-purple-400',
    loginPath: '/volunteer/login',
    registerPath: null,          // volunteers are added by NGOs
    tag: 'For Volunteers',
  },
];

const STATS = [
  { value: '2.4M+', label: 'Meals Redistributed' },
  { value: '340+', label: 'NGO Partners' },
  { value: '12K+', label: 'Volunteers' },
  { value: '890 t', label: 'CO₂ Offset' },
];

export function PortalSelector() {
  const { user, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // initialize is now handled by the App component once at the top level
  }, []);

  // Already authenticated donors → go straight to their dashboard
  useEffect(() => {
    if (!loading && user) {
      const role = (user as any).user_metadata?.role;
      if (!role || role === 'donor') {
        navigate('/', { replace: true });
      }
      // ngo/volunteer users stay here (they go to /ngo directly after ngo login)
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-500/3 blur-[140px]" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.4) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <span className="text-white font-black text-sm">FB</span>
          </div>
          <div>
            <div className="font-bold text-white leading-none">FoodBridge</div>
            <div className="text-xs text-teal-400 leading-none mt-0.5">Surplus Food Redistribution</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="mailto:support@foodbridge.in" className="text-xs text-gray-500 hover:text-gray-300 transition-colors hidden sm:block">
            Need help?
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 text-center px-6 pt-10 pb-16 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-medium mb-6"
        >
          <Sparkles size={12} />
          India's largest food redistribution network
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-5"
        >
          Every meal
          <span className="block bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
            deserves a second life.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-400 text-lg max-w-xl mx-auto mb-10"
        >
          Connect surplus food from restaurants and events directly to communities that need it — in real time.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-8 mb-16 flex-wrap"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Portal Cards ── */}
      <section className="relative z-10 px-6 max-w-6xl mx-auto pb-16">
        <div className="text-center mb-8">
          <div className="text-sm text-gray-500 uppercase tracking-widest font-medium">Choose your portal</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PORTALS.map((portal, i) => (
            <motion.div
              key={portal.role}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.1 }}
              className={`relative rounded-2xl border ${portal.border} ${portal.hoverBorder} bg-gray-900/60 backdrop-blur-sm transition-all duration-300 shadow-2xl ${portal.glow}
                hover:shadow-lg hover:-translate-y-1 group flex flex-col overflow-hidden`}
            >
              {/* Featured badge */}
              {portal.featured && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-semibold">
                  <Sparkles size={9} /> Most Popular
                </div>
              )}

              {/* Gradient top bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${
                portal.role === 'donor' ? 'from-orange-500 to-amber-400' :
                portal.role === 'ngo' ? 'from-teal-500 to-emerald-400' :
                'from-purple-500 to-violet-400'
              } opacity-60 group-hover:opacity-100 transition-opacity`} />

              {/* Gradient bg overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${portal.gradient} opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`} />

              {/* Content */}
              <div className="relative p-5 flex flex-col flex-1">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${portal.accentBg} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {portal.emoji}
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">{portal.title}</div>
                    <div className="text-xs text-gray-400">{portal.subtitle}</div>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${portal.badgeBg} font-medium`}>
                      {portal.tag}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">{portal.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-5 flex-1">
                  {portal.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-300">
                      <div className={`w-4 h-4 rounded-full ${portal.accentBg} flex items-center justify-center flex-shrink-0`}>
                        <svg viewBox="0 0 12 12" fill="none" className={`w-2.5 h-2.5 ${portal.accentText}`}>
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Buttons */}
                <div className="space-y-2 mt-auto pt-4 border-t border-white/5">
                  <button
                    onClick={() => navigate(portal.loginPath)}
                    className={`w-full ${portal.buttonBg} text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all`}
                  >
                    Sign In
                    <ArrowRight size={14} />
                  </button>
                  {portal.registerPath ? (
                    <button
                      onClick={() => navigate(portal.registerPath!)}
                      className="w-full py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors border border-white/5 hover:border-white/10"
                    >
                      Create Account
                    </button>
                  ) : (
                    <p className="text-xs text-center text-gray-600 py-1">
                      Added by your NGO admin
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <section className="relative z-10 px-6 pb-16 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-white/5 bg-gray-900/40 backdrop-blur p-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-teal-400" />
              End-to-end encrypted
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-orange-400" />
              Real-time GPS tracking
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" />
              AI-powered matching
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">●</span>
              99.9% uptime SLA
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center pb-8 text-xs text-gray-700">
        © 2025 FoodBridge · Built to eliminate food waste, one meal at a time.
      </footer>
    </div>
  );
}
