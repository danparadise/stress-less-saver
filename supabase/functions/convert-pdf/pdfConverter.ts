const getPresignedUrl = async (apiKey: string, fileName: string) => {
  console.log('Getting presigned URL for:', fileName);
  
  const queryPath = `/v1/file/upload/get-presigned-url?contenttype=application/octet-stream&name=${fileName}`;
  const response = await fetch(`https://api.pdf.co${queryPath}`, {
    headers: { "x-api-key": apiKey }
  });

  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`PDF.co error: ${data.message}`);
  }

  console.log('Presigned URL obtained successfully');
  return [data.presignedUrl, data.url];
};

const uploadToPdfCo = async (presignedUrl: string, pdfData: ArrayBuffer) => {
  console.log('Uploading PDF to PDF.co');
  
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: pdfData,
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to upload to PDF.co: ${response.statusText}`);
  }

  console.log('PDF uploaded to PDF.co successfully');
};

const convertToImage = async (apiKey: string, uploadedFileUrl: string) => {
  console.log('Converting PDF to PNG');
  
  const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: uploadedFileUrl,
      pages: '1-1',
      async: false
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to convert PDF: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`PDF.co conversion error: ${data.message}`);
  }

  if (!data.urls || data.urls.length === 0) {
    throw new Error('No PNG URLs returned from PDF.co');
  }

  console.log('PDF converted to PNG successfully');
  return data.urls[0]; // Get the first page's URL
};

export const convertPdfToPng = async (pdfData: ArrayBuffer): Promise<Uint8Array> => {
  const apiKey = Deno.env.get('PDF_CO_API_KEY');
  if (!apiKey) {
    throw new Error('PDF_CO_API_KEY is not set');
  }

  try {
    console.log('Starting PDF conversion process');
    
    // Get presigned URL for upload
    const fileName = `${crypto.randomUUID()}.pdf`;
    const [presignedUrl, uploadedFileUrl] = await getPresignedUrl(apiKey, fileName);

    // Upload PDF to PDF.co
    await uploadToPdfCo(presignedUrl, pdfData);

    // Convert PDF to PNG
    const pngUrl = await convertToImage(apiKey, uploadedFileUrl);

    // Download the PNG
    console.log('Downloading converted PNG');
    const pngResponse = await fetch(pngUrl);
    if (!pngResponse.ok) {
      throw new Error('Failed to download converted PNG');
    }

    const pngArrayBuffer = await pngResponse.arrayBuffer();
    console.log('PNG downloaded successfully');
    
    return new Uint8Array(pngArrayBuffer);
  } catch (error) {
    console.error('PDF conversion failed:', error);
    throw error;
  }
};