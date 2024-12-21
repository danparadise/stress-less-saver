export function formatAIResponse(response: string): string {
  try {
    // Split the response into sections
    const sections = response.split('\n\n');
    
    // Format the response with clear step formatting
    return sections.map(section => {
      if (section.startsWith('Step')) {
        // Add extra line breaks around steps for better readability
        return `\n${section}\n`;
      }
      return section;
    }).join('\n');
  } catch (error) {
    console.error('Error formatting AI response:', error);
    return response;
  }
}