# Plan: Generacion de Facturas desde Tickets

## Estado: IMPLEMENTADO (2026-03-16)

## Contexto

Los clientes de Flowstark necesitan poder generar facturas (no solo tickets/recibos) desde los tickets existentes. Los tickets ya contienen toda la informacion necesaria (cliente, servicio, importes, IVA, retencion, periodo). La infraestructura de PDF (html2pdf.js) ya esta operativa.

**Decisiones tomadas:**
- Factura como entidad nueva en Firestore (trazabilidad, rectificativas)
- Datos del emisor = datos del perfil de usuario existente (name, nifCif, direccion, etc.)
- UI: boton "Generar Factura" en acciones del ticket (tabla + modal detalle)

---

## Paso 1: Modelo de datos

**Archivo: src/types/models.ts**

Interfaces `Invoice` e `InvoiceLine` anadidas despues de `TicketWithRelations`. Campo `invoiceId?: string` anadido al interface `Ticket`.

```typescript
export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;           // "2026-0001"
  ticketId: string;
  subscriptionId?: string;
  clientId: string;
  issuer: {                        // Snapshot del perfil al generar
    name: string;
    nifCif: string;
    address: string;
    postalCode: string;
    city: string;
    province: string;
    country: string;
    phone?: string;
    email?: string;
    website?: string;
    iban?: string;
  };
  client: {                        // Snapshot del cliente al generar
    fiscalName: string;
    taxId: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    email?: string;
  };
  lines: InvoiceLine[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  retentionRate: number;
  retentionAmount: number;
  total: number;
  issueDate: Date;
  serviceStart?: Date;
  serviceEnd?: Date;
  dueDate: Date;
  paymentMethod?: string;
  status: 'issued' | 'paid' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}
```

---

## Paso 2: Servicio de numeracion

**Archivo: src/services/invoiceCounterService.ts**

- Documento Firestore: `users/{userId}/counters/invoices`
- Estructura: `{ year: number, lastNumber: number, updatedAt: Timestamp }`
- `getNextInvoiceNumber()`: transaccion atomica con `db.runTransaction` que lee, incrementa y devuelve `"YYYY-NNNN"` (padding 4 digitos)
- Maneja cambio de ano (reset a 1)

---

## Paso 3: Servicio CRUD de facturas

**Archivo: src/services/invoicesService.ts**

Patron de `ticketsService.ts` con helpers `convertTimestampsToDate` y `convertDatesToTimestamps`:

- Coleccion: `users/{userId}/invoices/{invoiceId}`
- `createInvoice(data)` -- crea documento. **Importante: filtra campos `undefined` antes de escribir** (Firestore no acepta `undefined`)
- `getInvoiceByTicketId(ticketId)` -- query por campo ticketId con `limit(1)`
- `getInvoiceById(id)` -- fetch directo
- `cancelInvoice(id)` -- cambia status a `'cancelled'` (nunca borrar)
- Campos de fecha convertidos: `issueDate`, `serviceStart`, `serviceEnd`, `dueDate`, `createdAt`, `updatedAt`

### Diferencia con el plan original
El plan no contemplaba que Firestore rechaza valores `undefined`. Se anadio un filtro explícito en `createInvoice` que recorre `Object.entries()` y solo incluye propiedades con valor distinto de `undefined`. Esto es critico para tickets manuales donde `subscriptionId`, `serviceStart`, `serviceEnd` pueden ser `undefined`.

---

## Paso 4: Hook useInvoice

**Archivo: src/app/flowstark/tickets/hooks/useInvoice.ts**

```typescript
interface UseInvoiceReturn {
  loading: boolean;
  error: string | null;
  generateInvoice: (ticket: TicketWithRelations) => Promise<Invoice>;
  checkExistingInvoice: (ticketId: string) => Promise<Invoice | null>;
}
```

`generateInvoice` orquesta:
1. Validar datos del cliente (`fiscalName || firstName`, `taxId || idNumber`)
2. Obtener perfil del usuario -> validar datos del emisor (`name`, `nifCif`)
3. Comprobar si ya existe factura para ese ticket
4. Obtener siguiente numero de factura (`invoiceCounterService`)
5. Construir snapshots de emisor (desde `UserProfile`: `street + number` = address) y cliente
6. Calcular lineas, subtotal, IVA, retencion, total:
   - **Con servicio**: usa `service.basePrice`, `service.vat`, `service.retention`
   - **Sin servicio (manual)**: usa `ticket.amount`, IVA = 0, retencion = 0
7. Guardar factura (`invoicesService.createInvoice`)
8. Actualizar ticket con `invoiceId` (`ticketsService.updateTicket`)
9. Retornar factura creada

### Diferencia con el plan original
El campo `subscriptionId` se pasa con spread condicional (`...(ticket.subscriptionId ? { subscriptionId } : {})`) en vez de `|| undefined`, porque Firestore rechaza `undefined`. Los fallbacks para `fiscalName` y `taxId` del cliente usan `firstName + lastName` y `idNumber` respectivamente, ya que muchos clientes de tipo "Particular" no tienen `fiscalName`/`taxId` rellenados.

---

## Paso 5: Template PDF de factura

**Archivo: src/app/flowstark/tickets/components/InvoicePDFContent.tsx**

Componente React con estilos inline (para html2pdf.js), formato A4. Colores corporativos `#154241`:

1. **Cabecera**: nombre/razon social del emisor (h1, bold)
2. **Dos columnas**: datos fiscales emisor (izq) | bloque nro factura + fechas (der, fondo `#f5f7f7`)
3. **Datos del cliente**: bloque con borde izquierdo `#154241`, fiscalName, NIF, direccion, email
4. **Periodo de servicio**: solo si `serviceStart` o `serviceEnd` existen
5. **Tabla de conceptos**: cabecera `#154241`, columnas: Descripcion | Cantidad | Precio Unitario | Importe
6. **Bloque de totales** (alineado derecha, 280px):
   - Base imponible
   - IVA (X%)
   - Retencion (X%) -- solo si > 0
   - **TOTAL** (borde superior `#154241`, bold)
7. **Info de pago**: metodo (traducido a espanol), IBAN del emisor
8. **Pie**: separador + datos del emisor en pequeno (10px, color `#999`)

---

## Paso 6: Modal de previsualizacion

**Archivo: src/app/flowstark/tickets/components/InvoicePreviewModal.tsx**

Dialog MUI (`maxWidth="md"`, `fullWidth`):
- Titulo: "Factura {invoiceNumber}" con `DescriptionIcon`
- Preview del `InvoicePDFContent` dentro de un `ref` para html2pdf
- Boton "Descargar PDF" (html2pdf.js, filename: `factura-{invoiceNumber}.pdf`, margin 0.5in, scale 2)
- Boton "Cerrar"
- Usa `as const` en las opciones de html2pdf para satisfacer los tipos estrictos de `Html2PdfOptions`

---

## Paso 7: Integracion UI

### src/app/flowstark/tickets/components/TicketDetailModal.tsx
- Props anadidas: `onGenerateInvoice`, `onViewInvoice`, `invoiceLoading`
- Boton "Generar Factura" / "Ver Factura" en `DialogActions`, despues del boton "Descargar PDF"
- Usa `DescriptionIcon` (`@mui/icons-material/Description`)
- Disabled mientras `invoiceLoading` es true

### src/app/flowstark/tickets/components/TicketsTable.tsx
- Props anadidas: `onGenerateInvoice`, `onViewInvoice`
- Icono de factura (`DescriptionIcon`) en la columna de acciones, **antes** del boton "Ver Detalle"
- Si ticket tiene `invoiceId`: icono color `secondary.main` con tooltip "Ver Factura"
- Si ticket no tiene `invoiceId`: icono color `grey.400` con hover a `secondary.main`, tooltip "Generar Factura"

### src/app/flowstark/tickets/components/index.ts
- Exports anadidos: `InvoicePDFContent`, `InvoicePreviewModal`

### src/app/flowstark/tickets/Tickets.tsx
- Importa `useInvoice` + `InvoicePreviewModal` + tipo `Invoice`
- Estados: `invoicePreviewOpen`, `currentInvoice`, `invoiceErrorOpen`
- `handleGenerateInvoice`: genera factura -> abre preview -> `refreshData()` para actualizar `invoiceId` en tabla
- `handleViewInvoice`: `checkExistingInvoice` -> abre preview
- `handleCloseInvoicePreview`: cierra modal y limpia estado
- Callbacks pasados a `TicketsTable` y `TicketDetailModal`
- Snackbar de error de factura con `autoHideDuration={10000}`

---

## Orden de implementacion (ejecutado)

```
Paso 1 (models.ts)
├── Paso 2 (invoiceCounterService) ─┐
├── Paso 3 (invoicesService) ───────┼── Paso 4 (useInvoice hook)
└── Paso 5 (InvoicePDFContent) ─────┘        │
         │                                     │
    Paso 6 (InvoicePreviewModal)              │
         └────────────┬───────────────────────┘
                 Paso 7 (integracion UI)
```

Pasos 2, 3 y 5 se implementaron en paralelo. El orden funciono bien.

---

## Casos edge

- **Ticket ya tiene factura** -> UI muestra "Ver Factura" en vez de "Generar" -- **verificado con Playwright**
- **Faltan datos emisor** -> Error: "Completa tus datos fiscales en Configuracion (nombre/razon social)" o "(NIF/CIF)"
- **Faltan datos cliente** -> Error: "El cliente X no tiene NIF/CIF. Completa sus datos fiscales."
- **Ticket manual sin serviceInfo** -> Usa `ticket.description` y `ticket.amount` directamente, IVA/retencion = 0 -- **verificado con Playwright**
- **Cambio de ano** -> Counter se resetea automaticamente (compara `storedYear` con `currentYear`)
- **Concurrencia** -> Transaccion Firestore garantiza numeros unicos
- **Campos undefined en Firestore** -> Filtrados antes de `add()` para evitar error `Unsupported field value: undefined` -- **bug encontrado y corregido durante implementacion**
- **Cliente sin fiscalName** -> Fallback a `firstName + lastName` -- **verificado con Playwright** (cliente "Particular")
- **Cliente sin taxId** -> Fallback a `idNumber` (DNI)

---

## Verificacion realizada (2026-03-16)

### Playwright MCP (puerto 3000, no 5173)
1. Registro de usuario test: `test-facturas@flowstark.com`
2. Datos fiscales del emisor configurados en /settings (Test Autonomo SL, B12345678, Barcelona)
3. Cliente creado: Juan Garcia Lopez, DNI 12345678A, Madrid
4. Ticket manual creado: "Consultoria fiscal Q1 2026", 605 EUR, domiciliacion
5. Boton "Generar Factura" visible en columna de acciones -- **OK**
6. Click "Generar Factura" -> modal preview con factura 2026-0002 -- **OK**
   - Datos emisor correctos (nombre, NIF, direccion, telefono, email)
   - Datos cliente correctos (nombre, NIF, direccion, email)
   - Tabla conceptos: "Consultoria fiscal Q1 2026" | 1 | 605,00 EUR | 605,00 EUR
   - Totales: Base 605,00 EUR, IVA 0%, Total 605,00 EUR
   - Datos de pago: Domiciliacion bancaria
   - Pie con datos del emisor
7. Al cerrar, boton cambia a "Ver Factura" -- **OK**
8. Click "Ver Factura" recupera factura existente correctamente -- **OK**

### Build
- `npm run build` compila sin errores nuevos (solo errores preexistentes en dashboard, services, users)

### Firebase MCP
- API REST de Firestore no habilitada para MCP en este proyecto. La verificacion funcional via UI confirma persistencia correcta (generar + recuperar).

---

## Archivos del modulo de facturas

### Nuevos (5 archivos)
| Archivo | Descripcion |
|---|---|
| `src/services/invoiceCounterService.ts` | Numeracion atomica con transaccion Firestore |
| `src/services/invoicesService.ts` | CRUD facturas (create, getByTicketId, getById, cancel) |
| `src/app/flowstark/tickets/hooks/useInvoice.ts` | Hook orquestador: validacion, generacion, snapshots |
| `src/app/flowstark/tickets/components/InvoicePDFContent.tsx` | Template PDF A4 con estilos inline |
| `src/app/flowstark/tickets/components/InvoicePreviewModal.tsx` | Modal MUI preview + descarga PDF |

### Modificados (5 archivos)
| Archivo | Cambio |
|---|---|
| `src/types/models.ts` | Interfaces `Invoice`, `InvoiceLine` + campo `invoiceId` en `Ticket` |
| `src/app/flowstark/tickets/components/index.ts` | Exports de `InvoicePDFContent` y `InvoicePreviewModal` |
| `src/app/flowstark/tickets/components/TicketDetailModal.tsx` | Props + boton "Generar/Ver Factura" en DialogActions |
| `src/app/flowstark/tickets/components/TicketsTable.tsx` | Props + icono factura en columna acciones |
| `src/app/flowstark/tickets/Tickets.tsx` | Hook, estados, handlers, modal, snackbar de factura |

---

## Trabajo futuro

- **Factura rectificativa**: crear nueva factura que referencia la original (campo `rectifiesInvoiceId`)
- **Listado de facturas**: pagina /invoices con tabla, filtros por fecha/cliente/estado
- **Exportacion**: Excel/CSV de facturas por periodo
- **Envio por email**: integrar con Brevo para enviar factura PDF al cliente
- **Numeracion personalizable**: permitir prefijo/sufijo configurable en settings
- **Multi-linea**: permitir facturas con varias lineas de concepto (actualmente 1 linea por ticket)
- **Logo del emisor**: subir logo y mostrarlo en la cabecera del PDF
