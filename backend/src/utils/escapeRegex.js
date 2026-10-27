/**
 * Escapes special regex characters in a user-provided string to prevent regex injection
 * @param {string} str - Raw input string
 * @returns {string} - Escaped string safe for use in RegExp
 */
export const escapeRegex = (str) => {
  if (typeof str !== 'string') return ''
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default escapeRegex
