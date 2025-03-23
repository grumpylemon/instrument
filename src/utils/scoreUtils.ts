/**
 * Utility functions for saving and retrieving high scores
 */

interface HighScore {
  difficulty: string;
  gameLength: string;
  time: number;
  date: string;
}

/**
 * Save a high score to local storage
 * @param key - The key to save the score under
 * @param score - The score object to save
 * @returns boolean - Whether this was a new high score
 */
export const saveHighScore = (key: string, score: HighScore): boolean => {
  const scores = getHighScores(key);
  
  // Check if this is a high score
  const isHighScore = scores.length === 0 || score.time < scores[0].time;
  
  // Add the new score
  scores.push(score);
  
  // Sort scores (lowest time first)
  scores.sort((a, b) => a.time - b.time);
  
  // Keep only the top 5 scores
  const topScores = scores.slice(0, 5);
  
  // Save to localStorage
  localStorage.setItem(key, JSON.stringify(topScores));
  
  return isHighScore;
};

/**
 * Get high scores from local storage
 * @param key - The key to retrieve scores for
 * @returns HighScore[] - Array of high scores
 */
export const getHighScores = (key: string): HighScore[] => {
  const scoresJson = localStorage.getItem(key);
  if (!scoresJson) return [];
  
  try {
    const scores = JSON.parse(scoresJson) as HighScore[];
    return scores;
  } catch (e) {
    console.error('Error parsing high scores:', e);
    return [];
  }
};

/**
 * Clear all high scores for a key
 * @param key - The key to clear scores for
 */
export const clearHighScores = (key: string): void => {
  localStorage.removeItem(key);
}; 