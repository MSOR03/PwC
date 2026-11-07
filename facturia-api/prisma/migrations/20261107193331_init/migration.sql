-- CreateTable
CREATE TABLE "proveedor" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "nombre_normalizado" VARCHAR(200) NOT NULL,
    "nit" VARCHAR(30),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento" (
    "id" UUID NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(50) NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "ruta_almacenamiento" VARCHAR(500) NOT NULL,
    "hash_sha256" CHAR(64) NOT NULL,
    "respuesta_llm" JSONB NOT NULL,
    "modelo_llm" VARCHAR(100) NOT NULL,
    "fecha_carga" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factura" (
    "id" UUID NOT NULL,
    "proveedor_id" UUID NOT NULL,
    "documento_id" UUID NOT NULL,
    "numero_factura" VARCHAR(100) NOT NULL,
    "fecha_emision" DATE NOT NULL,
    "fecha_limite_pago" DATE,
    "valor_total" DECIMAL(18,2) NOT NULL,
    "moneda" CHAR(3) NOT NULL,
    "numero_cliente" VARCHAR(100),
    "editada_manualmente" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "factura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proveedor_nombre_normalizado_key" ON "proveedor"("nombre_normalizado");

-- CreateIndex
CREATE INDEX "documento_hash_sha256_idx" ON "documento"("hash_sha256");

-- CreateIndex
CREATE UNIQUE INDEX "factura_documento_id_key" ON "factura"("documento_id");

-- CreateIndex
CREATE INDEX "factura_fecha_emision_idx" ON "factura"("fecha_emision");

-- CreateIndex
CREATE INDEX "factura_proveedor_id_fecha_emision_idx" ON "factura"("proveedor_id", "fecha_emision");

-- CreateIndex
CREATE UNIQUE INDEX "factura_proveedor_numero_activa_key" ON "factura"("proveedor_id", "numero_factura") WHERE (deleted_at IS NULL);

-- AddForeignKey
ALTER TABLE "factura" ADD CONSTRAINT "factura_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura" ADD CONSTRAINT "factura_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
