'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  UserCheck,
  UserX,
  Camera,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Cliente, Genero, EstadoGeneral } from '@/types/database';
import { FALLBACK_ORGANIZACION } from '@/lib/seed';

type FilterEstado = 'TODOS' | 'ACTIVO' | 'INACTIVO';

interface ClienteFormData {
  ci: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  genero: Genero | '';
  foto_url: string;
}

const INITIAL_FORM: ClienteFormData = {
  ci: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  genero: '',
  foto_url: '',
};

export default function ClientesPage() {
  const { profile } = useAuth();
  const currentOrgId = profile?.organizacion_id || FALLBACK_ORGANIZACION.id;

  // Estados de lista y carga
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<FilterEstado>('TODOS');

  // Modal (Nuevo / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<ClienteFormData>(INITIAL_FORM);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Subida de fotografía a Supabase Storage
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Alertas y feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Cargar Clientes de la organización
  const loadClientes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let query = supabase.from('clientes').select('*');

      if (currentOrgId && currentOrgId !== FALLBACK_ORGANIZACION.id) {
        query = query.eq('organizacion_id', currentOrgId);
      }

      const { data, error } = await query.order('ci', { ascending: true });

      if (error) {
        console.warn('[Clientes] Error al cargar clientes:', error.message);
        setFeedback({
          type: 'error',
          message: 'Error al consultar la lista de clientes: ' + error.message,
        });
      } else if (data) {
        setClientes(data);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[Clientes] Error inesperado:', err);
      setFeedback({
        type: 'error',
        message: e.message || 'Ocurrió un error al cargar los clientes.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentOrgId]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  // Abrir modal para Crear
  const handleOpenCreateModal = () => {
    setEditingCliente(null);
    setFormData(INITIAL_FORM);
    setPhotoPreview(null);
    setUploadedPhotoPath(null);
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFeedback(null);
    setIsModalOpen(true);
  };

  // Abrir modal para Editar
  const handleOpenEditModal = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      ci: cliente.ci || '',
      nombre: cliente.nombre || '',
      apellido: cliente.apellido || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      fecha_nacimiento: cliente.fecha_nacimiento || '',
      genero: cliente.genero
        ? (String(cliente.genero).toUpperCase() === 'M'
            ? 'M'
            : String(cliente.genero).toUpperCase() === 'F'
              ? 'F'
              : ('OTRO' as Genero))
        : '',
      foto_url: cliente.foto_url || '',
    });
    setPhotoPreview(cliente.foto_url || null);
    setUploadedPhotoPath(null);
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFeedback(null);
    setIsModalOpen(true);
  };

  const closeModal = async (cleanupUploadedPhoto: boolean) => {
    if (cleanupUploadedPhoto && uploadedPhotoPath) {
      const { error } = await supabase.storage.from('clientes-fotos').remove([uploadedPhotoPath]);
      if (error) {
        console.error('[Clientes Storage Cleanup] Error:', error);
      }
    }
    setIsModalOpen(false);
    setEditingCliente(null);
    setFormData(INITIAL_FORM);
    setPhotoPreview(null);
    setUploadedPhotoPath(null);
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleCloseModal = () => closeModal(true);

  // Manejador de subida de fotografía a Supabase Storage
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validar formato permitido (png, jpg, jpeg, webp)
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!validMimeTypes.includes(file.type) && !hasValidExt) {
      setFeedback({
        type: 'error',
        message: 'Formato no válido. Solo se admiten imágenes PNG, JPG, JPEG o WEBP.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validar tamaño (máximo 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFeedback({
        type: 'error',
        message: 'El tamaño de la imagen no debe superar los 5 MB.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 3. Generar vista previa inmediata
    const localPreviewUrl = URL.createObjectURL(file);
    setPhotoPreview(localPreviewUrl);
    setUploadingPhoto(true);
    setFeedback(null);

    try {
      // 4. Generar nombre de archivo único para evitar colisiones
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = `${currentOrgId}/${Date.now()}_${cleanFileName}.${fileExt}`;

      // 5. Subir imagen a Supabase Storage en el bucket 'clientes-fotos'
      const { error: uploadError } = await supabase.storage
        .from('clientes-fotos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 6. Obtener URL pública resultante
      const {
        data: { publicUrl },
      } = supabase.storage.from('clientes-fotos').getPublicUrl(filePath);
      const previousUploadedPhotoPath = uploadedPhotoPath;

      setFormData((prev) => ({
        ...prev,
        foto_url: publicUrl,
      }));
      setPhotoPreview(publicUrl);
      setUploadedPhotoPath(filePath);
      if (previousUploadedPhotoPath) {
        const { error: cleanupError } = await supabase.storage
          .from('clientes-fotos')
          .remove([previousUploadedPhotoPath]);
        if (cleanupError) {
          console.error('[Clientes Storage Cleanup] Error:', cleanupError);
        }
      }

      setFeedback({
        type: 'success',
        message: 'Fotografía subida y vinculada correctamente.',
      });
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      console.error('[Clientes Storage Upload] Error:', err);
      let errorMsg = errorObj.message || 'Error al subir la fotografía.';
      if (errorMsg.toLowerCase().includes('bucket not found')) {
        errorMsg = 'El bucket "clientes-fotos" no existe en Supabase Storage. Créalo como bucket público en tu consola de Supabase.';
      }
      setFeedback({
        type: 'error',
        message: errorMsg,
      });
      // Revertir a la foto previa si falló la subida
      setPhotoPreview(formData.foto_url || null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Quitar fotografía seleccionada
  const handleRemovePhoto = async () => {
    if (uploadedPhotoPath) {
      const { error } = await supabase.storage.from('clientes-fotos').remove([uploadedPhotoPath]);
      if (error) {
        console.error('[Clientes Storage Cleanup] Error:', error);
      }
      setUploadedPhotoPath(null);
    }
    setPhotoPreview(null);
    setFormData((prev) => ({ ...prev, foto_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Guardar (Crear o Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setFeedback(null);

    const ciTrim = formData.ci.trim();
    const nombreTrim = formData.nombre.trim();
    const apellidoTrim = formData.apellido.trim();

    if (!ciTrim || !nombreTrim || !apellidoTrim) {
      setFeedback({
        type: 'error',
        message: 'Los campos Cédula (CI), Nombre y Apellido son obligatorios.',
      });
      setModalSubmitting(false);
      return;
    }

    try {
      const genero = formData.genero
        ? (String(formData.genero).toUpperCase() === 'MASCULINO' ||
          String(formData.genero).toUpperCase() === 'M'
            ? 'M'
            : String(formData.genero).toUpperCase() === 'FEMENINO' ||
                String(formData.genero).toUpperCase() === 'F'
              ? 'F'
              : ('OTRO' as Genero))
        : null;

      if (editingCliente) {
        // Modo Edición
        // Verificar si se cambió el CI y si colisiona con otro cliente de la misma organización
        if (ciTrim !== editingCliente.ci) {
          const { data: existingCi } = await supabase
            .from('clientes')
            .select('id')
            .eq('organizacion_id', currentOrgId)
            .eq('ci', ciTrim)
            .neq('id', editingCliente.id)
            .maybeSingle();

          if (existingCi) {
            setFeedback({
              type: 'error',
              message: `Ya existe otro socio registrado con la Cédula/DNI: ${ciTrim}`,
            });
            setModalSubmitting(false);
            return;
          }
        }

        const updatePayload = {
          ci: ciTrim,
          nombre: nombreTrim,
          apellido: apellidoTrim,
          email: formData.email.trim() || null,
          telefono: formData.telefono.trim() || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          genero,
          foto_url: formData.foto_url.trim() || null,
        };

        let { error } = await supabase
          .from('clientes')
          .update(updatePayload)
          .eq('id', editingCliente.id);

        if (error) {
          throw error;
        }

        setFeedback({
          type: 'success',
          message: `Socio ${nombreTrim} ${apellidoTrim} actualizado con éxito.`,
        });
        setUploadedPhotoPath(null);
        closeModal(false);
        await loadClientes();
      } else {
        // Modo Creación
        // Validar unicidad de CI en la organización
        const { data: existingCi } = await supabase
          .from('clientes')
          .select('id')
          .eq('organizacion_id', currentOrgId)
          .eq('ci', ciTrim)
          .maybeSingle();

        if (existingCi) {
          setFeedback({
            type: 'error',
            message: `El socio con Cédula/DNI ${ciTrim} ya se encuentra registrado en esta organización.`,
          });
          setModalSubmitting(false);
          return;
        }

        const insertPayload = {
          organizacion_id: currentOrgId,
          ci: ciTrim,
          nombre: nombreTrim,
          apellido: apellidoTrim,
          email: formData.email.trim() || null,
          telefono: formData.telefono.trim() || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          genero,
          foto_url: formData.foto_url.trim() || null,
          estado: 'ACTIVO' as EstadoGeneral,
        };

        let { error } = await supabase
          .from('clientes')
          .insert([insertPayload]);

        if (error) {
          throw error;
        }

        setFeedback({
          type: 'success',
          message: `¡Socio ${nombreTrim} ${apellidoTrim} registrado exitosamente!`,
        });
        setUploadedPhotoPath(null);
        closeModal(false);
        await loadClientes();
      }
    } catch (err: unknown) {
      if (uploadedPhotoPath) {
        const { error: cleanupError } = await supabase.storage
          .from('clientes-fotos')
          .remove([uploadedPhotoPath]);
        if (cleanupError) {
          console.error('[Clientes Storage Cleanup] Error:', cleanupError);
        }
        setUploadedPhotoPath(null);
      }
      const e = err as { message?: string };
      console.error('[Clientes Form] Error:', err);
      setFeedback({
        type: 'error',
        message: e.message || 'Ocurrió un error al procesar la solicitud.',
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Alternar Estado (Activo / Inactivo)
  const handleToggleEstado = async (cliente: Cliente) => {
    const nuevoEstado: EstadoGeneral =
      String(cliente.estado).toUpperCase() === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    try {
      const { error } = await supabase
        .from('clientes')
        .update({ estado: nuevoEstado })
        .eq('id', cliente.id);

      if (error) {
        throw error;
      }

      setClientes((prev) =>
        prev.map((c) => (c.id === cliente.id ? { ...c, estado: nuevoEstado } : c))
      );

      setFeedback({
        type: 'success',
        message: `Estado de ${cliente.nombre} ${cliente.apellido} cambiado a ${nuevoEstado.toUpperCase()}.`,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[Toggle Estado] Error:', err);
      setFeedback({
        type: 'error',
        message: 'No se pudo actualizar el estado del socio: ' + (e.message || ''),
      });
    }
  };

  // Filtrado reactivo en memoria
  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const search = searchTerm.toLowerCase().trim();
      const matchSearch =
        !search ||
        (c.ci && c.ci.toLowerCase().includes(search)) ||
        (c.nombre && c.nombre.toLowerCase().includes(search)) ||
        (c.apellido && c.apellido.toLowerCase().includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search)) ||
        (c.telefono && c.telefono.toLowerCase().includes(search));

      const isActivo = String(c.estado).toUpperCase() === 'ACTIVO';
      const matchEstado =
        estadoFilter === 'TODOS' ||
        (estadoFilter === 'ACTIVO' && isActivo) ||
        (estadoFilter === 'INACTIVO' && !isActivo);

      return matchSearch && matchEstado;
    });
  }, [clientes, searchTerm, estadoFilter]);

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
            <span className="font-semibold text-foreground">Gestión de Clientes</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Gestión de Socios & Clientes
          </h1>
          <p className="mt-1 text-xs text-muted">
            Registra, edita y administra los socios del gimnasio para accesos y membresías.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadClientes(true)}
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
            <UserPlus className="h-4 w-4" />
            <span>Nuevo Socio</span>
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
            placeholder="Buscar por Cédula (CI), nombre, apellido, email o teléfono..."
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
            Todos ({clientes.length})
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
            Activos (
            {clientes.filter((c) => String(c.estado).toUpperCase() === 'ACTIVO').length}
            )
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
            Inactivos (
            {clientes.filter((c) => String(c.estado).toUpperCase() !== 'ACTIVO').length}
            )
          </button>
        </div>
      </div>

      {/* ── Tabla de Clientes ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface/90 shadow-sm backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="border-b border-surface-border bg-background/50 text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3.5">Socio</th>
                <th className="px-5 py-3.5">Cédula / DNI</th>
                <th className="px-5 py-3.5">Contacto</th>
                <th className="px-5 py-3.5">Género</th>
                <th className="px-5 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-xs">Cargando socios...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-muted/50" />
                      <span className="text-xs font-medium">
                        {searchTerm || estadoFilter !== 'TODOS'
                          ? 'No se encontraron socios que coincidan con los filtros aplicados.'
                          : 'Aún no hay socios registrados en esta organización.'}
                      </span>
                      {!searchTerm && estadoFilter === 'TODOS' && (
                        <button
                          onClick={handleOpenCreateModal}
                          className="mt-2 text-xs font-bold text-primary hover:underline"
                        >
                          + Registrar el primer socio
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClientes.map((cliente) => {
                  const isActivo = String(cliente.estado).toUpperCase() === 'ACTIVO';
                  const iniciales = `${cliente.nombre?.[0] || ''}${
                    cliente.apellido?.[0] || ''
                  }`.toUpperCase();

                  return (
                    <tr
                      key={cliente.id}
                      className="transition-colors hover:bg-background/60"
                    >
                      {/* Avatar y Nombre */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {cliente.foto_url ? (
                            <img
                              src={cliente.foto_url}
                              alt={`${cliente.nombre} ${cliente.apellido}`}
                              className="h-9 w-9 rounded-full object-cover border border-surface-border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                              {iniciales || <Users className="h-4 w-4" />}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-foreground">
                              {cliente.nombre} {cliente.apellido}
                            </div>
                            {cliente.email && (
                              <div className="text-[11px] text-muted">{cliente.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CI */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-background px-2.5 py-1 font-mono text-xs font-bold text-foreground">
                          <CreditCard className="h-3 w-3 text-muted" />
                          {cliente.ci}
                        </span>
                      </td>

                      {/* Contacto */}
                      <td className="px-5 py-3.5">
                        {cliente.telefono ? (
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            <span>{cliente.telefono}</span>
                          </div>
                        ) : (
                          <span className="text-muted text-[11px]">Sin teléfono</span>
                        )}
                      </td>

                      {/* Género */}
                      <td className="px-5 py-3.5 capitalize text-muted text-xs">
                        {cliente.genero || '—'}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
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
                          {isActivo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Botón Editar */}
                          <button
                            onClick={() => handleOpenEditModal(cliente)}
                            title="Editar socio"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-background text-muted transition-colors hover:border-primary hover:text-primary"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Botón Activar/Desactivar */}
                          <button
                            onClick={() => handleToggleEstado(cliente)}
                            title={
                              isActivo
                                ? 'Desactivar socio'
                                : 'Activar socio'
                            }
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                              isActivo
                                ? 'border-surface-border bg-background text-muted hover:border-red-500 hover:text-red-500'
                                : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white'
                            }`}
                          >
                            {isActivo ? (
                              <UserX className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de Registro / Edición ──────────────────────────────── */}
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

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl backdrop-blur-2xl z-10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-surface-border p-5 bg-background/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {editingCliente ? 'Editar Socio' : 'Nuevo Socio'}
                    </h2>
                    <p className="text-[11px] text-muted">
                      {editingCliente
                        ? 'Modifica los datos del socio seleccionado'
                        : 'Ingresa los datos para registrar un nuevo socio'}
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
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* CI (Carnet de Identidad) - Campo Obligatorio */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="form-ci"
                    className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted"
                  >
                    <span>Cédula de Identidad / DNI *</span>
                    <span className="text-[10px] text-primary">Para acceso por teclado</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      id="form-ci"
                      type="text"
                      required
                      value={formData.ci}
                      onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                      placeholder="Ej. 12345678"
                      className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-10 pr-4 text-xs font-mono text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Nombres y Apellidos */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-nombre"
                      className="text-[11px] font-bold uppercase tracking-wider text-muted"
                    >
                      Nombre *
                    </label>
                    <input
                      id="form-nombre"
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      placeholder="Ej. Carlos"
                      className="w-full rounded-xl border border-surface-border bg-background py-2.5 px-3 text-xs text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-apellido"
                      className="text-[11px] font-bold uppercase tracking-wider text-muted"
                    >
                      Apellido *
                    </label>
                    <input
                      id="form-apellido"
                      type="text"
                      required
                      value={formData.apellido}
                      onChange={(e) =>
                        setFormData({ ...formData, apellido: e.target.value })
                      }
                      placeholder="Ej. Mendoza"
                      className="w-full rounded-xl border border-surface-border bg-background py-2.5 px-3 text-xs text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Contacto: Teléfono y Email */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        onChange={(e) =>
                          setFormData({ ...formData, telefono: e.target.value })
                        }
                        placeholder="+591 70000000"
                        className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-10 pr-3 text-xs text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-email"
                      className="text-[11px] font-bold uppercase tracking-wider text-muted"
                    >
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <input
                        id="form-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="socio@email.com"
                        className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-10 pr-3 text-xs text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Fecha de Nacimiento y Género */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-fecha-nac"
                      className="text-[11px] font-bold uppercase tracking-wider text-muted"
                    >
                      Fecha de Nacimiento
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                      <input
                        id="form-fecha-nac"
                        type="date"
                        value={formData.fecha_nacimiento}
                        onChange={(e) =>
                          setFormData({ ...formData, fecha_nacimiento: e.target.value })
                        }
                        className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-10 pr-3 text-xs text-foreground placeholder:text-muted/60 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="form-genero"
                      className="text-[11px] font-bold uppercase tracking-wider text-muted"
                    >
                      Género
                    </label>
                    <select
                      id="form-genero"
                      value={formData.genero ? String(formData.genero).toUpperCase() : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          genero: e.target.value as Genero | '',
                        })
                      }
                      className="w-full rounded-xl border border-surface-border bg-background py-2.5 px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">No especificado</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Fotografía del Socio con Supabase Storage */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Fotografía del Socio
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-surface-border bg-surface/50 p-3.5 transition-colors">
                    {/* Vista previa Avatar */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-surface-border bg-background shadow-sm flex items-center justify-center">
                      {photoPreview || formData.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photoPreview || formData.foto_url}
                          alt="Vista previa del socio"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted">
                          <Camera className="h-7 w-7 stroke-[1.5]" />
                          <span className="text-[10px] font-medium mt-0.5">Sin foto</span>
                        </div>
                      )}

                      {/* Overlay con spinner mientras se sube */}
                      {uploadingPhoto && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                          <RefreshCw className="h-5 w-5 animate-spin text-primary-light" />
                          <span className="text-[9px] font-semibold mt-1">Subiendo...</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones y descripción */}
                    <div className="flex-1 space-y-1.5 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="foto-upload-input"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handlePhotoSelect}
                          disabled={uploadingPhoto || modalSubmitting}
                          className="hidden"
                        />
                        <label
                          htmlFor="foto-upload-input"
                          className={`inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-all hover:border-primary hover:text-primary cursor-pointer ${
                            uploadingPhoto || modalSubmitting ? 'opacity-50 pointer-events-none' : ''
                          }`}
                        >
                          <UploadCloud className="h-3.5 w-3.5 text-primary" />
                          <span>
                            {photoPreview || formData.foto_url
                              ? 'Cambiar fotografía'
                              : 'Seleccionar imagen'}
                          </span>
                        </label>

                        {(photoPreview || formData.foto_url) && !uploadingPhoto && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={modalSubmitting}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10 hover:border-red-500/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Quitar</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-muted">
                        Formatos permitidos:{' '}
                        <span className="font-medium text-foreground">PNG, JPG, WEBP</span>. Máximo{' '}
                        <span className="font-medium text-foreground">5 MB</span>.
                      </p>

                      {uploadingPhoto && (
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] text-primary font-medium">
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <span>Subiendo archivo a Supabase Storage...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={modalSubmitting || uploadingPhoto}
                    className="rounded-xl border border-surface-border px-4 py-2.5 text-xs font-semibold text-muted transition-colors hover:border-foreground/20 hover:text-foreground disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting || uploadingPhoto}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark disabled:opacity-50"
                  >
                    {modalSubmitting ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : uploadingPhoto ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Subiendo foto...</span>
                      </>
                    ) : (
                      <span>{editingCliente ? 'Guardar Cambios' : 'Registrar Socio'}</span>
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
