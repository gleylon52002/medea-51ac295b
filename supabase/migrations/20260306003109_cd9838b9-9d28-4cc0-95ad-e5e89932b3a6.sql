-- Create HOSGELDIN coupon
INSERT INTO public.coupons (code, description, discount_type, discount_value, minimum_order_amount, max_uses, is_active)
VALUES ('HOSGELDIN', 'İlk siparişe özel %10 indirim', 'percentage', 10, 0, null, true)
ON CONFLICT DO NOTHING;

-- Create default spin wheel config if none exists
INSERT INTO public.spin_wheel_config (is_active, cooldown_hours, coupon_prefix, coupon_expiry_hours, trigger_type, trigger_delay_seconds, trigger_scroll_percent, wheel_colors, center_color, border_color)
SELECT true, 24, 'CARK', 72, 'scroll', 30, 50, '["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F"]'::jsonb, '#2d4a3e', '#ffffff'
WHERE NOT EXISTS (SELECT 1 FROM public.spin_wheel_config LIMIT 1);

-- Insert default slices if the config was just created
WITH cfg AS (SELECT id FROM public.spin_wheel_config LIMIT 1)
INSERT INTO public.spin_wheel_slices (config_id, label, prize_type, discount_value, min_cart_amount, probability, color, sort_order, is_active)
SELECT cfg.id, vals.label, vals.prize_type, vals.discount_value, vals.min_cart_amount, vals.probability, vals.color, vals.sort_order, true
FROM cfg, (VALUES
  ('Tekrar Deneyin', 'retry', 0, 0, 50, '#999999', 0),
  ('%5 İndirim', 'percentage', 5, 50, 20, '#FF6B6B', 1),
  ('%10 İndirim', 'percentage', 10, 100, 15, '#4ECDC4', 2),
  ('Kargo Bedava', 'free_shipping', 0, 75, 10, '#45B7D1', 3),
  ('%20 İndirim', 'percentage', 20, 150, 3, '#FFEAA7', 4),
  ('Tekrar Deneyin', 'retry', 0, 0, 50, '#DDA0DD', 5),
  ('10₺ İndirim', 'fixed', 10, 50, 15, '#96CEB4', 6),
  ('%15 İndirim', 'percentage', 15, 100, 7, '#F7DC6F', 7)
) AS vals(label, prize_type, discount_value, min_cart_amount, probability, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.spin_wheel_slices LIMIT 1);