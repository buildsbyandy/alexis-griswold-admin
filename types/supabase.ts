export interface Database {
  public: {
    Tables: {
      storefront_products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          price: string;
          image_url: string;
          category_id: string;
          status: 'draft' | 'published' | 'archived';
          is_favorite: boolean;
          tags: string[];
          amazon_url: string;
          click_count: number;
          last_clicked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['storefront_products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['storefront_products']['Insert']>;
      };
      storefront_categories: {
        Row: {
          id: string;
          name: string;
          description: string;
          image_url: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['storefront_categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['storefront_categories']['Insert']>;
      };
      storefront_favorites: {
        Row: {
          id: string;
          product_id: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
          product?: Database['public']['Tables']['storefront_products']['Row'];
        };
        Insert: Omit<Database['public']['Tables']['storefront_favorites']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['storefront_favorites']['Insert']>;
      };
    };
  };
}

export type StorefrontProduct = Database['public']['Tables']['storefront_products']['Row'];
export type StorefrontCategory = Database['public']['Tables']['storefront_categories']['Row'];
export type StorefrontFavorite = Database['public']['Tables']['storefront_favorites']['Row'];