'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UsuarioSistema, Sucursal } from '@/types/database';
import { ensureDatabaseSeeded, FALLBACK_ORGANIZACION, FALLBACK_SUCURSAL } from '@/lib/seed';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UsuarioSistema | null;
  activeSucursalId: string | null;
  setActiveSucursalId: (id: string | null) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  activeSucursalId: null,
  setActiveSucursalId: () => {},
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UsuarioSistema | null>(null);
  const [activeSucursalId, setActiveSucursalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      const email = currentUser.email;
      if (!email) return;

      const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (data && !error) {
        setProfile(data);
        if (!activeSucursalId && data.sucursal_id) {
          setActiveSucursalId(data.sucursal_id);
        }
      } else {
        // Si no existe perfil en usuarios_sistema, intentar crearlo con el seed
        const seedResult = await ensureDatabaseSeeded();
        const orgId = seedResult.organizacion?.id || FALLBACK_ORGANIZACION.id;
        const sucursalId = seedResult.sucursal?.id || null;

        const fullName =
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          email.split('@')[0] ||
          'Usuario';

        const parts = fullName.trim().split(' ');
        const nombre = currentUser.user_metadata?.nombre || parts[0] || 'Usuario';
        const apellido = currentUser.user_metadata?.apellido || parts.slice(1).join(' ') || '';

        // Contar usuarios para rol inicial
        const { count } = await supabase
          .from('usuarios_sistema')
          .select('*', { count: 'exact', head: true });

        const isFirst = (count ?? 0) === 0;

        const newProfile: UsuarioSistema = {
          id: currentUser.id,
          organizacion_id: orgId,
          sucursal_id: sucursalId,
          ci: null,
          nombre,
          apellido,
          email,
          rol: isFirst ? 'admin' : 'recepcionista',
          estado: 'activo',
        };

        const { data: inserted } = await supabase
          .from('usuarios_sistema')
          .insert([newProfile])
          .select()
          .single();

        setProfile(inserted || newProfile);
      }
    } catch (e) {
      console.warn('[AuthContext] Error al obtener perfil:', e);
      // Fallback a metadatos de usuario
      const email = currentUser.email || 'usuario@gymdemo.com';
      setProfile({
        id: currentUser.id,
        organizacion_id: FALLBACK_ORGANIZACION.id,
        sucursal_id: null,
        ci: null,
        nombre: currentUser.user_metadata?.nombre || email.split('@')[0],
        apellido: currentUser.user_metadata?.apellido || '',
        email,
        rol: 'admin',
        estado: 'activo',
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user);
        }
      } catch (err) {
        console.error('[AuthContext] Error al inicializar sesión:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Escuchar cambios de estado en Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user || null);

        if (newSession?.user) {
          await fetchProfile(newSession.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        activeSucursalId,
        setActiveSucursalId,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
