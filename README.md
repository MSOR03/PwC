# FacturIA · Extracción inteligente de facturas con LLM

Aplicación web *end-to-end* para cargar facturas de servicios (PDF/PNG/JPG), extraer sus datos clave con un LLM, guardarlas en PostgreSQL y consultarlas desde una interfaz web.

| Capa | Tecnología |
|---|---|
| Frontend | React 19 · TypeScript · Vite · React Router · React Hook Form + Zod · TanStack Query · Axios |
| Backend | Node.js 26 · TypeScript · Express 5 · Multer · Zod · Prisma 7 |
| Base de datos | PostgreSQL 17 |
| LLM | Google Gemini (detrás de la interfaz `LlmClient`, intercambiable) |
| Pruebas e infraestructura | Vitest · Supertest · Docker Compose · nginx · GitHub Actions |

---

## 1. Ejecución

**Requisitos:** Docker y Docker Compose. La API Key de Gemini es opcional: con `LLM_PROVIDER=fake` se usa un LLM simulado.

```bash
cp .env.example .env          # completar POSTGRES_PASSWORD y LLM_API_KEY (o LLM_PROVIDER=fake)
docker compose up --build
```

- Aplicación: http://localhost:8080 · API: http://localhost:8080/api/health
- **Facturas de ejemplo:** `samples/` (2 PDF + 1 PNG ficticios).
- **Datos de ejemplo:** con la BD en marcha, `cd facturia-api && cp .env.example .env && npm install && npm run db:seed` (4 proveedores y 4 facturas en COP y USD). La contraseña de `DATABASE_URL` debe coincidir con `POSTGRES_PASSWORD`.

**Desarrollo local y pruebas:**

```bash
docker compose up -d db
cd facturia-api && cp .env.example .env && npm install && npx prisma migrate dev && npm run dev   # :3000
cd facturia-web && npm install && npm run dev                                                     # :5173
npm test                     # en cada proyecto (API: unitarias + integración con Supertest)
```

---

## 2. Arquitectura

La API está organizada en capas con **inversión de dependencias** (*Ports & Adapters*): el negocio define interfaces (`InvoiceRepository`, `LlmClient`, `FileStorage`) y la capa de datos las implementa (Prisma, Gemini, disco local). Las dependencias apuntan hacia el negocio: **presentación → negocio ← datos**, y todo se conecta en `container.ts` (inyección de dependencias manual).

### 2.1 Modelo de datos

![Diagrama entidad-relación](image/PwC_ER_View.drawio.png)

**Proveedor** 1—N **Factura** 1—1 **Documento**. Montos en `DECIMAL(18,2)`, fechas en `DATE` y la respuesta original del LLM en `JSONB`.

- **Unicidad:** `(proveedor_id, numero_factura) WHERE deleted_at IS NULL` (índice parcial, compatible con borrado lógico) · `proveedor.nombre_normalizado` · `factura.documento_id` (1:1).
- **Índices:** `fecha_emision` · `(proveedor_id, fecha_emision)` · `documento.hash_sha256` (trazabilidad del archivo).
- **CHECK:** `valor_total > 0` · moneda ISO 4217 · `fecha_limite_pago >= fecha_emision` · tamaño ≤ 10 MB · tipo PDF/PNG/JPG. Están en una migración SQL propia, porque Prisma no las soporta.

### 2.2 Componentes y despliegue

![Vista de componentes y conectores](image/PwC_C%26C_View.drawio.png)
![Vista de despliegue](image/PwC_Deployment_View.drawio.png)

Tres contenedores en la red `facturia-net`: **web** (nginx), **api** (Express) y **db** (PostgreSQL).

- nginx sirve la SPA y hace de *reverse proxy* de `/api`: un solo origen, sin CORS, y la API no se expone al anfitrión.
- La API se conecta a PostgreSQL por TCP y a Gemini por HTTPS, con *timeout* configurable.
- Los *healthchecks* fijan el orden de arranque db → api → web, y la API aplica las migraciones al iniciar.

### 2.3 Capas

![Vista de capas](image/PwC_shapes_view.drawio.png)

| Capa | Contenido |
|---|---|
| Web (`facturia-web`) | páginas y componentes · hooks (TanStack Query) · servicios (Axios con interceptor de errores) |
| Presentación API (`src/presentation`) | rutas · middlewares (validación Zod, carga, errores) · controladores |
| Negocio (`src/business`) | servicios · dominio (reglas y errores) · *ports* |
| Datos (`src/data`) | repositorio Prisma · cliente Gemini/Fake · almacenamiento de archivos |

---

## 3. API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/facturas` | Carga (`multipart/form-data`, campo `archivo`), extracción y registro → `201` |
| GET | `/api/facturas?page&pageSize&proveedor&fechaDesde&fechaHasta` | Listado paginado y filtrado en la BD |
| GET · PUT | `/api/facturas/:id` | Detalle · corrección manual |
| DELETE | `/api/facturas/:id` | Borrado lógico → `204` |
| GET | `/api/facturas/reportes/resumen?fechaDesde&fechaHasta` | Totales por proveedor, mes y moneda |

Los errores se devuelven como **Problem Details (RFC 9457)** desde un único middleware:

| HTTP | Caso |
|---|---|
| 400 | Request inválido (Zod), id mal formado, archivo ausente o vacío |
| 404 | Factura inexistente o eliminada |
| 409 | Proveedor + número de factura ya registrado |
| 413 · 415 | Archivo > 10 MB · tipo distinto de PDF/PNG/JPG (por *magic bytes*) |
| 422 | La respuesta del LLM no trae los campos obligatorios válidos |
| 502 · 500 | Falla o *timeout* del LLM · error no controlado |

```json
{ "type": "https://api.facturia.local/errors#duplicate-invoice", "title": "Duplicate Invoice", "status": 409,
  "detail": "Invoice FE-1234 for provider 'Energía S.A.' already exists", "instance": "/api/facturas" }
```

---

## 4. Decisiones técnicas

| Decisión | Justificación |
|---|---|
| Ports & Adapters | El negocio no depende de Prisma ni de Gemini: se prueba con *mocks* y el proveedor se cambia implementando una interfaz. |
| Borrado **lógico** | Las facturas son información contable: se conservan la trazabilidad, el archivo y la respuesta del LLM. El índice único parcial permite volver a cargar una factura eliminada. |
| Proveedor normalizado | "Energía del Valle S.A. E.S.P." y "ENERGIA DEL VALLE" son el mismo proveedor; sin esto, los duplicados se evadirían con variaciones del LLM. |
| Doble control de duplicados | La verificación previa da un error claro; la restricción única en la BD cubre la concurrencia. |
| Validación antes y después del LLM | El tipo real (*magic bytes*) y el tamaño se validan antes de gastar cuota; la salida del modelo se valida con Zod como entrada no confiable. |
| Una transacción | El proveedor, el documento y la factura se guardan juntos; si la transacción falla, se elimina el archivo guardado. |
| `DECIMAL` y SQL del reporte | Sin errores de punto flotante; el `GROUP BY` por moneda en la BD nunca mezcla monedas. |
| Gemini | Nivel gratuito, lee PDF e imágenes sin OCR previo y devuelve JSON con `responseSchema`. |
| `LLM_PROVIDER=fake` | Permite ejecutar y evaluar la solución sin API Key; lo usan la CI y las pruebas de integración. |
