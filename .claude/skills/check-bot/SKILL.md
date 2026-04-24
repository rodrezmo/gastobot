---
name: check-bot
description: Muestra los últimos logs de la Edge Function del bot de WhatsApp. Úsalo para debuggear cuando el bot no responde o hay errores.
allowed-tools: mcp__claude_ai_Supabase__get_logs
---

Traé los últimos logs de la Edge Function `whatsapp-webhook` de GastoBot.

## Pasos
1. Llamar a `mcp__claude_ai_Supabase__get_logs` con:
   - `project_id: cggnuvdsqbqxqsoqfwps`
   - `service: edge-function`
2. Filtrar y mostrar solo los logs de `whatsapp-webhook`
3. Destacar si hay errores (status != 200, mensajes de error en event_message)
4. Mostrar la versión actual deployada y los últimos 5 calls con: timestamp, version, status_code, execution_time_ms

Si hay errores, sugerir posibles causas basándose en el mensaje de error.
