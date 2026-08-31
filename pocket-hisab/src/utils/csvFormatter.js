// ============================================================================
// src/utils/csvFormatter.js
//
// A tiny, dependency-free CSV writer. We hand-roll this instead of pulling
// in a library (e.g. json2csv) because CSV is a simple enough format that a
// ~20-line implementation is both sufficient and easier to audit than an
// external dependency.
// ============================================================================

/**
 * Escapes a single CSV field per RFC 4180: wrap the value in double quotes
 * if it contains a comma, double quote, or newline, and double up any
 * internal double quotes.
 */
function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Converts an array of plain objects into a CSV string with a header row.
 *
 * @param {object[]} rows - Array of row objects. All rows should share the same shape.
 * @param {string[]} columns - Ordered list of object keys to include as columns.
 * @param {string[]} [headerLabels] - Optional display labels for the header row (defaults to `columns`).
 * @returns {string} The full CSV document as a string.
 */
function toCsv(rows, columns, headerLabels = columns) {
  const headerLine = headerLabels.map(escapeCsvField).join(',');
  const dataLines = rows.map((row) =>
    columns.map((column) => escapeCsvField(row[column])).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

module.exports = { toCsv };
