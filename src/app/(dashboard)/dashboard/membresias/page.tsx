'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, Pencil, ToggleLeft, ToggleRight, X,
  Clock, Users, Globe, Building2, CheckCircle2,
  XCircle, CalendarDays, Loader2, AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Membresia, MembresiaInsert } from '@/types/database';

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
  return `${inicio} – ${fin}`;
}
function formatAccess(limite: number | null): string {
  if (!limite || limite === 0) return 'Ilimitado';
  return `${limite} ingreso${limite !== 1 ? 's' : ''} / periodo`;
}

const emptyForm = (): Omit<MembresiaInsert, 'organizacion_id'> => ({
  nombre: '', descripcion: '', precio: 0, duracion_dias: 30,
  limite_ingresos: null, hora_inicio: null, hora_fin: null,
  es_multisucursal: false, estado: 'activo',
});

export default function MembresiasPage() {
  const { profile } = useAuth();
  const [membresias, setMembresias] = useState<Membresia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Membresia | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [useSchedule, setUseSchedule] = useState(false);
  const [useLimitAccess, setUseLimitAccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchMembresias = useCallback(async () => {
    setLoading(true); setError(null);
    let query = supabase.from('membresias').select('*').order('creado_en', { ascending: false });
    if (profile?.organizacion_id) query = query.eq('organizacion_id', profile.organizacion_id);
    const { data, error: err } = await query;
    if (err) setError(`Error al cargar membresias: ${err.message}`);
    else setMembresias((data as Membresia[]) ?? []);
    setLoading(false);
  }, [profile?.organizacion_id]);

  useEffect(() => { if (profile) fetchMembresias(); }, [profile, fetchMembresias]);

  function openCreate() {
    setEditTarget(null); setForm(emptyForm()); setUseSchedule(false);
    setUseLimitAccess(false); setFormError(null); setModalOpen(true);
  }
  function openEdit(m: Membresia) {
    setEditTarget(m);
    setForm({
      nombre: m.nombre, descripcion: m.descripcion ?? '', precio: m.precio,
      duracion_dias: m.duracion_dias, limite_ingresos: m.limite_ingresos,
      hora_inicio: m.hora_inicio, hora_fin: m.hora_fin,
      es_multisucursal: m.es_multisucursal, estado: m.estado,
    });
    setUseSchedule(!!(m.hora_inicio && m.hora_fin));
    setUseLimitAccess(!!(m.limite_ingresos && m.limite_ingresos > 0));
    setFormError(null); setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditTarget(null); }

  async function handleSave() {
    setFormError(null);
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio.'); return; }
    if (form.precio <= 0) { setFormError('El precio debe ser mayor a 0.'); return; }
    if (form.duracion_dias <= 0) { setFormError('La duracion debe ser mayor a 0.'); return; }
    if (useSchedule && (!form.hora_inicio || !form.hora_fin)) {
      setFormError('Ingresa ambos horarios.'); return;
    }
    setSaving(true);
    const orgId = profile?.organizacion_id ?? '11111111-1111-1111-1111-111111111111';
    const payload: MembresiaInsert = {
      organizacion_id: orgId, nombre: form.nombre.trim(),
      descripcion: form.descripcion?.trim() || null, precio: Number(form.precio),
      duracion_dias: Number(form.duracion_dias),
      limite_ingresos: useLimitAccess ? Number(form.limite_ingresos) : null,
      hora_inicio: useSchedule ? form.hora_inicio : null,
      hora_fin: useSchedule ? form.hora_fin : null,
      es_multisucursal: form.es_multisucursal, estado: form.estado,
    };
    if (editTarget) {
      const { error: err } = await supabase.from('membresias').update(payload).eq('id', editTarget.id);
      if (err) setFormError(`Error al actualizar: ${err.message}`);
      else { setSuccess('Membresia actualizada.'); closeModal(); fetchMembresias(); }
    } else {
      const { error: err } = await supabase.from('membresias').insert(payload);
      if (err) setFormError(`Error al crear: ${err.message}`);
      else { setSuccess('Membresia creada.'); closeModal(); fetchMembresias(); }
    }
    setSaving(false);
    setTimeout(() => setSuccess(null), 4000);
  }

  async function toggleEstado(m: Membresia) {
    const next = m.estado === 'activo' ? 'inactivo' : 'activo';
    const { error: err } = await supabase.from('membresias').update({ estado: next }).eq('id', m.id);
    if (err) setError(`Error al cambiar estado: ${err.message}`);
    else setMembresias((prev) => prev.map((x) => (x.id === m.id ? { ...x, estado: next } : x)));
  }

  const activas = membresias.filter((m) => m.estado === 'activo').length;
  const inactivas = membresias.filter((m) => m.estado === 'inactivo').length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1 flex items-center gap-1 text-xs text-zinc-400">
            <a href="/dashboard" className="hover:text-primary transition-colors">Inicio</a>
            <span>/</span>
            <span className="text-zinc-600 dark:text-zinc-300">Membresias</span>
          </nav>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Gestion de Membresias
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            Define los planes de acceso, precios y horarios disponibles para tus socios.
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-light transition-colors">
          <Plus className="w-4 h-4" /> Nueva Membresia
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 flex flex-wrap gap-3">
        {[`Todas (${membresias.length})`, `Activas (${activas})`, `Inactivas (${inactivas})`].map((t) => (
          <span key={t} className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">{t}</span>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : membresias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CreditCard className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">No se encontraron membresias</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Crea tu primer plan haciendo clic en Nueva Membresia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {membresias.map((m, i) => (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}
                className="relative rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                <span className={`absolute top-4 right-4 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${m.estado === 'activo' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                  {m.estado === 'activo' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {m.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
                <div className="pr-20">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{m.nombre}</h3>
                  <p className="text-2xl font-extrabold text-primary mt-1">{formatPrice(m.precio)}</p>
                  {m.descripcion && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{m.descripcion}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300">
                    <CalendarDays className="w-3.5 h-3.5 text-primary" />{formatDuration(m.duracion_dias)}
                  </span>
                  <span className="flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    {formatAccess(m.limite_ingresos)}
                  </span>
                  <span className="flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-primary" />{formatSchedule(m.hora_inicio, m.hora_fin)}
                  </span>
                  <span className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${m.es_multisucursal ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                    {m.es_multisucursal ? <Globe className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                    {m.es_multisucursal ? 'Multisucursal' : 'Sucursal unica'}
                  </span>
                </div>
                <div className="flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-auto">
                  <button onClick={() => openEdit(m)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />Editar
                  </button>
                  <button onClick={() => toggleEstado(m)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${m.estado === 'activo' ? 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30' : 'border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30'}`}>
                    {m.estado === 'activo' ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                    {m.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
            <motion.div key="modal"
              initial={{ opacity: 0, scale: 0.97, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                    {editTarget ? 'Editar Membresia' : 'Nueva Membresia'}
                  </h2>
                  <button onClick={closeModal} className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    <X className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                  {formError && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />{formError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nombre <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="Ej: Plan Mensual" value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Descripcion</label>
                    <textarea rows={2} placeholder="Descripcion breve del plan..." value={form.descripcion ?? ''}
                      onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Precio (BOB) <span className="text-red-500">*</span></label>
                      <input type="number" min="0" step="0.5" placeholder="150"
                        value={form.precio === 0 ? '' : form.precio}
                        onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Duracion (dias) <span className="text-red-500">*</span></label>
                      <input type="number" min="1" placeholder="30" value={form.duracion_dias}
                        onChange={(e) => setForm({ ...form, duracion_dias: parseInt(e.target.value) || 1 })}
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div onClick={() => setUseLimitAccess((v) => !v)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${useLimitAccess ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${useLimitAccess ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Limitar cantidad de ingresos</span>
                    </label>
                    {useLimitAccess && (
                      <input type="number" min="1" placeholder="Ej: 20 ingresos por periodo"
                        value={form.limite_ingresos ?? ''}
                        onChange={(e) => setForm({ ...form, limite_ingresos: parseInt(e.target.value) || null })}
                        className="mt-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary" />
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div onClick={() => setUseSchedule((v) => !v)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${useSchedule ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${useSchedule ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Restringir horario de acceso</span>
                    </label>
                    {useSchedule && (
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Hora inicio</label>
                          <input type="time" value={form.hora_inicio ?? ''}
                            onChange={(e) => setForm({ ...form, hora_inicio: e.target.value || null })}
                            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Hora fin</label>
                          <input type="time" value={form.hora_fin ?? ''}
                            onChange={(e) => setForm({ ...form, hora_fin: e.target.value || null })}
                            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div onClick={() => setForm((f) => ({ ...f, es_multisucursal: !f.es_multisucursal }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${form.es_multisucursal ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.es_multisucursal ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Acceso Multisucursal</span>
                    </label>
                    <p className="mt-0.5 ml-12 text-xs text-zinc-400">Permite al socio ingresar a cualquier sede registrada.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Estado</label>
                    <select value={form.estado}
                      onChange={(e) => setForm({ ...form, estado: e.target.value as 'activo' | 'inactivo' })}
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 px-6 py-4">
                  <button onClick={closeModal}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light transition-colors disabled:opacity-60">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editTarget ? 'Guardar cambios' : 'Crear Membresia'}
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
