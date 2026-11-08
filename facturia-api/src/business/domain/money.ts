export function normalizeAmount(value: unknown): string | null {
    let text: string;

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return null;
        text = value.toFixed(2);
    } else if (typeof value === 'string') {
        text = value.replace(/[^\d.,-]/g, ''); //remove currency simbols with regular expresion
    } else {
        return null;
    }
    if (!text) return null;

    const lastComma = text.lastIndexOf(',')
    const lastDot = text.lastIndexOf('.')

    if (lastComma > -1 && lastDot > -1) {
        text =
            lastComma > lastDot
                ? text.replace(/\./g, '').replace(',', '.')
                : text.replace(/,/g, '')
    } else if (lastComma > -1) {
        // Only commas: decimal if there is one comma followed by 1-2 digits
        const isDecimal = /^[^,]*,\d{1,2}$/.test(text);
        text = isDecimal ? text.replace(',', '.') : text.replace(/,/g, '');
    } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
        // Only dots in groups of 3: thousands separator (245.300 or 1.245.300)
        text = text.replace(/\./g, '');
    }

    if (!/^\d+(\.\d+)?$/.test(text)) return null; // rejects negatives and garbage

    const [integerPart, decimalPart = ''] = text.split('.');
    const normalized = `${BigInt(integerPart)}.${(decimalPart + '00').slice(0, 2)}`;

    return /^0\.00$/.test(normalized) ? null : normalized;
}


