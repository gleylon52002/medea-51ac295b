
-- Fix FK constraints on products table to allow deletion

-- seller_transactions: SET NULL (preserve transaction history)
ALTER TABLE seller_transactions DROP CONSTRAINT seller_transactions_product_id_fkey;
ALTER TABLE seller_transactions ADD CONSTRAINT seller_transactions_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- order_items: SET NULL (preserve order history)
ALTER TABLE order_items DROP CONSTRAINT order_items_product_id_fkey;
ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- favorites: CASCADE (remove favorites when product deleted)
ALTER TABLE favorites DROP CONSTRAINT favorites_product_id_fkey;
ALTER TABLE favorites ADD CONSTRAINT favorites_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- reviews: CASCADE
ALTER TABLE reviews DROP CONSTRAINT reviews_product_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- related_products: CASCADE
ALTER TABLE related_products DROP CONSTRAINT related_products_product_id_fkey;
ALTER TABLE related_products ADD CONSTRAINT related_products_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE related_products DROP CONSTRAINT related_products_related_product_id_fkey;
ALTER TABLE related_products ADD CONSTRAINT related_products_related_product_id_fkey 
  FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE CASCADE;

-- product_variants: CASCADE
ALTER TABLE product_variants DROP CONSTRAINT product_variants_product_id_fkey;
ALTER TABLE product_variants ADD CONSTRAINT product_variants_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- product_questions: CASCADE
ALTER TABLE product_questions DROP CONSTRAINT product_questions_product_id_fkey;
ALTER TABLE product_questions ADD CONSTRAINT product_questions_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- price_alerts: CASCADE
ALTER TABLE price_alerts DROP CONSTRAINT price_alerts_product_id_fkey;
ALTER TABLE price_alerts ADD CONSTRAINT price_alerts_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- product_comparisons: CASCADE
ALTER TABLE product_comparisons DROP CONSTRAINT product_comparisons_product_id_fkey;
ALTER TABLE product_comparisons ADD CONSTRAINT product_comparisons_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- product_subscriptions: CASCADE
ALTER TABLE product_subscriptions DROP CONSTRAINT product_subscriptions_product_id_fkey;
ALTER TABLE product_subscriptions ADD CONSTRAINT product_subscriptions_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
