'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Sidebar from '@/components/ui/Sidebar';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LogOut, Menu, Shield } from 'lucide-react';

function DashboardProtectedArea({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Pantalla de carga mientras se verifica la sesión
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-white shadow-xl shadow-primary/20">
            G
          </div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-semibold text-muted">Verificando sesión segura...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario y ya terminó de cargar, la redirección está en camino
  if (!user) {
    return null;
  }

  const displayName = profile
    ? `${profile.nombre} ${profile.apellido}`.trim()
    : user.email?.split('@')[0] || 'Usuario';

  const userInitial = displayName.charAt(0).toUpperCase() || 'U';
  const roleName = profile?.rol ? profile.rol.toUpperCase() : 'RECEPCIÓN';

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Sidebar (desktop colapsable + móvil drawer) ──────────────── */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* ── Área principal ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-surface-border bg-surface px-4 lg:px-6">
          {/* Espaciador para el botón hamburguesa en móvil */}
          <div className="w-10 lg:hidden" />

          <button
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary lg:flex"
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Saludo personalizado con el nombre real del usuario autenticado */}
          <div className="hidden items-center gap-2 lg:flex">
            <p className="text-sm text-muted">
              Panel de control •{' '}
              <span className="font-semibold text-foreground">
                Bienvenido, {displayName}
              </span>
            </p>
          </div>

          {/* Acciones del header */}
          <div className="flex items-center gap-3">
            {/* Badge de Rol */}
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              <Shield className="h-3 w-3" />
              <span>{roleName}</span>
            </span>

            {/* Selector de Tema */}
            <ThemeToggle />

            {/* Perfil y Avatar con la inicial */}
            <div className="flex items-center gap-2">
              <div
                title={`${displayName} (${user.email})`}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm shadow-primary/20"
              >
                {userInitial}
              </div>
            </div>

            {/* Botón de cerrar sesión en topbar */}
            <button
              onClick={async () => {
                await signOut();
                router.replace('/login');
              }}
              title="Cerrar sesión"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border text-muted transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Contenido de cada página */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardProtectedArea>{children}</DashboardProtectedArea>
    </AuthProvider>
  );
}
