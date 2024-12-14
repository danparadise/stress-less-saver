import { Canvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm";

export async function convertPdfToPng(pdfData: ArrayBuffer): Promise<Uint8Array> {
  console.log('Loading PDF with PDF.js');
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
  const page = await pdf.getPage(1); // Get first page
  const viewport = page.getViewport({ scale: 2.0 }); // Scale up for better quality

  // Create canvas
  console.log('Creating canvas for PDF rendering');
  const canvas = new Canvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  // Render PDF page to canvas
  console.log('Rendering PDF to canvas');
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  // Convert canvas to PNG
  console.log('Converting canvas to PNG');
  return canvas.toBuffer('image/png');
}