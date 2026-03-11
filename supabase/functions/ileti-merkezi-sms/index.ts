import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const errorMessages: Record<number, string> = {
  400: "İstek çözümlenemedi. Parametreleri kontrol edin.",
  401: "Üyelik bilgileri hatalı. API Key ve Hash değerlerini kontrol edin.",
  402: "Bakiye yetersiz. Lütfen hesabınıza bakiye yükleyin.",
  450: "Gönderilen başlık (sender) sistemde tanımlı değil.",
  451: "Tekrarlanan sipariş. Aynı mesaj daha önce gönderilmiş.",
  452: "Mesaj alıcıları hatalı. Telefon numaralarını kontrol edin.",
  453: "Sipariş boyutu aşıldı. Daha az alıcıyla tekrar deneyin.",
  454: "Mesaj metni boş. Lütfen bir mesaj yazın.",
  468: "IYS sorgulanamadı. IYS ayarlarınızı kontrol edin.",
  469: "IYS üzerinden doğrulanamayan numaralar var.",
  470: "IYS ile ilgili genel bir hata oluştu. Ayarları kontrol edin.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { key, hash, text, receipents, sender, iys, iysList } = await req.json();

    if (!key || !hash || !text || !receipents || !sender) {
      return new Response(
        JSON.stringify({ success: false, error: "Eksik parametreler" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 451 hatasını önlemek için mesaja zaman damgası ekle
    const now = new Date();
    const timestamp = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    const textWithTimestamp = `${text} [${timestamp}]`;

    const params = new URLSearchParams({
      key,
      hash,
      text: textWithTimestamp,
      receipents,
      sender,
      iys: String(iys ?? 1),
      iysList: iysList || "BIREYSEL",
    });

    const apiUrl = `https://api.iletimerkezi.com/v1/send-sms/get/?${params.toString()}`;
    
    console.log("İleti Merkezi API Request URL:", apiUrl.replace(key, "***").replace(hash, "***"));

    const response = await fetch(apiUrl, { method: "GET" });
    const xmlText = await response.text();

    console.log("İleti Merkezi API Response:", xmlText);

    // Parse XML response
    const codeMatch = xmlText.match(/<code>(\d+)<\/code>/);
    const descMatch = xmlText.match(/<description>(.*?)<\/description>/);
    const orderIdMatch = xmlText.match(/<id>(\d+)<\/id>/);

    const code = codeMatch ? parseInt(codeMatch[1]) : 0;
    const description = descMatch ? descMatch[1] : "";
    const orderId = orderIdMatch ? orderIdMatch[1] : null;

    if (code === 200) {
      return new Response(
        JSON.stringify({
          success: true,
          code,
          description,
          orderId,
          message: "SMS başarıyla gönderildi!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errorMsg = errorMessages[code] || description || "Bilinmeyen bir hata oluştu.";
      return new Response(
        JSON.stringify({
          success: false,
          code,
          description,
          error: errorMsg,
          rawResponse: xmlText,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("İleti Merkezi SMS Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
