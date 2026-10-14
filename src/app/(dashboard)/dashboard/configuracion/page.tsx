import Link from 'next/link';
import { Users, Building, Shield, ChevronRight } from 'lucide-react';

const configSections = [
  {
    title: 'Personal & Usuarios del Sistema',
    desc: 'Registra administradores, recepcionistas y entrenadores. Controla permisos y credenciales.',
    href: '/dashboard/configuracion/usuarios',
    icon: Users,
    badge: 'Seguridad',
  },
  {
    title: 'Sucursales & Sedes',
    desc: 'Administra las diferentes ubicaciones físicas, direcciones y teléfonos operativos de tu gimnasio.',
    href: '/dashboard/configuracion/sucursales',
    icon: Building,
    badge: 'Sedes',
  },
  {
    title: 'Políticas de Acceso & Torniquetes',
    desc: 'Configura métodos de entrada biométrica, tolerancia de vencimiento y lectores QR.',
    href: '#',
    icon: Shield,
    badge: 'Hardware',
  },
];

export default function ConfiguracionHubPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configuración del Sistema
        </h1>
        <p className="mt-1 text-xs text-muted">
          Ajustes generales de la organización, sucursales y personal operativo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {configSections.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group relative flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-surface-border bg-background px-2.5 py-0.5 text-[10px] font-bold text-muted">
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1 text-xs font-bold text-primary">
                <span>Gestionar</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
