// Configuración de cuentas de pago por podólogo

export interface PaymentAccountDetails {
  accountHolderName: string;
  bankName: string; // ej: "Banco Galicia", "Mercado Pago"
  cbu?: string;
  cvu?: string;
  alias: string;
  cuilCuit?: string;
  accountNumber?: string;
  notes?: string;
}

// Mapeo de podólogo a detalles de pago
const paymentDetailsMap: Record<string, PaymentAccountDetails> = {
  // Podólogas que usan cuenta de Martín en Banco Galicia
  silvia: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Banco Galicia",
    cbu: "0070008530004063250362",
    alias: "podo2015",
    cuilCuit: "20266022167",
    accountNumber: "CTA: 4063250-3 008-6",
    notes: "DU: 26602216. Compatible con transferencias desde Mercado Pago.",
  },
  natalia: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Banco Galicia",
    cbu: "0070008530004063250362",
    alias: "podo2015",
    cuilCuit: "20266022167",
    accountNumber: "CTA: 4063250-3 008-6",
    notes: "DU: 26602216. Compatible con transferencias desde Mercado Pago.",
  },
  elizabeth: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Banco Galicia",
    cbu: "0070008530004063250362",
    alias: "podo2015",
    cuilCuit: "20266022167",
    accountNumber: "CTA: 4063250-3 008-6",
    notes: "DU: 26602216. Compatible con transferencias desde Mercado Pago.",
  },
  diana: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Banco Galicia",
    cbu: "0070008530004063250362",
    alias: "podo2015",
    cuilCuit: "20266022167",
    accountNumber: "CTA: 4063250-3 008-6",
    notes: "DU: 26602216. Compatible con transferencias desde Mercado Pago.",
  },
  luciana: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Banco Galicia",
    cbu: "0070008530004063250362",
    alias: "podo2015",
    cuilCuit: "20266022167",
    accountNumber: "CTA: 4063250-3 008-6",
    notes: "DU: 26602216. Compatible con transferencias desde Mercado Pago.",
  },

  // Lorena - Mercado Pago
  lorena: {
    accountHolderName: "Lorena Noemi Mino",
    bankName: "Mercado Pago",
    cvu: "0000003100039650502156",
    alias: "podopalermo",
    cuilCuit: "27240244999",
  },

  // Martín - Mercado Pago
  martin: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Mercado Pago",
    cvu: "0000003100070968401249",
    alias: "podopalermo.martin",
    cuilCuit: "20266022167",
  },
};

export function getPaymentDetailsForPodologist(podologistKey: string): PaymentAccountDetails | undefined {
  return paymentDetailsMap[podologistKey.toLowerCase()];
}

// Constante del monto esperado para reservas
export const EXPECTED_PAYMENT_AMOUNT = 10000; // ARS

// Información de contacto para soporte
export const CECILIA_WHATSAPP_NUMBER = "1167437969";