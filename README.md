# ZorzTech

Tienda en línea de tecnología. El brief completo está en [`CLAUDE.md`](CLAUDE.md) y el estándar de calidad en [`docs/ESTANDAR-LUMACODE-v2.md`](docs/ESTANDAR-LUMACODE-v2.md).

## Puesta en marcha

```bash
npm install
cp .env.example .env        # completa DATABASE_URL con una base PostgreSQL
npx prisma migrate deploy   # crea las tablas
npm run db:seed             # categorías y productos de ejemplo
npm run dev
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Genera el cliente de Prisma y compila |
| `npm run lint` / `npm run typecheck` | Revisión de código y tipos |
| `npm test` | Pruebas unitarias (`lib/**/*.test.ts`) |
| `npm run db:migrate` | Nueva migración en desarrollo |
| `npm run db:seed` | Datos de ejemplo (se puede repetir sin duplicar) |

## Estado

Fase 1 (base) lista para revisión. Ver [`docs/fase-1-reporte.md`](docs/fase-1-reporte.md).
