'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Banknote,
  ArrowRightLeft,
  UserCheck,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CalendarClock,
  AlertTriangle,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type {
  Cliente,
  Membresia,
  MetodoPago,
  Suscripcion,
  Sucursal,
} from '@/types/database';
import { FALLBACK_ORGANIZACION, FALLBACK_SUCURSAL } from '@/lib/seed';

interface ModalAsignarMembresiaProps {
  isOpen: boolean;
  onClose: () => void;
  clientePreseleccionado?: Cliente | null;
  onSuccess?: (suscripcion: Suscripcion, cliente?: Cliente) => void;
}

export interface SuscripcionConPlan {
  id: string;
  cliente_id: string;
  membresia_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  monto_pagado: number;
  metodo_pago: string;
  estado_pago: string;
  ingresos_restantes: number | null;
  membresias?: {
    id: string;
    nombre: string;
    duracion_dias: number;
    precio: number;
    limite_ingresos: number | null;
  } | null;
}

// Obtener fecha actual en zona horaria America/La_Paz (YYYY-MM-DD)
export function getTodayBolivia(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Calcular fecha de vencimiento sumando días a la fecha de inicio
export function computeEndDate(startDateStr: string, durationDays: number): string {
  if (!startDateStr || isNaN(durationDays) || durationDays <= 0) return startDateStr;
  const parts = startDateStr.split('-');
  if (parts.length !== 3) return startDateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  date.setDate(date.getDate() + durationDays);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Calcular el día consecutivo siguiente (fecha_fin + 1 día)
export function computeNextDay(dateStr: string): string {
  if (!dateStr) return getTodayBolivia();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return getTodayBolivia();
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const nextDate = new Date(y, m, d);
  nextDate.setDate(nextDate.getDate() + 1);

  const nextY = nextDate.getFullYear();
  const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
  const nextD = String(nextDate.getDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

// Calcular días restantes respecto a hoy en Bolivia
export function computeRemainingDays(endDateStr: string): number {
  if (!endDateStr) return 0;
  const todayStr = getTodayBolivia();
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);

  const today = new Date(ty, tm - 1, td);
  const end = new Date(ey, em - 1, ed);
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Formatear fecha legible
export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return new Intl.DateTimeFormat('es-BO', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Formato de moneda
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Formato de duración
export function formatDuration(dias: number): string {
  if (dias % 365 === 0) return `${dias / 365} año${dias / 365 > 1 ? 's' : ''}`;
  if (dias % 30 === 0) return `${dias / 30} mes${dias / 30 > 1 ? 'es' : ''}`;
  if (dias % 7 === 0) return `${dias / 7} semana${dias / 7 > 1 ? 's' : ''}`;
  return `${dias} día${dias !== 1 ? 's' : ''}`;
}

export default function ModalAsignarMembresia({
  isOpen,
  onClose,
  clientePreseleccionado = null,
  onSuccess,
}: ModalAsignarMembresiaProps) {
  const { profile, activeSucursalId } = useAuth();
  const currentOrgId = profile?.organizacion_id || FALLBACK_ORGANIZACION.id;
  const todayBolivia = useMemo(() => getTodayBolivia(), []);

  // Estado del socio seleccionado
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(clientePreseleccionado);

  // Buscador de socios (si no viene preseleccionado)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Historial de suscripciones del socio
  const [clientSubscriptions, setClientSubscriptions] = useState<SuscripcionConPlan[]>([]);
  const [loadingClientSubs, setLoadingClientSubs] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Planes disponibles
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(false);
  const [selectedMembresiaId, setSelectedMembresiaId] = useState<string>('');

  // Formulario de suscripción
  const [fechaInicio, setFechaInicio] = useState<string>(todayBolivia);
  const [montoCobrado, setMontoCobrado] = useState<number | string>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');

  // Estados de proceso y feedback
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Sucursal de destino
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);

  // Sincronizar cliente preseleccionado al abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedCliente(clientePreseleccionado || null);
      setSearchTerm('');
      setSearchResults([]);
      setShowDropdown(false);
      setFechaInicio(todayBolivia);
      setFeedback(null);
      setShowHistory(false);
    }
  }, [isOpen, clientePreseleccionado, todayBolivia]);

  // Cargar historial de suscripciones del cliente actual
  const loadClientSubscriptions = useCallback(async (clienteId: string) => {
    setLoadingClientSubs(true);
    try {
      const { data, error } = await supabase
        .from('suscripciones')
        .select(`
          id,
          cliente_id,
          membresia_id,
          fecha_inicio,
          fecha_fin,
          monto_pagado,
          metodo_pago,
          estado_pago,
          ingresos_restantes,
          membresias (
            id,
            nombre,
            duracion_dias,
            precio,
            limite_ingresos
          )
        `)
        .eq('cliente_id', clienteId)
        .order('fecha_fin', { ascending: false });

      if (!error && data) {
        setClientSubscriptions(data as unknown as SuscripcionConPlan[]);
      } else {
        setClientSubscriptions([]);
      }
    } catch (e) {
      console.error('[ModalAsignarMembresia] Error al consultar suscripciones del cliente:', e);
      setClientSubscriptions([]);
    } finally {
      setLoadingClientSubs(false);
    }
  }, []);

  // Al seleccionar o cambiar de cliente, consultar sus suscripciones
  useEffect(() => {
    if (isOpen && selectedCliente?.id) {
      loadClientSubscriptions(selectedCliente.id);
    } else {
      setClientSubscriptions([]);
    }
  }, [isOpen, selectedCliente, loadClientSubscriptions]);

  // Identificar suscripción vigente activa (fecha_fin >= hoy && estado_pago === 'PAGADO')
  const activeSubscription = useMemo(() => {
    return (
      clientSubscriptions.find(
        (s) => s.fecha_fin >= todayBolivia && s.estado_pago === 'PAGADO'
      ) || null
    );
  }, [clientSubscriptions, todayBolivia]);

  // Fecha siguiente consecutiva para encadenar
  const nextConsecutiveDate = useMemo(() => {
    if (!activeSubscription) return todayBolivia;
    return computeNextDay(activeSubscription.fecha_fin);
  }, [activeSubscription, todayBolivia]);

  // Días restantes del plan activo
  const remainingDays = useMemo(() => {
    if (!activeSubscription) return 0;
    return computeRemainingDays(activeSubscription.fecha_fin);
  }, [activeSubscription]);

  // Última suscripción pasada (si no tiene activa)
  const latestPastSubscription = useMemo(() => {
    if (activeSubscription) return null;
    return clientSubscriptions.length > 0 ? clientSubscriptions[0] : null;
  }, [clientSubscriptions, activeSubscription]);

  // Si tiene plan activo, sugerir por defecto iniciar al día siguiente para no perder días
  useEffect(() => {
    if (activeSubscription) {
      setFechaInicio(nextConsecutiveDate);
    } else {
      setFechaInicio(todayBolivia);
    }
  }, [activeSubscription, nextConsecutiveDate, todayBolivia]);

  // Detectar solapamiento con la suscripción activa
  const hasOverlap = useMemo(() => {
    if (!activeSubscription || !fechaInicio) return false;
    return fechaInicio <= activeSubscription.fecha_fin;
  }, [activeSubscription, fechaInicio]);

  // Cargar planes de membresía y sucursales
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchData() {
      setLoadingPlanes(true);
      try {
        // Consultar membresías activas
        const query = supabase
          .from('membresias')
          .select('*')
          .eq('organizacion_id', currentOrgId)
          .or('estado.eq.activo,estado.eq.ACTIVO');

        const { data: planes, error: planesError } = await query.order('precio', { ascending: true });

        if (planesError) {
          console.warn('[ModalAsignarMembresia] Error al cargar membresías:', planesError.message);
        } else if (isMounted && planes) {
          setMembresias(planes);
          if (planes.length > 0 && !selectedMembresiaId) {
            setSelectedMembresiaId(planes[0].id);
            setMontoCobrado(planes[0].precio);
          }
        }

        // Consultar sucursales de la organización
        const { data: sucs } = await supabase
          .from('sucursales')
          .select('*')
          .eq('organizacion_id', currentOrgId);

        if (isMounted && sucs) {
          setSucursales(sucs);
        }
      } catch (err) {
        console.error('[ModalAsignarMembresia] Error inesperado:', err);
      } finally {
        if (isMounted) setLoadingPlanes(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentOrgId, selectedMembresiaId]);

  // Membresía seleccionada en el catálogo
  const activeMembresia = useMemo(() => {
    return membresias.find((m) => m.id === selectedMembresiaId) || null;
  }, [membresias, selectedMembresiaId]);

  // Al cambiar la membresía seleccionada, actualizar monto por defecto
  const handleSelectPlan = (id: string) => {
    setSelectedMembresiaId(id);
    const plan = membresias.find((m) => m.id === id);
    if (plan) {
      setMontoCobrado(plan.precio);
    }
  };

  // Fecha fin calculada automáticamente según fechaInicio y duracion_dias
  const fechaFinCalculada = useMemo(() => {
    if (!activeMembresia) return fechaInicio;
    return computeEndDate(fechaInicio, activeMembresia.duracion_dias);
  }, [fechaInicio, activeMembresia]);

  // Búsqueda en tiempo real de clientes por CI, Nombre o Apellido
  useEffect(() => {
    if (!isOpen || selectedCliente || !searchTerm.trim()) {
      setSearchResults([]);
      setSearchingClients(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingClients(true);
      try {
        const term = searchTerm.trim();
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('organizacion_id', currentOrgId)
          .or(`ci.ilike.%${term}%,nombre.ilike.%${term}%,apellido.ilike.%${term}%`)
          .limit(6);

        if (!error && data) {
          setSearchResults(data);
          setShowDropdown(true);
        }
      } catch (e) {
        console.error('[ModalAsignarMembresia] Error al buscar socios:', e);
      } finally {
        setSearchingClients(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCliente, isOpen, currentOrgId]);

  // Manejar el submit de la suscripción
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedCliente) {
      setFeedback({
        type: 'error',
        message: 'Por favor, selecciona un socio para asignarle la membresía.',
      });
      return;
    }

    if (!activeMembresia) {
      setFeedback({
        type: 'error',
        message: 'Debes seleccionar un plan de membresía.',
      });
      return;
    }

    const cobroNumerico = typeof montoCobrado === 'number' ? montoCobrado : parseFloat(montoCobrado);
    if (isNaN(cobroNumerico) || cobroNumerico < 0) {
      setFeedback({
        type: 'error',
        message: 'El monto cobrado debe ser un número válido mayor o igual a 0.',
      });
      return;
    }

    if (!fechaInicio || !fechaFinCalculada) {
      setFeedback({
        type: 'error',
        message: 'Las fechas de inicio y vencimiento deben ser válidas.',
      });
      return;
    }

    // Determinar sucursal_id
    const targetSucursalId =
      activeMembresia.sucursal_id ||
      activeSucursalId ||
      sucursales[0]?.id ||
      FALLBACK_SUCURSAL.id;

    setSubmitting(true);

    try {
      // Mapear al check constraint en mayúsculas de Postgres ('EFECTIVO' | 'TARJETA' | 'OTRO')
      const dbMetodoPago: 'EFECTIVO' | 'TARJETA' | 'OTRO' =
        metodoPago === 'efectivo' || (metodoPago as string) === 'EFECTIVO'
          ? 'EFECTIVO'
          : metodoPago === 'tarjeta' || (metodoPago as string) === 'TARJETA'
            ? 'TARJETA'
            : 'OTRO';

      const payload = {
        organizacion_id: currentOrgId,
        sucursal_id: targetSucursalId,
        cliente_id: selectedCliente.id,
        membresia_id: activeMembresia.id,
        usuario_vendedor_id: profile?.id || null,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFinCalculada,
        ingresos_restantes: activeMembresia.limite_ingresos ?? null,
        monto_pagado: cobroNumerico,
        metodo_pago: dbMetodoPago,
        estado_pago: 'PAGADO' as const,
      };

      const { data: newSuscripcion, error: subError } = await supabase
        .from('suscripciones')
        .insert([payload])
        .select()
        .single();

      if (subError) {
        throw new Error(subError.message);
      }

      // 2. Actualizar o validar el estado del socio en la tabla `clientes` como 'ACTIVO'
      const { error: clienteError } = await supabase
        .from('clientes')
        .update({ estado: 'ACTIVO' })
        .eq('id', selectedCliente.id);

      if (clienteError) {
        console.warn('[ModalAsignarMembresia] Aviso al actualizar estado del cliente:', clienteError.message);
      }

      setFeedback({
        type: 'success',
        message: `¡Membresía ${activeSubscription ? 'renovada' : 'asignada'} exitosamente para ${selectedCliente.nombre} ${selectedCliente.apellido}! Vigencia hasta el ${formatReadableDate(fechaFinCalculada)}.`,
      });

      // Recargar suscripciones del cliente
      if (selectedCliente.id) {
        await loadClientSubscriptions(selectedCliente.id);
      }

      // Notificar éxito al padre
      if (onSuccess && newSuscripcion) {
        onSuccess(newSuscripcion, selectedCliente);
      }

      // Cerrar modal automáticamente tras una breve pausa
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[ModalAsignarMembresia] Error al guardar suscripción:', err);
      setFeedback({
        type: 'error',
        message: e.message || 'No se pudo registrar la suscripción. Revisa tu conexión o permisos.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!submitting) onClose();
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-surface-border bg-surface p-5 sm:p-7 shadow-2xl"
        >
          {/* Encabezado */}
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  {selectedCliente
                    ? `${activeSubscription ? 'Renovar / Extender Membresía' : 'Asignar Membresía'} a ${selectedCliente.nombre} ${selectedCliente.apellido}`
                    : 'Cobrar Membresía / Asignar Plan'}
                </h3>
                <p className="text-xs text-muted">
                  Control de vigencia, encadenamiento continuo y activación inmediata
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-surface-border bg-background text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`mt-4 flex items-center gap-2.5 rounded-2xl border p-3.5 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* ── 1. SOCIO / CLIENTE ────────────────────────────────────────── */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
                Socio Beneficiario
              </label>

              {selectedCliente ? (
                // Tarjeta de socio preseleccionado o seleccionado (Modo Lectura)
                <div className="flex items-center justify-between rounded-2xl border border-surface-border bg-background p-3.5 sm:p-4 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    {selectedCliente.foto_url ? (
                      <img
                        src={selectedCliente.foto_url}
                        alt={`${selectedCliente.nombre} ${selectedCliente.apellido}`}
                        className="h-11 w-11 rounded-full object-cover border border-surface-border"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                        {`${selectedCliente.nombre?.[0] || ''}${selectedCliente.apellido?.[0] || ''}`.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">
                          {selectedCliente.nombre} {selectedCliente.apellido}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          <UserCheck className="h-3 w-3" />
                          {selectedCliente.estado || 'ACTIVO'}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                        <span className="font-mono font-semibold text-foreground">
                          CI: {selectedCliente.ci}
                        </span>
                        {selectedCliente.telefono && (
                          <span>Tel: {selectedCliente.telefono}</span>
                        )}
                        {selectedCliente.email && (
                          <span className="truncate max-w-[200px]">{selectedCliente.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Si no venía forzado como prop inicial, permitir cambiar */}
                  {!clientePreseleccionado && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCliente(null);
                        setSearchTerm('');
                        setClientSubscriptions([]);
                      }}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Cambiar socio
                    </button>
                  )}
                </div>
              ) : (
                // Buscador de socio con autocompletado en tiempo real
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => {
                        if (searchResults.length > 0) setShowDropdown(true);
                      }}
                      placeholder="Buscar por Cédula (CI), Nombre o Apellido..."
                      className="w-full rounded-2xl border border-surface-border bg-background py-3 pl-10 pr-10 text-xs text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {searchingClients && (
                      <RefreshCw className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
                    )}
                  </div>

                  {/* Dropdown de resultados */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-56 overflow-y-auto rounded-2xl border border-surface-border bg-surface p-1.5 shadow-xl backdrop-blur-xl">
                      {searchResults.map((cli) => (
                        <button
                          key={cli.id}
                          type="button"
                          onClick={() => {
                            setSelectedCliente(cli);
                            setShowDropdown(false);
                            setSearchTerm('');
                          }}
                          className="flex w-full items-center justify-between rounded-xl p-2.5 text-left text-xs transition-colors hover:bg-background"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {`${cli.nombre?.[0] || ''}${cli.apellido?.[0] || ''}`.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">
                                {cli.nombre} {cli.apellido}
                              </div>
                              <div className="text-[11px] text-muted">CI: {cli.ci}</div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted" />
                        </button>
                      ))}
                    </div>
                  )}

                  {searchTerm.trim().length > 1 && !searchingClients && searchResults.length === 0 && (
                    <div className="mt-1.5 rounded-xl border border-surface-border bg-surface p-3 text-center text-xs text-muted">
                      No se encontró ningún socio con &quot;{searchTerm}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 2. ESTADO ACTUAL DE MEMBRESÍAS DEL SOCIO ─────────────────── */}
            {selectedCliente && (
              <div className="rounded-2xl border border-surface-border bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      Estado Actual de Membresías
                    </span>
                  </div>
                  {loadingClientSubs && (
                    <span className="flex items-center gap-1 text-[11px] text-muted">
                      <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                      Consultando planes...
                    </span>
                  )}
                </div>

                {/* Caso A: El cliente tiene un plan activo vigente */}
                {activeSubscription ? (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {activeSubscription.membresias?.nombre || 'Plan Vigente'}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold text-white">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            ACTIVO
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          Vigencia: <strong className="text-foreground">{formatReadableDate(activeSubscription.fecha_inicio)}</strong> al{' '}
                          <strong className="text-foreground">{formatReadableDate(activeSubscription.fecha_fin)}</strong>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="inline-block rounded-lg bg-surface border border-surface-border px-2.5 py-1 text-xs font-bold text-primary">
                          {remainingDays === 0
                            ? 'Vence hoy'
                            : remainingDays === 1
                              ? 'Le queda 1 día'
                              : `Le quedan ${remainingDays} días`}
                        </span>
                        <p className="mt-0.5 text-[10px] text-muted">
                          Cobrado: {formatMoney(activeSubscription.monto_pagado)} ({activeSubscription.metodo_pago})
                        </p>
                      </div>
                    </div>

                    {/* Opciones inteligentes para programar la nueva membresía */}
                    <div className="border-t border-primary/15 pt-2.5">
                      <p className="text-[11px] font-semibold text-foreground mb-1.5">
                        ¿Cómo deseas programar este nuevo plan?
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setFechaInicio(nextConsecutiveDate)}
                          className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs text-left transition-all ${
                            fechaInicio === nextConsecutiveDate
                              ? 'border-primary bg-primary text-white shadow-sm font-bold'
                              : 'border-surface-border bg-surface text-foreground hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 shrink-0" />
                            <div>
                              <p className="text-xs font-bold leading-tight">
                                Continuar tras vencimiento
                              </p>
                              <p className={`text-[10px] ${fechaInicio === nextConsecutiveDate ? 'text-white/80' : 'text-muted'}`}>
                                Inicia el {formatReadableDate(nextConsecutiveDate)} (Recomendado)
                              </p>
                            </div>
                          </div>
                          {fechaInicio === nextConsecutiveDate && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setFechaInicio(todayBolivia)}
                          className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs text-left transition-all ${
                            fechaInicio === todayBolivia
                              ? 'border-primary bg-primary text-white shadow-sm font-bold'
                              : 'border-surface-border bg-surface text-foreground hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 shrink-0" />
                            <div>
                              <p className="text-xs font-bold leading-tight">
                                Iniciar hoy de inmediato
                              </p>
                              <p className={`text-[10px] ${fechaInicio === todayBolivia ? 'text-white/80' : 'text-muted'}`}>
                                Inicia hoy {formatReadableDate(todayBolivia)}
                              </p>
                            </div>
                          </div>
                          {fechaInicio === todayBolivia && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : latestPastSubscription ? (
                  // Caso B: El socio tuvo membresías pasadas pero están vencidas
                  <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-muted" />
                      <div>
                        <span className="font-semibold text-foreground">
                          Último plan: {latestPastSubscription.membresias?.nombre || 'Membresía anterior'}
                        </span>
                        <p className="text-[11px] text-muted">
                          Venció el {formatReadableDate(latestPastSubscription.fecha_fin)}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-surface-border/60 px-2 py-0.5 text-[10px] font-bold text-muted">
                      Vencida
                    </span>
                  </div>
                ) : (
                  // Caso C: No tiene ninguna suscripción registrada
                  !loadingClientSubs && (
                    <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface p-3 text-xs text-muted">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>El socio no registra ninguna membresía previa en el sistema. Se dará de alta su primer plan.</span>
                    </div>
                  )
                )}

                {/* Desplegable de Historial completo de membresías */}
                {clientSubscriptions.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>
                        {showHistory ? 'Ocultar historial de planes' : `Ver historial de planes (${clientSubscriptions.length})`}
                      </span>
                      {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {showHistory && (
                      <div className="mt-2 divide-y divide-surface-border rounded-xl border border-surface-border bg-surface overflow-hidden">
                        {clientSubscriptions.map((sub) => {
                          const isVigente = sub.fecha_fin >= todayBolivia && sub.estado_pago === 'PAGADO';
                          return (
                            <div key={sub.id} className="flex items-center justify-between p-2.5 text-xs">
                              <div>
                                <p className="font-bold text-foreground">
                                  {sub.membresias?.nombre || 'Plan de membresía'}
                                </p>
                                <p className="text-[10px] text-muted">
                                  {formatReadableDate(sub.fecha_inicio)} – {formatReadableDate(sub.fecha_fin)} • {formatMoney(sub.monto_pagado)} ({sub.metodo_pago})
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isVigente
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'bg-surface-border/60 text-muted'
                                }`}
                              >
                                {isVigente ? 'Vigente' : 'Finalizada'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── 3. SELECCIÓN DE PLAN DE MEMBRESÍA ────────────────────────── */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Plan a Asignar / Renovar
                </label>
                {loadingPlanes && (
                  <span className="flex items-center gap-1 text-[11px] text-muted">
                    <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                    Cargando catálogo...
                  </span>
                )}
              </div>

              {membresias.length === 0 && !loadingPlanes ? (
                <div className="rounded-2xl border border-surface-border bg-background p-4 text-center text-xs text-muted">
                  No hay planes de membresía activos registrados en el sistema.{' '}
                  <span className="text-primary font-semibold">Crea planes en el menú Membresías.</span>
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {membresias.map((plan) => {
                    const isSelected = plan.id === selectedMembresiaId;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-3.5 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-surface-border bg-background hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                              {plan.nombre}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted">
                              {formatDuration(plan.duracion_dias)}
                              {plan.limite_ingresos
                                ? ` • ${plan.limite_ingresos} ingresos`
                                : ' • Ingresos ilimitados'}
                            </p>
                          </div>
                          <span className="rounded-lg bg-surface px-2 py-0.5 text-xs font-extrabold text-primary border border-surface-border">
                            {formatMoney(plan.precio)}
                          </span>
                        </div>
                        {plan.descripcion && (
                          <p className="mt-2 text-[10px] text-muted line-clamp-1">
                            {plan.descripcion}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── 4. FECHAS (INICIO Y VENCIMIENTO AUTOMÁTICO) ───────────────── */}
            <div className="space-y-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
                    Fecha de Inicio de Cobertura
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="date"
                      required
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full rounded-2xl border border-surface-border bg-background py-2.5 pl-10 pr-3.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted">
                    Inicio: {formatReadableDate(fechaInicio) || '—'}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
                    Fecha de Vencimiento (Automática)
                  </label>
                  <div className="flex items-center justify-between rounded-2xl border border-surface-border bg-background/50 px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-bold text-foreground">
                        {fechaFinCalculada ? formatReadableDate(fechaFinCalculada) : '—'}
                      </span>
                    </div>
                    {activeMembresia && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        +{activeMembresia.duracion_dias} días
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-muted">
                    Calculada automáticamente según los días del plan
                  </p>
                </div>
              </div>

              {/* Alerta de Solapamiento si la fecha de inicio se cruza con un plan vigente */}
              {hasOverlap && activeSubscription && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">
                        Aviso: La fecha seleccionada coincide con el plan actual
                      </p>
                      <p className="text-[11px] leading-relaxed text-muted">
                        El socio ya tiene cubierto hasta el <strong>{formatReadableDate(activeSubscription.fecha_fin)}</strong>. Si deseas que este nuevo plan inicie justo al vencer el actual para no perder días:
                      </p>
                      <button
                        type="button"
                        onClick={() => setFechaInicio(nextConsecutiveDate)}
                        className="mt-1 inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-900 dark:text-amber-100 hover:bg-amber-500/30 transition-colors"
                      >
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span>Ajustar fecha de inicio al {formatReadableDate(nextConsecutiveDate)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── 5. MÉTODO DE PAGO Y MONTO COBRADO ─────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('efectivo')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      metodoPago === 'efectivo'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-surface-border bg-background text-muted hover:border-primary/50'
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    <span>Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('transferencia')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      metodoPago === 'transferencia'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-surface-border bg-background text-muted hover:border-primary/50'
                    }`}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>QR / Transf.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('tarjeta')}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      metodoPago === 'tarjeta'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-surface-border bg-background text-muted hover:border-primary/50'
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Tarjeta</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
                  Monto Cobrado (BOB)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-muted">
                    Bs.
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={montoCobrado}
                    onChange={(e) => setMontoCobrado(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-surface-border bg-background py-2.5 pl-10 pr-3.5 text-xs font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  Editable en caso de promociones o descuentos acordados
                </p>
              </div>
            </div>

            {/* ── BOTONES DE ACCIÓN ────────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3 border-t border-surface-border pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-surface-border bg-background px-4 py-2.5 text-xs font-bold text-muted transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting || !selectedCliente || !activeMembresia}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-primary-light disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Guardando y Activando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {activeSubscription ? 'Confirmar Renovación' : 'Confirmar y Cobrar Plan'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
