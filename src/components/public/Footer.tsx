import Link from 'next/link';
import { Dumbbell, MessageCircle, ShieldCheck, Sparkles, Globe, Mail, Share2 } from 'lucide-react';

const footerLinks = [
  {
    title: 'Producto',
    links: [
      { label: 'Control de Asistencia', href: '#features' },
      { label: 'Membresías & Pagos', href: '#features' },
      { label: 'Validación Biométrica', href: '#features' },
      { label: 'Multi-sucursal SaaS', href: '#features' },
    ],
  },
  {
    title: 'Plataforma',
    links: [
      { label: 'Panel de Recepción', href: '/dashboard' },
      { label: 'Portal del Socio', href: '/login' },
      { label: 'Planes & Precios', href: '#plans' },
      { label: 'Guía de Inicio', href: '#contact' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Acerca de GymDemo', href: '#contact' },
      { label: 'Seguridad & Datos', href: '#contact' },
      { label: 'Términos de Servicio', href: '#' },
      { label: 'Contacto Soporte', href: 'mailto:hola@gym-demo.com' },
    ],
  },
];

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-surface-border bg-surface text-foreground transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Grid */}
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand Col (2 spans on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
                <Dumbbell className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-foreground">
                Gym<span className="text-primary">Demo</span>
              </span>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Plataforma SaaS moderna para la administración integral de gimnasios, boxes de CrossFit y centros fitness. Velocidad en recepción, biometría y reportes en tiempo real.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://gym-demo.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Sitio Web"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-background text-muted transition-all hover:border-primary hover:text-primary hover:shadow-sm"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="mailto:hola@gym-demo.com"
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-background text-muted transition-all hover:border-primary hover:text-primary hover:shadow-sm"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-background text-muted transition-all hover:border-primary hover:text-primary hover:shadow-sm"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
              <a
                href="#contact"
                aria-label="Compartir"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-background text-muted transition-all hover:border-primary hover:text-primary hover:shadow-sm"
              >
                <Share2 className="h-4 w-4" />
              </a>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span>Todos los servicios operativos • 99.9% Uptime</span>
            </div>
          </div>

          {/* Nav Categories */}
          {footerLinks.map((category) => (
            <div key={category.title} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {category.title}
              </h4>
              <ul className="space-y-2.5">
                {category.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-surface-border pt-8 text-xs text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>© {year} GymDemo Inc. Arquitectura Multi-tenant lista para producción.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Diseñado con <Sparkles className="h-3 w-3 text-primary" /> para máxima velocidad.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
