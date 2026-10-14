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
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-surface-border/80 bg-background/85 shadow-sm backdrop-blur-md dark:bg-background/90'
          : 'border-b border-transparent bg-background/60 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        
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
              <span className="text-xl font-black tracking-tight text-foreground">
                Gym<span className="text-primary">Demo</span>
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary dark:bg-primary/20">
                PRO
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wide text-muted">
              SISTEMA DE GESTIÓN
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex rounded-full border border-surface-border/60 bg-surface/50 px-4 py-1.5 backdrop-blur-sm shadow-inner">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-1 text-sm font-medium text-muted transition-all duration-200 hover:text-primary hover:bg-primary/5"
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
            className="group flex items-center gap-1.5 rounded-lg border border-surface-border px-3.5 py-2 text-xs font-semibold text-foreground transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-muted group-hover:text-primary transition-colors" />
            <span>Panel Recepción</span>
          </Link>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/login"
              className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-dark hover:shadow-md hover:shadow-primary/25"
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
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface text-foreground hover:text-primary"
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
            className="border-b border-surface-border bg-background/95 px-6 py-5 backdrop-blur-lg sm:hidden shadow-lg"
          >
            <nav className="flex flex-col space-y-3">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-3 border-t border-surface-border flex flex-col gap-2.5">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-surface-border py-2.5 text-sm font-semibold text-foreground"
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
