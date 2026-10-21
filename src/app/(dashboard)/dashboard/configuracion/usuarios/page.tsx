'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Users,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  User,
  Building,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { UsuarioSistema, Sucursal, RolUsuario, EstadoGeneral } from '@/types/database';
import { FALLBACK_ORGANIZACION } from '@/lib/seed';

export default function GestionUsuariosPage() {
  const { profile } = useAuth();
  const currentOrgId = profile?.organizacion_id || FALLBACK_ORGANIZACION.id;

  // Lista de usuarios y sucursales
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Filtro de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'todos' | RolUsuario>('todos');

  // Estado del formulario
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ci, setCi] = useState('');
  const [rol, setRol] = useState<RolUsuario>('recepcionista');
  const [sucursalIds, setSucursalIds] = useState<string[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userBranches, setUserBranches] = useState<Record<string, string[]>>({});

  // Estados de retroalimentación
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Cargar usuarios de la organización
  const loadData = useCallback(async () => {
    setLoadingList(true);
    try {
      // 1. Cargar sucursales
      const { data: sucursalesData } = await supabase
        .from('sucursales')
        .select('*');

      if (sucursalesData) {
        setSucursales(sucursalesData);
        if (sucursalesData.length > 0 && sucursalIds.length === 0) {
          setSucursalIds([sucursalesData[0].id]);
        }
      }

      // 2. Cargar usuarios
      let query = supabase.from('usuarios_sistema').select('*');
      if (currentOrgId && currentOrgId !== FALLBACK_ORGANIZACION.id) {
        query = query.eq('organizacion_id', currentOrgId);
      }

      const { data: usuariosData, error: usuariosError } = await query.order('nombre', {
        ascending: true,
      });

      if (usuariosError) {
        console.warn('[Usuarios] Error al cargar lista:', usuariosError.message);
      } else if (usuariosData) {
        setUsuarios(usuariosData);
      }

      const { data: assignments, error: assignmentsError } = await supabase
        .from('usuario_sucursales')
        .select('usuario_id, sucursal_id');
      if (assignmentsError) {
        console.warn('[Usuarios] No se pudieron cargar las asignaciones múltiples:', assignmentsError.message);
      } else {
        const mapped = (assignments || []).reduce<Record<string, string[]>>(
          (acc, item: { usuario_id: string; sucursal_id: string }) => {
          acc[item.usuario_id] = [...(acc[item.usuario_id] || []), item.sucursal_id];
          return acc;
          },
          {}
        );
        setUserBranches(mapped);
      }
    } catch (err: unknown) {
      console.error('[Usuarios] Error:', err);
    } finally {
      setLoadingList(false);
    }
  }, [currentOrgId, sucursalIds.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manejar creación de nuevo usuario
  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      if (!nombre.trim() || !apellido.trim() || !email.trim() || !ci.trim() || sucursalIds.length === 0) {
        throw new Error('Completa nombre, apellido, CI y al menos una sucursal');
      }

      if (editingUserId) {
        const { error: updateError } = await supabase
          .from('usuarios_sistema')
          .update({
            ci: ci.trim(),
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email: email.trim().toLowerCase(),
            rol,
            sucursal_id: sucursalIds[0] || null,
          })
          .eq('id', editingUserId);
        if (updateError) throw updateError;
        await saveUserBranches(editingUserId);
      } else {
        if (!password.trim()) throw new Error('La contraseña inicial es obligatoria');
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: { data: { nombre: nombre.trim(), apellido: apellido.trim(), rol } },
        });
        if (authError) throw authError;
        const targetUserId = authData.user?.id;
        const { error: insertError } = await supabase.from('usuarios_sistema').insert([{
          ...(targetUserId ? { id: targetUserId } : {}),
          organizacion_id: currentOrgId,
          sucursal_id: sucursalIds[0] || null,
          ci: ci.trim(),
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim().toLowerCase(),
          rol,
          estado: 'activo' as EstadoGeneral,
        }]);
        if (insertError) throw insertError;
        if (targetUserId) await saveUserBranches(targetUserId);
      }

      setFeedback({
        type: 'success',
        message: editingUserId ? 'Usuario actualizado exitosamente.' : `¡Usuario ${nombre} ${apellido} (${rol}) creado exitosamente!`,
      });

      // Limpiar formulario y recargar
      setNombre('');
      setApellido('');
      setEmail('');
      setPassword('');
      setCi('');
      setSucursalIds(sucursales[0] ? [sucursales[0].id] : []);
      setEditingUserId(null);
      setShowForm(false);
      await loadData();
    } catch (err: unknown) {
      console.error('[Crear Usuario] Error:', err);
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'No se pudo crear el usuario. Revisa los datos ingresados.',
      });
    } finally {
      setSubmitting(false);
    }

  }

  async function saveUserBranches(userId: string) {
    const { error: deleteError } = await supabase.from('usuario_sucursales').delete().eq('usuario_id', userId);
    if (deleteError) throw deleteError;
    const { error: insertError } = await supabase.from('usuario_sucursales').insert(
      sucursalIds.map((sucursal_id) => ({ usuario_id: userId, sucursal_id }))
    );
    if (insertError) throw insertError;
  }

  function startEditingUser(usuario: UsuarioSistema) {
    setEditingUserId(usuario.id);
    setNombre(usuario.nombre);
    setApellido(usuario.apellido);
    setEmail(usuario.email);
    setCi(usuario.ci || '');
    setRol(usuario.rol);
    setPassword('');
    setSucursalIds(userBranches[usuario.id] || (usuario.sucursal_id ? [usuario.sucursal_id] : []));
    setShowForm(true);
    setFeedback(null);
  }

  function resetForm() {
    setShowForm(false);
    setEditingUserId(null);
    setNombre('');
    setApellido('');
    setEmail('');
    setPassword('');
    setCi('');
    setSucursalIds(sucursales[0] ? [sucursales[0].id] : []);
  }

  // Alternar estado activo / inactivo
  async function toggleUserStatus(usuario: UsuarioSistema) {
    const nextState: EstadoGeneral = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      const { error } = await supabase
        .from('usuarios_sistema')
        .update({ estado: nextState })
        .eq('id', usuario.id);

      if (!error) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id === usuario.id ? { ...u, estado: nextState } : u))
        );
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  }

  // Usuarios filtrados por búsqueda y rol
  const filteredUsers = usuarios.filter((u) => {
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'todos' || u.rol === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* ── Breadcrumb y Título ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/dashboard/configuracion" className="hover:text-primary transition-colors">
              Configuración
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">Personal & Usuarios</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Gestión de Personal del Sistema
          </h1>
          <p className="mt-1 text-xs text-muted">
            Administra los roles de acceso (Administradores, Recepción y Entrenadores) para tu organización.
          </p>
        </div>

        {/* Botón de acción */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            title="Refrescar lista"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-border bg-surface text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${loadingList ? 'animate-spin text-primary' : ''}`} />
          </button>

          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark"
          >
            <UserPlus className="h-4 w-4" />
            <span>{showForm ? 'Cerrar Formulario' : 'Nuevo Usuario'}</span>
          </button>
        </div>
      </div>

      {/* ── Banner de Feedback ───────────────────────────────────────── */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'border-primary/20 bg-primary/10 text-primary'
              : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── Formulario de Registro de Usuario (Colapsable) ──────────── */}
      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-surface p-6 shadow-md transition-all sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-surface-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {editingUserId ? 'Editar Colaborador' : 'Registrar Nuevo Colaborador'}
                </h3>
                <p className="text-xs text-muted">
                  {editingUserId
                    ? 'Actualiza los datos del colaborador y sus sucursales asignadas.'
                    : 'Crea las credenciales de acceso a Supabase y vincula su perfil en la organización.'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveUser} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Lucas"
                    className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-9 pr-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Apellido */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Ej. Gómez"
                  className="w-full rounded-xl border border-surface-border bg-background py-2.5 px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lucas.gomez@gymdemo.com"
                    className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-9 pr-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* CI */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">CI</label>
                <input
                  type="text"
                  required
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  placeholder="Ej. 12345678"
                  className="w-full rounded-xl border border-surface-border bg-background py-2.5 px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Contraseña Inicial */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Contraseña Inicial
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="password"
                    required={!editingUserId}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingUserId ? 'No se modifica aquí' : 'Mínimo 6 caracteres'}
                    className="w-full rounded-xl border border-surface-border bg-background py-2.5 pl-9 pr-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Rol */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Rol en el Sistema
                </label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as RolUsuario)}
                  className="w-full rounded-xl border border-surface-border bg-background py-2.5 px-3 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="recepcionista">Recepción (Control de Accesos)</option>
                  <option value="admin">Administrador (Control Total)</option>
                  <option value="instructor">Entrenador / Instructor</option>
                </select>
              </div>

              {/* Sucursal asignada */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Sucursal Asignada
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <div className="rounded-xl border border-surface-border bg-background py-2.5 pl-9 pr-3 text-xs text-foreground">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {sucursales.map((s) => (
                        <label key={s.id} className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={sucursalIds.includes(s.id)}
                            onChange={() =>
                              setSucursalIds((current) =>
                                current.includes(s.id)
                                  ? current.filter((id) => id !== s.id)
                                  : [...current, s.id]
                              )
                            }
                            className="h-3.5 w-3.5 accent-primary"
                          />
                          <span>{s.nombre} ({s.ciudad || 'Principal'})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-surface-border px-5 py-2.5 text-xs font-bold text-muted transition-colors hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{editingUserId ? 'Guardar Cambios' : 'Guardar y Registrar'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filtros y Búsqueda ───────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, apellido o correo..."
            className="w-full rounded-xl border border-surface-border bg-surface py-2.5 pl-10 pr-4 text-xs text-foreground outline-none transition-all placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">Filtrar rol:</span>
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as 'todos' | RolUsuario)
            }
            className="rounded-xl border border-surface-border bg-surface py-2 px-3 text-xs text-foreground outline-none transition-all focus:border-primary"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="recepcionista">Recepción</option>
            <option value="instructor">Entrenadores</option>
          </select>
        </div>
      </div>

      {/* ── Tabla Dinámica de Usuarios ───────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-sm">
        <div className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Usuarios Registrados ({filteredUsers.length})
            </h2>
          </div>
        </div>

        {loadingList ? (
          <div className="p-12 text-center text-xs text-muted">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 font-medium">Cargando personal de la organización...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="mx-auto h-8 w-8 text-muted/50" />
            <p className="mt-3 text-sm font-bold text-foreground">No se encontraron usuarios</p>
            <p className="mt-1 text-xs text-muted">
              {searchTerm
                ? 'Intenta con otro término de búsqueda'
                : 'Registra al primer miembro del equipo usando el botón "Nuevo Usuario".'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-border bg-background/50 text-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Colaborador</th>
                  <th className="px-6 py-3.5">Rol de Sistema</th>
                  <th className="px-6 py-3.5">Sucursal</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredUsers.map((u) => {
                  const initial = u.nombre.charAt(0).toUpperCase();
                  const assignedBranchIds = userBranches[u.id] || (u.sucursal_id ? [u.sucursal_id] : []);
                  const assignedBranches = assignedBranchIds
                    .map((id) => sucursales.find((s) => s.id === id)?.nombre)
                    .filter(Boolean);

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-background/40"
                    >
                      {/* Colaborador */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">
                              {u.nombre} {u.apellido}
                            </p>
                            <p className="text-[11px] text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4">
                        {u.rol === 'admin' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                            <Shield className="h-3 w-3" />
                            <span>Administrador</span>
                          </span>
                        )}
                        {u.rol === 'recepcionista' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 font-bold text-blue-600 dark:text-blue-400">
                            <span>Recepción</span>
                          </span>
                        )}
                        {u.rol === 'instructor' && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-bold text-amber-600 dark:text-amber-400">
                            <span>Entrenador</span>
                          </span>
                        )}
                      </td>

                      {/* Sucursal */}
                      <td className="px-6 py-4 text-muted">
                        {assignedBranches.length > 0 ? assignedBranches.join(', ') : 'Sin asignar'}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            u.estado === 'activo'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-muted/20 text-muted'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.estado === 'activo' ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                          <span className="capitalize">{u.estado}</span>
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEditingUser(u)}
                            title="Editar usuario"
                            className="rounded-lg border border-surface-border p-1.5 text-muted transition-colors hover:border-primary hover:text-primary"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(u)}
                            className="rounded-lg border border-surface-border px-3 py-1 text-[11px] font-semibold text-muted transition-colors hover:border-primary hover:text-primary"
                          >
                            {u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
