import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { handleMessage } from "./handle-message.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "whatsapp:+14155238886";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Envía un mensaje de WhatsApp via Twilio
export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: TWILIO_WHATSAPP_FROM,
      To: to,
      Body: body,
    }).toString(),
  });
}

Deno.serve(async (req: Request) => {
  // Solo aceptamos POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);

  // Extraer datos del mensaje de Twilio
  const from = params.get("From") ?? "";       // ej: whatsapp:+5491112345678
  const msgBody = params.get("Body") ?? "";    // texto del mensaje
  const numMedia = parseInt(params.get("NumMedia") ?? "0");
  const mediaUrl = numMedia > 0 ? params.get("MediaUrl0") : null;
  const mediaType = numMedia > 0 ? params.get("MediaContentType0") : null;

  console.log(`Mensaje de ${from}: "${msgBody}" | media: ${mediaUrl ?? "ninguna"} (${mediaType ?? "-"})`);

  // Extraer número limpio (sin prefijo whatsapp:)
  const phone = from.replace("whatsapp:", "");

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verificar si el número está vinculado a un usuario
  const { data: link } = await supabase
    .from("phone_links")
    .select("user_id, verified_at")
    .eq("phone", phone)
    .single();

  if (!link || !link.verified_at) {
    // Flujo de vinculación
    const isLinkingCode = /^vincular\s+\d{6}$/i.test(msgBody.trim());

    if (isLinkingCode) {
      const code = msgBody.trim().split(/\s+/)[1];
      const { data: linkingCode } = await supabase
        .from("linking_codes")
        .select("user_id, expires_at, used_at")
        .eq("code", code)
        .single();

      if (!linkingCode) {
        await sendWhatsAppMessage(from, "Código inválido. Generá uno nuevo desde la app web en Configuración.");
      } else if (linkingCode.used_at) {
        await sendWhatsAppMessage(from, "Este código ya fue usado. Generá uno nuevo desde la app web.");
      } else if (new Date(linkingCode.expires_at) < new Date()) {
        await sendWhatsAppMessage(from, "El código expiró. Generá uno nuevo desde la app web.");
      } else {
        // Vincular el número
        await supabase.from("phone_links").upsert({
          user_id: linkingCode.user_id,
          phone,
          verified_at: new Date().toISOString(),
        });
        await supabase
          .from("linking_codes")
          .update({ used_at: new Date().toISOString() })
          .eq("code", code);

        await sendWhatsAppMessage(
          from,
          "✅ *¡Número vinculado exitosamente!*\n\nYa podés cargar gastos por acá. Probá mandando algo como:\n• _taxi 1800_\n• _super 8450_\n• _me depositaron 150000_\n\nO mandá una foto de un ticket 🧾"
        );
      }
    } else {
      await sendWhatsAppMessage(
        from,
        "👋 Hola! Para usar GastoBot por WhatsApp primero tenés que vincular tu número.\n\n1. Abrí la app web\n2. Andá a *Configuración*\n3. Generá tu código de vinculación\n4. Respondé acá: *vincular XXXXXX*"
      );
    }

    return new Response("OK", { status: 200 });
  }

  // Número vinculado — procesar mensaje
  await handleMessage({ supabase, from, phone, userId: link.user_id, msgBody, mediaUrl, mediaType });

  return new Response("OK", { status: 200 });
});
