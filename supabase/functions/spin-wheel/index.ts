import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Giriş yapmalısınız" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Geçersiz oturum" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Get active config
    const { data: config } = await supabase
      .from("spin_wheel_config")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!config) {
      return new Response(JSON.stringify({ error: "Çark aktif değil" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: check cooldown
    const cooldownMs = config.cooldown_hours * 60 * 60 * 1000;
    const { data: lastSpin } = await supabase
      .from("spin_results")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSpin) {
      const timeSince = Date.now() - new Date(lastSpin.created_at).getTime();
      if (timeSince < cooldownMs) {
        const nextSpinAt = new Date(new Date(lastSpin.created_at).getTime() + cooldownMs).toISOString();
        return new Response(JSON.stringify({ 
          error: "Çarkı tekrar çevirebilmek için beklemelisiniz",
          next_spin_at: nextSpinAt,
          cooldown_remaining_ms: cooldownMs - timeSince
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Additional rate limit: max 1 request per 5 seconds
    if (lastSpin) {
      const timeSince = Date.now() - new Date(lastSpin.created_at).getTime();
      if (timeSince < 5000) {
        return new Response(JSON.stringify({ error: "Çok hızlı! Lütfen bekleyin." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get active slices
    const { data: slices } = await supabase
      .from("spin_wheel_slices")
      .select("*")
      .eq("config_id", config.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!slices || slices.length === 0) {
      return new Response(JSON.stringify({ error: "Çark dilimi bulunamadı" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Weighted random selection
    const totalWeight = slices.reduce((sum, s) => sum + s.probability, 0);
    let random = Math.random() * totalWeight;
    let selectedSlice = slices[0];
    for (const slice of slices) {
      random -= slice.probability;
      if (random <= 0) {
        selectedSlice = slice;
        break;
      }
    }

    const isWinner = selectedSlice.prize_type !== "retry";
    let couponCode: string | null = null;
    let couponId: string | null = null;
    let expiresAt: string | null = null;

    if (isWinner) {
      // Generate unique coupon code
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
      couponCode = `${config.coupon_prefix}-${randomPart}`;
      expiresAt = new Date(Date.now() + config.coupon_expiry_hours * 60 * 60 * 1000).toISOString();

      // Determine discount type for coupons table
      let discountType = "percentage";
      let discountValue = selectedSlice.discount_value;
      
      if (selectedSlice.prize_type === "free_shipping") {
        discountType = "fixed";
        discountValue = 9999; // large value to cover any shipping
      } else if (selectedSlice.prize_type === "fixed") {
        discountType = "fixed";
      }

      // Create real coupon in coupons table
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .insert({
          code: couponCode,
          description: `Çark ödülü: ${selectedSlice.label}`,
          discount_type: discountType,
          discount_value: discountValue,
          minimum_order_amount: selectedSlice.min_cart_amount || 0,
          max_uses: 1,
          starts_at: new Date().toISOString(),
          expires_at: expiresAt,
          is_active: true,
        })
        .select("id")
        .single();

      if (couponError) {
        console.error("Coupon creation error:", couponError);
        return new Response(JSON.stringify({ error: "Kupon oluşturulamadı" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      couponId = coupon.id;
    }

    // Get client IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

    // Record the spin result
    await supabase.from("spin_results").insert({
      user_id: userId,
      slice_id: selectedSlice.id,
      coupon_id: couponId,
      coupon_code: couponCode,
      is_winner: isWinner,
      ip_address: ip,
    });

    // Calculate which slice index was selected (for frontend animation)
    const sliceIndex = slices.findIndex((s) => s.id === selectedSlice.id);

    return new Response(
      JSON.stringify({
        success: true,
        slice_index: sliceIndex,
        slice: {
          label: selectedSlice.label,
          prize_type: selectedSlice.prize_type,
          discount_value: selectedSlice.discount_value,
          min_cart_amount: selectedSlice.min_cart_amount,
        },
        is_winner: isWinner,
        coupon_code: couponCode,
        expires_at: expiresAt,
        coupon_expiry_hours: config.coupon_expiry_hours,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Spin wheel error:", error);
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
