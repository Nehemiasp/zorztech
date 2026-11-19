import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/info/info-page";
import { LegalText, type LegalSection } from "@/components/info/legal-text";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Qué datos personales recopila ZorzTech, para qué los usa, con quién los comparte y cómo puedes pedir que los corrijamos.",
  alternates: { canonical: "/privacidad" },
};

// Texto entregado por el dueño de la tienda (18 de noviembre de 2026). La sección 11 (contacto) va aparte, con enlaces.
const sections: LegalSection[] = [
  {
    title: "1. Información que recopilamos",
    blocks: [
      "Al contactar o realizar una compra en ZorzTech, podemos solicitar la siguiente información:",
      {
        list: [
          "Nombre y apellido.",
          "Número de teléfono o WhatsApp.",
          "Dirección de entrega, cuando sea necesaria.",
          "Correo electrónico.",
          "Información relacionada con pedidos, compras y pagos.",
          "Información adicional necesaria para brindar atención al cliente.",
        ],
      },
    ],
  },
  {
    title: "2. Uso de la información",
    blocks: [
      "La información proporcionada será utilizada exclusivamente para fines relacionados con nuestra actividad comercial, incluyendo:",
      {
        list: [
          "Procesar y gestionar pedidos.",
          "Confirmar pagos y compras.",
          "Coordinar entregas.",
          "Brindar atención y soporte al cliente.",
          "Gestionar garantías, cambios y devoluciones.",
          "Enviar información sobre productos, promociones y novedades cuando el cliente lo autorice o corresponda.",
        ],
      },
    ],
  },
  {
    title: "3. Protección de la información",
    blocks: [
      "ZorzTech adopta medidas razonables para proteger la información de sus clientes contra accesos no autorizados, pérdida, divulgación o uso indebido.",
      "No solicitamos contraseñas personales ni códigos de seguridad de tarjetas bancarias mediante mensajes o redes sociales.",
    ],
  },
  {
    title: "4. Compartir información con terceros",
    blocks: [
      "ZorzTech no vende ni comercializa los datos personales de sus clientes.",
      "En determinados casos, podremos compartir únicamente la información necesaria con terceros que participen en la prestación del servicio, tales como:",
      { list: ["Empresas de mensajería y transporte.", "Procesadores y plataformas de pago.", "Proveedores relacionados con garantías y soporte técnico."] },
      "Estos terceros recibirán únicamente la información necesaria para cumplir con el servicio correspondiente.",
    ],
  },
  {
    title: "5. Información de pagos",
    blocks: [
      "Los pagos realizados mediante plataformas externas estarán sujetos también a las políticas de privacidad y seguridad de sus respectivos proveedores.",
      "ZorzTech no solicita que los clientes compartan contraseñas bancarias, PIN ni códigos de verificación personales por nuestros canales de atención.",
    ],
  },
  {
    title: "6. Comunicaciones y promociones",
    blocks: [
      "Podremos utilizar los datos de contacto proporcionados para informar sobre pedidos, actualizaciones de servicios y promociones comerciales.",
      "Los clientes podrán solicitar que dejemos de enviarles comunicaciones promocionales en cualquier momento.",
    ],
  },
  {
    title: "7. Cookies y navegación",
    blocks: [
      "En caso de utilizar un sitio web, este podrá emplear cookies o tecnologías similares para mejorar la experiencia de navegación, recordar preferencias y analizar el funcionamiento del sitio.",
      "El usuario podrá administrar las cookies desde la configuración de su navegador, cuando corresponda.",
    ],
  },
  {
    title: "8. Derechos del cliente",
    blocks: [
      "Los clientes podrán comunicarse con ZorzTech para solicitar información sobre los datos personales que nos hayan proporcionado, corregir información incorrecta o solicitar que dejemos de utilizar sus datos para comunicaciones promocionales.",
      "Las solicitudes serán evaluadas conforme a la normativa aplicable.",
    ],
  },
  {
    title: "9. Conservación de la información",
    blocks: [
      "Los datos personales serán conservados durante el tiempo necesario para cumplir con los fines comerciales, administrativos, contables y legales correspondientes.",
      "Cuando la información ya no sea necesaria, se procurará eliminarla o dejar de utilizarla de manera segura, salvo cuando exista una obligación legal de conservarla.",
    ],
  },
  {
    title: "10. Modificaciones de esta política",
    blocks: [
      "ZorzTech podrá actualizar esta política de privacidad cuando sea necesario. Cualquier modificación será publicada a través de nuestros canales oficiales.",
    ],
  },
];

const link = "text-brand-primary-strong underline underline-offset-2";

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Política de privacidad"
      intro="En ZorzTech respetamos la privacidad de nuestros clientes y nos comprometemos a proteger la información personal que nos proporcionan al realizar consultas, cotizaciones o compras."
    >
      <LegalText
        updated="18 de noviembre de 2026"
        lead="Esta política explica qué información recopilamos, cómo la utilizamos y qué medidas adoptamos para protegerla."
        sections={sections}
        closing="ZorzTech – Tu confianza es nuestra prioridad."
      >
        <InfoSection title="11. Contacto">
          <p>Si tienes preguntas, inquietudes o solicitudes relacionadas con el uso de tu información personal, puedes comunicarte con nosotros:</p>
          <ul className="space-y-1">
            <li>
              Correo electrónico:{" "}
              <a href="mailto:zorztech@hotmail.com" className={link}>
                zorztech@hotmail.com
              </a>
            </li>
            <li>
              Instagram:{" "}
              <a href="https://www.instagram.com/zorztech/" target="_blank" rel="noopener noreferrer" className={link}>
                @ZorzTech
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </li>
          </ul>
        </InfoSection>
      </LegalText>
    </InfoPage>
  );
}
