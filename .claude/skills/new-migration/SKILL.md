---
name: new-migration
description: Crea un archivo de migración SQL vacío con el número correcto. Uso: /new-migration nombre-descriptivo
allowed-tools: Glob Write Bash
argument-hint: <nombre-descriptivo>
---

Creá un nuevo archivo de migración SQL numerado correctamente para GastoBot.

## Pasos
1. Listá los archivos en `supabase/migrations/*.sql` para encontrar el número más alto
2. El nuevo número es el siguiente (ej: si existe `014_`, crear `015_`)
3. Crear el archivo `supabase/migrations/NNN_$ARGUMENTS.sql` con este template:

```sql
-- Migration: $ARGUMENTS
-- Created: [fecha actual]

-- ============================================
-- Escribí tu migración acá
-- ============================================
```

4. Confirmar el path del archivo creado

Si no hay migraciones existentes, empezar desde `001_`.
