import { json } from "@/lib/api";
import { getCartView } from "@/lib/cart/service";

export async function GET() {
  return json({ cart: await getCartView() });
}
