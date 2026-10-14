// ─────────────────────────────────────────────────────────────────────────────
// Tipos de base de datos — 9 tablas del esquema multi-tenant
// Generados manualmente a partir del schema definido en AGENTS.md.
// Usar con createClient<Database>() de @supabase/supabase-js.
// ─────────────────────────────────────────────────────────────────────────────

// ── Enums compartidos ─────────────────────────────────────────────────────────

export type EstadoGeneral = 'activo' | 'inactivo';
export type EstadoSucursal = 'ACTIVO' | 'INACTIVO';
export type EstadoPago = 'pagado' | 'pendiente' | 'vencido';
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
export type MetodoIngreso = 'manual' | 'biometria' | 'qr' | 'tarjeta' | 'CI_TECLADO' | (string & {});
export type EstadoAcceso = 'permitido' | 'denegado' | 'PERMITIDO' | 'DENEGADO' | (string & {});
export type RolUsuario = 'admin' | 'recepcionista' | 'instructor';
export type PlanSaas = 'basico' | 'profesional' | 'enterprise';
export type Genero = 'masculino' | 'femenino' | 'otro' | 'no_especificado';
export type TipoBiometria = 'huella' | 'facial' | 'iris';

// ── 1. organizaciones ─────────────────────────────────────────────────────────

export type Organizacion = {
  id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  plan_saas: PlanSaas;
  estado: EstadoGeneral;
  creado_en: string; // ISO 8601 datetime
};

export type OrganizacionInsert = {
  id?: string;
  nombre: string;
  slug: string;
  logo_url?: string | null;
  plan_saas: PlanSaas;
  estado: EstadoGeneral;
  creado_en?: string;
};
export type OrganizacionUpdate = Partial<OrganizacionInsert>;

// ── 2. sucursales ─────────────────────────────────────────────────────────────

export type Sucursal = {
  id: string;
  organizacion_id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  ciudad: string | null;
  estado: EstadoSucursal;
};

export type SucursalInsert = {
  id?: string;
  organizacion_id: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  ciudad?: string | null;
  estado: EstadoSucursal;
};
export type SucursalUpdate = Partial<SucursalInsert>;

// ── 3. usuarios_sistema ───────────────────────────────────────────────────────

export type UsuarioSistema = {
  id: string;
  organizacion_id: string;
  sucursal_id: string | null;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  estado: EstadoGeneral;
};

export type UsuarioSistemaInsert = {
  id?: string;
  organizacion_id: string;
  sucursal_id?: string | null;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  estado: EstadoGeneral;
};
export type UsuarioSistemaUpdate = Partial<UsuarioSistemaInsert>;

// ── 4. clientes ───────────────────────────────────────────────────────────────

export type Cliente = {
  id: string;
  organizacion_id: string;
  ci: string;                       // Cédula de identidad / DNI
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;  // ISO 8601 date
  genero: Genero | null;
  foto_url: string | null;
  estado: EstadoGeneral;
};

export type ClienteInsert = {
  id?: string;
  organizacion_id: string;
  ci: string;
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  genero?: Genero | null;
  foto_url?: string | null;
  estado: EstadoGeneral;
};
export type ClienteUpdate = Partial<ClienteInsert>;

// ── 5. cliente_biometria ──────────────────────────────────────────────────────

export type ClienteBiometria = {
  id: string;
  cliente_id: string;
  tipo: TipoBiometria;
  data_biometrica: string;          // hash / template codificado
  proveedor_sensor: string | null;
};

export type ClienteBiometriaInsert = {
  id?: string;
  cliente_id: string;
  tipo: TipoBiometria;
  data_biometrica: string;
  proveedor_sensor?: string | null;
};
export type ClienteBiometriaUpdate = Partial<ClienteBiometriaInsert>;

// ── 6. membresias ─────────────────────────────────────────────────────────────

export type Membresia = {
  id: string;
  organizacion_id: string;
  nombre: string;
  descripcion: string | null;
  duracion_dias: number;
  limite_ingresos: number | null;   // null = ingresos ilimitados
  precio: number;
  es_multisucursal: boolean;
  hora_inicio: string | null;       // "HH:mm" — null = horario libre
  hora_fin: string | null;          // "HH:mm" — null = horario libre
  estado: EstadoGeneral;
  creado_en?: string;
};

export type MembresiaInsert = {
  id?: string;
  organizacion_id: string;
  nombre: string;
  descripcion?: string | null;
  duracion_dias: number;
  limite_ingresos?: number | null;
  precio: number;
  es_multisucursal?: boolean;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  estado: EstadoGeneral;
};
export type MembresiaUpdate = Partial<MembresiaInsert>;

// ── 7. suscripciones ──────────────────────────────────────────────────────────

export type Suscripcion = {
  id: string;
  organizacion_id: string;
  sucursal_id: string;
  cliente_id: string;
  membresia_id: string;
  usuario_vendedor_id: string | null;
  fecha_inicio: string;             // ISO 8601 date
  fecha_fin: string;                // ISO 8601 date — activa si fecha_fin >= hoy
  ingresos_restantes: number | null;
  monto_pagado: number;
  metodo_pago: MetodoPago;
  estado_pago: EstadoPago;
};

export type SuscripcionInsert = {
  id?: string;
  organizacion_id: string;
  sucursal_id: string;
  cliente_id: string;
  membresia_id: string;
  usuario_vendedor_id?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  ingresos_restantes?: number | null;
  monto_pagado: number;
  metodo_pago: MetodoPago;
  estado_pago: EstadoPago;
};
export type SuscripcionUpdate = Partial<SuscripcionInsert>;

// ── 8. asistencias ────────────────────────────────────────────────────────────

export type Asistencia = {
  id: string;
  organizacion_id: string;
  sucursal_id: string;
  cliente_id: string;
  fecha_hora: string;               // ISO 8601 datetime
  metodo_ingreso: MetodoIngreso;
  estado_acceso: EstadoAcceso;
};

export type AsistenciaInsert = {
  id?: string;
  organizacion_id: string;
  sucursal_id: string;
  cliente_id: string;
  fecha_hora?: string;
  metodo_ingreso: MetodoIngreso;
  estado_acceso: EstadoAcceso;
};
export type AsistenciaUpdate = Partial<AsistenciaInsert>;

// ── 9. landing_page_config ────────────────────────────────────────────────────

export type RedSocial = {
  plataforma: string;
  url: string;
};

export type HorarioEntry = {
  dia: string;
  apertura: string;  // "HH:mm"
  cierre: string;    // "HH:mm"
};

export type LandingPageConfig = {
  id: string;
  organizacion_id: string;
  titulo_principal: string;
  subtitulo: string | null;
  banner_url: string | null;
  horarios_json: HorarioEntry[] | null;
  redes_sociales_json: RedSocial[] | null;
  mostrar_precios_publicos: boolean;
};

export type LandingPageConfigInsert = {
  id?: string;
  organizacion_id: string;
  titulo_principal: string;
  subtitulo?: string | null;
  banner_url?: string | null;
  horarios_json?: HorarioEntry[] | null;
  redes_sociales_json?: RedSocial[] | null;
  mostrar_precios_publicos?: boolean;
};
export type LandingPageConfigUpdate = Partial<LandingPageConfigInsert>;

// ─────────────────────────────────────────────────────────────────────────────
// Tipo Database — compatible con createClient<Database> de Supabase
// ─────────────────────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      organizaciones: {
        Row: Organizacion;
        Insert: OrganizacionInsert;
        Update: OrganizacionUpdate;
        Relationships: [];
      };
      sucursales: {
        Row: Sucursal;
        Insert: SucursalInsert;
        Update: SucursalUpdate;
        Relationships: [];
      };
      usuarios_sistema: {
        Row: UsuarioSistema;
        Insert: UsuarioSistemaInsert;
        Update: UsuarioSistemaUpdate;
        Relationships: [];
      };
      clientes: {
        Row: Cliente;
        Insert: ClienteInsert;
        Update: ClienteUpdate;
        Relationships: [];
      };
      cliente_biometria: {
        Row: ClienteBiometria;
        Insert: ClienteBiometriaInsert;
        Update: ClienteBiometriaUpdate;
        Relationships: [];
      };
      membresias: {
        Row: Membresia;
        Insert: MembresiaInsert;
        Update: MembresiaUpdate;
        Relationships: [];
      };
      suscripciones: {
        Row: Suscripcion;
        Insert: SuscripcionInsert;
        Update: SuscripcionUpdate;
        Relationships: [];
      };
      asistencias: {
        Row: Asistencia;
        Insert: AsistenciaInsert;
        Update: AsistenciaUpdate;
        Relationships: [];
      };
      landing_page_config: {
        Row: LandingPageConfig;
        Insert: LandingPageConfigInsert;
        Update: LandingPageConfigUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      estado_general: EstadoGeneral;
      estado_pago: EstadoPago;
      metodo_pago: MetodoPago;
      metodo_ingreso: MetodoIngreso;
      estado_acceso: EstadoAcceso;
      rol_usuario: RolUsuario;
      plan_saas: PlanSaas;
      genero: Genero;
      tipo_biometria: TipoBiometria;
    };
  };
};
