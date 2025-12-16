/**
 * Format message timestamp to readable time
 * @param {string|Date} date - Date string or Date object
 * @returns {string} - Formatted time string (HH:mm)
 */
export function formatMessageTime(date) {
  if (!date) return "";
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "";
    }
    
    return dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting message time:", error);
    return "";
  }
}
