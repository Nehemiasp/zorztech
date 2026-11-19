import type { Metadata } from "next";
import { InfoPage } from "@/components/info/info-page";
import { LegalText, type LegalSection } from "@/components/info/legal-text";

export const metadata: Metadata = {
  title: "Términos y condiciones de compra",
  description: "Las condiciones que aplican al comprar en ZorzTech: precios, pagos, envíos, garantías, cambios y devoluciones.",
  alternates: { canonical: "/terminos" },
};

// Texto entregado por el dueño de la tienda (18 de noviembre de 2026).
const sections: LegalSection[] = [
  {
    title: "1. Información general",
    blocks: [
      "ZorzTech es una tienda dedicada a la comercialización de productos tecnológicos, incluyendo computadoras, componentes, accesorios, periféricos, productos gaming y dispositivos electrónicos.",
      "Nuestro objetivo es ofrecer productos de calidad, atención personalizada y una experiencia de compra segura y transparente.",
    ],
  },
  {
    title: "2. Precios y disponibilidad",
    blocks: [
      {
        list: [
          "Todos los precios publicados están expresados en quetzales guatemaltecos (Q), salvo que se indique lo contrario.",
          "Los precios y promociones pueden cambiar sin previo aviso.",
          "La disponibilidad de los productos está sujeta a existencias.",
          "Una cotización no garantiza la reserva de un producto, salvo confirmación expresa de ZorzTech.",
          "Los errores evidentes en precios o descripciones podrán ser revisados antes de confirmar una compra.",
        ],
      },
    ],
  },
  {
    title: "3. Métodos de pago",
    blocks: [
      "ZorzTech pone a disposición de sus clientes diferentes alternativas de pago, que pueden incluir:",
      {
        list: [
          "Transferencias bancarias.",
          "PagoLink.",
          "VisaCuotas, sujeto a aprobación y condiciones del proveedor financiero.",
          "Otros métodos de pago que ZorzTech comunique oficialmente.",
        ],
      },
      "Los pedidos se considerarán confirmados una vez verificado el pago o aprobada la modalidad de financiamiento correspondiente.",
    ],
  },
  {
    title: "4. Envíos y entregas",
    blocks: [
      {
        list: [
          "Las condiciones de entrega serán informadas al cliente al momento de realizar su compra.",
          "Los tiempos de entrega son estimados y pueden variar por circunstancias ajenas a ZorzTech.",
          "El cliente deberá proporcionar correctamente sus datos de contacto y dirección de entrega.",
          "Una vez recibido el producto, se recomienda verificar su estado y reportar cualquier inconveniente lo antes posible.",
        ],
      },
    ],
  },
  {
    title: "5. Garantías",
    blocks: [
      {
        list: [
          "Los productos cuentan con la garantía indicada en su publicación, cotización o documentación de compra.",
          "La garantía dependerá del producto y de las condiciones establecidas por el fabricante, distribuidor o proveedor correspondiente.",
          "Para solicitar una garantía, el cliente deberá presentar su comprobante de compra y proporcionar información sobre la falla.",
          "Los productos serán evaluados para determinar si corresponde una reparación, reemplazo u otra solución aplicable.",
          "La garantía no cubre daños ocasionados por golpes, líquidos, manipulación inadecuada, modificaciones no autorizadas, instalaciones incorrectas o uso contrario a las especificaciones del fabricante, cuando corresponda.",
        ],
      },
      "Estas condiciones no limitan los derechos que la legislación guatemalteca reconoce a los consumidores.",
    ],
  },
  {
    title: "6. Cambios y devoluciones",
    blocks: [
      {
        list: [
          "Toda solicitud de cambio o devolución deberá comunicarse directamente a ZorzTech.",
          "El producto deberá conservar sus accesorios y empaques originales cuando corresponda.",
          "Los cambios o devoluciones estarán sujetos a la evaluación del caso y a las disposiciones legales aplicables.",
          "Los productos con fallas de fábrica serán atendidos conforme a las condiciones de garantía y los derechos del consumidor.",
          "No se considerarán automáticamente como defectos de fábrica los daños ocasionados por mal uso o manipulación inadecuada.",
        ],
      },
    ],
  },
  {
    title: "7. Compras de componentes y equipos",
    blocks: [
      "El cliente es responsable de verificar la compatibilidad de los componentes cuando selecciona por cuenta propia las piezas de una computadora.",
      "Si ZorzTech realiza una cotización o configuración, se proporcionará orientación sobre compatibilidad según la información disponible del fabricante.",
    ],
  },
  {
    title: "8. Responsabilidad del cliente",
    blocks: [
      "El cliente se compromete a:",
      {
        list: [
          "Proporcionar información correcta al realizar una compra.",
          "Verificar las características del producto antes de confirmar el pedido.",
          "Utilizar los productos de acuerdo con las recomendaciones del fabricante.",
          "Conservar su comprobante de compra y documentación de garantía.",
        ],
      },
    ],
  },
  {
    title: "9. Propiedad intelectual",
    blocks: [
      "El nombre ZorzTech, su identidad visual, logotipo, diseños, fotografías y contenido publicado son propiedad de sus respectivos titulares y no podrán utilizarse sin autorización.",
    ],
  },
  {
    title: "10. Modificaciones",
    blocks: [
      "ZorzTech se reserva el derecho de actualizar estos términos y condiciones cuando sea necesario. Las modificaciones serán publicadas por los medios oficiales de la tienda.",
    ],
  },
  {
    title: "11. Legislación aplicable",
    blocks: [
      "Estos términos se interpretarán conforme a las leyes de la República de Guatemala, incluyendo la normativa de protección al consumidor que resulte aplicable.",
    ],
  },
  {
    title: "12. Contacto",
    blocks: [
      "Para consultas, compras, garantías o cualquier asunto relacionado con estos términos, puedes comunicarte con nosotros a través de nuestros canales oficiales.",
    ],
  },
];

export default function TermsPage() {
  return (
    <InfoPage
      title="Términos y condiciones"
      intro="Bienvenido a ZorzTech. Al visitar nuestra página, realizar una compra o utilizar nuestros servicios, aceptas los siguientes términos y condiciones."
    >
      <LegalText updated="18 de noviembre de 2026" sections={sections} closing="ZorzTech – Tecnología, calidad y confianza." />
    </InfoPage>
  );
}
