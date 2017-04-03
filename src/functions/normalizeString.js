export default function normalizeString(str) {
  if (!str) return '';

  return String(str).trim().toLowerCase();
}
