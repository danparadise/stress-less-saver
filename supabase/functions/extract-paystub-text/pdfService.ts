import { corsHeaders } from "./config.ts";

export async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  console.log('Starting PDF text extraction for:', pdfUrl);
  
  const apiKey = Deno.env.get('PDF_CO_API_KEY');
  if (!apiKey) {
    throw new Error('PDF_CO_API_KEY is not set');
  }

  // Get the text content directly
  const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: pdfUrl,
      async: false,
      inline: true
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('PDF.co API error:', errorData);
    throw new Error(`Failed to extract text from PDF: ${errorData}`);
  }

  const result = await response.json();
  console.log('PDF.co conversion response:', result);
  
  if (result.error) {
    throw new Error(`PDF.co processing error: ${result.message}`);
  }

  if (!result.text) {
    throw new Error('No text content returned from PDF.co');
  }

  return result.text;
}