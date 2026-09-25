export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function limitInteger(value: string, maximum: number) {
  const digits = onlyDigits(value);
  return digits && Number(digits) > maximum ? String(maximum) : digits;
}

export function formatCurrencyInput(value: string) {
  const cents = onlyDigits(value);
  if (!cents) return '';
  return (Number(cents) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
