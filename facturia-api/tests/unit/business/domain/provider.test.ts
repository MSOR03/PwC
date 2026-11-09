import { describe, expect, it } from 'vitest';
import { normalizeProviderName } from '../../../../src/business/domain/provider';

describe('normalizeProviderName', () => {
  it.each([
    ['Energía del Valle S.A. E.S.P.', 'ENERGIA DEL VALLE'],
    ['Aguas Metropolitanas S.A.S.', 'AGUAS METROPOLITANAS'],
    ['TelcoNet Colombia S.A.', 'TELCONET COLOMBIA'],
    ['CloudHost Inc.', 'CLOUDHOST'],
    ['  energia   del valle sa ', 'ENERGIA DEL VALLE'],
  ])('normalizes "%s" to "%s"', (input, expected) => {
    expect(normalizeProviderName(input)).toBe(expected);
  });

  it('gives the same result for different spellings of the same provider', () => {
    expect(normalizeProviderName('Energía del Valle S.A.')).toBe(
      normalizeProviderName('ENERGIA DEL VALLE SA'),
    );
  });
});
