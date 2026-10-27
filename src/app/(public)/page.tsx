'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  UserCheck,
  Fingerprint,
  QrCode,
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
  { value: '< 0.4s', label: 'Tiempo de Check-in', desc: 'Validación instantánea en mostrador', icon: Zap },
  { value: '+85,000', label: 'Accesos Diarios', desc: 'Procesados en red de gimnasios', icon: Users },
  { value: '99.98%', label: 'Disponibilidad SaaS', desc: 'Garantía en la nube multi-tenant', icon: ShieldCheck },
  { value: '100%', label: 'Personalizable', desc: 'Tu marca, tus reglas, tus sedes', icon: Award },
];

const features = [
  {
    icon: UserCheck,
    title: 'Control de Asistencia Express',
    description:
      'Registro ultra-rápido en recepción mediante CI/DNI, teclado numérico o escaneo directo. Feedback visual inmediato de cuota al día o vencida.',
    tag: 'Operación Diaria',
    highlight: false,
  },
  {
    icon: Fingerprint,
    title: 'Biometría & Identificación',
    description:
      'Integración con lectores biométricos (huella y reconocimiento) para eliminar el fraude de préstamos de pases y agilizar el acceso.',
    tag: 'Seguridad',
    highlight: true,
  },
  {
    icon: QrCode,
    title: 'Acceso QR & Pase Móvil',
    description:
      'Genera códigos QR dinámicos para socios que pueden ser escaneados directamente desde la pantalla de su teléfono en torniquetes o recepción.',
    tag: 'Modernidad',
    highlight: false,
  },
  {
    icon: CreditCard,
    title: 'Gestión Inteligente de Membresías',
    description:
      'Planes por días, meses o paquetes de pases con límites de ingresos. Renovaciones automáticas, estados de pago y alertas de vencimiento.',
    tag: 'Finanzas',
    highlight: false,
  },
  {
    icon: Building2,
    title: 'Soporte Multi-Sucursal',
    description:
      'Gestiona múltiples sedes desde un solo panel maestro. Configura pases universales o exclusivos por sucursal con reportes consolidados.',
    tag: 'Escalabilidad',
    highlight: true,
  },
  {
    icon: BarChart3,
    title: 'Métricas & Ocupación en Vivo',
    description:
      'Monitorea el aforo en tiempo real, horas pico de entrenamiento, retención de socios y rendimiento financiero con gráficos claros.',
    tag: 'Analítica',
    highlight: false,
  },
];

const plans = [
  {
    id: 'starter',
    name: 'Sucursal Inicial',
    price: 30,
    period: '/mes',
    description: 'Perfecto para gimnasios individuales, boxes, estudios boutique o cualquier negocio que requiera controlar el ingreso de socios.',
    badge: null,
    highlight: false,
    features: [
      'Multimples sucursales incluidas',
      'Hasta 300 socios activos',
      'Control de asistencias por CI',
      'Gestión de membresías y pagos',
      'Panel de recepción optimizado',
      'Soporte técnico por WhatsApp',
    ],
    cta: 'Comenzar Prueba Gratis',
  },
  {
    id: 'pro',
    name: 'Crecimiento Pro',
    price: 79,
    period: '/mes',
    description: 'La opción predilecta para gimnasios con alto flujo y control estricto.',
    badge: 'MÁS POPULAR',
    highlight: true,
    features: [
      'Hasta 3 Sucursales interconectadas',
      'Socios ilimitados',
      'Módulo de Biometría & Códigos QR',
      'Validación de acceso en <0.4s',
      'Portal web de consulta para socios',
      'Reportes de ocupación y retención',
      'Soporte prioritario 24/7',
    ],
    cta: 'Probar Plan Pro Gratis',
  },
  {
    id: 'enterprise',
    name: 'Franquicias & Redes',
    price: null,
    period: '',
    description: 'Solución a medida para cadenas de gimnasios y complejos deportivos.',
    badge: 'EMPRESAS',
    highlight: false,
    features: [
      'Sucursales ilimitadas',
      'API abierta para torniquetes y hardware',
      'Base de datos dedicada / multi-región',
      'Personalización visual 100% marca blanca',
      'Capacitación y onboarding in-situ',
      'Acuerdo de nivel de servicio (SLA 99.9%)',
    ],
    cta: 'Contactar a Ventas',
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
        <section className="relative px-4 pt-12 pb-20 sm:px-6 lg:px-8 lg:pt-20 lg:pb-32">
          {/* Luces y glows decorativos de fondo con colores semánticos */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[750px] rounded-full bg-primary/15 blur-[120px] dark:bg-primary/20" />
            <div className="absolute top-96 -left-20 h-[350px] w-[350px] rounded-full bg-primary-light/10 blur-[100px]" />
            <div className="absolute top-80 -right-20 h-[400px] w-[400px] rounded-full bg-primary-dark/15 blur-[110px]" />
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center text-center">
              
              {/* Badge animado con glow suave */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="group relative mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface/80 px-4 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary hover:shadow-md hover:shadow-primary/10"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="flex items-center gap-1 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Nuevo SaaS Multi-sucursal</span>
                </span>
                <span className="hidden sm:inline text-muted">•</span>
                <span className="hidden sm:inline text-muted">Biometría y Control Instantáneo</span>
                <ChevronRight className="h-3 w-3 text-muted transition-transform group-hover:translate-x-0.5" />
              </motion.div>

              {/* Título principal con tipografía grande y gradiente animado */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl"
              >
                Controla tu gimnasio con{' '}
                <span className="bg-gradient-to-r from-primary via-primary-light to-primary-dark bg-clip-text text-transparent">
                  máxima velocidad
                </span>{' '}
                y cero fricción.
              </motion.h1>

              {/* Subtítulo descriptivo */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted"
              >
                La plataforma moderna diseñada para recepción y administración: check-in en menos de 0.4s, control biométrico, suscripciones dinámicas y soporte multi-sede en la nube.
              </motion.p>

              {/* Botones de Acción (CTA) con microinteracciones */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto"
                >
                  <Link
                    href="/dashboard"
                    className="relative flex items-center justify-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40 focus:ring-4 focus:ring-primary/20"
                  >
                    <Zap className="h-4 w-4 fill-current" />
                    <span>Probar Demo en Vivo</span>
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
                    className="flex items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface px-8 py-4 text-sm font-bold text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5 focus:ring-4 focus:ring-primary/20"
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
                        gym-demo.app/dashboard/recepcion
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Sucursal Centro • En Línea
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
                          Registro de ingresos con verificación en tiempo real de membresías.
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
                          <span className="text-primary font-semibold">⚡ 0.3s prom</span>
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
                    <p className="text-[11px] leading-tight">Biometría Verificada</p>
                    <p className="text-[9px] text-primary font-bold">100% Sin Préstamo de Pases</p>
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
                    <p className="text-[11px] leading-tight">Métricas en Vivo</p>
                    <p className="text-[9px] text-muted">Multi-sede Sincronizada</p>
                  </div>
                </motion.div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── 2. METRICS & STATS BANNER ────────────────────────────────────── */}
        <section className="border-y border-surface-border bg-surface/50 py-12 backdrop-blur-sm">
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
                    <span className="text-3xl sm:text-4xl font-black text-foreground">
                      {item.value}
                    </span>
                    <span className="mt-1 text-sm font-bold text-primary">
                      {item.label}
                    </span>
                    <span className="mt-0.5 text-xs text-muted">
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
                  Experiencia de Recepción
                </span>
                <h2 className="text-3xl font-extrabold sm:text-4xl text-foreground">
                  Validación instantánea en 3 simples pasos
                </h2>
                <p className="text-muted leading-relaxed">
                  Evita cuellos de botella en horarios pico. El recepcionista solo ingresa el DNI/CI o el socio coloca su dedo en el lector:
                </p>

                <div className="space-y-4">
                  {[
                    { title: '1. Búsqueda o Escaneo', desc: 'Identificación por CI, lector de código de barras o sensor biométrico.' },
                    { title: '2. Verificación de Regla de Negocio', desc: 'Comprueba al instante si la fecha actual es menor o igual a fecha_fin de su suscripción.' },
                    { title: '3. Registro Automático de Asistencia', desc: 'Guarda la hora exacta, sucursal y método de ingreso para métricas y aforo.' },
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
                    <span>Ver cómo funciona en el panel</span>
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
                Inversión Transparente
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Planes claros que escalan con tu gimnasio
              </h2>
              <p className="mt-4 text-base sm:text-lg text-muted">
                Sin comisiones ocultas por socio. Elige el plan adecuado según la cantidad de sedes y funciones que requieras.
              </p>
            </div>

            {/* Grid de 3 planes con distintivo de más popular */}
            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -6 }}
                  className={`relative flex flex-col justify-between rounded-3xl p-8 transition-all duration-300 ${
                    plan.highlight
                      ? 'border-2 border-primary bg-surface shadow-2xl ring-4 ring-primary/10'
                      : 'border border-surface-border bg-surface/60 hover:border-primary/40 hover:shadow-xl'
                  }`}
                >
                  {/* Badge para el plan más popular */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md shadow-primary/30">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Header del Plan */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted min-h-[36px]">
                      {plan.description}
                    </p>

                    {/* Precio */}
                    <div className="mt-6 flex items-baseline gap-1">
                      {plan.price !== null ? (
                        <>
                          <span className="text-4xl sm:text-5xl font-black text-foreground">
                            ${plan.price}
                          </span>
                          <span className="text-sm font-semibold text-muted">
                            {plan.period}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-black text-foreground">
                          A Medida
                        </span>
                      )}
                    </div>

                    {/* Lista de Features */}
                    <div className="mt-8 space-y-3.5 border-t border-surface-border pt-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Incluye:
                      </p>
                      <ul className="space-y-2.5">
                        {plan.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5 text-xs text-muted">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                            <span className="text-foreground/90">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Botón de acción con efecto de presión (whileTap) */}
                  <div className="mt-8 pt-6 border-t border-surface-border">
                    <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}>
                      <Link
                        href={plan.price === null ? '#contact' : '/login'}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold transition-all duration-200 ${
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
              Únete a los cientos de centros deportivos que ya optimizaron sus accesos, cobranzas y administración diaria con GymDemo.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/40"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  <span>Ingresar al Panel de Recepción</span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a
                  href="mailto:hola@gym-demo.com"
                  className="flex items-center gap-2 rounded-xl border border-surface-border bg-background px-8 py-4 text-sm font-bold text-foreground transition-all hover:border-primary hover:text-primary hover:bg-primary/5"
                >
                  <span>Hablar con un Asesor</span>
                </a>
              </motion.div>
            </div>

            <p className="mt-6 text-xs text-muted">
              Sin tarjeta de crédito requerida • Configuración en menos de 10 minutos
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
