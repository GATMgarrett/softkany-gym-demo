'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Scan,
  ShieldCheck,
  ShieldAlert,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Sparkles,
  Fingerprint,
  Camera,
  Calendar,
  Building,
  ArrowRight,
  Flame,
  Check,
  Layers,
  Radio,
  History,
  Activity,
  CreditCard,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Cliente, Membresia, Suscripcion, Asistencia } from '@/types/database';
import { FALLBACK_ORGANIZACION, FALLBACK_SUCURSAL } from '@/lib/seed';

// ── Tipos para el resultado de validación ─────────────────────────────────────
type ResultadoAcceso =
  | {
      tipo: 'PERMITIDO';
      cliente: Cliente;
      membresia: Membresia | null;
      suscripcion: Suscripcion | null;
      mensaje: string;
      horaMarcaje: string;
    }
  | {
      tipo: 'DENEGADO';
      cliente: Cliente | null;
      motivo: string;
      membresia?: Membresia | null;
      horaMarcaje: string;
    };

// Interfaz para filas en el historial
interface AsistenciaHistorialItem {
  id: string;
  fecha_hora: string;
  metodo_ingreso: string;
  estado_acceso: string;
  cliente_id: string;
  cliente?: {
    id: string;
    nombre: string;
    apellido: string;
    ci: string;
    foto_url: string | null;
  } | null;
}

export default function AsistenciasPage() {
  const { profile, activeSucursalId } = useAuth();
  const currentOrgId = profile?.organizacion_id || FALLBACK_ORGANIZACION.id;
  const currentSucursalId =
    activeSucursalId || profile?.sucursal_id || FALLBACK_SUCURSAL.id;

  // ── 1. Reloj en tiempo real (America/La_Paz) ──────────────────────────────
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatBoliviaDate = (date: Date) => {
    const formatted = new Intl.DateTimeFormat('es-BO', {
      timeZone: 'America/La_Paz',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const formatBoliviaTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-BO', {
      timeZone: 'America/La_Paz',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  };

  // ── 2. Estados de la Interfaz ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'ci' | 'biometria'>('ci');
  const [ciInput, setCiInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAcceso | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Historial reciente
  const [historial, setHistorial] = useState<AsistenciaHistorialItem[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [filterHistorial, setFilterHistorial] = useState<'todos' | 'permitido' | 'denegado'>('todos');

  // Input ref para auto-focus continuo
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'ci') {
      inputRef.current?.focus();
    }
  }, [activeTab, processing]);

  // Contador de reseteo automático para volver al estado listo para escanear
  useEffect(() => {
    if (!resultado) {
      setCountdown(null);
      return;
    }

    setCountdown(10);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setResultado(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resultado]);

  // ── 3. Cargar Historial Reciente de Hoy ────────────────────────────────────
  const fetchHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    try {
      // Consultar asistencias
      let query = supabase
        .from('asistencias')
        .select(`
          id,
          fecha_hora,
          metodo_ingreso,
          estado_acceso,
          cliente_id
        `)
        .order('fecha_hora', { ascending: false })
        .limit(25);

      if (currentOrgId) {
        query = query.eq('organizacion_id', currentOrgId);
      }

      const { data: asistData, error: asistError } = await query;

      if (asistError) {
        console.error('[Asistencias] Error al cargar historial:', asistError.message);
        setHistorial([]);
        setLoadingHistorial(false);
        return;
      }

      if (!asistData || asistData.length === 0) {
        setHistorial([]);
        setLoadingHistorial(false);
        return;
      }

      // Obtener los clientes correspondientes
      const clientIds = Array.from(new Set(asistData.map((a) => a.cliente_id).filter(Boolean)));
      let clientMap: Record<string, { id: string; nombre: string; apellido: string; ci: string; foto_url: string | null }> = {};

      if (clientIds.length > 0) {
        const { data: clientsData } = await supabase
          .from('clientes')
          .select('id, nombre, apellido, ci, foto_url')
          .in('id', clientIds);

        if (clientsData) {
          clientMap = clientsData.reduce((acc, c) => {
            acc[c.id] = c;
            return acc;
          }, {} as typeof clientMap);
        }
      }

      const enriched: AsistenciaHistorialItem[] = asistData.map((item) => ({
        id: item.id,
        fecha_hora: item.fecha_hora,
        metodo_ingreso: item.metodo_ingreso,
        estado_acceso: item.estado_acceso,
        cliente_id: item.cliente_id,
        cliente: clientMap[item.cliente_id] || null,
      }));

      setHistorial(enriched);
    } catch (err) {
      console.error('[Asistencias] Excepción al cargar historial:', err);
    } finally {
      setLoadingHistorial(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  // ── 4. Lógica Encadenada de Validación por CI ─────────────────────────────
  const procesarIngresoPorCI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCi = ciInput.trim();
    if (!cleanCi || processing) return;

    setProcessing(true);
    const ahora = new Date();
    const horaMarcajeActual = formatBoliviaTime(ahora);

    try {
      // ── PASO 1: Buscar cliente por CI y organizacion_id
      let clientQuery = supabase
        .from('clientes')
        .select('*')
        .eq('ci', cleanCi);

      if (currentOrgId) {
        clientQuery = clientQuery.eq('organizacion_id', currentOrgId);
      }

      const { data: clientesEncontrados, error: clientError } = await clientQuery;

      if (clientError) {
        console.error('[Asistencias] Error buscando cliente:', clientError.message);
      }

      const cliente = clientesEncontrados && clientesEncontrados.length > 0 ? clientesEncontrados[0] : null;

      if (!cliente) {
        // Alerta: Cliente no encontrado
        setResultado({
          tipo: 'DENEGADO',
          cliente: null,
          motivo: `No se encontró ningún socio registrado con el CI: "${cleanCi}". Verifica que el número sea correcto.`,
          horaMarcaje: horaMarcajeActual,
        });
        setCiInput('');
        setProcessing(false);
        inputRef.current?.focus();
        return;
      }

      // Validar si el cliente está inactivo
      if (String(cliente.estado).toLowerCase() !== 'activo') {
        // Registrar intento denegado
        await supabase.from('asistencias').insert({
          organizacion_id: currentOrgId,
          sucursal_id: currentSucursalId,
          cliente_id: cliente.id,
          fecha_hora: ahora.toISOString(),
          metodo_ingreso: 'CI_TECLADO',
          estado_acceso: 'DENEGADO',
        });

        setResultado({
          tipo: 'DENEGADO',
          cliente,
          motivo: 'El socio se encuentra con estado INACTIVO o suspendido en el sistema. Debe regularizar su estado.',
          horaMarcaje: horaMarcajeActual,
        });

        fetchHistorial();
        setCiInput('');
        setProcessing(false);
        inputRef.current?.focus();
        return;
      }

      // ── PASO 2: Buscar suscripción activa (fecha_fin >= hoy en America/La_Paz)
      const todayBolivia = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/La_Paz',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(ahora); // "YYYY-MM-DD"

      const { data: suscripciones, error: subError } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('fecha_fin', { ascending: false });

      if (subError) {
        console.error('[Asistencias] Error al consultar suscripciones:', subError.message);
      }

      // Buscar suscripción vigente
      const subVigente = suscripciones?.find((s) => s.fecha_fin >= todayBolivia);

      if (!subVigente) {
        // Sin membresía activa
        const subAnterior = suscripciones && suscripciones.length > 0 ? suscripciones[0] : null;
        const motivo = subAnterior
          ? `Membresía vencida el ${subAnterior.fecha_fin}. Es necesario renovar el plan para ingresar.`
          : 'El socio no cuenta con ninguna suscripción o membresía registrada.';

        await supabase.from('asistencias').insert({
          organizacion_id: currentOrgId,
          sucursal_id: currentSucursalId,
          cliente_id: cliente.id,
          fecha_hora: ahora.toISOString(),
          metodo_ingreso: 'CI_TECLADO',
          estado_acceso: 'DENEGADO',
        });

        setResultado({
          tipo: 'DENEGADO',
          cliente,
          motivo,
          horaMarcaje: horaMarcajeActual,
        });

        fetchHistorial();
        setCiInput('');
        setProcessing(false);
        inputRef.current?.focus();
        return;
      }

      // Obtener detalles de la membresía asociada
      let membresia: Membresia | null = null;
      if (subVigente.membresia_id) {
        const { data: membData } = await supabase
          .from('membresias')
          .select('*')
          .eq('id', subVigente.membresia_id)
          .maybeSingle();

        membresia = membData || null;
      }

      // ── PASO 3: Validación de Horario y Límites de Ingreso
      // A) Regla de horario
      if (membresia?.hora_inicio && membresia?.hora_fin) {
        const currentBoliviaTimeStr = new Intl.DateTimeFormat('es-BO', {
          timeZone: 'America/La_Paz',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(ahora);

        const horaIni = membresia.hora_inicio.slice(0, 5);
        const horaFin = membresia.hora_fin.slice(0, 5);

        if (currentBoliviaTimeStr < horaIni || currentBoliviaTimeStr > horaFin) {
          const motivo = `Fuera de horario permitido. El plan "${membresia.nombre}" autoriza ingresos únicamente de ${horaIni} a ${horaFin}. (Hora actual: ${currentBoliviaTimeStr})`;

          await supabase.from('asistencias').insert({
            organizacion_id: currentOrgId,
            sucursal_id: currentSucursalId,
            cliente_id: cliente.id,
            fecha_hora: ahora.toISOString(),
            metodo_ingreso: 'CI_TECLADO',
            estado_acceso: 'DENEGADO',
          });

          setResultado({
            tipo: 'DENEGADO',
            cliente,
            membresia,
            motivo,
            horaMarcaje: horaMarcajeActual,
          });

          fetchHistorial();
          setCiInput('');
          setProcessing(false);
          inputRef.current?.focus();
          return;
        }
      }

      // B) Regla de límite de ingresos / cupos restantes
      if (
        subVigente.ingresos_restantes !== null &&
        subVigente.ingresos_restantes !== undefined
      ) {
        if (subVigente.ingresos_restantes <= 0) {
          const motivo = `Sin pases disponibles. El plan "${membresia?.nombre || 'Actual'}" ha consumido la totalidad de sus cupos de ingreso.`;

          await supabase.from('asistencias').insert({
            organizacion_id: currentOrgId,
            sucursal_id: currentSucursalId,
            cliente_id: cliente.id,
            fecha_hora: ahora.toISOString(),
            metodo_ingreso: 'CI_TECLADO',
            estado_acceso: 'DENEGADO',
          });

          setResultado({
            tipo: 'DENEGADO',
            cliente,
            membresia,
            motivo,
            horaMarcaje: horaMarcajeActual,
          });

          fetchHistorial();
          setCiInput('');
          setProcessing(false);
          inputRef.current?.focus();
          return;
        }
      }

      // ── PASO 4: Registro de Asistencia Exitosa (PERMITIDO)
      const { error: insertError } = await supabase.from('asistencias').insert({
        organizacion_id: currentOrgId,
        sucursal_id: currentSucursalId,
        cliente_id: cliente.id,
        fecha_hora: ahora.toISOString(),
        metodo_ingreso: 'CI_TECLADO',
        estado_acceso: 'PERMITIDO',
      });

      if (insertError) {
        console.error('[Asistencias] Error insertando asistencia:', insertError.message);
      }

      // Descontar cupo si aplica
      let updatedSub = subVigente;
      if (
        subVigente.ingresos_restantes !== null &&
        subVigente.ingresos_restantes > 0
      ) {
        const nuevosIngresos = subVigente.ingresos_restantes - 1;
        await supabase
          .from('suscripciones')
          .update({ ingresos_restantes: nuevosIngresos })
          .eq('id', subVigente.id);

        updatedSub = {
          ...subVigente,
          ingresos_restantes: nuevosIngresos,
        };
      }

      // Resultado exitoso
      setResultado({
        tipo: 'PERMITIDO',
        cliente,
        membresia,
        suscripcion: updatedSub,
        mensaje: '¡Acceso autorizado! Bienvenido a la sesión de entrenamiento.',
        horaMarcaje: horaMarcajeActual,
      });

      fetchHistorial();
      setCiInput('');
    } catch (err) {
      console.error('[Asistencias] Error inesperado en validación:', err);
    } finally {
      setProcessing(false);
      inputRef.current?.focus();
    }
  };

  // Filtrado del historial
  const filteredHistorial = historial.filter((item) => {
    if (filterHistorial === 'todos') return true;
    const est = String(item.estado_acceso).toLowerCase();
    if (filterHistorial === 'permitido') return est === 'permitido';
    if (filterHistorial === 'denegado') return est === 'denegado';
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 space-y-6">
      {/* ── Breadcrumb y Título ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">
              Control de Asistencias & Recepción
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Terminal de Control & Asistencias
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Punto de marcaje rápido en recepción con validación automática de membresías.
              </p>
            </div>
          </div>
        </div>

        {/* Badges de estado operativo */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Recepción En Línea
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 shadow-sm">
            <Building className="h-3.5 w-3.5 text-primary" />
            <span>Sede Operativa</span>
          </div>
        </div>
      </div>

      {/* ── 1. Cabecera con Reloj Digital en Tiempo Real (America/La_Paz) ───── */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-6 text-white shadow-xl dark:border-zinc-800">
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row text-center md:text-left">
          {/* Reloj y Fecha */}
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-medium uppercase tracking-wider text-primary-light">
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              <span>Hora Estándar Bolivia (America/La_Paz)</span>
            </div>

            <div className="text-3xl sm:text-5xl font-black tracking-tight font-mono text-white drop-shadow-sm">
              {currentTime ? formatBoliviaTime(currentTime) : '--:--:-- --'}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2 text-xs sm:text-sm text-zinc-300">
              <Calendar className="h-4 w-4 text-primary" />
              <span>
                {currentTime ? formatBoliviaDate(currentTime) : 'Cargando calendario...'}
              </span>
            </div>
          </div>

          {/* Métricas rápidas de hoy */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/80 px-4 py-3 text-center backdrop-blur-sm shadow-sm">
              <div className="text-2xl font-extrabold text-white">
                {historial.filter((h) => String(h.estado_acceso).toLowerCase() === 'permitido').length}
              </div>
              <div className="text-[11px] font-medium text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Ingresos Hoy
              </div>
            </div>

            <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/80 px-4 py-3 text-center backdrop-blur-sm shadow-sm">
              <div className="text-2xl font-extrabold text-white">
                {historial.filter((h) => String(h.estado_acceso).toLowerCase() === 'denegado').length}
              </div>
              <div className="text-[11px] font-medium text-rose-400 flex items-center justify-center gap-1">
                <XCircle className="h-3 w-3" />
                Rechazos
              </div>
            </div>

            <button
              onClick={() => fetchHistorial()}
              disabled={loadingHistorial}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700/60 bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700/80 transition-colors"
              title="Actualizar registros"
            >
              <RefreshCw className={`h-5 w-5 ${loadingHistorial ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Switcher de Método de Marcaje ─────────────────────────────────── */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('ci')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === 'ci'
              ? 'border-primary text-primary dark:text-primary-light'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Scan className="h-4 w-4" />
          Ingreso por CI / Código de Barras
        </button>

        <button
          onClick={() => setActiveTab('biometria')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
            activeTab === 'biometria'
              ? 'border-primary text-primary dark:text-primary-light'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Fingerprint className="h-4 w-4" />
          Escanear Biometría / Rostro
          <span className="rounded-full bg-primary/10 dark:bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary dark:text-primary-light">
            Próximamente
          </span>
        </button>
      </div>

      {/* ── Contenido Principal de Recepción ──────────────────────────────── */}
      {activeTab === 'ci' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Input de Marcaje + Tarjeta de Feedback (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Formulario de Escaneo de CI */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <form onSubmit={procesarIngresoPorCI} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="ciInput"
                    className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2"
                  >
                    <Scan className="h-4 w-4 text-primary" />
                    Escanear o Ingresar CI del Socio
                  </label>
                  <span className="text-xs text-zinc-400">
                    Presiona <kbd className="rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px]">Enter</kbd>
                  </span>
                </div>

                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-4 text-zinc-400">
                    <User className="h-6 w-6" />
                  </div>

                  <input
                    ref={inputRef}
                    id="ciInput"
                    type="text"
                    autoFocus
                    disabled={processing}
                    value={ciInput}
                    onChange={(e) => setCiInput(e.target.value)}
                    placeholder="Ej: 8392102 o escanear código..."
                    className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 pl-14 pr-32 py-4 text-lg sm:text-xl font-bold tracking-wider text-zinc-900 transition-all placeholder:font-normal placeholder:text-zinc-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/15 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white dark:focus:border-primary dark:focus:bg-zinc-900"
                  />

                  <div className="absolute right-3 flex items-center gap-2">
                    {ciInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setCiInput('');
                          inputRef.current?.focus();
                        }}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 transition-colors"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={processing || !ciInput.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-light active:bg-primary-dark disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {processing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span>Validar</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Compatible con lectores de códigos de barra USB y tarjetas magnéticas.
                  </span>
                  {resultado && countdown !== null && (
                    <span className="font-mono text-zinc-400">
                      Limpiando en {countdown}s...
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* ── 4. Retroalimentación Visual (Feedback en Pantalla) ──────── */}
            <AnimatePresence mode="wait">
              {resultado ? (
                resultado.tipo === 'PERMITIDO' ? (
                  /* Tarjeta Verde Brillante: ACCESO PERMITIDO */
                  <motion.div
                    key="acceso-permitido"
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 p-6 shadow-xl dark:border-emerald-500/80 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-emerald-900/20"
                  >
                    <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                      {/* Cabecera de estado */}
                      <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800/60 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                            <CheckCircle2 className="h-7 w-7" />
                          </div>
                          <div>
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                              Validación Exitosa
                            </span>
                            <h2 className="text-2xl font-black text-emerald-950 dark:text-emerald-100 leading-tight">
                              ¡BIENVENIDO!
                            </h2>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                            {resultado.horaMarcaje}
                          </span>
                        </div>
                      </div>

                      {/* Datos del Socio */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        {/* Avatar / Foto */}
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-emerald-500/30 bg-zinc-100 shadow-md dark:bg-zinc-800">
                          {resultado.cliente.foto_url ? (
                            <Image
                              src={resultado.cliente.foto_url}
                              alt={resultado.cliente.nombre}
                              width={96}
                              height={96}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-emerald-500/10 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-black text-2xl">
                              {resultado.cliente.nombre.charAt(0)}
                              {resultado.cliente.apellido.charAt(0)}
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-1 text-white shadow">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        </div>

                        {/* Información del plan */}
                        <div className="space-y-1 text-center sm:text-left flex-1">
                          <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                            {resultado.cliente.nombre} {resultado.cliente.apellido}
                          </h3>
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            CI: <span className="font-mono text-zinc-700 dark:text-zinc-300">{resultado.cliente.ci}</span>
                          </p>

                          <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/25 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              <CreditCard className="h-3.5 w-3.5" />
                              {resultado.membresia?.nombre || 'Membresía Activa'}
                            </span>

                            {resultado.suscripcion?.fecha_fin && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                Vence: {resultado.suscripcion.fecha_fin}
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-bold text-primary">
                              {resultado.suscripcion?.ingresos_restantes !== null &&
                              resultado.suscripcion?.ingresos_restantes !== undefined ? (
                                <>
                                  <Activity className="h-3.5 w-3.5" />
                                  {resultado.suscripcion.ingresos_restantes} pases restantes
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Ingresos Ilimitados
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botón de limpiar / Listo */}
                      <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                          {resultado.mensaje}
                        </p>
                        <button
                          onClick={() => {
                            setResultado(null);
                            inputRef.current?.focus();
                          }}
                          className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-zinc-800 dark:text-emerald-300 dark:hover:bg-zinc-700 transition-colors"
                        >
                          Limpiar Pantalla
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Tarjeta Roja de Alerta: ACCESO DENEGADO */
                  <motion.div
                    key="acceso-denegado"
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="relative overflow-hidden rounded-2xl border-2 border-rose-500 bg-gradient-to-br from-rose-50 via-white to-rose-100/60 p-6 shadow-xl dark:border-rose-500/80 dark:from-rose-950/40 dark:via-zinc-900 dark:to-rose-900/20"
                  >
                    <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-rose-500/20 blur-2xl pointer-events-none" />

                    <div className="relative z-10 space-y-5">
                      {/* Cabecera de rechazo */}
                      <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800/60 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                            <ShieldAlert className="h-7 w-7" />
                          </div>
                          <div>
                            <span className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                              Acceso No Permitido
                            </span>
                            <h2 className="text-2xl font-black text-rose-950 dark:text-rose-100 leading-tight">
                              ACCESO DENEGADO
                            </h2>
                          </div>
                        </div>

                        <span className="rounded-full bg-rose-500/20 dark:bg-rose-500/30 px-3 py-1 text-xs font-bold text-rose-800 dark:text-rose-200">
                          {resultado.horaMarcaje}
                        </span>
                      </div>

                      {/* Motivo del rechazo */}
                      <div className="rounded-xl border border-rose-200 bg-rose-500/10 p-4 dark:border-rose-800/80 dark:bg-rose-950/40">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                              Motivo del Bloqueo:
                            </h4>
                            <p className="mt-1 text-xs sm:text-sm text-rose-800 dark:text-rose-300">
                              {resultado.motivo}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Datos del Socio si se identificó */}
                      {resultado.cliente && (
                        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200 font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                            {resultado.cliente.nombre.charAt(0)}
                            {resultado.cliente.apellido.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                              {resultado.cliente.nombre} {resultado.cliente.apellido}
                            </p>
                            <p className="text-xs text-zinc-500 font-mono">
                              CI: {resultado.cliente.ci}
                            </p>
                          </div>
                          <Link
                            href={`/dashboard/clientes?ci=${resultado.cliente.ci}`}
                            className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                          >
                            Ver Socio
                          </Link>
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex items-center justify-between pt-2 border-t border-rose-200/60 dark:border-rose-800/40">
                        <Link
                          href="/dashboard/membresias"
                          className="text-xs font-bold text-primary hover:underline"
                        >
                          → Revisar planes disponibles
                        </Link>

                        <button
                          onClick={() => {
                            setResultado(null);
                            inputRef.current?.focus();
                          }}
                          className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50 dark:border-rose-800 dark:bg-zinc-800 dark:text-rose-300 dark:hover:bg-zinc-700 transition-colors"
                        >
                          Cerrar Alerta
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              ) : (
                /* Estado en Espera (Idle) */
                <motion.div
                  key="estado-espera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30"
                >
                  <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary dark:bg-primary/20">
                    <Scan className="h-10 w-10 animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-primary"></span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                    Terminal Listo para Escaneo
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                    El sistema está esperando el número de CI o código del socio para validar en tiempo real el acceso al gimnasio.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-200/60 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      ⚡ Validación de Vigencia
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-200/60 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      🕒 Control de Horarios
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-200/60 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                      🎟️ Cupos de Pases
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Columna Derecha: Historial Reciente de Marcajes de Hoy (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {/* Encabezado del Historial */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Historial Reciente de Hoy
                  </h3>
                </div>
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  {historial.length} registros
                </span>
              </div>

              {/* Filtros rápidos */}
              <div className="mt-3 flex gap-1.5 border-b border-zinc-100 pb-3 dark:border-zinc-800 text-xs">
                {(['todos', 'permitido', 'denegado'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterHistorial(mode)}
                    className={`rounded-lg px-3 py-1 font-semibold capitalize transition-colors ${
                      filterHistorial === mode
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {mode === 'todos' ? 'Todos' : mode === 'permitido' ? 'Permitidos' : 'Denegados'}
                  </button>
                ))}
              </div>

              {/* Lista de Registros */}
              <div className="mt-3 max-h-[500px] overflow-y-auto space-y-2.5 pr-1">
                {loadingHistorial ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary mb-2" />
                    <p className="text-xs">Cargando marcajes...</p>
                  </div>
                ) : filteredHistorial.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <Scan className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">No hay marcajes registrados hoy con este filtro.</p>
                  </div>
                ) : (
                  filteredHistorial.map((item) => {
                    const isPermitido = String(item.estado_acceso).toLowerCase() === 'permitido';
                    const fechaObj = new Date(item.fecha_hora);
                    const horaFormateada = new Intl.DateTimeFormat('es-BO', {
                      timeZone: 'America/La_Paz',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                    }).format(fechaObj);

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                          isPermitido
                            ? 'border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10 hover:border-emerald-300'
                            : 'border-rose-200/70 bg-rose-50/30 dark:border-rose-900/30 dark:bg-rose-950/10 hover:border-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar / Icono */}
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                              isPermitido
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                            }`}
                          >
                            {item.cliente?.nombre ? (
                              item.cliente.foto_url ? (
                                <Image
                                  src={item.cliente.foto_url}
                                  alt={item.cliente.nombre}
                                  width={40}
                                  height={40}
                                  className="h-full w-full rounded-xl object-cover"
                                  unoptimized
                                />
                              ) : (
                                `${item.cliente.nombre.charAt(0)}${item.cliente.apellido.charAt(0)}`
                              )
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                              {item.cliente
                                ? `${item.cliente.nombre} ${item.cliente.apellido}`
                                : 'Socio No Identificado'}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                              <span className="font-mono">
                                CI: {item.cliente?.ci || 'Desconocido'}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{item.metodo_ingreso}</span>
                            </div>
                          </div>
                        </div>

                        {/* Estado y Hora */}
                        <div className="text-right shrink-0 pl-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isPermitido
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                            }`}
                          >
                            {isPermitido ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {item.estado_acceso}
                          </span>
                          <p className="mt-0.5 text-[10px] font-mono text-zinc-400">
                            {horaFormateada}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── 5. Preparación para Biometría / Reconocimiento Facial (UI Placeholder) */
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary/20 via-primary/10 to-primary/30 text-primary shadow-inner">
              <Camera className="h-12 w-12" />
              <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-primary animate-spin-slow pointer-events-none" />
              <span className="absolute -bottom-2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                Sensor Ready
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                Módulo Biométrico & Reconocimiento Facial
              </h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Este módulo está conectado a la tabla <code className="font-mono text-primary font-bold">cliente_biometria</code> para soportar lectores USB/Red de huella dactilar y cámaras con inteligencia artificial para detección facial sin contacto.
              </p>
            </div>

            {/* Simulación del visor de la cámara / target */}
            <div className="relative mx-auto h-64 max-w-md overflow-hidden rounded-2xl border-2 border-zinc-800 bg-zinc-950 p-4 shadow-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-primary-light font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  SENSOR_ONLINE
                </span>
                <span>FPS: 30.0</span>
              </div>

              {/* Marco de enfoque facial */}
              <div className="relative mx-auto h-32 w-32 rounded-xl border border-primary/60 flex items-center justify-center">
                <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-primary" />
                <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-primary" />
                <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-primary" />
                <Fingerprint className="h-10 w-10 text-primary/40 animate-pulse" />
              </div>

              <div className="text-center font-mono text-[11px] text-zinc-400">
                [ Posicione al socio frente a la lente o coloque huella en el lector ]
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('ci')}
                className="w-full sm:w-auto rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-primary-light transition-colors"
              >
                Volver a Marcaje por CI
              </button>

              <button
                onClick={() => {
                  alert('El controlador de hardware de biometría está preparado para conectar con dispositivos ZKTeco, DigitalPersona y Webcams WebRTC.');
                }}
                className="w-full sm:w-auto rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                Probar Diagnóstico de Hardware
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
