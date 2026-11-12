-- Kayıt sonrası isteğe bağlı "Seni biraz daha tanıyalım" adımı (12 Kasım 2026).
-- Kaba aralıklar kullanılır; kişiyi tanınabilir kılmamak için il yerine 4 seçenekli şehir.
ALTER TABLE users ADD COLUMN age_range TEXT;
ALTER TABLE users ADD COLUMN company_size TEXT;
ALTER TABLE users ADD COLUMN manages TEXT;
ALTER TABLE users ADD COLUMN city TEXT;
ALTER TABLE users ADD COLUMN extra_done INTEGER NOT NULL DEFAULT 0;
