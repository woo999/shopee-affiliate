-- ======================================================
-- Shopee Affiliate Platform – Supabase Schema
-- 貼到 Supabase → SQL Editor → Run
-- ======================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT NOT NULL,
  full_name  TEXT,
  avatar_url TEXT,
  role       TEXT DEFAULT 'editor' CHECK (role IN ('admin','editor','viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS 商品庫
CREATE TABLE IF NOT EXISTS public.products (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name             TEXT NOT NULL,
  name_th          TEXT,
  shopee_url       TEXT NOT NULL,
  affiliate_url    TEXT,
  image_url        TEXT,
  price            DECIMAL(10,2),
  currency         TEXT DEFAULT 'THB',
  category         TEXT CHECK (category IN ('baby','pet','beauty','other')),
  tags             TEXT[] DEFAULT '{}',
  commission_rate  DECIMAL(5,2),
  is_active        BOOLEAN DEFAULT true,
  click_count      INTEGER DEFAULT 0,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- CONTENT 內容庫
CREATE TABLE IF NOT EXISTS public.content (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title           TEXT,
  source_url      TEXT,
  source_text     TEXT,
  translated_text TEXT,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','scheduled','published','archived')),
  platform        TEXT DEFAULT 'threads' CHECK (platform IN ('threads','facebook','instagram','tiktok','line')),
  category        TEXT CHECK (category IN ('baby','pet','beauty','other')),
  scheduled_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  media_urls      TEXT[] DEFAULT '{}',
  tags            TEXT[] DEFAULT '{}',
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- CONTENT VERSIONS AI 改寫版本
CREATE TABLE IF NOT EXISTS public.content_versions (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id     UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  text           TEXT NOT NULL,
  is_selected    BOOLEAN DEFAULT false,
  word_count     INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- CONTENT ↔ PRODUCTS
CREATE TABLE IF NOT EXISTS public.content_products (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id  UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  inserted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, product_id)
);

-- SCHEDULES 排程
CREATE TABLE IF NOT EXISTS public.schedules (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id    UUID REFERENCES public.content(id) ON DELETE CASCADE NOT NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  platform      TEXT NOT NULL,
  remind_before INTEGER DEFAULT 30,
  is_done       BOOLEAN DEFAULT false,
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ANALYTICS 成效
CREATE TABLE IF NOT EXISTS public.analytics (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id  UUID REFERENCES public.content(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES public.products(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('view','click','conversion')),
  revenue     DECIMAL(10,2) DEFAULT 0,
  metadata    JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "p_profiles_s" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "p_profiles_u" ON public.profiles FOR UPDATE USING (auth.uid()=id);
CREATE POLICY "p_products" ON public.products FOR ALL USING (auth.role()='authenticated');
CREATE POLICY "p_content" ON public.content FOR ALL USING (auth.role()='authenticated');
CREATE POLICY "p_versions" ON public.content_versions FOR ALL USING (auth.role()='authenticated');
CREATE POLICY "p_cp" ON public.content_products FOR ALL USING (auth.role()='authenticated');
CREATE POLICY "p_schedules" ON public.schedules FOR ALL USING (auth.role()='authenticated');
CREATE POLICY "p_analytics_s" ON public.analytics FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "p_analytics_i" ON public.analytics FOR INSERT WITH CHECK (auth.role()='authenticated');

-- TRIGGER: auto create profile
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles(id,email,full_name)
  VALUES(NEW.id,NEW.email,NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRIGGER: auto updated_at
CREATE OR REPLACE FUNCTION public.upd() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at=NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER t_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.upd();
CREATE TRIGGER t_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.upd();
CREATE TRIGGER t_content  BEFORE UPDATE ON public.content  FOR EACH ROW EXECUTE FUNCTION public.upd();

-- SEED 商品
INSERT INTO public.products (name,name_th,shopee_url,affiliate_url,image_url,price,category,tags,commission_rate) VALUES
('Baby Lotion 200ml','โลชั่นเด็ก 200ml','https://shopee.co.th/p/baby1','https://s.shopee.co.th/af_baby1','https://via.placeholder.com/200x200?text=Baby+Lotion',189,'baby',ARRAY['baby','lotion'],8.5),
('Pet Shampoo','แชมพูสัตว์เลี้ยง','https://shopee.co.th/p/pet1','https://s.shopee.co.th/af_pet1','https://via.placeholder.com/200x200?text=Pet+Shampoo',299,'pet',ARRAY['pet','shampoo'],9.0),
('Vitamin C Serum','เซรั่มวิตามินซี','https://shopee.co.th/p/beauty1','https://s.shopee.co.th/af_beauty1','https://via.placeholder.com/200x200?text=Vit+C',399,'beauty',ARRAY['skincare','serum'],10.0),
('Baby Diaper M 50pcs','ผ้าอ้อมเด็ก M 50ชิ้น','https://shopee.co.th/p/baby2','https://s.shopee.co.th/af_baby2','https://via.placeholder.com/200x200?text=Diaper',449,'baby',ARRAY['baby','diaper'],7.5),
('Dog Snack','ขนมสุนัข','https://shopee.co.th/p/pet2','https://s.shopee.co.th/af_pet2','https://via.placeholder.com/200x200?text=Dog+Snack',159,'pet',ARRAY['pet','dog'],8.0);
