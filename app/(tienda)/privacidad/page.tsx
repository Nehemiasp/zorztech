import type { Metadata } from "next";
import { InfoPage, InfoSection, PolicyPlaceholder } from "@/components/info/info-page";

export const metadata: Metadata = {
  title: "Privacidad y uso de tus datos",
  description: "Los datos que ZorzTech guarda cuando compras o creas una cuenta, las cookies que usa el sitio y cómo pedir que los corrijamos.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacidad" intro="Esto es lo que hace el sitio con tus datos hoy. El texto legal completo lo entrega el dueño de la tienda.">
      <InfoSection title="Datos que guarda la tienda">
        <ul className="list-disc space-y-1 pl-5">
          <li>Al comprar: nombre, correo, teléfono, dirección de entrega o tienda elegida, NIT y nombre de la factura, y los productos del pedido.</li>
          <li>Con una cuenta: además tu contraseña, que se guarda cifrada y nadie puede leer, y las direcciones que guardes.</li>
          <li>Del pago: el estado y el monto. Los datos de tu tarjeta no pasan por esta tienda: se escriben en la página del proveedor de pagos.</li>
        </ul>
      </InfoSection>
      <InfoSection title="Cookies que usa el sitio">
        <ul className="list-disc space-y-1 pl-5">
          <li>Una para recordar tu carrito.</li>
          <li>Una para mantener tu sesión si ingresas con tu cuenta.</li>
          <li>Una para que puedas ver tu último pedido sin cuenta.</li>
        </ul>
        <p>Son necesarias para comprar. El sitio no usa cookies de publicidad ni de análisis.</p>
      </InfoSection>
      <InfoSection title="Texto legal">
        <PolicyPlaceholder
          marker="[Política de privacidad del cliente]"
          hint="Quién es el responsable de los datos, para qué se usan, cuánto tiempo se guardan, con quién se comparten (por ejemplo, el proveedor de pagos y el de correo) y cómo ejercer los derechos de acceso, corrección y borrado."
        />
      </InfoSection>
    </InfoPage>
  );
}
