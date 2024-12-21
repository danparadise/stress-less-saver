interface FormattedResponse {
  summary: string;
  suggestions: Array<{
    title: string;
    impact: string;
    implementation: string;
  }>;
}

export function formatAIResponse(response: string): string {
  try {
    // Parse the response into sections
    const sections = response.split('\n\n');
    
    // Format the response in a clean, consistent way
    return `${sections[0]}

Top Recommendations:
${sections.slice(1, -1).join('\n')}

${sections[sections.length - 1]}`;
  } catch (error) {
    console.error('Error formatting AI response:', error);
    return response;
  }
}