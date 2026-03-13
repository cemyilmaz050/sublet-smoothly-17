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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_id: string
          created_at: string | null
          id: string
          listing_id: string
          message: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string | null
          id?: string
          listing_id: string
          message?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          message?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      background_checks: {
        Row: {
          applicant_id: string
          application_id: string
          created_at: string
          employment_verified: boolean | null
          id: string
          identity_verified: boolean | null
          notes: string | null
          rental_history_verified: boolean | null
          reviewer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          application_id: string
          created_at?: string
          employment_verified?: boolean | null
          id?: string
          identity_verified?: boolean | null
          notes?: string | null
          rental_history_verified?: boolean | null
          reviewer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          application_id?: string
          created_at?: string
          employment_verified?: boolean | null
          id?: string
          identity_verified?: boolean | null
          notes?: string | null
          rental_history_verified?: boolean | null
          reviewer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_checks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          deposit_amount: number
          id: string
          listing_id: string
          platform_fee: number
          refund_eligible_until: string | null
          refund_reason: string | null
          refunded_at: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtenant_id: string
          tenant_id: string
          total_paid: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount: number
          id?: string
          listing_id: string
          platform_fee: number
          refund_eligible_until?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtenant_id: string
          tenant_id: string
          total_paid: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number
          id?: string
          listing_id?: string
          platform_fee?: number
          refund_eligible_until?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtenant_id?: string
          tenant_id?: string
          total_paid?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_properties: {
        Row: {
          address: string
          created_at: string | null
          id: string
          manager_id: string
          name: string | null
          photo_url: string | null
          property_type: string | null
          units_count: number | null
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          manager_id: string
          name?: string | null
          photo_url?: string | null
          property_type?: string | null
          units_count?: number | null
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          manager_id?: string
          name?: string | null
          photo_url?: string | null
          property_type?: string | null
          units_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_properties_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "property_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_units: {
        Row: {
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string | null
          description: string | null
          floor: number | null
          id: string
          occupancy_status: string | null
          photos: string[] | null
          property_id: string
          sqft: number | null
          unit_number: string
        }
        Insert: {
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          description?: string | null
          floor?: number | null
          id?: string
          occupancy_status?: string | null
          photos?: string[] | null
          property_id: string
          sqft?: number | null
          unit_number: string
        }
        Update: {
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string | null
          description?: string | null
          floor?: number | null
          id?: string
          occupancy_status?: string | null
          photos?: string[] | null
          property_id?: string
          sqft?: number | null
          unit_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "catalog_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          listing_id: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      cosigners: {
        Row: {
          address: string | null
          confirmation_status: string
          created_at: string
          document_url: string | null
          email: string
          employment_status: string | null
          full_name: string
          id: string
          monthly_income: number | null
          phone: string
          relationship: string
          tenant_id: string
        }
        Insert: {
          address?: string | null
          confirmation_status?: string
          created_at?: string
          document_url?: string | null
          email: string
          employment_status?: string | null
          full_name: string
          id?: string
          monthly_income?: number | null
          phone: string
          relationship: string
          tenant_id: string
        }
        Update: {
          address?: string | null
          confirmation_status?: string
          created_at?: string
          document_url?: string | null
          email?: string
          employment_status?: string | null
          full_name?: string
          id?: string
          monthly_income?: number | null
          phone?: string
          relationship?: string
          tenant_id?: string
        }
        Relationships: []
      }
      listing_views: {
        Row: {
          id: string
          listing_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          listing_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          listing_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          amenities: string[] | null
          available_from: string | null
          available_until: string | null
          bathrooms: number | null
          bedrooms: number | null
          catalog_unit_id: string | null
          created_at: string
          description: string | null
          guest_policy: Database["public"]["Enums"]["guest_policy"] | null
          headline: string | null
          house_rules: string | null
          id: string
          latitude: number | null
          longitude: number | null
          management_group_id: string | null
          manager_id: string | null
          min_duration: number | null
          monthly_rent: number | null
          move_in_flexibility: string | null
          path: string | null
          photos: string[] | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          published_at: string | null
          save_count: number
          security_deposit: number | null
          source: string
          space_type: string | null
          sqft: number | null
          status: Database["public"]["Enums"]["listing_status"]
          tenant_id: string
          unit_number: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          available_from?: string | null
          available_until?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          catalog_unit_id?: string | null
          created_at?: string
          description?: string | null
          guest_policy?: Database["public"]["Enums"]["guest_policy"] | null
          headline?: string | null
          house_rules?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          management_group_id?: string | null
          manager_id?: string | null
          min_duration?: number | null
          monthly_rent?: number | null
          move_in_flexibility?: string | null
          path?: string | null
          photos?: string[] | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          published_at?: string | null
          save_count?: number
          security_deposit?: number | null
          source?: string
          space_type?: string | null
          sqft?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          tenant_id: string
          unit_number?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          available_from?: string | null
          available_until?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          catalog_unit_id?: string | null
          created_at?: string
          description?: string | null
          guest_policy?: Database["public"]["Enums"]["guest_policy"] | null
          headline?: string | null
          house_rules?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          management_group_id?: string | null
          manager_id?: string | null
          min_duration?: number | null
          monthly_rent?: number | null
          move_in_flexibility?: string | null
          path?: string | null
          photos?: string[] | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          published_at?: string | null
          save_count?: number
          security_deposit?: number | null
          source?: string
          space_type?: string | null
          sqft?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          tenant_id?: string
          unit_number?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_catalog_unit_id_fkey"
            columns: ["catalog_unit_id"]
            isOneToOne: false
            referencedRelation: "catalog_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_management_group_id_fkey"
            columns: ["management_group_id"]
            isOneToOne: false
            referencedRelation: "property_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_integrations: {
        Row: {
          appfolio_url: string
          created_at: string
          id: string
          last_synced_at: string | null
          manager_id: string
          status: string
          sync_error: string | null
          synced_count: number
          updated_at: string
        }
        Insert: {
          appfolio_url: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          manager_id: string
          status?: string
          sync_error?: string | null
          synced_count?: number
          updated_at?: string
        }
        Update: {
          appfolio_url?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          manager_id?: string
          status?: string
          sync_error?: string | null
          synced_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read: boolean | null
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_mode: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          documents_status: string
          first_name: string | null
          id: string
          id_document_url: string | null
          id_verified: boolean
          last_name: string | null
          onboarding_complete: boolean
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          active_mode?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          documents_status?: string
          first_name?: string | null
          id: string
          id_document_url?: string | null
          id_verified?: boolean
          last_name?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          active_mode?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          documents_status?: string
          first_name?: string | null
          id?: string
          id_document_url?: string | null
          id_verified?: boolean
          last_name?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_managers: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          cover_photo_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          properties_count: number | null
          slug: string | null
          state: string | null
          status: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          properties_count?: number | null
          slug?: string | null
          state?: string | null
          status?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          properties_count?: number | null
          slug?: string | null
          state?: string | null
          status?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      request_documents: {
        Row: {
          document_type: string
          file_name: string
          file_url: string
          id: string
          request_id: string
          review_comment: string | null
          status: string
          uploaded_at: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_url: string
          id?: string
          request_id: string
          review_comment?: string | null
          status?: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          request_id?: string
          review_comment?: string | null
          status?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sublet_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          reviewer_role: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          reviewer_role?: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          reviewer_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_listings: {
        Row: {
          id: string
          listing_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          listing_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          listing_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      sublet_agreements: {
        Row: {
          booking_id: string
          created_at: string
          deposit_amount: number
          end_date: string
          id: string
          listing_id: string
          monthly_rent: number
          property_address: string
          start_date: string
          status: string
          subtenant_id: string
          subtenant_name: string
          subtenant_signed_at: string | null
          tenant_id: string
          tenant_name: string
          tenant_signed_at: string | null
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          deposit_amount: number
          end_date: string
          id?: string
          listing_id: string
          monthly_rent: number
          property_address: string
          start_date: string
          status?: string
          subtenant_id: string
          subtenant_name: string
          subtenant_signed_at?: string | null
          tenant_id: string
          tenant_name: string
          tenant_signed_at?: string | null
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          deposit_amount?: number
          end_date?: string
          id?: string
          listing_id?: string
          monthly_rent?: number
          property_address?: string
          start_date?: string
          status?: string
          subtenant_id?: string
          subtenant_name?: string
          subtenant_signed_at?: string | null
          tenant_id?: string
          tenant_name?: string
          tenant_signed_at?: string | null
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sublet_agreements_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sublet_agreements_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      sublet_requests: {
        Row: {
          additional_rules: string | null
          co_approve_subtenant: boolean | null
          created_at: string
          id: string
          manager_id: string
          manager_message: string | null
          max_sublet_duration: number | null
          property_address: string
          rejection_note: string | null
          rejection_reason: string | null
          status: string
          tenant_id: string
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          additional_rules?: string | null
          co_approve_subtenant?: boolean | null
          created_at?: string
          id?: string
          manager_id: string
          manager_message?: string | null
          max_sublet_duration?: number | null
          property_address: string
          rejection_note?: string | null
          rejection_reason?: string | null
          status?: string
          tenant_id: string
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          additional_rules?: string | null
          co_approve_subtenant?: boolean | null
          created_at?: string
          id?: string
          manager_id?: string
          manager_message?: string | null
          max_sublet_duration?: number | null
          property_address?: string
          rejection_note?: string | null
          rejection_reason?: string | null
          status?: string
          tenant_id?: string
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_documents: {
        Row: {
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          review_comment: string | null
          status: string
          tenant_id: string
          uploaded_at: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          review_comment?: string | null
          status?: string
          tenant_id: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          review_comment?: string | null
          status?: string
          tenant_id?: string
          uploaded_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          active_mode: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          role: string | null
        }
        Insert: {
          active_mode?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          role?: string | null
        }
        Update: {
          active_mode?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      guest_policy: "no_guests" | "occasional_guests" | "guests_allowed"
      listing_status: "draft" | "pending" | "active" | "expired" | "rejected"
      property_type: "apartment" | "condo" | "studio" | "house"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      guest_policy: ["no_guests", "occasional_guests", "guests_allowed"],
      listing_status: ["draft", "pending", "active", "expired", "rejected"],
      property_type: ["apartment", "condo", "studio", "house"],
    },
  },
} as const
