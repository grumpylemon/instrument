// Utility function to generate a formatted timestamp
export const getFormattedTimestamp = (): string => {
  const now = new Date();
  
  // Format date as MM/DD/YYYY
  const date = now.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
  
  // Format time as HH:MM:SS
  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  return `Last updated: ${date} at ${time}`;
}; 