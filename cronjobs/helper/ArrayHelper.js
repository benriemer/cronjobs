/**
 * Checks if an array has values
 * @param {Array} array - The array to check
 * @returns {Boolean} - True if the array has values, false otherwise
 */
const hasValues = (array) => {
  return Array.isArray(array) && array.length > 0;
};

module.exports = {
  hasValues,
}