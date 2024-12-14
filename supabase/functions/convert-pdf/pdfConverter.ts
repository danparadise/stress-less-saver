import { createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import { getDocument } from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/es5/build/pdf.js";

// Required for PDF.js to work in Deno environment
const GlobalWorkerOptions = {
  workerSrc: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/es5/build/pdf.worker.js"
};

export async function convertPdfToPng(pdfData: ArrayBuffer): Promise<Uint8Array> {
  console.log('Loading PDF with PDF.js');
  
  try {
    // Initialize PDF.js with the worker
    console.log('Setting up PDF.js worker');
    (globalThis as any).pdfjsLib = { GlobalWorkerOptions };
    
    // Initialize PDF.js
    const loadingTask = getDocument({ data: pdfData });
    console.log('PDF loading task created');
    
    const pdf = await loadingTask.promise;
    console.log('PDF document loaded');
    
    const page = await pdf.getPage(1); // Get first page
    console.log('First page retrieved');
    
    const viewport = page.getViewport({ scale: 2.0 }); // Scale up for better quality
    console.log('Viewport created with dimensions:', viewport.width, 'x', viewport.height);

    // Create canvas
    console.log('Creating canvas for PDF rendering');
    const canvas = createCanvas(viewport.width, viewport.height);
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
  } catch (error) {
    console.error('Error in PDF conversion:', error);
    throw error;
  }
}