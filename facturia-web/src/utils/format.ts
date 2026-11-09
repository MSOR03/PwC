export function formatCurrency(value:string,currency:string):string{
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(Number(value))
}
//"2026-10-28"> "28 oct. 2026"

export function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatMonth(value: string): string {
  return new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${value}-01T00:00:00Z`),
  );
}