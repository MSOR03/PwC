-- CHECK constraints cannot be declared in schema.prisma, so they live in this SQL migration.
-- They are the last line of defense: the business layer already validates the same rules.

-- Factura
ALTER TABLE "factura"
    ADD CONSTRAINT "factura_valor_total_positivo_chk" CHECK ("valor_total" > 0),
    ADD CONSTRAINT "factura_moneda_iso4217_chk" CHECK ("moneda" ~ '^[A-Z]{3}$'),
    ADD CONSTRAINT "factura_fecha_limite_pago_chk"
        CHECK ("fecha_limite_pago" IS NULL OR "fecha_limite_pago" >= "fecha_emision");

-- Documento
ALTER TABLE "documento"
    ADD CONSTRAINT "documento_tamano_bytes_chk" CHECK ("tamano_bytes" > 0 AND "tamano_bytes" <= 10485760),
    ADD CONSTRAINT "documento_mime_type_chk"
        CHECK ("mime_type" IN ('application/pdf', 'image/png', 'image/jpeg'));
