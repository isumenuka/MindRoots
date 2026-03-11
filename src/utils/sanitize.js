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
  return {
    ...node,
    belief: sanitizeText(node.belief),
    origin_event: sanitizeText(node.origin_event),
    cost_today: sanitizeText(node.cost_today),
  }
}

export { sanitizeText, sanitizeBeliefNode }
