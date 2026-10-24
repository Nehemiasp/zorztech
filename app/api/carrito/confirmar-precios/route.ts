import { checkOrigin, json } from "@/lib/api";
import { confirmPrices } from "@/lib/cart/service";

export async function POST(request: Request) {
  const blocked = checkOrigin(request);
  if (blocked) return blocked;
  return json(await confirmPrices());
}
