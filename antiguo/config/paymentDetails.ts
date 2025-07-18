
// src/config/paymentDetails.ts

export interface PaymentAccountDetails {
  accountHolderName: string;
  bankName: string; // e.g., "Banco Galicia", "Mercado Pago", "HSBC"
  cbu?: string;
  cvu?: string;
  alias: string;
  cuilCuit?: string;
  accountNumber?: string; // For display if relevant
  notes?: string; // Any extra info for the user
}

// Define a mapping from podologist key to their payment account details
const paymentDetailsMap: Record<string, PaymentAccountDetails> = {
  // Chicas (Silvia, Natalia, Elizabeth, Diana, Luciana)
  silvia: {
    accountHolderName: "Martin Alejandro Iacono", // Deduced from CUIL/DU
    bankName: "Banco Galicia",
    cbu: "0070008530004063250362",
    alias: "podo2015",
    cuilCuit: "20266022167",
    accountNumber: "CTA: 4063250-3 008-6",
    notes: "DU: 26602216. El alias 'podo2015' también es compatible con transferencias desde Mercado Pago a esta cuenta de Banco Galicia.",
  },
  natalia: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Banco Galicia",
    cbu: "0070008530004063250362",
    alias: "podo2015",
    cuilCuit: "20266022167",
    accountNumber: "CTA: 4063250-3 008-6",
    notes: "DU: 26602216. El alias 'podo2015' también es compatible con transferencias desde Mercado Pago a esta cuenta de Banco Galicia.",
  },
  elizabeth: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Banco Galicia",
    cbu: "0070008530004063250362",
    alias: "podo2015",
    cuilCuit: "20266022167",
    accountNumber: "CTA: 4063250-3 008-6",
    notes: "DU: 26602216. El alias 'podo2015' también es compatible con transferencias desde Mercado Pago a esta cuenta de Banco Galicia.",
  },
  diana: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Banco Galicia",
    cbu: "0070008530004063250362",
    alias: "podo2015",
    cuilCuit: "20266022167",
    accountNumber: "CTA: 4063250-3 008-6",
    notes: "DU: 26602216. El alias 'podo2015' también es compatible con transferencias desde Mercado Pago a esta cuenta de Banco Galicia.",
  },
  luciana: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Banco Galicia",
    cbu: "0070008530004063250362",
    alias: "podo2015",
    cuilCuit: "20266022167",
    accountNumber: "CTA: 4063250-3 008-6",
    notes: "DU: 26602216. El alias 'podo2015' también es compatible con transferencias desde Mercado Pago a esta cuenta de Banco Galicia.",
  },

  // Lorena (no changes mentioned, keep as is)
  lorena: {
    accountHolderName: "Lorena Noemi Mino",
    bankName: "Mercado Pago",
    cvu: "0000003100039650502156",
    alias: "podopalermo",
    cuilCuit: "27240244999",
  },

  // Martín
  martin: {
    accountHolderName: "Martin Alejandro Iacono",
    bankName: "Mercado Pago",
    cvu: "0000003100070968401249",
    alias: "podopalermo.martin",
    cuilCuit: "20266022167",
  },
};

export function getPaymentDetailsForPodologist(podologistKey: string): PaymentAccountDetails | undefined {
  return paymentDetailsMap[podologistKey];
}
