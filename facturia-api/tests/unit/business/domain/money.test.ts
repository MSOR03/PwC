import { describe, expect, it } from 'vitest';
import { normalizeAmount } from '../../../../src/business/domain/money';

describe('normalizeAmount', () => {
  it.each([
    ['245.300,00', '245300.00'], // Colombian format
    ['245,300.00', '245300.00'], // US format
    ['$ 98.450', '98450.00'], // currency symbol + thousands dot
    ['1.245.300', '1245300.00'], // several thousands groups
    ['245300', '245300.00'],
    ['49.99', '49.99'],
    ['49,9', '49.90'],
    [245300, '245300.00'],
    [49.99, '49.99'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeAmount(input)).toBe(expected);
  });

  it.each([['abc'], [''], ['0'], ['-10'], [null], [undefined], [Number.NaN]])(
    'returns null for invalid input %s',
    (input) => {
      expect(normalizeAmount(input)).toBeNull();
    },
  );
});