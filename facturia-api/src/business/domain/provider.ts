
//Normalize a provider name to detect duplicates reliably
export function normalizeProviderName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toUpperCase()
    .replace(/[.,]/g, ' ')
    .replace(/\b(S\s?A\s?S|S\s?A|E\s?S\s?P|LTDA|INC|LLC|CORP)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}