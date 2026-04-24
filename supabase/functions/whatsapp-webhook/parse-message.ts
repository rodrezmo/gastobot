const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export type ParsedMessage = {
  intent: "gasto" | "ingreso" | "consulta" | "desconocido";
  amount: number | null;
  description: string | null;
  category_hint: string | null;
  date: string | null; // ISO date YYYY-MM-DD
};

const SYSTEM_PROMPT = `Sos un asistente que extrae datos de mensajes de gastos personales en español rioplatense.
Analizá el mensaje y devolvé SOLO un JSON con esta estructura exacta:
{
  "intent": "gasto" | "ingreso" | "consulta" | "desconocido",
  "amount": número o null,
  "description": string o null,
  "category_hint": string o null,
  "date": "YYYY-MM-DD" o null
}

Reglas:
- intent "gasto": compras, pagos, gastos. Ej: "taxi 1800", "super 8450", "almuerzo 3500"
- intent "ingreso": cobros, depósitos, ingresos. Ej: "me depositaron 150000", "cobré 80000"
- intent "consulta": preguntas sobre balance, gastos, presupuesto. Ej: "cómo voy?", "cuánto gasté"
- intent "desconocido": cualquier otra cosa
- amount: solo el número, sin símbolos. Si dice "1.500" o "1,500" interpretar como 1500
- category_hint: inferí la categoría en español. Opciones: Comida, Transporte, Entretenimiento, Salud, Educacion, Hogar, Ropa, Otros, Salario, Freelance, Inversiones
- date: si menciona "ayer", "el lunes", etc. calcular la fecha. Si no menciona fecha, devolver null
- Hoy es ${new Date().toISOString().split("T")[0]}

Devolvé SOLO el JSON, sin explicaciones ni markdown.`;

const VISION_PROMPT = `Sos un asistente que extrae datos de tickets, recibos o comprobantes de transferencia en imágenes, en español rioplatense.
Analizá la imagen y devolvé SOLO un JSON con esta estructura exacta:
{
  "intent": "gasto" | "ingreso" | "desconocido",
  "amount": número o null,
  "description": string o null,
  "category_hint": string o null,
  "date": "YYYY-MM-DD" o null
}

Reglas:
- intent "gasto": tickets de compra, recibos, facturas
- intent "ingreso": comprobantes de depósito, transferencias recibidas
- intent "desconocido": si no podés identificar un monto claro
- amount: el total o importe final, solo el número sin símbolos. Si dice "1.500" o "1,500" interpretar como 1500
- description: nombre del comercio, producto principal, o concepto de la transferencia
- category_hint: inferí la categoría. Opciones: Comida, Transporte, Entretenimiento, Salud, Educacion, Hogar, Ropa, Otros, Salario, Freelance, Inversiones
- date: si aparece fecha en el ticket/comprobante, usarla en formato YYYY-MM-DD. Si no aparece, null. Hoy es ${new Date().toISOString().split("T")[0]}

Devolvé SOLO el JSON, sin explicaciones ni markdown.`;

export async function parseMessageVision(imageBase64: string, mimeType: string): Promise<ParsedMessage> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: VISION_PROMPT },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 200 },
    }),
  });

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as ParsedMessage;
  } catch {
    return { intent: "desconocido", amount: null, description: null, category_hint: null, date: null };
  }
}

export async function parseMessage(text: string): Promise<ParsedMessage> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nMensaje: "${text}"` }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 200 },
    }),
  });

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as ParsedMessage;
  } catch {
    return { intent: "desconocido", amount: null, description: null, category_hint: null, date: null };
  }
}
