-- Limpia los pedidos de prueba antes de abrir la tienda.
-- Se ejecuta en Neon: consola → tu proyecto → SQL Editor → base «neondb». NO se puede deshacer:
-- antes, crea una rama de respaldo en Neon (Branches → Create branch).
--
-- Qué hace, todo en una sola transacción (si algo falla, no cambia nada):
--   1. Devuelve al inventario lo que vendieron los pedidos pagados, enviados o entregados.
--   2. Borra todos los pedidos. Sus líneas, pagos, comprobantes e historial se borran con ellos.
--   3. Recalcula el stock apartado: sin pedidos pendientes queda en 0 (también corrige apartados sueltos).
--   4. Reinicia el conteo de usos de los cupones.
--   5. Vacía los carritos.
-- No toca productos, categorías, cuentas, configuración ni tus datos de transferencia.

BEGIN;

UPDATE product_variants v
SET stock = v.stock + s.qty
FROM (
  SELECT oi."variantId", SUM(oi.quantity)::int AS qty
  FROM order_items oi
  JOIN orders o ON o.id = oi."orderId"
  WHERE o.status IN ('pagado', 'en_preparacion', 'enviado', 'listo_para_recoger', 'entregado')
  GROUP BY oi."variantId"
) s
WHERE v.id = s."variantId";

DELETE FROM orders;

UPDATE product_variants SET "reservedStock" = 0;

UPDATE coupons SET "usedCount" = 0;

DELETE FROM carts;

COMMIT;

-- Comprobación (debe dar 0, 0, 0 y 0):
SELECT
  (SELECT count(*) FROM orders)                                   AS pedidos,
  (SELECT count(*) FROM payments)                                 AS pagos,
  (SELECT coalesce(sum("reservedStock"), 0) FROM product_variants) AS apartado,
  (SELECT count(*) FROM carts)                                    AS carritos;
