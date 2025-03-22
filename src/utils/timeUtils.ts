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

// Application version information
export const getAppVersion = (): string => {
  // Update this version number when making significant changes
  return '1.0.1';
};

// Get build information with timestamp
export const getBuildInfo = (): string => {
  // This is the timestamp when this file was last modified
  const buildDate = new Date('2024-04-30');
  
  const formattedDate = buildDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
  
  return `v${getAppVersion()} (Build: ${formattedDate})`;
}; 