'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  UserCheck,
  Fingerprint,
  CreditCard,
  Building2,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Check,
  Search,
  Users,
  Activity,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';

import PublicNavbar from '@/components/public/Navbar';
import PublicFooter from '@/components/public/Footer';

// ── Datos de Métricas y Características ───────────────────────────────────────

const stats = [
  { value: '1', label: 'Sistema centralizado', desc: 'Toda la operación de tu gimnasio', icon: Activity },
  { value: '0', label: 'Carnets prestados', desc: 'El rostro identifica al socio', icon: Fingerprint },
  { value: '24/7', label: 'Control y respaldo', desc: 'Información disponible cuando la necesitas', icon: ShieldCheck },
  { value: '100%', label: 'Más control', desc: 'Cobros, accesos y sucursales en orden', icon: Award },
];

const features = [
  {
    icon: UserCheck,
    title: 'Control de ingresos',
    description:
      'Registra cada ingreso y consulta al instante si la membresía está vigente. Menos filas y menos trabajo manual en recepción.',
    tag: 'Operación diaria',
    highlight: false,
  },
  {
    icon: Fingerprint,
    title: 'Reconocimiento facial',
    description:
      'La membresía es el rostro del socio. Evita carnets prestados y deja entrar solo a quien tiene su mensualidad al día.',
    tag: 'Seguridad',
    highlight: true,
  },
  {
    icon: CreditCard,
    title: 'Cobros y vencimientos',
    description:
      'Controla mensualidades, vencimientos y caja diaria para que ningún socio siga entrando sin pagar.',
    tag: 'Más ingresos',
    highlight: false,
  },
  {
    icon: BarChart3,
    title: 'Reportes claros',
    description:
      'Conoce tus ingresos, socios activos e intentos de acceso no autorizados sin depender del cuaderno o de Excel.',
    tag: 'Información',
    highlight: false,
  },
  {
    icon: Building2,
    title: 'Control de sucursales',
    description:
      'Cada sede deja de trabajar a ciegas. Administra sucursales y revisa la información desde un solo lugar.',
    tag: 'Multi-sucursal',
    highlight: true,
  },
  {
    icon: Users,
    title: 'Socios y membresías',
    description:
      'Ficha completa de cada socio, membresías a medida, promociones y seguimiento de su historial de ingresos.',
    tag: 'Gestión diaria',
    highlight: false,
  },
];

const plans = [
  {
    id: 'basico',
    name: 'Básico',
    price: 11,
    currency: 'USD',
    period: '/mes',
    branches: '1 Sucursal',
    description: 'Diga adiós al cuaderno y al Excel.',
    badge: null,
    highlight: false,
    inherits: null,
    features: [
      'Ficha completa de cada socio, con foto',
      'Control de asistencia en recepción',
      'Cobros, vencimientos y caja diaria al centavo',
      'Membresías y promociones a su medida',
      '2 usuarios: admin y recepción',
      'Reportes de ingresos y socios activos',
    ],
    cta: 'Consultar por WhatsApp',
  },
  {
    id: 'gym-digital',
    name: 'Gym Digital',
    price: 16,
    currency: 'USD',
    period: '/mes',
    branches: 'Hasta 3 Sucursales',
    description: 'Crezca con orden: más sedes, más control.',
    badge: 'MÁS ELEGIDO',
    highlight: true,
    inherits: 'Todo lo de Básico, más:',
    features: [
      'Reconocimiento facial: entra solo quien pagó',
      'Hasta 3 sucursales desde un solo sistema',
      'Roles y permisos para su equipo',
      'Historial de ingresos de cada socio',
      'Landing propia para captar socios',
    ],
    cta: 'Consultar por WhatsApp',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    currency: 'USD',
    period: '/mes',
    branches: 'Hasta 10 Sucursales',
    description: 'El favorito de los gimnasios que crecen.',
    badge: null,
    highlight: false,
    inherits: 'Todo lo de Gym Digital, más:',
    features: [
      'Hasta 10 sucursales',
      'Permisos personalizados por sucursal',
      'Reportes por sede y consolidados',
      'Instructores, clases y horarios',
      'Venta de productos e inventario',
      'Alerta de intentos de ingreso no autorizados',
    ],
    cta: 'Consultar por WhatsApp',
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 28,
    currency: 'USD',
    period: '/mes',
    branches: 'Sucursales Ilimitadas',
    description: 'Su gimnasio atendido y vendiendo 24/7.',
    badge: 'MÁXIMO CONTROL',
    highlight: false,
    inherits: 'Todo lo de Pro, más:',
    features: [
      'Sucursales ilimitadas',
      'Agente de IA que atiende y vende membresías 24/7',
      'En su web o en su WhatsApp Business',
      'Avisos de vencimiento por WhatsApp a sus socios',
      'Panel central de todas sus sedes',
      'Soporte prioritario',
    ],
    cta: 'Consultar por WhatsApp',
  },
];

// ── Componente Principal de Landing Page ──────────────────────────────────────

export default function LandingPage() {
  // Estado para la simulación interactiva de check-in
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulatedMember, setSimulatedMember] = useState({
    name: 'Camila Rodriguez',
    ci: '4.912.830',
    plan: 'Pase Libre Musculación',
    validUntil: '24 Oct 2026',
    status: 'Activo',
    time: 'Ahora',
  });

  const runSimulation = () => {
    setSimulationActive(true);
    setTimeout(() => {
      setSimulatedMember({
        name: 'Carlos Mendoza',
        ci: '3.421.905',
        plan: 'CrossFit + Gimnasio Full',
        validUntil: '15 Nov 2026',
        status: 'Acceso Concedido',
        time: 'Hace un momento',
      });
      setSimulationActive(false);
    }, 1200);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      <PublicNavbar />

      <main className="flex-1 overflow-hidden">
        {/* ── 1. HERO SECTION ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-ink px-4 pb-20 pt-10 text-white sm:px-6 lg:px-8 lg:pb-28 lg:pt-16">
          {/* Luces y glows decorativos de fondo con colores semánticos */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-32 -top-32 h-[620px] w-[620px] rounded-full bg-primary/20 blur-[130px]" />
            <div className="absolute bottom-0 left-1/3 h-px w-1/2 bg-primary/50 shadow-[0_0_60px_20px] shadow-primary/20" />
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="flex flex-col items-start">
              
              {/* Badge animado con glow suave */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="group relative mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-white/80 shadow-sm backdrop-blur-md transition-all hover:border-primary hover:bg-white/10"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="flex items-center gap-1 text-primary-light">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Propuesta comercial para gimnasios</span>
                </span>
                <span className="hidden text-white/30 sm:inline">•</span>
                <span className="hidden text-white/50 sm:inline">Reconocimiento facial y control de cobros</span>
                <ChevronRight className="h-3 w-3 text-white/50 transition-transform group-hover:translate-x-0.5" />
              </motion.div>

              {/* Título principal con tipografía grande y gradiente animado */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="max-w-5xl text-left text-5xl font-black leading-[0.95] tracking-[-0.05em] sm:text-7xl lg:text-[8.5rem]"
              >
                Cobra cada mensualidad.
                <span className="block font-editorial font-normal italic tracking-[-0.06em] text-primary-light">
                  Controla cada sucursal.
                </span>
              </motion.h1>

              {/* Subtítulo descriptivo */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 max-w-xl text-left text-base leading-relaxed text-ink-muted sm:text-lg"
              >
                El sistema de gestión para gimnasios que convierte cada ingreso en información, cada vencimiento en un cobro y cada sucursal en una operación controlada.
              </motion.p>

              {/* Botones de Acción (CTA) con microinteracciones */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex w-full flex-col items-start gap-4 sm:w-auto sm:flex-row sm:items-center"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href="/dashboard"
                    className="relative flex items-center justify-center gap-2.5 rounded-full bg-primary px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-primary-light hover:shadow-xl hover:shadow-primary/40 focus:ring-4 focus:ring-primary/20"
                  >
                    <Zap className="h-4 w-4 fill-current" />
                    <span>Ver cómo funciona</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-8 py-4 text-sm font-bold text-white shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary hover:text-primary-light hover:bg-white/10 focus:ring-4 focus:ring-primary/20"
                  >
                    <span>Iniciar Sesión</span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Floating Dashboard Mockup */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative mt-16 w-full max-w-5xl"
              >
                {/* Glow envolvente del mockup */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/30 via-primary-light/20 to-primary-dark/30 opacity-70 blur-xl dark:opacity-50" />

                {/* Tarjeta flotante con animación continua en eje Y */}
                <motion.div
                  animate={{ y: [-6, 6, -6] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface/90 shadow-2xl backdrop-blur-xl"
                >
                  {/* Mockup Topbar */}
                  <div className="flex items-center justify-between border-b border-surface-border bg-surface/80 px-5 py-3.5 text-xs text-muted">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-400/80" />
                        <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                        <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                      </div>
                      <span className="ml-3 hidden sm:inline font-mono text-[11px] text-muted">
                        softkany.vercel.app/dashboard/recepcion
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Sucursal Centro • Control activo
                      </span>
                    </div>
                  </div>

                  {/* Mockup Dashboard Content */}
                  <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                    {/* Header bar within mockup */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          Control de Acceso & Recepción
                        </h3>
                        <p className="text-xs text-muted">
                          Registro de ingresos y verificación de membresías en tiempo real.
                        </p>
                      </div>

                      {/* Mockup search & scan trigger */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                          <input
                            type="text"
                            readOnly
                            value="4.912.830"
                            className="w-full rounded-lg border border-surface-border bg-background py-1.5 pl-9 pr-3 text-xs text-foreground"
                          />
                        </div>
                        <button
                          onClick={runSimulation}
                          disabled={simulationActive}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-dark transition-colors"
                        >
                          <Fingerprint className="h-3.5 w-3.5" />
                          <span>{simulationActive ? 'Validando...' : 'Escanear'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Member verification card */}
                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Member profile card */}
                      <div className="md:col-span-2 rounded-xl border border-primary/20 bg-background/60 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-base font-bold text-white shadow-md shadow-primary/20">
                              {simulatedMember.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-foreground text-sm sm:text-base">
                                  {simulatedMember.name}
                                </h4>
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                  CI: {simulatedMember.ci}
                                </span>
                              </div>
                              <p className="text-xs text-muted mt-0.5">
                                Plan: <span className="font-semibold text-foreground">{simulatedMember.plan}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {simulatedMember.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-surface-border pt-3 text-center text-xs">
                          <div>
                            <span className="text-muted text-[10px]">Vence</span>
                            <p className="font-semibold text-foreground">{simulatedMember.validUntil}</p>
                          </div>
                          <div>
                            <span className="text-muted text-[10px]">Ingresos Mes</span>
                            <p className="font-semibold text-primary">18 asistencias</p>
                          </div>
                          <div>
                            <span className="text-muted text-[10px]">Último Registro</span>
                            <p className="font-semibold text-foreground">{simulatedMember.time}</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick metrics column */}
                      <div className="flex flex-col justify-between gap-3 rounded-xl border border-surface-border bg-background/60 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted">Aforo Actual</span>
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                            64%
                          </span>
                        </div>
                        <div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-extrabold text-foreground">148</span>
                            <span className="text-xs text-muted">/ 220 máx</span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-border">
                            <div className="h-full rounded-full bg-primary w-[64%]" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted border-t border-surface-border/50 pt-2">
                          <span>Ingresos hoy: <strong className="text-foreground">312</strong></span>
                          <span className="text-primary font-semibold">✓ Sin carnets prestados</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating mini pills around mockup */}
                <motion.div
                  animate={{ y: [4, -6, 4] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="hidden md:flex absolute -bottom-5 -left-5 items-center gap-2 rounded-xl border border-surface-border bg-surface/90 px-4 py-2.5 text-xs font-semibold text-foreground shadow-xl backdrop-blur-md"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] leading-tight">Rostro verificado</p>
                    <p className="text-[9px] text-primary font-bold">Entra quien está al día</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [-4, 6, -4] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="hidden md:flex absolute -top-5 -right-5 items-center gap-2 rounded-xl border border-surface-border bg-surface/90 px-4 py-2.5 text-xs font-semibold text-foreground shadow-xl backdrop-blur-md"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] leading-tight">Más control por sede</p>
                    <p className="text-[9px] text-muted">Toda la información en un lugar</p>
                  </div>
                </motion.div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── 2. METRICS & STATS BANNER ────────────────────────────────────── */}
        <section className="border-y border-white/10 bg-ink-soft py-12 text-white backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex flex-col items-center text-center sm:items-start sm:text-left"
                  >
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="text-3xl font-black text-white sm:text-4xl">
                      {item.value}
                    </span>
                    <span className="mt-1 text-sm font-bold text-primary">
                      {item.label}
                    </span>
                    <span className="mt-0.5 text-xs text-ink-muted">
                      {item.desc}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3. FEATURES GRID CON HOVER 3D Y ANIMACIÓN SCROLL ──────────────── */}
        <section id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            
            {/* Header de la sección */}
            <div className="mx-auto max-w-3xl text-center">
              <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Capacidades Principales
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Diseñado para la velocidad en el mostrador
              </h2>
              <p className="mt-4 text-base sm:text-lg text-muted">
                Herramientas intuitivas que eliminan las colas en la entrada, automatizan los cobros y te dan visibilidad total del rendimiento de tu negocio.
              </p>
            </div>

            {/* Grid interactiva de 6 tarjetas */}
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    whileHover={{ y: -6, scale: 1.015 }}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 sm:p-8 transition-all duration-300 ${
                      feature.highlight
                        ? 'border-primary/40 bg-surface shadow-md shadow-primary/5 dark:bg-surface/80'
                        : 'border-surface-border bg-surface/50 hover:border-primary/30 hover:bg-surface hover:shadow-lg'
                    }`}
                  >
                    {/* Glow suave en esquina al hacer hover */}
                    <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

                    <div>
                      {/* Top tag & icon */}
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white shadow-sm">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="rounded-full border border-surface-border bg-background px-2.5 py-0.5 text-[10px] font-semibold text-muted">
                          {feature.tag}
                        </span>
                      </div>

                      {/* Título & Descripción */}
                      <h3 className="mt-6 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="mt-2.5 text-sm leading-relaxed text-muted">
                        {feature.description}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span>Explorar módulo</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 4. SECCIÓN INTERACTIVA DE FLUJO DE RECEPCIÓN ────────────────── */}
        <section id="live-demo" className="border-t border-surface-border bg-surface/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              
              {/* Columna Izquierda: Información */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  El problema que resolvemos
                </span>
                <h2 className="text-3xl font-extrabold sm:text-4xl text-foreground">
                  Deje de perder dinero en la puerta
                </h2>
                <p className="text-muted leading-relaxed">
                  SoftKany ordena el ingreso, los cobros y la información de tu gimnasio para que cada mensualidad cuente:
                </p>

                <div className="space-y-4">
                  {[
                    { title: 'Carnets prestados', desc: 'El reconocimiento facial confirma que entra el socio correcto.' },
                    { title: 'Vencidos que igual entran', desc: 'El acceso se valida contra el estado real de la mensualidad.' },
                    { title: 'Sucursales a ciegas', desc: 'Consulta ingresos, socios activos y operación de cada sede.' },
                    { title: 'Recepción con todo', desc: 'Cobros, vencimientos y caja diaria en un solo sistema.' },
                  ].map((step, idx) => (
                    <div key={step.title} className="flex gap-4">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                        <p className="text-xs text-muted mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                  >
                    <span>Ver el control en acción</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>

              {/* Columna Derecha: Tarjeta de demostración interactiva */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-surface-border pb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">Simulador de Acceso</span>
                  </div>
                  <span className="text-xs text-muted">Entorno de prueba</span>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-surface-border bg-background p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted">Socio Consultado</p>
                      <p className="font-bold text-foreground text-sm">Alejandro Silva</p>
                      <p className="text-xs text-muted">CI: 5.120.400</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                        <Check className="h-3 w-3" /> Membresía Activa
                      </span>
                      <p className="mt-1 text-[11px] text-muted">Vence en 14 días</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-surface-border bg-background/50 p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">Sucursal:</span>
                      <span className="font-medium text-foreground">Sede Principal - Norte</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Torniquete / Puerta:</span>
                      <span className="font-medium text-primary">Entrada 01 (Desbloqueada)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Tiempo de validación:</span>
                      <span className="font-mono font-bold text-foreground">0.28 segundos</span>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="block w-full rounded-xl bg-primary py-3 text-center text-xs font-bold text-white shadow-md transition-all hover:bg-primary-dark"
                  >
                    Abrir Panel de Control Real →
                  </Link>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── 5. PLANES & PRECIOS ────────────────────────────────────────── */}
        <section id="plans" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            
            <div className="mx-auto max-w-3xl text-center">
              <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Elija Su Plan
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Elija el plan que necesita
              </h2>
              <p className="mt-4 text-base sm:text-lg text-muted">
                El socio entra con su rostro, no con un carnet prestado. Más cobros, más control y cero fugas. Precios en USD por mes · cada plan incluye todo lo del anterior.
              </p>
            </div>

            {/* Grid de 4 planes con distintivo de más elegido */}
            <div className="mt-16 grid gap-6 lg:grid-cols-4 md:grid-cols-2">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -6 }}
                  className={`relative flex flex-col justify-between rounded-3xl p-6 lg:p-7 transition-all duration-300 ${
                    plan.highlight
                      ? 'border-2 border-primary bg-surface shadow-2xl ring-4 ring-primary/10'
                      : 'border border-surface-border bg-surface/60 hover:border-primary/40 hover:shadow-xl'
                  }`}
                >
                  {/* Badge para el plan destacado */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md shadow-primary/30 whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Header del Plan */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted min-h-[32px]">
                      {plan.description}
                    </p>

                    {/* Sucursales */}
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        {plan.branches}
                      </span>
                    </div>

                    {/* Precio */}
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-foreground">
                        ${plan.price}
                      </span>
                      <span className="text-xs font-semibold text-muted">
                        {plan.currency}{plan.period}
                      </span>
                    </div>

                    {/* Lista de Features */}
                    <div className="mt-6 space-y-3 border-t border-surface-border pt-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                        {plan.inherits ? plan.inherits : 'Incluye:'}
                      </p>
                      <ul className="space-y-2">
                        {plan.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2 text-xs text-muted">
                            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary mt-0.5" />
                            <span className="text-foreground/90">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Botón de acción */}
                  <div className="mt-6 pt-5 border-t border-surface-border">
                    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}>
                      <Link
                        href="https://wa.me/59169618847?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20SoftKany%20para%20mi%20gimnasio"
                        target="_blank"
                        rel="noreferrer"
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all duration-200 ${
                          plan.highlight
                            ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/35'
                            : 'border border-surface-border bg-background text-foreground hover:border-primary hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        <span>{plan.cta}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </section>

        {/* ── 6. SECCIÓN DE CONTACTO & CTA FINAL ───────────────────────────── */}
        <section id="contact" className="relative overflow-hidden bg-surface py-20 sm:py-28 border-t border-surface-border">
          {/* Fondo sutil con glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[300px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              ¿Listo para empezar?
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
              Transforma la gestión de tu gimnasio hoy mismo
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted">
              Pida su demostración y empiece en Básico; puede subir de plan cuando su gimnasio crezca, sin perder sus datos.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="https://wa.me/59169618847?text=Hola%2C%20quiero%20solicitar%20una%20demostraci%C3%B3n%20de%20SoftKany"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  <span>Solicitar demostración</span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a
                  href="https://wa.me/59169618847?text=Hola%2C%20quiero%20una%20demostraci%C3%B3n%20de%20SoftKany"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-surface-border bg-background px-8 py-4 text-sm font-bold text-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5"
                >
                  <span>WhatsApp: 69618847</span>
                </a>
              </motion.div>
            </div>

            <p className="mt-6 text-xs text-muted">
              Presencial local en La Paz • Capacitación incluida • Soporte por WhatsApp
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
