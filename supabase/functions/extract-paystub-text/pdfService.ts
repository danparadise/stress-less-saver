import { corsHeaders } from "./config.ts";

export async function convertPdfToImages(pdfUrl: string): Promise<string[]> {
  console.log('Converting PDF to images:', pdfUrl);
  const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY');
  
  const convertResponse = await fetch(`https://api.pdf.co/v1/pdf/convert/to/png`, {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: pdfUrl,
      pages: "1-2", // Convert first two pages
      async: false
    })
  });

  if (!convertResponse.ok) {
    const errorData = await convertResponse.text();
    console.error('PDF conversion error:', errorData);
    throw new Error(`PDF conversion failed: ${errorData}`);
  }

  const convertResult = await convertResponse.json();
  console.log('PDF conversion result:', convertResult);

  if (!convertResult.urls || convertResult.urls.length === 0) {
    throw new Error('No image URLs returned from conversion');
  }

  return convertResult.urls;
}