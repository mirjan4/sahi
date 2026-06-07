import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Search, Trophy, Megaphone, Image as ImageIcon, Award, ArrowRight,
  BookOpen, Star, Calendar, Users, Layers, ChevronDown, Sparkles, Zap
} from 'lucide-react';

/* ─────────────── Floating Particles ─────────────── */
const PARTICLE_COUNT = 28;
const Particles = () => {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.5 + 0.2,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0
              ? `rgba(99,102,241,${p.opacity})`
              : p.id % 3 === 1
              ? `rgba(6,182,212,${p.opacity})`
              : `rgba(16,185,129,${p.opacity})`,
            boxShadow: `0 0 ${p.size * 3}px currentColor`,
            animation: `particleDrift ${p.duration}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
};

/* ─────────────── Background Stars ─────────────── */
const STAR_COUNT = 60;
const Stars = () => {
  const stars = useRef(
    Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 5,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animation: `starBlink ${s.duration}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
};

/* ─────────────── Animated Counter ─────────────── */
const AnimatedCounter = ({ target, suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate: (v) => setVal(Math.floor(v)),
    });
    return controls.stop;
  }, [target]);
  return <span>{val}{suffix}</span>;
};

/* ─────────────── Stat Card ─────────────── */
const StatCard = ({ icon: Icon, label, value, suffix, color, delay, floatClass }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, delay }}
    className={`glass-card rounded-2xl px-5 py-4 border border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-xl ${floatClass}`}
    style={{ willChange: 'transform' }}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
      <Icon className="w-4.5 h-4.5" />
    </div>
    <div>
      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{label}</p>
      <p className="text-lg font-black text-white leading-tight">
        <AnimatedCounter target={value} suffix={suffix} />
      </p>
    </div>
  </motion.div>
);

/* ─────────────── Main Home Component ─────────────── */
const Home = () => {
  const [festivalName, setFestivalName] = useState('Sahithyolsav');
  const [festivalEdition, setFestivalEdition] = useState('33');
  const [festivalTheme, setFestivalTheme] = useState('Explore the Colors of Literature');
  const [festivalDate, setFestivalDate] = useState('');
  const [festivalVenue, setFestivalVenue] = useState('');
  const [festivalBanners, setFestivalBanners] = useState([]); // array of hero image URLs
  const [bannerIdx, setBannerIdx] = useState(0);              // active slideshow index
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ programs: 0, participants: 0, results: 0 });
  const [loading, setLoading] = useState(true);
  const [allResults, setAllResults] = useState([]);
  const [posterIdx, setPosterIdx] = useState(0);

  // Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgX = useTransform(mouseX, [-1, 1], [-12, 12]);
  const bgY = useTransform(mouseY, [-1, 1], [-8, 8]);
  const fgX = useTransform(mouseX, [-1, 1], [-6, 6]);
  const fgY = useTransform(mouseY, [-1, 1], [-4, 4]);

  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [settingsRes, annRes, eventsRes, resultsRes, participantsRes] = await Promise.all([
          api.get('/settings'),
          api.get('/announcements'),
          api.get('/events'),
          api.get('/results'),
          api.get('/participants'),
        ]);

        if (settingsRes.data.success) {
          const s = settingsRes.data.settings;
          // Split festival name: "Sahithyolsav 33" → name + edition
          const nameParts = (s.festival_name || 'Sahithyolsav 33').split(' ');
          const edition = nameParts[nameParts.length - 1];
          const baseName = nameParts.slice(0, -1).join(' ') || 'Sahithyolsav';
          setFestivalName(baseName);
          setFestivalEdition(/^\d+$/.test(edition) ? edition : '');
          setFestivalTheme(s.festival_theme || 'A Grand Celebration of Literature, Culture & Talent');
          setFestivalDate(s.festival_date || '');
          setFestivalVenue(s.festival_venue || '');
          // Load multi-banner array (festival_banners) or fall back to single banner
          if (s.festival_banners) {
            try {
              const parsed = JSON.parse(s.festival_banners);
              setFestivalBanners(Array.isArray(parsed) && parsed.length > 0 ? parsed : s.festival_banner ? [s.festival_banner] : []);
            } catch { setFestivalBanners(s.festival_banner ? [s.festival_banner] : []); }
          } else {
            setFestivalBanners(s.festival_banner ? [s.festival_banner] : []);
          }
        }

        if (annRes.data.success) setAnnouncements(annRes.data.announcements.slice(0, 3));

        const evCount = eventsRes?.data?.events?.length || 0;
        const pCount = participantsRes?.data?.participants?.length || 0;
        const allRes = resultsRes?.data?.results || [];
        setStats({ programs: evCount, participants: pCount, results: allRes.length });
        setAllResults(allRes);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Cycle through results every 4s for the dynamic poster card
  useEffect(() => {
    if (allResults.length <= 1) return;
    const id = setInterval(() => { setPosterIdx((i) => (i + 1) % allResults.length); }, 4000);
    return () => clearInterval(id);
  }, [allResults]);

  // Auto-cycle hero banner slideshow every 5s
  useEffect(() => {
    if (festivalBanners.length <= 1) return;
    const id = setInterval(() => { setBannerIdx((i) => (i + 1) % festivalBanners.length); }, 5000);
    return () => clearInterval(id);
  }, [festivalBanners]);

  const features = [
    { title: 'Result Search', desc: 'Lookup placements instantly by name or register number.', path: '/results', icon: Search, color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/20', text: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Live Scoreboard', desc: 'Real-time team rankings and leaderboard standing tables.', path: '/scoreboard', icon: Trophy, color: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/20', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Notice Board', desc: 'Official schedule announcements, news and PDF downloads.', path: '/notices', icon: Megaphone, color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/20', text: 'text-pink-400', bg: 'bg-pink-500/10' },
    { title: 'Gallery', desc: 'Browse photos and media showcasing event performances.', path: '/gallery', icon: ImageIcon, color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="relative">

      {/* ══════════════════════════════════════
          HERO SECTION — FULL-SCREEN CINEMATIC
          ══════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* ── Animated cinematic background ── */}
        <motion.div
          className="absolute inset-0 z-0 animate-slow-zoom"
          style={{ x: bgX, y: bgY, willChange: 'transform' }}
        >
          {/* Always-present dark base */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#050d1a] to-slate-900" />

          {festivalBanners.length > 0 ? (
            /* Crossfading hero slideshow */
            <>
              {festivalBanners.map((url, idx) => (
                <img
                  key={url}
                  src={url}
                  alt={`Festival hero ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                  style={{
                    mixBlendMode: 'luminosity',
                    opacity: idx === bannerIdx ? 0.38 : 0,
                  }}
                />
              ))}
            </>
          ) : (
            /* Subtle dot-grid fallback texture */
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            />
          )}
        </motion.div>

        {/* ── Stars ── */}
        <Stars />

        {/* ── Particles ── */}
        <Particles />

        {/* ── Aurora light blobs ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="absolute top-[-15%] left-[10%] w-[500px] h-[500px] rounded-full animate-aurora-1"
            style={{
              background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] rounded-full animate-aurora-2"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
          <div
            className="absolute top-[40%] right-[30%] w-[350px] h-[350px] rounded-full animate-aurora-1"
            style={{
              background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)',
              filter: 'blur(50px)',
              animationDelay: '4s',
            }}
          />
        </div>

        {/* ── Radial vignette overlay ── */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(2,6,23,0.6) 100%)'
          }}
        />

        {/* ── Hero content ── */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* LEFT — Text content */}
            <div className="space-y-6 text-left">

              {/* Venue badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-sm text-cyan-300 text-[10px] font-bold uppercase tracking-[0.2em]"
              >
                <Sparkles className="w-3 h-3 animate-pulse" />
                {festivalVenue || 'Annual Literary Festival'}
              </motion.div>

              {/* Festival name */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <h1 className="font-black tracking-tight text-white leading-none">
                  <span
                    className="block text-3xl sm:text-4xl lg:text-5xl"
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {festivalName}
                  </span>
                  {festivalEdition && (
                    <span
                      className="block text-4xl sm:text-5xl lg:text-6xl mt-1"
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 40%, #0891b2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1,
                      }}
                    >
                      {festivalEdition}
                    </span>
                  )}
                </h1>
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-slate-300 text-base sm:text-lg max-w-md leading-relaxed font-medium"
              >
                {festivalTheme}
              </motion.p>

              {/* Date + Venue info chips */}
              {(festivalDate || festivalVenue) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                  className="flex flex-wrap gap-3"
                >
                  {festivalDate && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <div>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Date</p>
                        <p className="text-xs font-bold text-white">{festivalDate}</p>
                      </div>
                    </div>
                  )}
                  {festivalVenue && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <div>
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Venue</p>
                        <p className="text-xs font-bold text-white">{festivalVenue}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="flex flex-wrap gap-3 pt-2"
              >
                <Link
                  to="/results"
                  className="group relative px-6 py-3.5 rounded-xl text-sm font-bold text-white uppercase tracking-wide overflow-hidden transition-all duration-300 hover:scale-105 shadow-lg shadow-cyan-500/20"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)',
                  }}
                >
                  {/* Glow sweep on hover */}
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(135deg, #22d3ee, #6366f1, #a855f7)', }} />
                  <span className="relative flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Explore Results
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>

                <Link
                  to="/gallery"
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wide border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  View Gallery
                </Link>
              </motion.div>
            </div>

            {/* RIGHT — Floating poster card + stats */}
            <motion.div
              className="relative flex items-center justify-center"
              style={{ x: fgX, y: fgY, willChange: 'transform' }}
            >
              {/* Glow behind poster */}
              <div
                className="absolute w-72 h-72 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                }}
              />

              {/* Stat cards floating around poster */}
              <div className="absolute -top-6 -left-4 z-20">
                <StatCard
                  icon={Layers}
                  label="Programs"
                  value={stats.programs}
                  suffix="+"
                  color="bg-indigo-500/20 text-indigo-400"
                  delay={0.7}
                  floatClass="animate-float"
                />
              </div>

              <div className="absolute -bottom-4 -right-4 z-20">
                <StatCard
                  icon={Users}
                  label="Participants"
                  value={stats.participants}
                  suffix="+"
                  color="bg-cyan-500/20 text-cyan-400"
                  delay={0.85}
                  floatClass="animate-float-delay"
                />
              </div>

              <div className="absolute top-1/2 -right-8 z-20 hidden lg:block">
                <StatCard
                  icon={Award}
                  label="Results"
                  value={stats.results}
                  suffix=""
                  color="bg-emerald-500/20 text-emerald-400"
                  delay={1.0}
                  floatClass="animate-float-slow"
                />
              </div>

              {/* Main poster card — dynamic live data */}
              {(() => {
                const MEDAL = [
                  { pos: '🥇', color: 'text-amber-300' },
                  { pos: '🥈', color: 'text-slate-300' },
                  { pos: '🥉', color: 'text-orange-400' },
                ];
                const activeResult = allResults[posterIdx] || null;
                const winners = activeResult?.winners?.slice(0, 3) || [];

                // Static placeholder when no results are published yet
                const placeholderWinners = [
                  { pos: '🥇', name: 'First Place Winner', unit: 'Team Alpha', color: 'text-amber-300' },
                  { pos: '🥈', name: 'Second Place Winner', unit: 'Team Beta', color: 'text-slate-300' },
                  { pos: '🥉', name: 'Third Place Winner', unit: 'Team Gamma', color: 'text-orange-400' },
                ];

                const rows = winners.length
                  ? winners.map((w, i) => ({
                      pos: MEDAL[i]?.pos || '🎖️',
                      name: w.participant?.name || '—',
                      unit: w.participant?.unit?.name || '',
                      color: MEDAL[i]?.color || 'text-slate-300',
                    }))
                  : placeholderWinners;

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="animate-poster-float relative z-10"
                  >
                    <div
                      className="w-56 sm:w-64 md:w-72 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                      style={{
                        background: 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))',
                        boxShadow: '0 30px 80px -10px rgba(6,182,212,0.3), 0 0 0 1px rgba(255,255,255,0.07)',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      {/* Header band */}
                      <div className="px-5 py-4 border-b border-white/5" style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.12), rgba(99,102,241,0.12))' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-cyan-400 uppercase tracking-[0.2em] font-black">
                            {festivalName || 'Sahithyolsav'}
                          </span>
                          <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Official</span>
                        </div>
                        {/* Event name — cycles with fade */}
                        <motion.p
                          key={posterIdx}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="text-xs text-white font-bold mt-1 truncate"
                        >
                          {activeResult?.event?.name || 'Result Poster'}
                        </motion.p>
                        {activeResult?.event?.category?.name && (
                          <p className="text-[8px] text-cyan-400/70 font-semibold uppercase tracking-widest mt-0.5">
                            {activeResult.event.category.name}
                          </p>
                        )}
                      </div>

                      {/* Winner rows — fade in/out on cycle */}
                      <motion.div
                        key={`body-${posterIdx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="p-5 space-y-3.5"
                      >
                        {rows.map((w, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-base flex-shrink-0">{w.pos}</span>
                            <div className="min-w-0">
                              <p className={`text-[10px] font-bold truncate ${w.color}`}>{w.name}</p>
                              <p className="text-[8px] text-slate-500 font-semibold truncate">{w.unit}</p>
                            </div>
                          </div>
                        ))}
                      </motion.div>

                      {/* Footer */}
                      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                        <span
                          className="text-xs font-black"
                          style={{
                            background: 'linear-gradient(90deg, #22d3ee, #6366f1)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          Celebrate Creativity
                        </span>
                        <div className="flex items-center gap-1">
                          {allResults.length > 1 && allResults.map((_, i) => (
                            <div
                              key={i}
                              className={`rounded-full transition-all duration-300 ${
                                i === posterIdx
                                  ? 'w-3 h-1.5 bg-emerald-400'
                                  : 'w-1.5 h-1.5 bg-slate-700'
                              }`}
                            />
                          ))}
                          {allResults.length <= 1 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </motion.div>
          </div>
        </div>

        {/* ── Scroll Indicator ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="relative z-10 flex flex-col items-center pb-8 gap-1"
        >
          <span className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-bold">Scroll</span>
          <div className="w-6 h-9 rounded-full border border-white/15 flex items-start justify-center pt-2 animate-scroll-bounce">
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </div>
        </motion.div>

        {/* ── Bottom fade ── */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-[2]"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(2,6,23,1))' }}
        />
      </section>

      {/* ══════════════════════════════════════
          CONTENT SECTIONS (padded container)
          ══════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 py-16 relative z-10">

        {/* Announcements */}
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-pink-400 animate-bounce-slow" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Latest Announcements</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : announcements.length > 0 ? (
              announcements.map((ann, idx) => (
                <motion.div
                  key={ann._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.07 }}
                  className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(ann.createdAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 font-bold text-[8px] uppercase tracking-wide border border-pink-500/20">
                        {ann.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{ann.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{ann.content}</p>
                  </div>
                  <Link
                    to="/notices"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 self-end sm:self-center flex-shrink-0"
                  >
                    Read Notice <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6 bg-slate-900/40 rounded-2xl border border-white/5 text-slate-500 text-xs font-semibold">
                No bulletins posted at this time.
              </div>
            )}
          </div>
        </section>

        {/* Portal Navigation Cards */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 justify-center">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Quick Portal Explorer</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                >
                  <Link
                    to={feat.path}
                    className="glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col justify-between h-52 group text-left shadow-lg glow-indigo-hover block"
                  >
                    <div className={`p-3.5 rounded-xl ${feat.bg} border ${feat.border} ${feat.text} w-fit`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-md font-bold text-white group-hover:text-indigo-400 transition-colors">{feat.title}</h3>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{feat.desc}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Winner Poster CTA */}
        <section className="glass-card rounded-3xl border border-white/10 p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          {/* Aurora accent */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />

          <div className="space-y-4 max-w-lg z-10 text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Generate Your Poster!</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Winners can look up their event results and download a personalized digital certificate poster instantly.
            </p>
            <Link
              to="/posters"
              className="inline-flex px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold tracking-wide uppercase transition-all shadow-lg shadow-indigo-600/30 items-center gap-2"
            >
              <Award className="w-4 h-4" />
              Generate Poster Card
            </Link>
          </div>

          <motion.div
            className="relative w-48 h-48 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center p-2 z-10 shadow-2xl"
            animate={{ rotate: [2, 3, 2], y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Award className="w-16 h-16 text-indigo-400 animate-pulse-slow" />
            <span className="absolute bottom-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sahithyolsav</span>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Home;
