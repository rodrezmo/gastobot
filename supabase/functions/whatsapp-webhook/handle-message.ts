import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { parseMessage, parseMessageVision } from "./parse-message.ts";
import { sendWhatsAppMessage } from "./index.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";

async function downloadTwilioMedia(url: string): Promise<{ base64: string; mimeType: string }> {
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const res = await fetch(url, {
    headers: { "Authorization": `Basic ${credentials}` },
  });
  const mimeType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return { base64: btoa(binary), mimeType };
}

type Context = {
  supabase: SupabaseClient;
  from: string;
  phone: string;
  userId: string;
  msgBody: string;
  mediaUrl: string | null;
  mediaType: string | null;
};

type SessionState = "idle" | "awaiting_confirmation";

type SessionContext = {
  parsed?: {
    intent: string;
    amount: number;
    description: string | null;
    category_hint: string | null;
    date: string | null;
    category_id?: string;
  };
};

async function getSession(supabase: SupabaseClient, phone: string): Promise<{ state: SessionState; context: SessionContext }> {
  const { data } = await supabase.from("bot_sessions").select("state, context").eq("phone", phone).maybeSingle();
  return { state: (data?.state ?? "idle") as SessionState, context: (data?.context ?? {}) as SessionContext };
}

async function saveSession(supabase: SupabaseClient, phone: string, state: SessionState, context: SessionContext): Promise<void> {
  await supabase.from("bot_sessions").upsert({ phone, state, context, updated_at: new Date().toISOString() });
}

async function clearSession(supabase: SupabaseClient, phone: string): Promise<void> {
  await supabase.from("bot_sessions").upsert({ phone, state: "idle", context: {}, updated_at: new Date().toISOString() });
}

async function findCategory(supabase: SupabaseClient, userId: string, hint: string | null, type: "expense" | "income"): Promise<string | null> {
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
    .eq("type", type);

  if (!categories || categories.length === 0) return null;

  if (hint) {
    const normalized = hint.toLowerCase();
    const match = categories.find((c) => c.name.toLowerCase().includes(normalized) || normalized.includes(c.name.toLowerCase()));
    if (match) return match.id;
  }

  const otros = categories.find((c) => c.name.toLowerCase() === "otros");
  return otros?.id ?? categories[0].id;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-AR").format(amount);
}

export async function handleMessage(ctx: Context): Promise<void> {
  const { supabase, from, phone, userId, msgBody, mediaUrl, mediaType } = ctx;
  const session = await getSession(supabase, phone);

  // Estado: esperando confirmación
  if (session.state === "awaiting_confirmation" && session.context.parsed) {
    const parsed = session.context.parsed;
    const normalized = msgBody.trim().toLowerCase();
    const isYes = ["si", "sí", "s", "yes", "dale", "ok", "✅", "👍"].includes(normalized);
    const isNo = ["no", "n", "cancelar", "cancel"].includes(normalized);

    if (isYes) {
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        category_id: parsed.category_id!,
        amount: parsed.amount,
        type: parsed.intent === "ingreso" ? "income" : "expense",
        description: parsed.description,
        date: parsed.date ?? new Date().toISOString().split("T")[0],
      });

      if (error) {
        await sendWhatsAppMessage(from, "❌ Hubo un error al guardar. Intentá de nuevo.");
      } else {
        await sendWhatsAppMessage(from, "✅ Guardado 👍");
      }
      await clearSession(supabase, phone);
      return;
    }

    if (isNo) {
      await sendWhatsAppMessage(from, "Cancelado. Mandá el gasto de nuevo cuando quieras.");
      await clearSession(supabase, phone);
      return;
    }

    // Corrección — re-parsear con el nuevo texto
    await clearSession(supabase, phone);
    // Continúa al flujo normal abajo
  }

  // Estado: idle — parsear mensaje nuevo (texto o imagen)
  let parsed: Awaited<ReturnType<typeof parseMessage>>;

  if (mediaUrl && mediaType?.startsWith("image/")) {
    console.log(`Procesando imagen: ${mediaUrl} (${mediaType})`);
    const { base64, mimeType } = await downloadTwilioMedia(mediaUrl);
    parsed = await parseMessageVision(base64, mimeType);
  } else if (mediaUrl) {
    await sendWhatsAppMessage(from, "Solo puedo procesar imágenes de tickets por ahora. 🧾\nMandá una foto del ticket o escribí el gasto manualmente.");
    return;
  } else {
    parsed = await parseMessage(msgBody);
  }

  if (parsed.intent === "consulta") {
    await handleConsulta(supabase, from, userId);
    return;
  }

  if (parsed.intent === "desconocido" || !parsed.amount) {
    await sendWhatsAppMessage(
      from,
      "No entendí bien 🤔 Probá con algo como:\n• _taxi 1800_\n• _super 8450_\n• _me depositaron 150000_"
    );
    return;
  }

  const type = parsed.intent === "ingreso" ? "income" : "expense";
  const categoryId = await findCategory(supabase, userId, parsed.category_hint, type);

  if (!categoryId) {
    await sendWhatsAppMessage(from, "❌ No encontré categorías en tu cuenta. Configuralas desde la app web.");
    return;
  }

  const { data: cat } = await supabase.from("categories").select("name").eq("id", categoryId).single();
  const catName = cat?.name ?? parsed.category_hint ?? "Otros";
  const emoji = type === "income" ? "💰" : "💸";
  const dateLabel = parsed.date ?? new Date().toISOString().split("T")[0];

  await saveSession(supabase, phone, "awaiting_confirmation", {
    parsed: { ...parsed, amount: parsed.amount, category_id: categoryId, date: dateLabel },
  });

  await sendWhatsAppMessage(
    from,
    `${emoji} *${parsed.intent === "ingreso" ? "Ingreso" : "Gasto"}*\n💵 $${formatAmount(parsed.amount)}\n🏷️ ${catName}${parsed.description ? `\n📝 ${parsed.description}` : ""}\n📅 ${dateLabel}\n\n¿Confirmo? Respondé *si* o *no*`
  );
}

async function handleConsulta(supabase: SupabaseClient, from: string, userId: string): Promise<void> {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const { data: txs } = await supabase
    .from("transactions")
    .select("amount, type")
    .eq("user_id", userId)
    .gte("date", firstDay)
    .lte("date", lastDay);

  if (!txs || txs.length === 0) {
    await sendWhatsAppMessage(from, "No tenés transacciones este mes todavía.");
    return;
  }

  const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const mes = now.toLocaleString("es-AR", { month: "long", year: "numeric" });
  await sendWhatsAppMessage(
    from,
    `📊 *Resumen de ${mes}*\n\n💰 Ingresos: $${new Intl.NumberFormat("es-AR").format(totalIncome)}\n💸 Gastos: $${new Intl.NumberFormat("es-AR").format(totalExpense)}\n📈 Balance: ${balance >= 0 ? "+" : ""}$${new Intl.NumberFormat("es-AR").format(balance)}`
  );
}
