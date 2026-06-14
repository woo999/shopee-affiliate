export type Category = 'baby' | 'pet' | 'beauty' | 'other';
export type ContentStatus = 'draft' | 'pending' | 'scheduled' | 'published' | 'archived';
export type Platform = 'threads' | 'facebook' | 'instagram' | 'tiktok' | 'line';

export interface Profile {
  id: string; email: string; full_name: string | null;
  avatar_url: string | null; role: 'admin'|'editor'|'viewer';
  created_at: string; updated_at: string;
}

export interface Product {
  id: string; name: string; name_th: string | null;
  shopee_url: string; affiliate_url: string | null;
  image_url: string | null; price: number | null; currency: string;
  category: Category | null; tags: string[];
  commission_rate: number | null; is_active: boolean;
  click_count: number; created_by: string | null;
  created_at: string; updated_at: string;
}

export interface Content {
  id: string; title: string | null; source_url: string | null;
  source_text: string | null; translated_text: string | null;
  status: ContentStatus; platform: Platform; category: Category | null;
  scheduled_at: string | null; published_at: string | null;
  media_urls: string[]; tags: string[];
  created_by: string | null; created_at: string; updated_at: string;
  content_versions?: ContentVersion[];
  content_products?: ContentProductJoin[];
}

export interface ContentVersion {
  id: string; content_id: string; version_number: number;
  text: string; is_selected: boolean; word_count: number; created_at: string;
}

export interface ContentProductJoin {
  id: string; content_id: string; product_id: string;
  product?: Product; inserted_at: string;
}

export interface Schedule {
  id: string; content_id: string; scheduled_at: string;
  platform: string; remind_before: number; is_done: boolean;
  created_by: string | null; created_at: string;
  content?: Content;
}

export interface DashboardStats {
  content: { total:number; draft:number; pending:number; scheduled:number; published:number };
  products: { total:number; active:number };
  analytics: { clicks:number; conversions:number; revenue:number };
  upcoming: Schedule[];
  recent: Content[];
}
