export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      box: {
        Row: {
          activo: boolean
          id: string
          nombre: string
          orden_visual: number
          tipo: string
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
          orden_visual?: number
          tipo: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
          orden_visual?: number
          tipo?: string
        }
        Relationships: []
      }
      cliente: {
        Row: {
          creado_en: string
          email: string | null
          id: string
          nombre: string
          telefono: string
        }
        Insert: {
          creado_en?: string
          email?: string | null
          id?: string
          nombre: string
          telefono: string
        }
        Update: {
          creado_en?: string
          email?: string | null
          id?: string
          nombre?: string
          telefono?: string
        }
        Relationships: []
      }
      contador_orden: {
        Row: {
          anio: number
          ultimo: number
        }
        Insert: {
          anio: number
          ultimo?: number
        }
        Update: {
          anio?: number
          ultimo?: number
        }
        Relationships: []
      }
      evento_orden: {
        Row: {
          actor: string | null
          actor_descripcion: string | null
          creado_en: string
          id: string
          orden_id: string
          payload: Json
          tipo: string
        }
        Insert: {
          actor?: string | null
          actor_descripcion?: string | null
          creado_en?: string
          id?: string
          orden_id: string
          payload?: Json
          tipo: string
        }
        Update: {
          actor?: string | null
          actor_descripcion?: string | null
          creado_en?: string
          id?: string
          orden_id?: string
          payload?: Json
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_orden_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_orden_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "orden_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      orden_servicio: {
        Row: {
          anio: number
          box_id: string | null
          cerrado_en: string | null
          cliente_id: string
          correlativo: number
          estado: string
          id: string
          kilometraje: number | null
          motivo_ingreso: string
          numero: string | null
          recibido_en: string
          tiempo_estimado_min: number | null
          token_publico: string
          ubicacion: string
          vehiculo_id: string
        }
        Insert: {
          anio: number
          box_id?: string | null
          cerrado_en?: string | null
          cliente_id: string
          correlativo: number
          estado?: string
          id?: string
          kilometraje?: number | null
          motivo_ingreso: string
          numero?: string | null
          recibido_en?: string
          tiempo_estimado_min?: number | null
          token_publico?: string
          ubicacion?: string
          vehiculo_id: string
        }
        Update: {
          anio?: number
          box_id?: string | null
          cerrado_en?: string | null
          cliente_id?: string
          correlativo?: number
          estado?: string
          id?: string
          kilometraje?: number | null
          motivo_ingreso?: string
          numero?: string | null
          recibido_en?: string
          tiempo_estimado_min?: number | null
          token_publico?: string
          ubicacion?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orden_servicio_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "box"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_servicio_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_servicio_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculo"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil: {
        Row: {
          activo: boolean
          creado_en: string
          id: string
          nombre: string
          rol: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id: string
          nombre: string
          rol?: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          rol?: string
        }
        Relationships: []
      }
      servicio_catalogo: {
        Row: {
          activo: boolean
          categoria: string
          creado_en: string
          duracion_min: number
          id: string
          nombre: string
          orden_visual: number
          precio_base_centimos: number
        }
        Insert: {
          activo?: boolean
          categoria: string
          creado_en?: string
          duracion_min: number
          id?: string
          nombre: string
          orden_visual?: number
          precio_base_centimos: number
        }
        Update: {
          activo?: boolean
          categoria?: string
          creado_en?: string
          duracion_min?: number
          id?: string
          nombre?: string
          orden_visual?: number
          precio_base_centimos?: number
        }
        Relationships: []
      }
      vehiculo: {
        Row: {
          anio: number | null
          cliente_id: string
          creado_en: string
          id: string
          marca: string
          modelo: string
          placa: string
          tipo: string
        }
        Insert: {
          anio?: number | null
          cliente_id: string
          creado_en?: string
          id?: string
          marca: string
          modelo: string
          placa: string
          tipo: string
        }
        Update: {
          anio?: number | null
          cliente_id?: string
          creado_en?: string
          id?: string
          marca?: string
          modelo?: string
          placa?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehiculo_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_vehiculo: {
        Args: { p_termino: string }
        Returns: {
          anio: number
          cliente_id: string
          cliente_nombre: string
          cliente_telefono: string
          id: string
          marca: string
          modelo: string
          orden_abierta_id: string
          orden_abierta_numero: string
          placa: string
          tipo: string
        }[]
      }
      cambiar_estado_orden: {
        Args: {
          p_estado_esperado: string
          p_estado_nuevo: string
          p_nota?: string
          p_orden_id: string
        }
        Returns: string
      }
      es_staff: { Args: never; Returns: boolean }
      generar_token_publico: { Args: never; Returns: string }
      mover_orden: {
        Args: { p_box_id?: string; p_orden_id: string; p_ubicacion: string }
        Returns: undefined
      }
      recepcionar_vehiculo: {
        Args: {
          p_anio?: number
          p_box_id?: string
          p_cliente_id?: string
          p_cliente_nombre?: string
          p_cliente_telefono?: string
          p_kilometraje?: number
          p_marca?: string
          p_modelo?: string
          p_motivo: string
          p_placa?: string
          p_tipo?: string
          p_ubicacion: string
          p_vehiculo_id?: string
        }
        Returns: string
      }
      siguiente_correlativo: { Args: { p_anio: number }; Returns: number }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
