export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
