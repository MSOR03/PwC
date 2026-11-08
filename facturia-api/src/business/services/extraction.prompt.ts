// Plain JSON Schema (no SDK types) so any LLM adapter can reuse it
const nullableString = (description: string) => ({
  anyOf: [{ type: 'string' }, { type: 'null' }],
  description,
});

export const EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    proveedor: {
      type: 'string',
      description: 'Nombre del proveedor o empresa que emite la factura',
    },
    numeroFactura: {
      type: 'string',
      description: 'Número o código de la factura, exactamente como aparece',
    },
    fechaEmision: {
      type: 'string',
      description: 'Fecha de emisión en formato YYYY-MM-DD',
    },
    fechaLimitePago: nullableString('Fecha límite de pago en formato YYYY-MM-DD, o null'),
    valorTotal: {
      type: 'string',
      description:
        'Valor TOTAL A PAGAR (no el subtotal) con punto decimal y sin separadores de miles, ej. 245300.00',
    },
    moneda: {
      type: 'string',
      description: 'Código ISO 4217 de 3 letras, ej. COP, USD, EUR',
    },
    numeroCliente: nullableString('Número de cliente, cuenta o contrato, o null'),
  },
  required: [
    'proveedor',
    'numeroFactura',
    'fechaEmision',
    'fechaLimitePago',
    'valorTotal',
    'moneda',
    'numeroCliente',
  ],
} as const;

export const EXTRACTION_PROMPT = `Eres un asistente que extrae datos de facturas de servicios públicos y privados
(energía, agua, gas, telecomunicaciones, etc.).

Analiza el documento adjunto y devuelve SOLO un objeto JSON con los campos del esquema.

Reglas:
- No inventes datos. Si un campo opcional no aparece, usa null.
- valorTotal es el total a pagar del periodo, no el subtotal ni el saldo anterior.
- Las fechas deben ir en formato YYYY-MM-DD.
- Si la moneda no se indica explícitamente y la factura es colombiana, usa COP.
- Copia el número de factura exactamente como aparece, sin agregar prefijos.`;