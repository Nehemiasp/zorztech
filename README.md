# ZorzTech

Tienda en línea de tecnología. El brief completo está en [`CLAUDE.md`](CLAUDE.md) y el estándar de calidad en [`docs/ESTANDAR-LUMACODE-v2.md`](docs/ESTANDAR-LUMACODE-v2.md).

## Puesta en marcha

```bash
npm install
cp .env.example .env        # completa DATABASE_URL con una base PostgreSQL
npx prisma migrate deploy   # crea las tablas
npm run db:seed             # catálogo, tarifas y tienda de ejemplo (y un administrador si defines SEED_ADMIN_*)
npm run dev
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Genera el cliente de Prisma y compila |
| `npm run lint` / `npm run typecheck` | Revisión de código y tipos |
| `npm test` | Pruebas unitarias (`lib/**/*.test.ts`) |
| `npm run test:integration` | Compra, pagos e inventario contra la base de datos de desarrollo |
| `npm run test:e2e` | Recorridos en navegador (Playwright). Con la app en marcha: `RATE_LIMIT_OFF=1 ALLOW_LOCAL_UPLOADS=1 npm start` |
| `npm run db:migrate` | Nueva migración en desarrollo |
| `npm run db:seed` | Datos de ejemplo (se puede repetir sin duplicar) |

## Estado

- Fase 1 (base): aprobada. [`docs/fase-1-reporte.md`](docs/fase-1-reporte.md).
- Fase 2 (catálogo): [`docs/fase-2-reporte.md`](docs/fase-2-reporte.md).
- Fase 3 (compra): [`docs/fase-3-reporte.md`](docs/fase-3-reporte.md).
- Fase 4 (administración): [`docs/fase-4-reporte.md`](docs/fase-4-reporte.md).
- Fase 5 (cierre): [`docs/fase-5-reporte.md`](docs/fase-5-reporte.md).
- Fase 6 (pasarela real): pendiente de que exista la API del proveedor. Pasos en [`docs/conectar-pasarela.md`](docs/conectar-pasarela.md).
