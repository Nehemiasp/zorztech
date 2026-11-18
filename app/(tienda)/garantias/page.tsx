import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Garantías de los productos",
  description: "Qué cubre la garantía de los productos que compras en ZorzTech, cuánto dura y cómo reclamarla si algo falla.",
  alternates: { canonical: "/garantias" },
};

// Texto entregado por el dueño de la tienda.
export default function WarrantyPage() {
  return (
    <InfoPage
      title="Garantías"
      intro="En ZorzTech queremos que compres con confianza. Por eso, todos nuestros productos cuentan con garantía, según el tipo de producto y las condiciones establecidas por el fabricante o proveedor."
    >
      <p>Aquí encontrarás información sobre la duración de las garantías, qué cubren y cómo puedes hacerlas válidas.</p>

      <InfoSection title="¿Cuánto dura la garantía?">
        <p>El período de garantía puede variar dependiendo del producto y la marca.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-medium text-text-on-light">Componentes de PC:</strong> según las condiciones del fabricante o proveedor.
          </li>
          <li>
            <strong className="font-medium text-text-on-light">Periféricos gaming:</strong> según el período de garantía indicado para cada producto.
          </li>
          <li>
            <strong className="font-medium text-text-on-light">Audífonos y accesorios:</strong> según la garantía correspondiente a cada modelo.
          </li>
          <li>
            <strong className="font-medium text-text-on-light">Monitores y laptops:</strong> según las condiciones específicas de cada fabricante.
          </li>
        </ul>
        <p>El tiempo de garantía correspondiente será informado al momento de realizar tu compra.</p>
      </InfoSection>

      <InfoSection title="¿Qué cubre y qué no cubre?">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-base font-semibold text-text-on-light">La garantía cubre</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Defectos de fábrica.</li>
              <li>Fallas de funcionamiento no ocasionadas por el usuario.</li>
              <li>Problemas técnicos cubiertos por las políticas del fabricante.</li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-on-light">La garantía no cubre</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Daños físicos, golpes o caídas.</li>
              <li>Daños ocasionados por líquidos o humedad.</li>
              <li>Mal uso o manipulación incorrecta.</li>
              <li>Daños por instalaciones inadecuadas.</li>
              <li>Modificaciones, reparaciones o aperturas no autorizadas.</li>
              <li>Daños ocasionados por variaciones eléctricas o factores externos.</li>
            </ul>
          </div>
        </div>
      </InfoSection>

      <InfoSection title="¿Cómo reclamar una garantía?">
        <p>Si tu producto presenta alguna falla durante el período de garantía, puedes comunicarte con nosotros siguiendo estos pasos:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Contáctanos a través de nuestros{" "}
            <Link href="/contacto" className="text-brand-primary-strong underline underline-offset-2">
              canales oficiales
            </Link>
            .
          </li>
          <li>Proporciona tu comprobante de compra o número de pedido.</li>
          <li>Describe la falla y, si es posible, adjunta fotografías o videos.</li>
          <li>Nuestro equipo te indicará cómo proceder con la revisión del producto.</li>
        </ol>
        <p>Una vez recibido el producto, se realizará la evaluación correspondiente para determinar si aplica la garantía.</p>
        <p>El tiempo de respuesta dependerá del tipo de producto y del proceso de diagnóstico del fabricante o proveedor.</p>
      </InfoSection>

      <InfoSection title="Nuestro compromiso contigo">
        <p>
          En ZorzTech trabajamos para ofrecerte productos de calidad y una buena experiencia de compra. Queremos que disfrutes de tu
          tecnología con tranquilidad y confianza.
        </p>
        <p>
          Si tienes alguna consulta sobre la garantía de un producto que compraste,{" "}
          <Link href="/contacto" className="text-brand-primary-strong underline underline-offset-2">
            escríbenos
          </Link>
          . ¡Estamos para ayudarte!
        </p>
        <p className="font-medium text-text-on-light">ZorzTech — Tecnología que te conecta.</p>
      </InfoSection>
    </InfoPage>
  );
}
