import { base64Decode } from "./deps.ts";

export async function convertPdfToPng(pdfData: ArrayBuffer): Promise<Uint8Array> {
  console.log('Starting PDF conversion using PDF.co API');
  
  try {
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfData)));
    console.log('PDF data converted to base64');

    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY');
    if (!pdfCoApiKey) {
      throw new Error('PDF_CO_API_KEY is not set');
    }

    // First, upload the PDF to PDF.co
    console.log('Uploading PDF to PDF.co');
    const uploadResponse = await fetch('https://api.pdf.co/v1/file/upload', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: pdfBase64,
      }),
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('PDF.co upload failed:', error);
      throw new Error(`PDF.co upload failed: ${error}`);
    }

    const { url: uploadedUrl } = await uploadResponse.json();
    console.log('PDF uploaded successfully to PDF.co');

    // Convert PDF to PNG
    console.log('Converting PDF to PNG using PDF.co');
    const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: uploadedUrl,
        pages: "1-1",
        async: false,
      }),
    });

    if (!convertResponse.ok) {
      const error = await convertResponse.text();
      console.error('PDF.co conversion failed:', error);
      throw new Error(`PDF.co conversion failed: ${error}`);
    }

    const { url: pngUrl } = await convertResponse.json();
    console.log('PDF converted to PNG, downloading result');

    // Download the PNG
    const pngResponse = await fetch(pngUrl);
    if (!pngResponse.ok) {
      throw new Error('Failed to download converted PNG');
    }

    const pngArrayBuffer = await pngResponse.arrayBuffer();
    console.log('PNG downloaded successfully');

    return new Uint8Array(pngArrayBuffer);
  } catch (error) {
    console.error('Error in PDF conversion:', error);
    throw error;
  }
}