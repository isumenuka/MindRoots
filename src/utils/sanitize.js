/**
 * sanitize.js — PII stripping utility
 * Removes common PII patterns before passing text to AI models.
 */

const PII_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // US Phone numbers
  /\b(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})\b/g,
  // SSN
  /\b\d{3}-\d{2}-\d{4}\b/g,
  // Credit card numbers
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
]

function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text
  let sanitized = text
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]')
  }
  return sanitized
}

function sanitizeBeliefNode(node) {
  if (!node) return node
  
  const cleanNode = JSON.parse(JSON.stringify(node))
  
  // Sanitize all string fields dynamically to support multiple node types
  for (const key in cleanNode) {
    if (typeof cleanNode[key] === 'string') {
      cleanNode[key] = sanitizeText(cleanNode[key])
    }
  }
  
  return cleanNode
}

export { sanitizeText, sanitizeBeliefNode }
