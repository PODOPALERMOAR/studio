'use server';

/**
 * @fileOverview Validates a PDF voucher and extracts information for auto-scheduling.
 *
 * - validateVoucher - A function that validates the voucher and extracts information.
 * - ValidateVoucherInput - The input type for the validateVoucher function.
 * - ValidateVoucherOutput - The return type for the validateVoucher function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

const ValidateVoucherInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF voucher, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ValidateVoucherInput = z.infer<typeof ValidateVoucherInputSchema>;

const ValidateVoucherOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the voucher is valid or not.'),
  patientName: z.string().optional().describe('The name of the patient.'),
  appointmentDate: z.string().optional().describe('The requested appointment date.'),
});
export type ValidateVoucherOutput = z.infer<typeof ValidateVoucherOutputSchema>;

export async function validateVoucher(input: ValidateVoucherInput): Promise<ValidateVoucherOutput> {
  return validateVoucherFlow(input);
}

const extractVoucherInfo = ai.defineTool({
    name: 'extractVoucherInfo',
    description: 'Extracts patient name and appointment date from a voucher.',
    inputSchema: z.object({
      voucherText: z.string().describe('The text content of the voucher.'),
    }),
    outputSchema: z.object({
      patientName: z.string().optional().describe('The name of the patient.'),
      appointmentDate: z.string().optional().describe('The requested appointment date.'),
    }),
  },
  async (input) => {
    // This is a placeholder implementation.  A real implementation would
    // call an OCR service or PDF parsing library to extract the text from
    // the PDF data URI.
    console.log('Voucher Text:', input.voucherText);
    return {
      patientName: 'Extracted Patient Name',
      appointmentDate: 'Extracted Appointment Date',
    };
  }
);

const validateVoucherPrompt = ai.definePrompt({
  name: 'validateVoucherPrompt',
  tools: [extractVoucherInfo],
  input: { schema: ValidateVoucherInputSchema },
  output: { schema: ValidateVoucherOutputSchema },
  prompt: `You are an expert voucher validator.

  First, use the extractVoucherInfo tool to extract the voucher info.
  Then, validate the voucher information to make sure all the information is valid.
  Return whether the voucher is valid or not.  If the voucher is valid, include the patient name and appointment date in the output.

  Voucher: {{pdfDataUri}}`,
});

const validateVoucherFlow = ai.defineFlow(
  {
    name: 'validateVoucherFlow',
    inputSchema: ValidateVoucherInputSchema,
    outputSchema: ValidateVoucherOutputSchema,
  },
  async input => {
    // Extract the PDF content from the data URI
    const pdfData = input.pdfDataUri.split(',')[1];
    const buffer = Buffer.from(pdfData, 'base64');

     // Save the pdf in the public directory
    const fs = require('fs');
    fs.writeFileSync('public/voucher.pdf', buffer);

    // Load the PDF into memory
    const loader = new PDFLoader("public/voucher.pdf");
    const docs = await loader.load();

    const pageContents = docs.map(doc => doc.pageContent);

    const voucherText = pageContents.join('\n');

    const { output } = await validateVoucherPrompt({
      ...input,
      pdfDataUri: voucherText,
    });
    return output!;
  }
);
