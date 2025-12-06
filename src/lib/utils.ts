export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Normalizes phone numbers by adding Turkey's country code (+90) if not present
 * @param phone - The phone number to normalize
 * @returns The normalized phone number with +90 prefix
 */
export function normalizePhoneNumber(
  phone: string | null | undefined
): string | null {
  if (!phone || phone.trim().length === 0) return null

  const cleaned = phone.trim()

  // If already has +90 or starts with 90, return as is
  if (cleaned.startsWith('+90')) return cleaned
  if (cleaned.startsWith('90')) return `+${cleaned}`

  // If starts with 0, remove it and add +90
  if (cleaned.startsWith('0')) {
    return `+90${cleaned.substring(1)}`
  }

  // Otherwise add +90
  return `+90${cleaned}`
}
