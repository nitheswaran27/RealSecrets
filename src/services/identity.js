/**
 * Realsecrets Celestial Identity Resolver
 * Resolves Date of Birth into Profile N or Profile H:
 * - 02/05/2007 -> Profile H
 * - 27/09/2006 -> Profile N
 */
export function parseProfileFromDob(rawDob) {
  if (!rawDob || typeof rawDob !== 'string') return null;
  const cleaned = rawDob.trim();
  const digits = cleaned.replace(/\D/g, '');

  // Profile H: 02/05/2007 (Day: 2, Month: 5, Year: 2007)
  if (
    digits === '02052007' ||
    digits === '20070502' ||
    digits === '252007' ||
    digits === '0252007' ||
    digits === '2052007'
  ) {
    return 'H';
  }

  // Profile N: 27/09/2006 (Day: 27, Month: 9, Year: 2006)
  if (
    digits === '27092006' ||
    digits === '20060927' ||
    digits === '2792006'
  ) {
    return 'N';
  }

  // Check delimiter patterns (DD/MM/YYYY or YYYY-MM-DD)
  const parts = cleaned.split(/[-/.]/).map((p) => p.trim());
  if (parts.length === 3) {
    let day, month, year;
    if (parts[0].length === 4) {
      [year, month, day] = parts.map(Number);
    } else {
      [day, month, year] = parts.map(Number);
    }
    if (day === 2 && month === 5 && year === 2007) return 'H';
    if (day === 27 && month === 9 && year === 2006) return 'N';
  }

  return null;
}
