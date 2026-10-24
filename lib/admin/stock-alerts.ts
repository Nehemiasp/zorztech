import { db } from "../db";
import { restockEmail } from "../email/templates";
import { sendEmail } from "../email";
import { siteConfig } from "../site";

/**
 * Avisa por correo a quien pidió "Avisarme cuando llegue" para variantes que volvieron a tener unidades.
 * Cada aviso se manda una sola vez. No lanza: un correo que falla no debe frenar el guardado del stock.
 */
export async function notifyRestock(variantIds: string[]): Promise<number> {
  if (variantIds.length === 0) return 0;
  let sent = 0;
  try {
    const alerts = await db.stockAlert.findMany({
      where: { variantId: { in: variantIds }, notifiedAt: null },
      include: { variant: { select: { name: true, stock: true, reservedStock: true, isActive: true, product: { select: { name: true, slug: true, isActive: true } } } } },
    });
    for (const alert of alerts) {
      const v = alert.variant;
      if (!v.isActive || !v.product.isActive || v.stock - v.reservedStock <= 0) continue;
      const url = `${siteConfig.url}/productos/${v.product.slug}`;
      await sendEmail(restockEmail(alert.email, v.product.name, v.name, url));
      await db.stockAlert.update({ where: { id: alert.id }, data: { notifiedAt: new Date() } });
      sent++;
    }
  } catch (error) {
    console.error("[stock] No se pudieron enviar los avisos", error instanceof Error ? error.message : error);
  }
  return sent;
}
