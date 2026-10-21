'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, Pencil, ToggleLeft, ToggleRight, X,
  Clock, Users, Globe, Building2, CheckCircle2,
  XCircle, CalendarDays, Loader2, AlertCircle, Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Membresia, MembresiaInsert, Sucursal } from '@/types/database';

function formatPrice(n: number): string {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n);
}
function formatDuration(dias: number): string {
  if (dias % 365 === 0) return `${dias / 365} año${dias / 365 > 1 ? 's' : ''}`;
  if (dias % 30 === 0) return `${dias / 30} mes${dias / 30 > 1 ? 'es' : ''}`;
  if (dias % 7 === 0) return `${dias / 7} semana${dias / 7 > 1 ? 's' : ''}`;
  return `${dias} día${dias !== 1 ? 's' : ''}`;
}
function formatSchedule(inicio: string | null, fin: string | null): string {
  if (!inicio || !fin) return 'Horario Libre';
  return `${inicio.slice(0, 5)} – ${fin.slice(0, 5)}`;
}
function formatAccess(limite: number | null): string {
  if (!limite || limite === 0) return 'Ilimitado';
  return `${limite} ingreso${limite !== 1 ? 's' : ''} / periodo`;
}

interface FormState extends Omit<MembresiaInsert, 'organizacion_id'> {
  sucursal_id: string | null;
}

const emptyForm = (defaultSucursalId?: string | null): FormState => ({
  nombre: '',
  descripcion: '',
  precio: 0,
  duracion_dias: 30,
  limite_ingresos: null,
  hora_inicio: null,
  hora_fin: null,
  sucursal_id: defaultSucursalId ?? null,
  es_multisucursal: false,
  estado: 'ACTIVO',
});

export default function MembresiasPage() {
  const { profile, activeSucursalId } = useAuth();
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [filterEstado, setFilterEstado] = useState<'todas' | 'activas' | 'inactivas'>('todas');
  const [filterSucursal, setFilterSucursal] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Membresia | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [useSchedule, setUseSchedule] = useState(false);
  const [useLimitAccess, setUseLimitAccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Mapa de id -> nombre de sucursal
  const sucursalMap = useMemo(() => {
    const map = new Map<string, string>();
    sucursales.forEach((s) => map.set(s.id, s.nombre));
    return map;
  }, [sucursales]);

  // Cargar sucursales de la organización
  const fetchSucursales = useCallback(async () => {
    if (!profile?.organizacion_id) return;
    const { data, error: err } = await supabase
      .from('sucursales')
      .select('*')
      .eq('organizacion_id', profile.organizacion_id)
      .order('nombre', { ascending: true });
    if (!err && data) {
      setSucursales(data as Sucursal[]);
    }
  }, [profile?.organizacion_id]);

  const fetchMembresias = useCallback(async () => {
    setLoading(true); setError(null);
    let query = supabase.from('membresias').select('*').order('creado_en', { ascending: false });
    if (profile?.organizacion_id) query = query.eq('organizacion_id', profile.organizacion_id);
    const { data, error: err } = await query;
    if (err) setError(`Error al cargar membresías: ${err.message}`);
    else setMembresias((data as Membresia[]) ?? []);
    setLoading(false);
  }, [profile?.organizacion_id]);

  useEffect(() => {
    if (profile) {
      fetchSucursales();
      fetchMembresias();
    }
  }, [profile, fetchSucursales, fetchMembresias]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm(activeSucursalId || null));
    setUseSchedule(false);
    setUseLimitAccess(false);
    setFormError(null);
    setModalOpen(true);
  }
  function openEdit(m: Membresia) {
    setEditTarget(m);
    setForm({
      nombre: m.nombre,
      descripcion: m.descripcion ?? '',
      precio: m.precio,
      duracion_dias: m.duracion_dias,
      limite_ingresos: m.limite_ingresos,
      hora_inicio: m.hora_inicio,
      hora_fin: m.hora_fin,
      sucursal_id: m.sucursal_id ?? null,
      es_multisucursal: m.es_multisucursal,
      estado: String(m.estado).toUpperCase() === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO',
    });
    setUseSchedule(!!(m.hora_inicio && m.hora_fin));
    setUseLimitAccess(!!(m.limite_ingresos && m.limite_ingresos > 0));
    setFormError(null);
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditTarget(null); }

  async function handleSave() {
    setFormError(null);
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio.'); return; }
    if (form.precio < 0) { setFormError('El precio no puede ser negativo.'); return; }
    if (form.duracion_dias <= 0) { setFormError('La duración debe ser mayor a 0 días.'); return; }
    if (useSchedule && (!form.hora_inicio || !form.hora_fin)) {
      setFormError('Ingresa ambos horarios de inicio y fin.'); return;
    }
    setSaving(true);
    const orgId = profile?.organizacion_id ?? '11111111-1111-1111-1111-111111111111';
    const payload: MembresiaInsert = {
      organizacion_id: orgId,
      sucursal_id: form.sucursal_id || null,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || null,
      precio: Number(form.precio),
      duracion_dias: Number(form.duracion_dias),
      limite_ingresos: useLimitAccess ? Number(form.limite_ingresos) : null,
      hora_inicio: useSchedule ? form.hora_inicio : null,
      hora_fin: useSchedule ? form.hora_fin : null,
      es_multisucursal: form.es_multisucursal,
      estado: form.estado,
    };
    if (editTarget) {
      const { error: err } = await supabase.from('membresias').update(payload).eq('id', editTarget.id);
      if (err) setFormError(`Error al actualizar: ${err.message}`);
      else { setSuccess('Membresía actualizada.'); closeModal(); fetchMembresias(); }
    } else {
      const { error: err } = await supabase.from('membresias').insert(payload);
      if (err) setFormError(`Error al crear: ${err.message}`);
      else { setSuccess('Membresía creada.'); closeModal(); fetchMembresias(); }
    }
    setSaving(false);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function toggleEstado(m: Membresia) {
    const isCurrentlyActivo = String(m.estado).toUpperCase() === 'ACTIVO';
    const next = isCurrentlyActivo ? 'INACTIVO' : 'ACTIVO';
    const { error: err } = await supabase.from('membresias').update({ estado: next }).eq('id', m.id);
    if (err) setError(`Error al cambiar estado: ${err.message}`);
    else setMembresias((prev) => prev.map((x) => (x.id === m.id ? { ...x, estado: next } : x)));
  }

  // Filtrado reactivo de membresías
  const filteredMembresias = useMemo(() => {
    return membresias.filter((m) => {
      const isActivo = String(m.estado).toUpperCase() === 'ACTIVO';
      if (filterEstado === 'activas' && !isActivo) return false;
      if (filterEstado === 'inactivas' && isActivo) return false;
      if (filterSucursal === 'globales' && m.sucursal_id !== null) return false;
      if (filterSucursal !== 'todas' && filterSucursal !== 'globales' && m.sucursal_id !== filterSucursal) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesNombre = m.nombre.toLowerCase().includes(query);
        const matchesDesc = m.descripcion?.toLowerCase().includes(query);
        if (!matchesNombre && !matchesDesc) return false;
      }
      return true;
    });
  }, [membresias, filterEstado, filterSucursal, searchTerm]);

  const activas = membresias.filter((m) => String(m.estado).toUpperCase() === 'ACTIVO').length;
  const inactivas = membresias.filter((m) => String(m.estado).toUpperCase() !== 'ACTIVO').length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-1 text-xs text-zinc-400">
            <a href="/dashboard" className="hover:text-primary transition-colors">Inicio</a>
            <span>/</span>
            <span className="text-zinc-600 dark:text-zinc-300">Membresías</span>
          </nav>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Gestión de Membresías y Planes
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Define planes exclusivos por sucursal con tarifas independientes o membresías globales para toda la cadena.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-light transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva Membresía
        </button>
      </div>

      {/* ── Alertas ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Barra de Filtros ─────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        {/* Pestañas de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todas', label: `Todas (${membresias.length})` },
            { id: 'activas', label: `Activas (${activas})` },
            { id: 'inactivas', label: `Inactivas (${inactivas})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterEstado(tab.id as 'todas' | 'activas' | 'inactivas')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                filterEstado === tab.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filtros secundarios: Selector de Sucursal y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Selector de Sucursal */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <select
              value={filterSucursal}
              onChange={(e) => setFilterSucursal(e.target.value)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="todas">Todas las sedes</option>
              <option value="globales">🌐 Solo Globales (Toda la cadena)</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  🏢 {s.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Campo de búsqueda */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-44 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 pl-8 pr-2.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* ── Listado de Planes ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-zinc-500">Cargando planes y membresías...</p>
        </div>
      ) : filteredMembresias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 p-6">
          <CreditCard className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-base font-semibold text-zinc-700 dark:text-zinc-200">No se encontraron membresías</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm">
            {searchTerm || filterSucursal !== 'todas' || filterEstado !== 'todas'
              ? 'Intenta ajustar los filtros de sede o término de búsqueda para ver más resultados.'
              : 'Empieza a configurar tus planes y tarifas creando una nueva membresía.'}
          </p>
          {(searchTerm || filterSucursal !== 'todas' || filterEstado !== 'todas') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSucursal('todas');
                setFilterEstado('todas');
              }}
              className="mt-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filteredMembresias.map((m, i) => {
              const sucursalNombre = m.sucursal_id ? sucursalMap.get(m.sucursal_id) : null;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
                >
                  {/* Badges superiores: Sede y Estado */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Badge Sede / Ámbito de Oferta */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        m.sucursal_id
                          ? 'border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                          : 'border border-primary/20 bg-primary/10 text-primary dark:text-primary-light'
                      }`}
                    >
                      {m.sucursal_id ? (
                        <>
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[140px]">{sucursalNombre || 'Sede específica'}</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3 shrink-0" />
                          <span>Toda la cadena</span>
                        </>
                      )}
                    </span>

                    {/* Badge Estado */}
                    {(() => {
                      const isActivo = String(m.estado).toUpperCase() === 'ACTIVO';
                      return (
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isActivo
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {isActivo ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {isActivo ? 'Activo' : 'Inactivo'}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Nombre y Precio */}
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">{m.nombre}</h3>
                    <p className="text-2xl font-extrabold text-primary mt-1">{formatPrice(m.precio)}</p>
                    {m.descripcion && (
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{m.descripcion}</p>
                    )}
                  </div>

                  {/* Atributos / Reglas del plan */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {/* Duración */}
                    <span className="flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-zinc-600 dark:text-zinc-300">
                      <CalendarDays className="w-3.5 h-3.5 text-primary" />
                      {formatDuration(m.duracion_dias)}
                    </span>

                    {/* Ingresos permitidos */}
                    <span className="flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-zinc-600 dark:text-zinc-300">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      {formatAccess(m.limite_ingresos)}
                    </span>

                    {/* Horario */}
                    <span className="flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-zinc-600 dark:text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {formatSchedule(m.hora_inicio, m.hora_fin)}
                    </span>

                    {/* Acceso de socio: Multisucursal vs Única */}
                    <span
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 font-medium ${
                        m.es_multisucursal
                          ? 'bg-primary/10 text-primary dark:bg-primary/20'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {m.es_multisucursal ? <Globe className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                      {m.es_multisucursal ? 'Pase Multisucursal' : 'Acceso sede única'}
                    </span>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-3 mt-auto">
                    <button
                      onClick={() => openEdit(m)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 text-zinc-500" /> Editar
                    </button>
                    {(() => {
                      const isActivo = String(m.estado).toUpperCase() === 'ACTIVO';
                      return (
                        <button
                          onClick={() => toggleEstado(m)}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            isActivo
                              ? 'border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                              : 'border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          }`}
                        >
                          {isActivo ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                          {isActivo ? 'Desactivar' : 'Activar'}
                        </button>
                      );
                    })()}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Modal Crear / Editar Membresía ──────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {/* Cabecera del modal */}
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                      {editTarget ? 'Editar Membresía' : 'Nueva Membresía'}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Configura el alcance, tarifas y reglas de acceso para el socio.
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Contenido scrolleable */}
                <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
                  {formError && (
                    <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Nombre del Plan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Plan Mensual Básico"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Sede / Ámbito de Disponibilidad */}
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 p-3.5">
                    <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      Sede de la Membresía / Disponibilidad
                    </label>
                    <select
                      value={form.sucursal_id ?? ''}
                      onChange={(e) => setForm({ ...form, sucursal_id: e.target.value || null })}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="">🌐 Disponible en toda la cadena (Plan Global)</option>
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>
                          🏢 Exclusivo de {s.nombre} {s.ciudad ? `(${s.ciudad})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {form.sucursal_id
                        ? 'Este plan y tarifa solo se mostrarán y venderán en la sucursal seleccionada.'
                        : 'Este plan estará disponible con el mismo precio en todas las sedes de la organización.'}
                    </p>
                  </div>

                  {/* Precio y Duración */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Precio (BOB) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="150"
                        value={form.precio === 0 && !editTarget ? '' : form.precio}
                        onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Duración (días) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="30"
                        value={form.duracion_dias}
                        onChange={(e) => setForm({ ...form, duracion_dias: parseInt(e.target.value) || 1 })}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Descripción (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Beneficios incluidos, condiciones o notas breves..."
                      value={form.descripcion ?? ''}
                      onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  {/* Límite de ingresos */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <div
                        onClick={() => setUseLimitAccess((v) => !v)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          useLimitAccess ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            useLimitAccess ? 'translate-x-5' : ''
                          }`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Limitar cantidad de ingresos (Pases por cupos)
                      </span>
                    </label>
                    {useLimitAccess && (
                      <input
                        type="number"
                        min="1"
                        placeholder="Ej: 20 ingresos por mes"
                        value={form.limite_ingresos ?? ''}
                        onChange={(e) => setForm({ ...form, limite_ingresos: parseInt(e.target.value) || null })}
                        className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                  </div>

                  {/* Horario restringido */}
                  <div>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <div
                        onClick={() => setUseSchedule((v) => !v)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          useSchedule ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            useSchedule ? 'translate-x-5' : ''
                          }`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Restringir franja horaria (Ej. Turno Mañana)
                      </span>
                    </label>
                    {useSchedule && (
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Hora inicio</label>
                          <input
                            type="time"
                            value={form.hora_inicio ?? ''}
                            onChange={(e) => setForm({ ...form, hora_inicio: e.target.value || null })}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Hora fin</label>
                          <input
                            type="time"
                            value={form.hora_fin ?? ''}
                            onChange={(e) => setForm({ ...form, hora_fin: e.target.value || null })}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acceso multisucursal */}
                  <div>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <div
                        onClick={() => setForm((f) => ({ ...f, es_multisucursal: !f.es_multisucursal }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          form.es_multisucursal ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            form.es_multisucursal ? 'translate-x-5' : ''
                          }`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Acceso de Socio Multisucursal (Pase Libre en toda la red)
                      </span>
                    </label>
                    <p className="mt-1 ml-12 text-xs text-zinc-400">
                      Permite al socio entrenar en cualquier sede registrada, independientemente de la sucursal donde adquirió el plan.
                    </p>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Estado</label>
                    <select
                      value={form.estado}
                      onChange={(e) => setForm({ ...form, estado: e.target.value as 'ACTIVO' | 'INACTIVO' })}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="ACTIVO">Activo (Disponible para venta)</option>
                      <option value="INACTIVO">Inactivo (Archivado / No disponible)</option>
                    </select>
                  </div>
                </div>

                {/* Footer del modal */}
                <div className="flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 px-6 py-4">
                  <button
                    onClick={closeModal}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-light transition-colors disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editTarget ? 'Guardar Cambios' : 'Crear Membresía'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
