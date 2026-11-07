-- Prepara la tienda para producción: quita los datos de prueba y de ejemplo.
-- Se ejecuta en una sola transacción (si algo falla, no cambia nada). NO se puede deshacer.
--
-- Qué borra:
--   1. Todos los pedidos (con sus líneas, pagos, comprobantes e historial) y los carritos.
--   2. Los productos marcados como «de ejemplo» (con sus variantes, imágenes y avisos de stock).
--   3. Las marcas de ejemplo, el cupón EJEMPLO10 y las tiendas para recoger con dirección en marcador.
-- Qué conserva: categorías y subcategorías, la configuración (contacto, envío, transferencia),
-- los banners, las cuentas (incluida la de administrador) y cualquier producto que ya no sea de ejemplo.

BEGIN;

DELETE FROM orders;
DELETE FROM carts;

DELETE FROM products WHERE "isSample";

DELETE FROM brands WHERE slug IN ('marca-ejemplo-a', 'marca-ejemplo-b');
DELETE FROM coupons WHERE code = 'EJEMPLO10';
DELETE FROM pickup_locations WHERE address LIKE '[%';

-- Sin pedidos pendientes, nada puede estar apartado.
UPDATE product_variants SET "reservedStock" = 0;

COMMIT;

-- Comprobación:
SELECT
  (SELECT count(*) FROM orders)                        AS pedidos,
  (SELECT count(*) FROM carts)                         AS carritos,
  (SELECT count(*) FROM products)                      AS productos,
  (SELECT count(*) FROM products WHERE "isSample")     AS de_ejemplo,
  (SELECT count(*) FROM brands)                        AS marcas,
  (SELECT count(*) FROM coupons)                       AS cupones,
  (SELECT count(*) FROM pickup_locations)              AS tiendas_para_recoger;
