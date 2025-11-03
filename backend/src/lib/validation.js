/**
 * Utility functions for validation and helpers
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password length
 * @param {string} password - Password to validate
 * @param {number} minLength - Minimum length (default: 6)
 * @returns {boolean} - True if password meets minimum length
 */
export const isValidPassword = (password, minLength = 6) => {
  return !!(password && password.length >= minLength);
};

/**
 * Check if all required fields are present
 * @param {object} data - Data object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {boolean} - True if all required fields are present
 */
export const hasRequiredFields = (data, requiredFields) => {
  return requiredFields.every(
    (field) => data[field] && String(data[field]).trim().length > 0
  );
};

/**
 * Validate full name
 * @param {string} name - Name to validate
 * @returns {boolean} - True if valid name
 */
export const isValidFullName = (name) => {
  return !!(name && name.trim().length > 0);
};
