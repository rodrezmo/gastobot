---
name: deploy
description: Build de TypeScript + Vite y deploy a Vercel producción de GastoBot. Úsalo cada vez que terminás cambios y querés publicarlos.
allowed-tools: Bash
argument-hint: [opcional: mensaje descriptivo]
---

Ejecutá el build y deploy de GastoBot a producción.

## Pasos
1. Correr `npm run build` en `/Users/rodrezmo/Documents/repositorios_git/gastobot`
2. Si hay errores TypeScript, reportarlos y NO deployar
3. Si el build es exitoso, correr `npx vercel --prod`
4. Reportar la URL de producción

## Comandos
```bash
cd /Users/rodrezmo/Documents/repositorios_git/gastobot && npm run build
npx vercel --prod
```

## Si hay errores de build
- Mostrar los errores TypeScript exactos
- No intentar corregirlos automáticamente salvo que sea obvio
- Preguntar al usuario cómo proceder

Los warnings de chunk size son normales, ignorarlos.
