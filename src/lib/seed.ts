import { supabase } from '@/lib/supabase';
import type { Organizacion, Sucursal, Membresia } from '@/types/database';

export interface SeedResult {
  success: boolean;
  seeded: boolean;
  organizacion: Organizacion | null;
  sucursal: Sucursal | null;
  membresias?: Membresia[];
  error?: string | null;
}

// Organización y sucursal de contingencia en caso de que RLS impida escrituras anónimas
export const FALLBACK_ORGANIZACION: Organizacion = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Gimnasio Demo',
  slug: 'gimnasio-demo',
  logo_url: null,
  plan_saas: 'profesional',
  estado: 'activo',
  creado_en: new Date().toISOString(),
};

export const FALLBACK_SUCURSAL: Sucursal = {
  id: '00000000-0000-0000-0000-000000000002',
  organizacion_id: FALLBACK_ORGANIZACION.id,
  nombre: 'Sucursal Central',
  direccion: 'Av. Principal 123',
  telefono: '+595 981 123456',
  ciudad: 'Asunción',
  estado: 'ACTIVO',
};

/**
 * Verifica si existe una organización registrada.
 * Si la tabla está vacía, inserta automáticamente:
 * - Organización principal ("Gimnasio Demo")
 * - Sucursal ("Sucursal Central")
 * - 3 Membresías de prueba (Mensual, Trimestral, Anual)
 */
export async function ensureDatabaseSeeded(): Promise<SeedResult> {
  try {
    // 1. Verificar si existen organizaciones
    const { data: orgs, error: fetchError } = await supabase
      .from('organizaciones')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.warn('[Seed] No se pudo consultar organizaciones:', fetchError.message);
      return {
        success: false,
        seeded: false,
        organizacion: FALLBACK_ORGANIZACION,
        sucursal: FALLBACK_SUCURSAL,
        error: fetchError.message,
      };
    }

    // Si ya existe al menos una organización, obtener su primera sucursal y retornar
    if (orgs && orgs.length > 0) {
      const org = orgs[0];
      const { data: sucursales } = await supabase
        .from('sucursales')
        .select('*')
        .eq('organizacion_id', org.id)
        .limit(1);

      return {
        success: true,
        seeded: false,
        organizacion: org,
        sucursal: sucursales && sucursales.length > 0 ? sucursales[0] : null,
      };
    }

    // 2. Si está vacía, sembrar la organización principal
    const { data: newOrg, error: orgError } = await supabase
      .from('organizaciones')
      .insert([
        {
          nombre: 'Gimnasio Demo',
          slug: 'gimnasio-demo',
          plan_saas: 'profesional',
          estado: 'activo',
        },
      ])
      .select()
      .single();

    if (orgError || !newOrg) {
      console.warn(
        '[Seed] Aviso: no se pudo insertar organización (posible RLS activo). Utilizando datos por defecto:',
        orgError?.message
      );
      return {
        success: true,
        seeded: false,
        organizacion: FALLBACK_ORGANIZACION,
        sucursal: FALLBACK_SUCURSAL,
        error: orgError?.message,
      };
    }

    // 3. Sembrar la sucursal por defecto
    const { data: newSucursal, error: sucursalError } = await supabase
      .from('sucursales')
      .insert([
        {
          organizacion_id: newOrg.id,
          nombre: 'Sucursal Central',
          direccion: 'Av. Principal 123',
          telefono: '+595 981 123456',
          ciudad: 'Asunción',
          estado: 'ACTIVO',
        },
      ])
      .select()
      .single();

    if (sucursalError) {
      console.warn('[Seed] Error al insertar sucursal:', sucursalError.message);
    }

    // 4. Sembrar 3 membresías de prueba
    const { data: membresias, error: membresiasError } = await supabase
      .from('membresias')
      .insert([
        {
          organizacion_id: newOrg.id,
          nombre: 'Pase Mensual',
          descripcion: 'Acceso ilimitado por 30 días a todas las instalaciones.',
          duracion_dias: 30,
          limite_ingresos: null,
          precio: 35,
          es_multisucursal: true,
          estado: 'activo',
        },
        {
          organizacion_id: newOrg.id,
          nombre: 'Pase Trimestral',
          descripcion: 'Acceso ilimitado por 90 días con descuento especial.',
          duracion_dias: 90,
          limite_ingresos: null,
          precio: 89,
          es_multisucursal: true,
          estado: 'activo',
        },
        {
          organizacion_id: newOrg.id,
          nombre: 'Pase Anual VIP',
          descripcion: 'Acceso total por 365 días a todas las sucursales con beneficios VIP.',
          duracion_dias: 365,
          limite_ingresos: null,
          precio: 299,
          es_multisucursal: true,
          estado: 'activo',
        },
      ])
      .select();

    if (membresiasError) {
      console.warn('[Seed] Error al insertar membresías:', membresiasError.message);
    }

    // Opcional: Sembrar socios y asistencias de demostración
    await seedDemoClientsAndActivity(newOrg.id, newSucursal?.id || null, membresias?.[0]?.id || null);

    return {
      success: true,
      seeded: true,
      organizacion: newOrg,
      sucursal: newSucursal || null,
      membresias: membresias || [],
    };
  } catch (err: any) {
    console.error('[Seed] Excepción inesperada durante el seed:', err);
    return {
      success: false,
      seeded: false,
      organizacion: FALLBACK_ORGANIZACION,
      sucursal: FALLBACK_SUCURSAL,
      error: err?.message || 'Error desconocido',
    };
  }
}

/**
 * Semilla de muestra para clientes, suscripciones y asistencias
 * para que el dashboard muestre datos dinámicos desde el primer día.
 */
export async function seedDemoClientsAndActivity(
  organizacionId: string,
  sucursalId: string | null,
  membresiaId: string | null
) {
  try {
    const { count: clientCount } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true });

    if ((clientCount ?? 0) > 0) return;

    // Crear 4 clientes de prueba
    const { data: newClients, error: clientsError } = await supabase
      .from('clientes')
      .insert([
        {
          organizacion_id: organizacionId,
          ci: '4912830',
          nombre: 'Camila',
          apellido: 'Rodríguez',
          email: 'camila.rodriguez@example.com',
          telefono: '+595 981 112233',
          genero: 'femenino',
          estado: 'activo',
        },
        {
          organizacion_id: organizacionId,
          ci: '3421905',
          nombre: 'Carlos',
          apellido: 'Mendoza',
          email: 'carlos.mendoza@example.com',
          telefono: '+595 971 445566',
          genero: 'masculino',
          estado: 'activo',
        },
        {
          organizacion_id: organizacionId,
          ci: '5120400',
          nombre: 'Alejandro',
          apellido: 'Silva',
          email: 'alejandro.silva@example.com',
          telefono: '+595 982 778899',
          genero: 'masculino',
          estado: 'activo',
        },
        {
          organizacion_id: organizacionId,
          ci: '4839201',
          nombre: 'Mariana',
          apellido: 'Duarte',
          email: 'mariana.duarte@example.com',
          telefono: '+595 991 334455',
          genero: 'femenino',
          estado: 'activo',
        },
      ])
      .select();

    if (clientsError || !newClients || newClients.length === 0) return;

    // Crear suscripciones y asistencias si tenemos sucursal y membresía
    if (sucursalId && membresiaId) {
      const now = new Date();
      const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const in25Days = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Suscripciones: una que vence pronto (5 días) y otra con tiempo suficiente
      await supabase.from('suscripciones').insert([
        {
          organizacion_id: organizacionId,
          sucursal_id: sucursalId,
          cliente_id: newClients[0].id,
          membresia_id: membresiaId,
          fecha_inicio: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          fecha_fin: in5Days, // Vence pronto
          monto_pagado: 35,
          metodo_pago: 'efectivo',
          estado_pago: 'pagado',
        },
        {
          organizacion_id: organizacionId,
          sucursal_id: sucursalId,
          cliente_id: newClients[1].id,
          membresia_id: membresiaId,
          fecha_inicio: now.toISOString().split('T')[0],
          fecha_fin: in25Days,
          monto_pagado: 35,
          metodo_pago: 'tarjeta',
          estado_pago: 'pagado',
        },
      ]);

      // Asistencias de hoy
      await supabase.from('asistencias').insert([
        {
          organizacion_id: organizacionId,
          sucursal_id: sucursalId,
          cliente_id: newClients[0].id,
          fecha_hora: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
          metodo_ingreso: 'biometria',
          estado_acceso: 'permitido',
        },
        {
          organizacion_id: organizacionId,
          sucursal_id: sucursalId,
          cliente_id: newClients[1].id,
          fecha_hora: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          metodo_ingreso: 'manual',
          estado_acceso: 'permitido',
        },
        {
          organizacion_id: organizacionId,
          sucursal_id: sucursalId,
          cliente_id: newClients[2].id,
          fecha_hora: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          metodo_ingreso: 'qr',
          estado_acceso: 'permitido',
        },
      ]);
    }
  } catch (e) {
    console.warn('[Seed] Nota: No se insertaron clientes de demostración:', e);
  }
}
