import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureDatabaseSeeded } from '@/lib/seed';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        const user = data.user;
        const email = user.email;

        // 1. Asegurar semilla de organización y sucursal
        const seedResult = await ensureDatabaseSeeded();
        const orgId = seedResult.organizacion?.id;
        const sucursalId = seedResult.sucursal?.id || null;

        // 2. Verificar si el usuario ya existe en usuarios_sistema
        if (email && orgId) {
          const { data: existingUser } = await supabase
            .from('usuarios_sistema')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (!existingUser) {
            // Verificar si es el primer usuario para asignarle rol 'admin'
            const { count } = await supabase
              .from('usuarios_sistema')
              .select('*', { count: 'exact', head: true });

            const isFirstUser = (count ?? 0) === 0;

            const fullName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              email.split('@')[0] ||
              'Usuario';

            const nameParts = fullName.trim().split(' ');
            const nombre = nameParts[0] || 'Usuario';
            const apellido = nameParts.slice(1).join(' ') || '';

            await supabase.from('usuarios_sistema').insert([
              {
                organizacion_id: orgId,
                sucursal_id: sucursalId,
                nombre,
                apellido,
                email,
                rol: isFirstUser ? 'admin' : 'recepcionista',
                estado: 'activo',
              },
            ]);
          }
        }
      }
    } catch (err) {
      console.error('[OAuth Callback] Error al procesar código de autorización:', err);
      return NextResponse.redirect(`${origin}/login?error=callback_error`);
    }
  }

  // Redirigir siempre al dashboard
  return NextResponse.redirect(`${origin}/dashboard`);
}
