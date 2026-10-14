'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Building,
  Plus,
  Search,
  Edit2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Phone,
  MapPin,
  Building2,
  Check,
  PowerOff,
  Power,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Sucursal, EstadoGeneral } from '@/types/database';
import { FALLBACK_ORGANIZACION } from '@/lib/seed';

type FilterEstado = 'TODOS' | 'ACTIVO' | 'INACTIVO';

interface SucursalFormData {
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  estado: EstadoGeneral;
}

const INITIAL_FORM: SucursalFormData = {
  nombre: '',
  ciudad: '',
  direccion: '',
  telefono: '',
  estado: 'activo',
};

export default function SucursalesPage() {
  const { profile, activeSucursalId, setActiveSucursalId, loading: authLoading } = useAuth();
  const currentOrgId = profile?.organizacion_id || FALLBACK_ORGANIZACION.id;

  // Estados
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<FilterEstado>('TODOS');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [formData, setFormData] = useState<SucursalFormData>(INITIAL_FORM);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Cargar Sucursales
  const loadSucursales = useCallback(async (isRefresh = false) => {
    if (authLoading) return;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let query = supabase
        .from('sucursales')
        .select('*');

      if (currentOrgId !== FALLBACK_ORGANIZACION.id) {
        query = query.eq('organizacion_id', currentOrgId);
      }

      const { data, error } = await query.order('nombre', { ascending: true });

      if (error) {
        console.warn('[Sucursales] Error al consultar:', error.message);
        setSucursales([]);
        setFeedback({
          type: 'error',
          message:
            error.code === '42501'
              ? 'Supabase bloqueó la lectura por RLS. Ejecuta supabase/fix_rls.sql en el SQL Editor de Supabase.'
              : `No se pudieron cargar las sucursales: ${error.message}`,
        });
        return;
      }

      if (data && data.length > 0) {
        setSucursales(data);
        if (!activeSucursalId) {
          setActiveSucursalId(profile?.sucursal_id || data[0].id);
        }
      } else {
        setSucursales([]);
      }
    } catch (err: unknown) {
      console.error('[Sucursales] Error inesperado:', err);
      setSucursales([]);
      setFeedback({
        type: 'error',
        message: 'Ocurrió un error inesperado al cargar las sucursales.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSucursalId, authLoading, currentOrgId, profile, setActiveSucursalId]);

  useEffect(() => {
    loadSucursales();
  }, [loadSucursales]);

  // Modal handlers
  const handleOpenCreateModal = () => {
    setEditingSucursal(null);
    setFormData(INITIAL_FORM);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal);
    setFormData({
      nombre: sucursal.nombre || '',
      ciudad: sucursal.ciudad || '',
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      estado: String(sucursal.estado || 'activo').toLowerCase() as EstadoGeneral,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSucursal(null);
    setFormData(INITIAL_FORM);
  };

  // Guardar (Crear o Editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setFeedback(null);

    const nombreTrim = formData.nombre.trim();

    if (!nombreTrim) {
      setFeedback({
        type: 'error',
        message: 'El nombre de la sucursal es obligatorio.',
      });
      setModalSubmitting(false);
      return;
    }

    try {
      if (editingSucursal) {
        // Modo Edición
        // Si intenta desactivar y es la única activa
        const activasCount = sucursales.filter(
          (s) => String(s.estado).toLowerCase() === 'activo'
        ).length;

        const isCurrentlyActivo = String(editingSucursal.estado).toLowerCase() === 'activo';
        const willBeInactivo = formData.estado === 'inactivo';

        if (isCurrentlyActivo && willBeInactivo && activasCount <= 1) {
          setFeedback({
            type: 'error',
            message: 'No puedes desactivar esta sucursal porque es la única sucursal activa de la organización.',
          });
          setModalSubmitting(false);
          return;
        }

        const { error: updateError } = await supabase
          .from('sucursales')
          .update({
            nombre: nombreTrim,
            ciudad: formData.ciudad.trim() || null,
            direccion: formData.direccion.trim() || null,
            telefono: formData.telefono.trim() || null,
            estado: formData.estado === 'activo' ? 'ACTIVO' : 'INACTIVO',
          })
          .eq('id', editingSucursal.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setFeedback({
          type: 'success',
          message: `Sucursal "${nombreTrim}" actualizada con éxito.`,
        });
        handleCloseModal();
        await loadSucursales();
      } else {
        // Modo Creación
        let targetOrgId = profile?.organizacion_id;
        if (!targetOrgId || targetOrgId === FALLBACK_ORGANIZACION.id) {
          const { data: orgs } = await supabase.from('organizaciones').select('id').limit(1);
          if (orgs && orgs.length > 0) {
            targetOrgId = orgs[0].id;
          } else {
            targetOrgId = currentOrgId;
          }
        }

        const { error: insertError } = await supabase
          .from('sucursales')
          .insert([
            {
              organizacion_id: targetOrgId,
              nombre: nombreTrim,
              ciudad: formData.ciudad.trim() || null,
              direccion: formData.direccion.trim() || null,
              telefono: formData.telefono.trim() || null,
              estado: formData.estado === 'activo' ? 'ACTIVO' : 'INACTIVO',
            },
          ]);

        if (insertError) throw insertError;

        setFeedback({
          type: 'success',
          message: `¡Sucursal "${nombreTrim}" creada exitosamente!`,
        });
        handleCloseModal();
        await loadSucursales();
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[Sucursales Form] Error:', err);
      const errorCode = (err as { code?: string }).code;
      setFeedback({
        type: 'error',
        message:
          errorCode === '42501'
            ? 'Supabase bloqueó esta operación por RLS. Ejecuta supabase/fix_rls.sql en el SQL Editor de Supabase.'
            : e.message || 'Ocurrió un error al procesar la sucursal.',
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Alternar Estado Rápido
  const handleToggleEstado = async (sucursal: Sucursal) => {
    const isActivo = String(sucursal.estado).toLowerCase() === 'activo';
    const nuevoEstado: EstadoGeneral = isActivo ? 'inactivo' : 'activo';

    // Validación: no permitir desactivar si es la única activa
    if (isActivo) {
      const activasCount = sucursales.filter(
        (s) => String(s.estado).toLowerCase() === 'activo'
      ).length;

      if (activasCount <= 1) {
        setFeedback({
          type: 'error',
          message: 'No puedes desactivar la sucursal porque es la única sucursal activa de la organización.',
        });
        return;
      }
    }

    try {
      const estadoDb = nuevoEstado === 'activo' ? 'ACTIVO' : 'INACTIVO';
      const { error } = await supabase
        .from('sucursales')
        .update({ estado: estadoDb })
        .eq('id', sucursal.id)
        .select()
        .single();

      if (error) throw error;

      setSucursales((prev) =>
        prev.map((s) => (s.id === sucursal.id ? { ...s, estado: estadoDb } : s))
      );

      setFeedback({
        type: 'success',
        message: `La sucursal "${sucursal.nombre}" ahora está ${nuevoEstado.toUpperCase()}.`,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[Toggle Estado Sucursal] Error:', err);
      setFeedback({
        type: 'error',
        message: 'No se pudo cambiar el estado: ' + (e.message || ''),
      });
    }
  };

  // Filtrado
  const filteredSucursales = useMemo(() => {
    return sucursales.filter((s) => {
      const search = searchTerm.toLowerCase().trim();
      const matchSearch =
        !search ||
        (s.nombre && s.nombre.toLowerCase().includes(search)) ||
        (s.ciudad && s.ciudad.toLowerCase().includes(search)) ||
        (s.direccion && s.direccion.toLowerCase().includes(search)) ||
        (s.telefono && s.telefono.toLowerCase().includes(search));

      const isActivo = String(s.estado).toLowerCase() === 'activo';
      const matchEstado =
        estadoFilter === 'TODOS' ||
        (estadoFilter === 'ACTIVO' && isActivo) ||
        (estadoFilter === 'INACTIVO' && !isActivo);

      return matchSearch && matchEstado;
    });
  }, [sucursales, searchTerm, estadoFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Header y Breadcrumb ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link href="/dashboard" className="transition-colors hover:text-primary">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/dashboard/configuracion" className="transition-colors hover:text-primary">
              Configuración
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">Sucursales & Sedes</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Gestión de Sucursales & Sedes
          </h1>
          <p className="mt-1 text-xs text-muted">
            Administra las ubicaciones físicas, direcciones y teléfonos operativos de tu gimnasio.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSucursales(true)}
            disabled={refreshing || loading}
            title="Refrescar lista"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-primary/30"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Sucursal</span>
          </button>
        </div>
      </div>

      {/* ── Banner de Feedback ───────────────────────────────────────── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center justify-between rounded-xl border p-4 text-xs font-semibold ${
              feedback.type === 'success'
                ? 'border-primary/20 bg-primary/10 text-primary'
                : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Barra de Búsqueda y Filtros ───────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-surface-border bg-surface/70 p-4 backdrop-blur-sm">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, ciudad, dirección o teléfono..."
            className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por Estado */}
        <div className="flex items-center gap-1 rounded-xl border border-surface-border bg-background p-1">
          <button
            type="button"
            onClick={() => setEstadoFilter('TODOS')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              estadoFilter === 'TODOS'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Todas ({sucursales.length})
          </button>
          <button
            type="button"
            onClick={() => setEstadoFilter('ACTIVO')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              estadoFilter === 'ACTIVO'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Activas ({sucursales.filter((s) => String(s.estado).toLowerCase() === 'activo').length})
          </button>
          <button
            type="button"
            onClick={() => setEstadoFilter('INACTIVO')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              estadoFilter === 'INACTIVO'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Inactivas ({sucursales.filter((s) => String(s.estado).toLowerCase() !== 'activo').length})
          </button>
        </div>
      </div>

      {/* ── Grid de Tarjetas de Sucursales ──────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs">Cargando sucursales...</span>
        </div>
      ) : filteredSucursales.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-surface-border bg-surface p-12 text-center text-muted">
          <Building className="h-10 w-10 text-muted/50" />
          <div>
            <h3 className="text-sm font-bold text-foreground">No se encontraron sucursales</h3>
            <p className="mt-1 text-xs">
              {searchTerm || estadoFilter !== 'TODOS'
                ? 'Prueba modificando tus términos de búsqueda o filtros.'
                : 'Aún no has registrado ninguna sucursal.'}
            </p>
          </div>
          {!searchTerm && estadoFilter === 'TODOS' && (
            <button
              onClick={handleOpenCreateModal}
              className="mt-2 text-xs font-bold text-primary hover:underline"
            >
              + Crear la primera sucursal
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSucursales.map((sucursal, idx) => {
            const isActivo = String(sucursal.estado).toLowerCase() === 'activo';
            const isCurrentActive = activeSucursalId
              ? sucursal.id === activeSucursalId
              : idx === 0;

            return (
              <motion.div
                key={sucursal.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative flex flex-col justify-between rounded-2xl border bg-surface/90 p-5 backdrop-blur-xl transition-all hover:shadow-lg ${
                  isCurrentActive
                    ? 'border-primary/50 shadow-md shadow-primary/10 ring-1 ring-primary/30'
                    : 'border-surface-border'
                }`}
              >
                <div>
                  {/* Top bar de la card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                          isActivo
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}
                      >
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {sucursal.nombre}
                        </h3>
                        {sucursal.ciudad && (
                          <p className="flex items-center gap-1 text-[11px] text-muted">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span>{sucursal.ciudad}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isActivo
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActivo ? 'bg-primary' : 'bg-red-500'
                          }`}
                        />
                        {isActivo ? 'ACTIVA' : 'INACTIVA'}
                      </span>

                      {isCurrentActive && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Sucursal Activa</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="mt-5 space-y-2 text-xs border-t border-surface-border pt-4">
                    <div className="flex items-start gap-2 text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-muted flex-shrink-0 mt-0.5" />
                      <span className="text-muted">
                        {sucursal.direccion || 'Sin dirección registrada'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-foreground">
                      <Phone className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                      <span className="text-muted">
                        {sucursal.telefono || 'Sin teléfono de contacto'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones de la tarjeta */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-4">
                  <div>
                    {!isCurrentActive && isActivo ? (
                      <button
                        onClick={() => {
                          setActiveSucursalId(sucursal.id);
                          setFeedback({
                            type: 'success',
                            message: `Has cambiado a la sucursal "${sucursal.nombre}".`,
                          });
                        }}
                        className="flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        <Check className="h-3 w-3" />
                        <span>Seleccionar</span>
                      </button>
                    ) : isCurrentActive ? (
                      <span className="text-[11px] font-semibold text-primary">
                        Sede en uso
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(sucursal)}
                      className="flex items-center gap-1.5 rounded-xl border border-surface-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-primary hover:text-primary"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => handleToggleEstado(sucursal)}
                      title={isActivo ? 'Desactivar sucursal' : 'Activar sucursal'}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActivo
                          ? 'border-surface-border bg-background text-muted hover:border-red-500 hover:text-red-500'
                          : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white'
                      }`}
                    >
                      {isActivo ? (
                        <>
                          <PowerOff className="h-3 w-3" />
                          <span>Desactivar</span>
                        </>
                      ) : (
                        <>
                          <Power className="h-3 w-3" />
                          <span>Activar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modal de Creación / Edición ─────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Contenido del Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl backdrop-blur-2xl z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-surface-border p-5 bg-background/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
                    </h2>
                    <p className="text-[11px] text-muted">
                      {editingSucursal
                        ? 'Modifica los datos de contacto y ubicación'
                        : 'Registra una nueva sede para tu organización'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-border hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Nombre (Obligatorio) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="form-nombre"
                    className="text-[11px] font-bold uppercase tracking-wider text-muted"
                  >
                    Nombre de la Sucursal *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      id="form-nombre"
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej. Sucursal Central / Zona Sur"
                      className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Ciudad */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="form-ciudad"
                    className="text-[11px] font-bold uppercase tracking-wider text-muted"
                  >
                    Ciudad
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      id="form-ciudad"
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      placeholder="Ej. La Paz / El Alto / Cochabamba"
                      className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="form-direccion"
                    className="text-[11px] font-bold uppercase tracking-wider text-muted"
                  >
                    Dirección
                  </label>
                  <input
                    id="form-direccion"
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Ej. Av. 16 de Julio #1234, Edif. Torre Azul"
                    className="w-full rounded-xl border border-surface-border bg-background py-2.5 px-3 text-xs text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Teléfono */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="form-telefono"
                    className="text-[11px] font-bold uppercase tracking-wider text-muted"
                  >
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      id="form-telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="+591 2 2123456"
                      className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Estado */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="form-estado"
                    className="text-[11px] font-bold uppercase tracking-wider text-muted"
                  >
                    Estado Operativo
                  </label>
                  <select
                    id="form-estado"
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({ ...formData, estado: e.target.value as EstadoGeneral })
                    }
                    className="w-full rounded-xl border border-surface-border bg-background py-2.5 px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="activo">Activo (En funcionamiento)</option>
                    <option value="inactivo">Inactivo (Cerrada temporalmente)</option>
                  </select>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={modalSubmitting}
                    className="rounded-xl border border-surface-border px-4 py-2.5 text-xs font-semibold text-muted transition-colors hover:border-foreground/20 hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark disabled:opacity-50"
                  >
                    {modalSubmitting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>{editingSucursal ? 'Guardar Cambios' : 'Crear Sucursal'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
