'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

/* ── Ítems de navegación ──────────────────────────────────────────────────── */
const navItems = [
  {
    href: '/dashboard',
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    label: 'Inicio',
  },
  {
    href: '/dashboard/asistencias',
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    label: 'Asistencias',
  },
  {
    href: '/dashboard/clientes',
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Socios',
  },
  {
    href: '/dashboard/membresias',
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    label: 'Membresías',
  },
  {
    href: '/dashboard/configuracion/sucursales',
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    label: 'Sucursales',
  },
  {
    href: '/dashboard/configuracion/usuarios',
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    label: 'Personal / Usuarios',
  },
  {
    href: '/dashboard/configuracion',
    icon: (
      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Configuración',
  },
];

/* ── Iconos SVG auxiliares ─────────────────────────────────────────────────── */
function MenuIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Sidebar — Desktop: colapsable con toggle + hover-peek
              Móvil:   drawer overlay con hamburguesa
   ══════════════════════════════════════════════════════════════════════════════ */
export default function Sidebar({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();

  // Estado del sidebar en desktop
  const [hovered, setHovered] = useState(false);

  // Estado del drawer en móvil
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cerrar drawer en móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // En desktop, la barra se "expande" visualmente si no está colapsada O si está en hover
  const isExpanded = !collapsed || hovered;

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await signOut();
    router.replace('/login');
  }

  /* ── Contenido compartido del sidebar ─────────────────────────────────── */
  function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
    const showLabels = isMobile || isExpanded;
    return (
      <>
        {/* Cabecera */}
        <div className="flex h-16 items-center border-b border-surface-border px-4 gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white flex-shrink-0">
            G
          </span>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              showLabels ? 'w-auto opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <p className="text-sm font-bold text-foreground whitespace-nowrap">GymDemo</p>
            <p className="text-xs text-muted whitespace-nowrap uppercase tracking-wider text-[10px]">
              {profile?.rol ? profile.rol : 'Recepción'}
            </p>
          </div>

        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {item.icon}
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
                    showLabels ? 'w-auto opacity-100' : 'w-0 opacity-0'
                  }`}
                >
                  {item.label}
                </span>

                {/* Tooltip cuando está colapsado y no hover */}
                {!isMobile && collapsed && !hovered && (
                  <span className="pointer-events-none absolute left-full z-50 ml-3 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-surface-border p-4">
          <button
            onClick={handleLogout}
            className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <LogoutIcon />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
                showLabels ? 'w-auto opacity-100' : 'w-0 opacity-0'
              }`}
            >
              Cerrar sesión
            </span>

            {/* Tooltip cuando colapsado */}
            {!isMobile && collapsed && !hovered && (
              <span className="pointer-events-none absolute left-full z-50 ml-3 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Cerrar sesión
              </span>
            )}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Botón hamburguesa (móvil) ─────────────────────────────────────── */}
      <button
        id="mobile-menu-toggle"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-muted shadow-md transition-colors hover:text-primary lg:hidden"
        aria-label="Abrir menú"
      >
        <MenuIcon />
      </button>

      {/* ── Overlay + Drawer (móvil) ──────────────────────────────────────── */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />
      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-surface shadow-xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Botón cerrar */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:text-primary"
          aria-label="Cerrar menú"
        >
          <CloseIcon />
        </button>
        <SidebarContent isMobile />
      </aside>

      {/* ── Sidebar desktop ───────────────────────────────────────────────── */}
      <aside
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`hidden flex-shrink-0 flex-col border-r border-surface-border bg-surface transition-all duration-300 ease-in-out lg:flex ${
          isExpanded ? 'w-60' : 'w-[4.5rem]'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

export function MobileMenuPlaceholder() {
  return <div className="w-10 lg:hidden" />;
}
