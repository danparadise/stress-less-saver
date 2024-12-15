const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function extractTextFromPdf(pdfUrl: string, apiKey: string): Promise<string> {
  console.log('Starting PDF text extraction for:', pdfUrl);
  
  // Start the PDF to Text conversion job
  const startJobResponse = await fetch('https://api.pdf.co/v1/pdf/text/from-url', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: pdfUrl,
      async: true,
      pages: "",
      password: "",
      profiles: ["General"]
    }),
  });

  if (!startJobResponse.ok) {
    const errorData = await startJobResponse.text();
    console.error('PDF.co job start error:', errorData);
    throw new Error(`Failed to start PDF conversion job: ${errorData}`);
  }

  const jobData = await startJobResponse.json();
  console.log('PDF.co job started:', jobData);

  if (!jobData.jobId) {
    throw new Error('No job ID received from PDF.co');
  }

  // Poll for job completion
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    console.log(`Checking job status, attempt ${attempts + 1}/${maxAttempts}`);
    
    const checkJobResponse = await fetch(`https://api.pdf.co/v1/job/check?jobid=${jobData.jobId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!checkJobResponse.ok) {
      throw new Error('Failed to check job status');
    }

    const jobStatus = await checkJobResponse.json();
    console.log('Job status:', jobStatus);

    if (jobStatus.status === 'working') {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      attempts++;
      continue;
    }

    if (jobStatus.status === 'success') {
      // Get the result URL and download the text
      const resultResponse = await fetch(jobStatus.url);
      if (!resultResponse.ok) {
        throw new Error('Failed to fetch conversion result');
      }
      const textResult = await resultResponse.text();
      console.log('PDF text extracted successfully');
      return textResult;
    }

    if (jobStatus.status === 'error') {
      throw new Error(`PDF.co job failed: ${jobStatus.error}`);
    }

    attempts++;
  }

  throw new Error('Failed to get text result after maximum attempts');
}