import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info/info-page";
import { Marker } from "@/components/marker";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas sobre cómo comprar, pagar, recibir y seguir tu pedido en ZorzTech.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

const link = "text-brand-primary-strong underline underline-offset-2";

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: "¿Necesito una cuenta para comprar?",
    a: "No. Puedes comprar como invitado con tu correo y teléfono. Con una cuenta guardas tus direcciones y ves todos tus pedidos en un solo lugar.",
  },
  {
    q: "¿Los precios incluyen IVA?",
    a: "Sí, todos los precios están en quetzales (GTQ) con IVA incluido. El costo de envío se suma antes de pagar y lo ves en el resumen.",
  },
  {
    q: "¿Cuánto cuesta el envío?",
    a: (
      <>
        Depende del departamento y se calcula antes de pagar. Consulta la lista en <Link href="/envios" className={link}>Envíos</Link>. Recoger en tienda no tiene costo.
      </>
    ),
  },
  {
    q: "¿Por cuánto tiempo me guardan los productos mientras pago?",
    a: "Al iniciar el pago reservamos tus productos por 15 minutos. Si no se completa el pago en ese tiempo, la reserva se libera y el pedido vence; puedes volver a intentarlo si todavía hay existencias.",
  },
  {
    q: "¿Qué hago si mi pago es rechazado?",
    a: "Tu pedido se conserva con todos tus datos. Desde la página del pedido puedes intentar de nuevo o elegir otro método de pago, mientras la reserva siga vigente.",
  },
  {
    q: "¿Se guardan los datos de mi tarjeta?",
    a: "No. Tus datos de tarjeta se escriben en la página del proveedor de pagos y nunca pasan por esta tienda.",
  },
  {
    q: "¿Cómo sé en qué estado está mi pedido?",
    a: (
      <>
        Te enviamos un correo en cada cambio importante. También puedes consultarlo en <Link href="/pedido/seguimiento" className={link}>seguimiento de pedido</Link> con tu código y tu correo, o desde tu cuenta.
      </>
    ),
  },
  {
    q: "¿Puedo pedir factura?",
    a: "En el pago nos indicas tu NIT (o CF) y el nombre para la factura, y los guardamos con tu pedido.",
  },
  {
    q: "¿Qué garantía tienen los productos?",
    a: (
      <>
        Consulta <Link href="/garantias" className={link}>Garantías</Link>. <Marker>[Garantía del producto]</Marker>
      </>
    ),
  },
  {
    q: "¿Puedo devolver un producto?",
    a: (
      <>
        Consulta <Link href="/devoluciones" className={link}>Devoluciones</Link>. <Marker>[Política de devoluciones del cliente]</Marker>
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <InfoPage title="Preguntas frecuentes" intro="Lo que más nos preguntan antes y después de comprar.">
      <div className="divide-y divide-border border-y border-border">
        {faqs.map((f) => (
          <details key={f.q} className="group py-1">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 py-2 font-medium text-text-on-light">
              {f.q}
              <span aria-hidden className="text-text-muted transition-transform duration-150 ease-out group-open:rotate-45">+</span>
            </summary>
            <div className="pb-3 text-text-muted">{f.a}</div>
          </details>
        ))}
      </div>
      <p>
        ¿No encuentras tu duda? <Link href="/contacto" className={link}>Escríbenos</Link>.
      </p>
    </InfoPage>
  );
}
