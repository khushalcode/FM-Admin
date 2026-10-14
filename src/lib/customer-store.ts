const PALETTE = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6']

/**
 * Returns an image URL for a store. Uses `logoUrl` when provided, otherwise a
 * deterministic placeholder (inline SVG data URI) derived from the store id.
 */
export function getStoreImage(storeId?: string | null, logoUrl?: string | null): string {
  if (logoUrl) return logoUrl
  const id = storeId || 'store'
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const color = PALETTE[hash % PALETTE.length]
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">` +
    `<rect width="80" height="80" fill="${color}"/>` +
    `<text x="40" y="52" font-size="36" text-anchor="middle">🍽️</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
