# GastoBot — WhatsApp Bot

## Objetivo

Agregar un bot de WhatsApp como canal principal de carga de datos. El usuario puede registrar gastos personales, gastos compartidos, cargar a vaquitas y consultar su situación financiera sin abrir la app web.

## Arquitectura

```
[Usuario WhatsApp]
      ↓ mensaje (texto o imagen)
[Twilio WhatsApp API]
      ↓ webhook POST
[Supabase Edge Function — whatsapp-webhook]
      ↓
¿Número vinculado a usuario?
      ├── NO → Flujo de vinculación
      └── SÍ ↓
          ¿Sesión activa en bot_sessions?
          ├── SÍ → Continuar conversación (state machine)
          └── NO → Parsear como comando nuevo (Gemini Flash)
                    ↓
                Ejecutar acción en Supabase
                    ↓
                Responder por WhatsApp
```

## Stack

| Pieza | Tecnología |
|---|---|
| WhatsApp API | Twilio Sandbox (dev) → Meta Cloud API (prod) |
| Webhook handler | Supabase Edge Function (Deno) |
| NLP + Visión | Gemini Flash (texto e imagen, una sola API) |
| Estado conversación | Tabla `bot_sessions` en Supabase |
| Base de datos | Mismo Supabase de GastoBot |

## Schema nuevo

```sql
-- Vinculación número ↔ usuario
CREATE TABLE phone_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Estado de conversación activa
CREATE TABLE bot_sessions (
  phone      TEXT PRIMARY KEY,
  state      TEXT NOT NULL DEFAULT 'idle',
  context    JSONB,         -- datos acumulados del flujo en curso
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## State Machine

```
idle
  ├── texto de gasto          → awaiting_confirmation
  ├── imagen de ticket        → awaiting_confirmation
  ├── "compartido"            → awaiting_participants
  ├── "vaquita"               → awaiting_group_selection
  ├── "presupuesto ..."       → guardar presupuesto → idle
  └── consulta ("cómo voy?") → responder → idle

awaiting_confirmation
  ├── "si" / "✅"             → guardar → idle
  └── corrección              → re-parsear → awaiting_confirmation

awaiting_participants
  └── email o nombre          → awaiting_split_method

awaiting_split_method
  └── "50/50" / "yo pago X%" → awaiting_confirmation

awaiting_group_selection
  └── nombre del grupo        → awaiting_expense_amount

awaiting_expense_amount
  └── monto y descripción     → awaiting_confirmation
```

## Flujos principales

### Gasto simple
```
Vos:  "super 8450"
Bot:  "✅ Gasto registrado
       💰 $8.450 — Comida
       📅 Hoy

       ¿Correcto? (si / no o corregí algo)"
Vos:  "si"
Bot:  "Listo 👍"
```

### Ticket (imagen)
```
Vos:  [foto del ticket]
Bot:  "Encontré esto:
       📍 Disco Supermercados
       💰 $8.450
       📅 30/03/2026
       🏷️ Comida

       ¿Confirmo?"
Vos:  "si"
Bot:  "Listo 👍"
```

### Gasto compartido
```
Vos:  "almuerzo 15000 compartido"
Bot:  "¿Con quién compartís? Mandame el email"
Vos:  "rodrigo@email.com"
Bot:  "¿Cómo dividimos?
       • 50/50
       • Yo pago X%
       • Monto fijo para él"
Vos:  "50/50"
Bot:  "✅ Gasto compartido
       💰 Total: $15.000 — Tu parte: $7.500
       Rodrigo debe: $7.500 (pendiente)"
```

### Vaquita
```
Vos:  "vaquita nafta 8000"
Bot:  "¿A qué grupo lo cargo?
       1. Viaje a MDQ
       2. Depto compartido"
Vos:  "1"
Bot:  "✅ $8.000 cargado a Viaje a MDQ"
```

### Consulta
```
Vos:  "cómo voy?"
Bot:  "📊 Marzo 2026

       Comida      $52.000 / $80.000  ████░ 65%
       Transporte  $28.000 / $30.000  █████ 93% ⚠️
       Entret.     $8.000  / $20.000  ██░░░ 40%

       Balance: -$88.000 de -$130.000 presupuestado"
```

## Vinculación de número

Flujo para conectar un número de WhatsApp con una cuenta GastoBot:

1. Usuario va a **Configuración** en la web app
2. Genera un código de 6 dígitos (válido 10 minutos)
3. Manda ese código por WhatsApp al bot: `vincular 482910`
4. El bot valida el código, guarda en `phone_links` y confirma

## Plan de implementación

### Fase 1 — Infraestructura
- [ ] Migration 013: tablas `phone_links` y `bot_sessions`
- [ ] Twilio Sandbox configurado (Account SID + Auth Token)
- [ ] Gemini API key lista (Google AI Studio)

### Fase 2 — Webhook base
- [ ] Edge Function scaffold: recibe POST de Twilio, valida firma, responde 200
- [ ] Flujo de vinculación end-to-end (web app → código → WhatsApp → confirmado)

### Fase 3 — Gastos personales
- [ ] Parser de texto con Gemini Flash → JSON estructurado
- [ ] Flujo gasto simple: idle → confirmar → guardar
- [ ] Flujo imagen/ticket: descargar media → Gemini Vision → confirmar → guardar

### Fase 4 — Gastos sociales
- [ ] Flujo gasto compartido (dividir)
- [ ] Flujo vaquitas (cargar gasto a grupo existente)

### Fase 5 — Consultas + Deploy
- [ ] Consultas de solo lectura: balance, presupuesto, últimos gastos
- [ ] Deploy a Supabase producción + configurar secrets
- [ ] Smoke test end-to-end en prod

## Variables de entorno necesarias

```
GEMINI_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # número sandbox Twilio
```
