'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { supabase } from '@/lib/supabase';
import { ensureDatabaseSeeded } from '@/lib/seed';

export default function LoginPage() {
  const router = useRouter();

  // Campos de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de carga y feedback
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Ejecutar el seed transparente en el primer arranque y verificar si ya hay sesión
  useEffect(() => {
    async function init() {
      // Disparar seed de forma transparente
      ensureDatabaseSeeded().catch((err) =>
        console.warn('[Seed] Aviso en login:', err)
      );

      // Si ya hay sesión activa, redirigir directo al dashboard
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/dashboard');
      }
    }
    init();
  }, [router]);

  // Manejar Login con Google OAuth
  async function handleGoogleLogin() {
    setError(null);
    setOauthLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[OAuth Google] Error:', err);
      setError(e?.message || 'Error al conectar con Google OAuth.');
      setOauthLoading(false);
    }
  }

  // Manejar Inicio de Sesión por correo/contraseña
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Autenticar con Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('No se pudo obtener la sesión del usuario.');
      }

      // 2. Verificar que el usuario existe en usuarios_sistema y está activo
      const { data: profile, error: profileError } = await supabase
        .from('usuarios_sistema')
        .select('id, estado, rol')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[Login] Error consultando usuarios_sistema:', profileError);
      }

      if (!profile || String(profile.estado).toLowerCase() !== 'activo') {
        // Destruir sesión inmediatamente — cuenta no autorizada
        await supabase.auth.signOut();
        setError('Cuenta no autorizada o inactiva. Contacte al administrador.');
        return;
      }

      // 3. Acceso autorizado — redirigir al dashboard
      router.replace('/dashboard');
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[Auth Error]:', err);
      let userMsg = e?.message || 'Ocurrió un error al procesar la solicitud.';
      if (userMsg.includes('Invalid login credentials')) {
        userMsg = 'Credenciales inválidas. Verifica tu correo y contraseña.';
      } else if (userMsg.includes('rate limit')) {
        userMsg = 'Demasiados intentos. Por favor espera un momento.';
      }
      setError(userMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 text-foreground selection:bg-primary selection:text-white">
      {/* Botón flotante de ThemeToggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Fondos decorativos con colores semánticos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-primary-light/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Cabecera / Marca */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/25">
              <Dumbbell className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-foreground">
              Gym<span className="text-primary">Demo</span>
            </span>
          </Link>
          <h1 className="mt-3 text-xl font-bold text-foreground">Bienvenido de vuelta</h1>
          <p className="mt-1 text-xs text-muted">Accede al panel de recepción o administración</p>
        </div>

        {/* Card Principal */}
        <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface/90 p-7 shadow-xl backdrop-blur-xl sm:p-8">
          {/* Banner de Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón de Login con Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={oauthLoading || loading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-surface-border bg-background py-3 px-4 text-xs font-bold text-foreground shadow-sm transition-all hover:border-primary hover:bg-primary/5 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* Ícono estilizado de Google en SVG con clases semánticas */}
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                className="text-blue-500"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                className="text-primary"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                className="text-amber-500"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                className="text-red-500"
              />
            </svg>
            <span>
              {oauthLoading ? 'Conectando con Google...' : 'Continuar con Google'}
            </span>
          </button>

          {/* Separador "O con tu correo" */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-surface-border" />
            <span className="absolute bg-surface px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              o con correo
            </span>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-[11px] font-bold uppercase tracking-wider text-muted"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gymdemo.com"
                  className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground outline-none transition-all placeholder:text-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-[11px] font-bold uppercase tracking-wider text-muted"
                >
                  Contraseña
                </label>
                <span className="text-[10px] text-muted">Mínimo 6 caracteres</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground outline-none transition-all placeholder:text-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Botón Submit */}
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || oauthLoading}
                className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verificando...
                  </span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Seguridad y Privacidad */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Autenticación cifrada vía Supabase Auth</span>
          </div>

          {/* Credenciales Demo */}
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-primary">
              🚀 Iniciar Demo como Super Administrador
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-background/80 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted" />
                  <span className="text-xs text-foreground font-mono">admin@gmail.com</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background/80 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted" />
                  <span className="text-xs text-foreground font-mono">admin123</span>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => { setEmail('admin@gmail.com'); setPassword('admin123'); }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Insertar credenciales
            </motion.button>
          </div>
        </div>

        {/* Volver a la Landing Page */}
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="transition-colors hover:text-primary">
            ← Volver a la página principal
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
