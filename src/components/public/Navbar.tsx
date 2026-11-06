'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Menu, X, ArrowRight, LayoutDashboard, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

const navLinks = [
  { href: '#features', label: 'Funciones' },
  { href: '#live-demo', label: 'Control en Vivo' },
  { href: '#plans', label: 'Planes' },
  { href: '#contact', label: 'Contacto' },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-3 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-7xl transition-all duration-300 ${
        scrolled
          ? 'rounded-full border border-white/15 bg-ink/95 shadow-lg shadow-black/20 backdrop-blur-md'
          : 'rounded-full border border-white/10 bg-ink/80 shadow-lg shadow-black/10 backdrop-blur-sm'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25"
          >
            <Dumbbell className="h-5 w-5" />
          </motion.div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white">
                Soft<span className="text-primary">Kany</span>
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary dark:bg-primary/20">
                PRO
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wide text-white/50">
              SISTEMAS INTELIGENTES PARA GIMNASIOS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 shadow-inner backdrop-blur-sm md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1 text-sm font-medium text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-primary-light"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons & ThemeToggle */}
        <div className="hidden items-center gap-3 sm:flex">
          <ThemeToggle />
          
          <Link
            href="/dashboard"
            className="group flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold text-white/80 transition-all duration-200 hover:border-primary hover:bg-white/10 hover:text-primary-light"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-white/50 transition-colors group-hover:text-primary-light" />
            <span>Panel Recepción</span>
          </Link>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-light hover:shadow-md hover:shadow-primary/25"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Iniciar Sesión</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* Mobile Hamburger & Toggle */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:text-primary-light"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-white/10 bg-ink/95 px-6 py-5 shadow-lg backdrop-blur-lg sm:hidden"
          >
            <nav className="flex flex-col space-y-3">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-primary/10 hover:text-primary-light"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-3 border-t border-surface-border flex flex-col gap-2.5">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/15 py-2.5 text-sm font-semibold text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Panel Recepción</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Iniciar Sesión</span>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
