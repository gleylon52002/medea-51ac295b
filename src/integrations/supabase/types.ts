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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          conversions_a: number
          conversions_b: number
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          impressions_a: number
          impressions_b: number
          is_active: boolean
          name: string
          starts_at: string
          test_type: string
          traffic_split: number
          updated_at: string
          variant_a: Json
          variant_b: Json
        }
        Insert: {
          conversions_a?: number
          conversions_b?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          impressions_a?: number
          impressions_b?: number
          is_active?: boolean
          name: string
          starts_at?: string
          test_type?: string
          traffic_split?: number
          updated_at?: string
          variant_a?: Json
          variant_b?: Json
        }
        Update: {
          conversions_a?: number
          conversions_b?: number
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          impressions_a?: number
          impressions_b?: number
          is_active?: boolean
          name?: string
          starts_at?: string
          test_type?: string
          traffic_split?: number
          updated_at?: string
          variant_a?: Json
          variant_b?: Json
        }
        Relationships: []
      }
      abandoned_cart_reminders: {
        Row: {
          cart_snapshot: Json
          created_at: string
          email_sent: boolean
          id: string
          last_reminder_at: string | null
          recovered: boolean
          recovered_at: string | null
          reminder_count: number
          sms_sent: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          cart_snapshot?: Json
          created_at?: string
          email_sent?: boolean
          id?: string
          last_reminder_at?: string | null
          recovered?: boolean
          recovered_at?: string | null
          reminder_count?: number
          sms_sent?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          cart_snapshot?: Json
          created_at?: string
          email_sent?: boolean
          id?: string
          last_reminder_at?: string | null
          recovered?: boolean
          recovered_at?: string | null
          reminder_count?: number
          sms_sent?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          address: string
          city: string
          created_at: string
          district: string
          full_name: string
          id: string
          is_default: boolean
          phone: string
          postal_code: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          district: string
          full_name: string
          id?: string
          is_default?: boolean
          phone: string
          postal_code?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          district?: string
          full_name?: string
          id?: string
          is_default?: boolean
          phone?: string
          postal_code?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          clicks: number
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          clicks?: number
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          clicks?: number
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_action_logs: {
        Row: {
          action_params: Json | null
          action_type: string
          created_at: string | null
          error_message: string | null
          executed_by: string | null
          id: string
          result: Json | null
          status: string | null
        }
        Insert: {
          action_params?: Json | null
          action_type: string
          created_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          id?: string
          result?: Json | null
          status?: string | null
        }
        Update: {
          action_params?: Json | null
          action_type?: string
          created_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          id?: string
          result?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      ai_chat_sessions: {
        Row: {
          created_at: string
          id: string
          messages: Json
          session_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          session_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          session_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          condition_type: string
          condition_value: number
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          points_reward: number
          slug: string
        }
        Insert: {
          condition_type: string
          condition_value?: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          points_reward?: number
          slug: string
        }
        Update: {
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          points_reward?: number
          slug?: string
        }
        Relationships: []
      }
      birthday_reminders: {
        Row: {
          birthday: string
          created_at: string
          id: string
          is_active: boolean
          last_gift_product_ids: string[] | null
          last_notified_at: string | null
          notes: string | null
          person_name: string
          user_id: string
        }
        Insert: {
          birthday: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_gift_product_ids?: string[] | null
          last_notified_at?: string | null
          notes?: string | null
          person_name: string
          user_id: string
        }
        Update: {
          birthday?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_gift_product_ids?: string[] | null
          last_notified_at?: string | null
          notes?: string | null
          person_name?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          product_ids: string[] | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          product_ids?: string[] | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          product_ids?: string[] | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      bulk_discount_rules: {
        Row: {
          applies_to: string
          buy_quantity: number
          category_id: string | null
          created_at: string
          discount_percent: number | null
          id: string
          is_active: boolean
          name: string
          pay_quantity: number | null
          product_ids: string[] | null
          rule_type: string
        }
        Insert: {
          applies_to?: string
          buy_quantity?: number
          category_id?: string | null
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          name: string
          pay_quantity?: number | null
          product_ids?: string[] | null
          rule_type?: string
        }
        Update: {
          applies_to?: string
          buy_quantity?: number
          category_id?: string | null
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          name?: string
          pay_quantity?: number | null
          product_ids?: string[] | null
          rule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_discount_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          applies_to: string
          banner_image: string | null
          banner_text: string | null
          category_id: string | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          product_ids: string[] | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          applies_to?: string
          banner_image?: string | null
          banner_text?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_ids?: string[] | null
          starts_at?: string
          updated_at?: string
        }
        Update: {
          applies_to?: string
          banner_image?: string | null
          banner_text?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_ids?: string[] | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image: string | null
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_events: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          session_id: string | null
          step: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          step: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          step?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          replied_at: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          replied_at?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          replied_at?: string | null
          subject?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          context_id: string | null
          context_type: string
          created_at: string
          id: string
          last_message_at: string
          participants: string[]
        }
        Insert: {
          context_id?: string | null
          context_type?: string
          created_at?: string
          id?: string
          last_message_at?: string
          participants: string[]
        }
        Update: {
          context_id?: string | null
          context_type?: string
          created_at?: string
          id?: string
          last_message_at?: string
          participants?: string[]
        }
        Relationships: []
      }
      coupon_uses: {
        Row: {
          coupon_id: string
          id: string
          order_id: string | null
          used_at: string
          user_id: string | null
        }
        Insert: {
          coupon_id: string
          id?: string
          order_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_id?: string
          id?: string
          order_id?: string | null
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_uses_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          minimum_order_amount: number | null
          starts_at: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          minimum_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          minimum_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      custom_product_orders: {
        Row: {
          additional_notes: string | null
          created_at: string
          id: string
          ingredient_allergies: string | null
          price: number | null
          product_id: string | null
          scent_preference: string | null
          seller_id: string | null
          skin_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          created_at?: string
          id?: string
          ingredient_allergies?: string | null
          price?: number | null
          product_id?: string | null
          scent_preference?: string | null
          seller_id?: string | null
          skin_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          created_at?: string
          id?: string
          ingredient_allergies?: string | null
          price?: number | null
          product_id?: string | null
          scent_preference?: string | null
          seller_id?: string | null
          skin_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          points_earned: number
          streak_days: number
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          id?: string
          points_earned?: number
          streak_days?: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          points_earned?: number
          streak_days?: number
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_packages: {
        Row: {
          box_style: string
          created_at: string
          gift_link_token: string | null
          gift_note: string | null
          id: string
          order_id: string | null
          product_ids: string[]
          recipient_address: Json | null
          recipient_email: string | null
          recipient_name: string
          sender_id: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          box_style?: string
          created_at?: string
          gift_link_token?: string | null
          gift_note?: string | null
          id?: string
          order_id?: string | null
          product_ids?: string[]
          recipient_address?: Json | null
          recipient_email?: string | null
          recipient_name: string
          sender_id?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          box_style?: string
          created_at?: string
          gift_link_token?: string | null
          gift_note?: string | null
          id?: string
          order_id?: string | null
          product_ids?: string[]
          recipient_address?: Json | null
          recipient_email?: string | null
          recipient_name?: string
          sender_id?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          billing_info: Json
          created_at: string | null
          discount_amount: number | null
          id: string
          invoice_date: string | null
          invoice_number: string
          items: Json
          order_id: string
          pdf_url: string | null
          shipping_cost: number | null
          subtotal: number
          tax_amount: number | null
          total: number
        }
        Insert: {
          billing_info: Json
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number: string
          items: Json
          order_id: string
          pdf_url?: string | null
          shipping_cost?: number | null
          subtotal: number
          tax_amount?: number | null
          total: number
        }
        Update: {
          billing_info?: Json
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          items?: Json
          order_id?: string
          pdf_url?: string | null
          shipping_cost?: number | null
          subtotal?: number
          tax_amount?: number | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          created_at: string
          id: string
          points: number
          tier: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          tier?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          tier?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string | null
          points: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_id?: string | null
          points: number
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          points?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tasks: {
        Row: {
          action_params: Json | null
          action_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_result: Json | null
          last_run_at: string | null
          next_run_at: string | null
          run_count: number | null
          schedule: string | null
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          action_params?: Json | null
          action_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_result?: Json | null
          last_run_at?: string | null
          next_run_at?: string | null
          run_count?: number | null
          schedule?: string | null
          task_type?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          action_params?: Json | null
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_result?: Json | null
          last_run_at?: string | null
          next_run_at?: string | null
          run_count?: number | null
          schedule?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_edited: boolean
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_edited?: boolean
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_edited?: boolean
          is_read?: boolean
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
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          variant_id: string | null
          variant_info: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          variant_id?: string | null
          variant_info?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_id?: string | null
          variant_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          coupon_code: string | null
          created_at: string
          discount_amount: number | null
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: Json
          shipping_company: string | null
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address: Json
          shipping_company?: string | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: Json
          shipping_company?: string | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean
          method: Database["public"]["Enums"]["payment_method"]
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          method: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          method?: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          callback_data: Json | null
          created_at: string
          id: string
          order_id: string | null
          payment_method: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          callback_data?: Json | null
          created_at?: string
          id?: string
          order_id?: string | null
          payment_method: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          callback_data?: Json | null
          created_at?: string
          id?: string
          order_id?: string | null
          payment_method?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      price_alerts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          target_price: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          target_price: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          target_price?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_comparisons: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_comparisons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_questions: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          is_public: boolean
          product_id: string
          question: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          product_id: string
          question: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          product_id?: string
          question?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          interval_days: number
          is_active: boolean | null
          last_order_id: string | null
          next_delivery_at: string
          product_id: string
          quantity: number
          shipping_address: Json
          total_deliveries: number | null
          updated_at: string | null
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interval_days?: number
          is_active?: boolean | null
          last_order_id?: string | null
          next_delivery_at?: string
          product_id: string
          quantity?: number
          shipping_address?: Json
          total_deliveries?: number | null
          updated_at?: string | null
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interval_days?: number
          is_active?: boolean | null
          last_order_id?: string | null
          next_delivery_at?: string
          product_id?: string
          quantity?: number
          shipping_address?: Json
          total_deliveries?: number | null
          updated_at?: string | null
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_subscriptions_last_order_id_fkey"
            columns: ["last_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_subscriptions_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string
          id: string
          is_auto: boolean
          product_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_auto?: boolean
          product_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          is_auto?: boolean
          product_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_code: string | null
          created_at: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          name: string
          price_adjustment: number | null
          product_id: string
          sku: string | null
          sort_order: number | null
          stock: number
          updated_at: string | null
          value: string
          variant_type: Database["public"]["Enums"]["variant_type"]
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name: string
          price_adjustment?: number | null
          product_id: string
          sku?: string | null
          sort_order?: number | null
          stock?: number
          updated_at?: string | null
          value: string
          variant_type: Database["public"]["Enums"]["variant_type"]
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          name?: string
          price_adjustment?: number | null
          product_id?: string
          sku?: string | null
          sort_order?: number | null
          stock?: number
          updated_at?: string | null
          value?: string
          variant_type?: Database["public"]["Enums"]["variant_type"]
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          guide_pdf_url: string | null
          id: string
          images: string[] | null
          ingredients: string | null
          is_active: boolean
          is_featured: boolean
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          name: string
          price: number
          sale_price: number | null
          seller_id: string | null
          short_description: string | null
          slug: string
          stock: number
          sustainability_score: number | null
          updated_at: string
          usage_instructions: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          guide_pdf_url?: string | null
          id?: string
          images?: string[] | null
          ingredients?: string | null
          is_active?: boolean
          is_featured?: boolean
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          price: number
          sale_price?: number | null
          seller_id?: string | null
          short_description?: string | null
          slug: string
          stock?: number
          sustainability_score?: number | null
          updated_at?: string
          usage_instructions?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          guide_pdf_url?: string | null
          id?: string
          images?: string[] | null
          ingredients?: string | null
          is_active?: boolean
          is_featured?: boolean
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          price?: number
          sale_price?: number | null
          seller_id?: string | null
          short_description?: string | null
          slug?: string
          stock?: number
          sustainability_score?: number | null
          updated_at?: string
          usage_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          identity_number: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          identity_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          identity_number?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_device_tokens: {
        Row: {
          created_at: string
          device_type: string
          id: string
          is_active: boolean
          player_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string
          id?: string
          is_active?: boolean
          player_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_type?: string
          id?: string
          is_active?: boolean
          player_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          sent_at: string | null
          sent_by: string | null
          sent_count: number
          status: string
          target_type: string
          target_user_ids: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          sent_at?: string | null
          sent_by?: string | null
          sent_count?: number
          status?: string
          target_type?: string
          target_user_ids?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          sent_at?: string | null
          sent_by?: string | null
          sent_count?: number
          status?: string
          target_type?: string
          target_user_ids?: string[] | null
          title?: string
        }
        Relationships: []
      }
      raffle_entries: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          raffle_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          raffle_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          raffle_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raffle_entries_raffle_id_fkey"
            columns: ["raffle_id"]
            isOneToOne: false
            referencedRelation: "raffles"
            referencedColumns: ["id"]
          },
        ]
      }
      raffles: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          min_order_amount: number
          prize: string
          starts_at: string
          title: string
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          min_order_amount?: number
          prize: string
          starts_at?: string
          title: string
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          min_order_amount?: number
          prize?: string
          starts_at?: string
          title?: string
          winner_user_id?: string | null
        }
        Relationships: []
      }
      related_products: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          related_product_id: string
          relation_type: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          related_product_id: string
          relation_type?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          related_product_id?: string
          relation_type?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "related_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_products_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          images: string[] | null
          is_approved: boolean
          order_id: string | null
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean
          order_id?: string | null
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean
          order_id?: string | null
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_applications: {
        Row: {
          account_holder: string
          address: string
          bank_name: string
          category_focus: string | null
          city: string
          company_name: string
          created_at: string
          description: string | null
          district: string
          iban: string
          id: string
          identity_number: string
          phone: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tax_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder: string
          address: string
          bank_name: string
          category_focus?: string | null
          city: string
          company_name: string
          created_at?: string
          description?: string | null
          district: string
          iban: string
          id?: string
          identity_number: string
          phone: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder?: string
          address?: string
          bank_name?: string
          category_focus?: string | null
          city?: string
          company_name?: string
          created_at?: string
          description?: string | null
          district?: string
          iban?: string
          id?: string
          identity_number?: string
          phone?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_certificates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          certificate_type: string
          created_at: string
          expires_at: string | null
          file_url: string
          id: string
          name: string
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          certificate_type?: string
          created_at?: string
          expires_at?: string | null
          file_url: string
          id?: string
          name: string
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          certificate_type?: string
          created_at?: string
          expires_at?: string | null
          file_url?: string
          id?: string
          name?: string
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_certificates_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_certificates_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          seller_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          seller_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          seller_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_notifications_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_notifications_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_point_packages: {
        Row: {
          bonus_points: number | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          points: number
          price: number
          sort_order: number | null
        }
        Insert: {
          bonus_points?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          points: number
          price: number
          sort_order?: number | null
        }
        Update: {
          bonus_points?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          points?: number
          price?: number
          sort_order?: number | null
        }
        Relationships: []
      }
      seller_points_history: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          point_type: string
          points: number
          reason: string
          review_id: string | null
          seller_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          point_type: string
          points: number
          reason: string
          review_id?: string | null
          seller_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          point_type?: string
          points?: number
          reason?: string
          review_id?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_points_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_points_history_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_points_history_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_points_history_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      seller_sla: {
        Row: {
          created_at: string
          id: string
          last_violation_at: string | null
          max_response_hours: number
          max_shipping_days: number
          penalty_applied: number
          response_violations: number
          seller_id: string
          shipping_violations: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_violation_at?: string | null
          max_response_hours?: number
          max_shipping_days?: number
          penalty_applied?: number
          response_violations?: number
          seller_id: string
          shipping_violations?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_violation_at?: string | null
          max_response_hours?: number
          max_shipping_days?: number
          penalty_applied?: number
          response_violations?: number
          seller_id?: string
          shipping_violations?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_sla_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_sla_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_transactions: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          net_amount: number
          order_id: string | null
          order_item_id: string | null
          paid_at: string | null
          product_id: string | null
          sale_amount: number
          seller_id: string
          status: string
        }
        Insert: {
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          net_amount: number
          order_id?: string | null
          order_item_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          sale_amount: number
          seller_id: string
          status?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          net_amount?: number
          order_id?: string | null
          order_item_id?: string | null
          paid_at?: string | null
          product_id?: string | null
          sale_amount?: number
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_transactions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          account_holder: string
          address: string
          application_id: string | null
          bank_name: string
          banner_url: string | null
          city: string
          commission_rate: number
          company_name: string
          created_at: string
          description: string | null
          district: string
          iban: string
          id: string
          is_featured: boolean
          logo_url: string | null
          penalty_points: number
          phone: string
          reputation_points: number
          slug: string | null
          status: string
          suspended_reason: string | null
          suspended_until: string | null
          tax_number: string
          total_orders: number
          total_sales: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder: string
          address: string
          application_id?: string | null
          bank_name: string
          banner_url?: string | null
          city: string
          commission_rate?: number
          company_name: string
          created_at?: string
          description?: string | null
          district: string
          iban: string
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          penalty_points?: number
          phone: string
          reputation_points?: number
          slug?: string | null
          status?: string
          suspended_reason?: string | null
          suspended_until?: string | null
          tax_number: string
          total_orders?: number
          total_sales?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder?: string
          address?: string
          application_id?: string | null
          bank_name?: string
          banner_url?: string | null
          city?: string
          commission_rate?: number
          company_name?: string
          created_at?: string
          description?: string | null
          district?: string
          iban?: string
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          penalty_points?: number
          phone?: string
          reputation_points?: number
          slug?: string | null
          status?: string
          suspended_reason?: string | null
          suspended_until?: string | null
          tax_number?: string
          total_orders?: number
          total_sales?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sellers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "seller_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_companies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          tracking_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          tracking_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          tracking_url?: string | null
        }
        Relationships: []
      }
      site_activity_logs: {
        Row: {
          action_detail: Json | null
          action_type: string
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_detail?: Json | null
          action_type?: string
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_detail?: Json | null
          action_type?: string
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          content: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          phone: string
          provider: string
          sent_at: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          phone: string
          provider: string
          sent_at?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          phone?: string
          provider?: string
          sent_at?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_settings: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean
          provider: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          provider: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          template_type: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          template_type?: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          template_type?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      social_media_links: {
        Row: {
          created_at: string
          icon_name: string | null
          id: string
          is_active: boolean
          platform: string
          sort_order: number | null
          url: string
        }
        Insert: {
          created_at?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          platform: string
          sort_order?: number | null
          url: string
        }
        Update: {
          created_at?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          platform?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: []
      }
      spin_results: {
        Row: {
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          is_winner: boolean
          slice_id: string | null
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_winner?: boolean
          slice_id?: string | null
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_winner?: boolean
          slice_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spin_results_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spin_results_slice_id_fkey"
            columns: ["slice_id"]
            isOneToOne: false
            referencedRelation: "spin_wheel_slices"
            referencedColumns: ["id"]
          },
        ]
      }
      spin_wheel_config: {
        Row: {
          border_color: string
          center_color: string
          cooldown_hours: number
          coupon_expiry_hours: number
          coupon_prefix: string
          created_at: string
          id: string
          is_active: boolean
          trigger_delay_seconds: number
          trigger_scroll_percent: number
          trigger_type: string
          updated_at: string
          wheel_colors: Json
        }
        Insert: {
          border_color?: string
          center_color?: string
          cooldown_hours?: number
          coupon_expiry_hours?: number
          coupon_prefix?: string
          created_at?: string
          id?: string
          is_active?: boolean
          trigger_delay_seconds?: number
          trigger_scroll_percent?: number
          trigger_type?: string
          updated_at?: string
          wheel_colors?: Json
        }
        Update: {
          border_color?: string
          center_color?: string
          cooldown_hours?: number
          coupon_expiry_hours?: number
          coupon_prefix?: string
          created_at?: string
          id?: string
          is_active?: boolean
          trigger_delay_seconds?: number
          trigger_scroll_percent?: number
          trigger_type?: string
          updated_at?: string
          wheel_colors?: Json
        }
        Relationships: []
      }
      spin_wheel_slices: {
        Row: {
          color: string | null
          config_id: string
          created_at: string
          discount_value: number
          id: string
          is_active: boolean
          label: string
          min_cart_amount: number
          prize_type: string
          probability: number
          sort_order: number
        }
        Insert: {
          color?: string | null
          config_id: string
          created_at?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          label: string
          min_cart_amount?: number
          prize_type?: string
          probability?: number
          sort_order?: number
        }
        Update: {
          color?: string | null
          config_id?: string
          created_at?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          label?: string
          min_cart_amount?: number
          prize_type?: string
          probability?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "spin_wheel_slices_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "spin_wheel_config"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          notified_at: string | null
          product_id: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          notified_at?: string | null
          product_id: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          notified_at?: string | null
          product_id?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_carts: {
        Row: {
          created_at: string
          discount_note: string | null
          id: string
          personal_discount: number | null
          price_adjustment: number | null
          product_id: string
          quantity: number
          seller_id: string | null
          updated_at: string
          user_id: string
          variant_id: string | null
          variant_info: Json | null
        }
        Insert: {
          created_at?: string
          discount_note?: string | null
          id?: string
          personal_discount?: number | null
          price_adjustment?: number | null
          product_id: string
          quantity?: number
          seller_id?: string | null
          updated_at?: string
          user_id: string
          variant_id?: string | null
          variant_info?: Json | null
        }
        Update: {
          created_at?: string
          discount_note?: string | null
          id?: string
          personal_discount?: number | null
          price_adjustment?: number | null
          product_id?: string
          quantity?: number
          seller_id?: string | null
          updated_at?: string
          user_id?: string
          variant_id?: string | null
          variant_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_carts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_carts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_carts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_carts_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          product_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          product_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          product_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_routines: {
        Row: {
          content: string
          created_at: string
          id: string
          images: string[] | null
          is_approved: boolean
          likes_count: number
          product_ids: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean
          likes_count?: number
          product_ids?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_approved?: boolean
          likes_count?: number
          product_ids?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          order_id: string | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          order_id?: string | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      payment_settings_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_active: boolean | null
          method: Database["public"]["Enums"]["payment_method"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          method?: Database["public"]["Enums"]["payment_method"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sellers_public: {
        Row: {
          banner_url: string | null
          city: string | null
          company_name: string | null
          created_at: string | null
          description: string | null
          district: string | null
          id: string | null
          is_featured: boolean | null
          logo_url: string | null
          reputation_points: number | null
          slug: string | null
          status: string | null
          total_orders: number | null
          total_sales: number | null
        }
        Insert: {
          banner_url?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          district?: string | null
          id?: string | null
          is_featured?: boolean | null
          logo_url?: string | null
          reputation_points?: number | null
          slug?: string | null
          status?: string | null
          total_orders?: number | null
          total_sales?: number | null
        }
        Update: {
          banner_url?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          district?: string | null
          id?: string | null
          is_featured?: boolean | null
          logo_url?: string | null
          reputation_points?: number | null
          slug?: string | null
          status?: string | null
          total_orders?: number | null
          total_sales?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_order_secure:
        | {
            Args: {
              p_coupon_code?: string
              p_items: Json
              p_notes?: string
              p_payment_method: Database["public"]["Enums"]["payment_method"]
              p_referral_code?: string
              p_shipping_address: Json
              p_shipping_cost: number
              p_wallet_amount?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_coupon_code?: string
              p_guest_email?: string
              p_items: Json
              p_notes?: string
              p_payment_method: Database["public"]["Enums"]["payment_method"]
              p_referral_code?: string
              p_shipping_address: Json
              p_shipping_cost: number
              p_wallet_amount?: number
            }
            Returns: Json
          }
      get_seller_id: { Args: never; Returns: string }
      has_purchased_product: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_seller: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "seller"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_method:
        | "credit_card"
        | "bank_transfer"
        | "cash_on_delivery"
        | "shopier"
        | "shopinext"
        | "payizone"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      variant_type: "color" | "weight" | "scent"
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
      app_role: ["admin", "user", "seller"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_method: [
        "credit_card",
        "bank_transfer",
        "cash_on_delivery",
        "shopier",
        "shopinext",
        "payizone",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      variant_type: ["color", "weight", "scent"],
    },
  },
} as const
