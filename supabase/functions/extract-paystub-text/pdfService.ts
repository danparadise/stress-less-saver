import { corsHeaders } from "./config.ts";

export async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  console.log('Starting PDF text extraction for:', pdfUrl);
  
  const apiKey = Deno.env.get('PDF_CO_API_KEY');
  if (!apiKey) {
    throw new Error('PDF_CO_API_KEY is not set');
  }

  // First, get a presigned URL for the PDF
  console.log('Getting presigned URL from PDF.co');
  const presignedResponse = await fetch(`https://api.pdf.co/v1/file/upload/get-presigned-url?name=paystub.pdf&contenttype=application/pdf`, {
    headers: { 'x-api-key': apiKey }
  });

  if (!presignedResponse.ok) {
    const errorText = await presignedResponse.text();
    console.error('Failed to get presigned URL:', errorText);
    throw new Error(`Failed to get presigned URL: ${errorText}`);
  }

  const { presignedUrl, url: uploadedFileUrl } = await presignedResponse.json();
  
  // Download and upload the PDF to PDF.co
  console.log('Downloading PDF from original URL');
  const pdfResponse = await fetch(pdfUrl);
  if (!pdfResponse.ok) {
    throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
  }
  
  const pdfBuffer = await pdfResponse.arrayBuffer();
  
  console.log('Uploading PDF to PDF.co presigned URL');
  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: pdfBuffer,
    headers: { 'Content-Type': 'application/pdf' }
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload PDF to PDF.co: ${uploadResponse.statusText}`);
  }

  // Extract text from the uploaded PDF
  console.log('Extracting text from uploaded PDF');
  const extractResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: uploadedFileUrl,
      async: false,
      inline: true,
      // Remove the profiles setting as it's causing issues
      // Use default OCR settings which work better for paystubs
      ocrEnabled: true,
      ocrLanguages: "eng",
      ocrResolution: 300
    })
  });

  if (!extractResponse.ok) {
    const errorData = await extractResponse.text();
    console.error('PDF.co API error:', errorData);
    throw new Error(`Failed to extract text from PDF: ${errorData}`);
  }

  const result = await extractResponse.json();
  console.log('PDF.co conversion response:', result);
  
  if (result.error) {
    throw new Error(`PDF.co processing error: ${result.message}`);
  }

  if (!result.text || typeof result.text !== 'string' || result.text.trim().length === 0) {
    throw new Error('No text content returned from PDF.co');
  }

  console.log('Text extraction successful, length:', result.text.length);
  return result.text;
}