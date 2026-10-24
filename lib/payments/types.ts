export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'refunded' | 'error';

export interface CreatePaymentInput {
  orderId: string;
  orderCode: string;
  amount: number;          // centavos
  currency: 'GTQ';
  customer: { email: string; name: string; phone?: string };
  returnUrl: string;       // a dónde vuelve el cliente
  cancelUrl: string;
  idempotencyKey: string;  // evita cobros duplicados
}

export type CreatePaymentResult =
  | { kind: 'redirect'; url: string; providerRef: string }               // página de pago del proveedor
  | { kind: 'embedded'; clientToken: string; providerRef: string }       // formulario del proveedor dentro de la tienda
  | { kind: 'error'; message: string };

export interface PaymentProvider {
  id: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentStatus(providerRef: string): Promise<PaymentStatus>;
  verifyWebhook(req: Request): Promise<{ providerRef: string; status: PaymentStatus; raw: unknown } | null>;
  refund?(providerRef: string, amount?: number): Promise<{ ok: boolean; message?: string }>;
}

/** Forma de pago que se le ofrece al cliente en el checkout (la define cada proveedor). */
export interface PaymentMethod {
  id: string;
  label: string;
  description: string;
}
