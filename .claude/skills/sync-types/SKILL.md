---
name: sync-types
description: Regenera src/lib/database.types.ts desde el schema actual de Supabase. Úsalo después de aplicar cualquier migración.
allowed-tools: mcp__claude_ai_Supabase__generate_typescript_types Write
---

Regenerá los tipos TypeScript desde Supabase y actualizá el archivo local.

## Pasos
1. Llamar a `mcp__claude_ai_Supabase__generate_typescript_types` con `project_id: cggnuvdsqbqxqsoqfwps`
2. Sobreescribir el archivo `src/lib/database.types.ts` con el resultado
3. Confirmar que el archivo fue actualizado

No modificar nada más, solo el archivo de tipos.
