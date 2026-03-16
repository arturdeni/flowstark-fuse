// src/app/flowstark/tickets/components/InvoicePDFContent.tsx
import React from 'react';
import { Invoice } from '../../../../types/models';

interface InvoicePDFContentProps {
	invoice: Invoice;
}

const formatDate = (date: Date | undefined) => {
	if (!date) return 'N/A';
	return new Intl.DateTimeFormat('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	}).format(date);
};

const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat('es-ES', {
		style: 'currency',
		currency: 'EUR',
	}).format(amount);
};

export const InvoicePDFContent: React.FC<InvoicePDFContentProps> = ({ invoice }) => {
	return (
		<div style={{
			fontFamily: "'Segoe UI', Arial, sans-serif",
			color: '#333',
			padding: '40px',
			maxWidth: '210mm',
			margin: '0 auto',
			fontSize: '13px',
			lineHeight: 1.5,
		}}>
			{/* Cabecera */}
			<div style={{ marginBottom: '30px' }}>
				<h1 style={{
					fontSize: '28px',
					fontWeight: 700,
					color: '#154241',
					margin: 0,
				}}>
					{invoice.issuer.name}
				</h1>
			</div>

			{/* Dos columnas: Emisor + Nº Factura */}
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
				{/* Datos emisor */}
				<div style={{ flex: 1 }}>
					<p style={{ margin: '0 0 2px', fontSize: '12px', color: '#666' }}>
						NIF/CIF: {invoice.issuer.nifCif}
					</p>
					<p style={{ margin: '0 0 2px', fontSize: '12px', color: '#666' }}>
						{invoice.issuer.address}
					</p>
					<p style={{ margin: '0 0 2px', fontSize: '12px', color: '#666' }}>
						{invoice.issuer.postalCode} {invoice.issuer.city} ({invoice.issuer.province})
					</p>
					<p style={{ margin: '0 0 2px', fontSize: '12px', color: '#666' }}>
						{invoice.issuer.country}
					</p>
					{invoice.issuer.phone && (
						<p style={{ margin: '0 0 2px', fontSize: '12px', color: '#666' }}>
							Tel: {invoice.issuer.phone}
						</p>
					)}
					{invoice.issuer.email && (
						<p style={{ margin: '0 0 2px', fontSize: '12px', color: '#666' }}>
							{invoice.issuer.email}
						</p>
					)}
					{invoice.issuer.website && (
						<p style={{ margin: '0 0 2px', fontSize: '12px', color: '#666' }}>
							{invoice.issuer.website}
						</p>
					)}
				</div>

				{/* Número de factura y fechas */}
				<div style={{
					textAlign: 'right',
					backgroundColor: '#f5f7f7',
					padding: '15px 20px',
					borderRadius: '8px',
					minWidth: '220px',
				}}>
					<p style={{ margin: '0 0 8px', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
						Factura
					</p>
					<p style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 700, color: '#154241' }}>
						{invoice.invoiceNumber}
					</p>
					<p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>
						Fecha: {formatDate(invoice.issueDate)}
					</p>
					<p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
						Vencimiento: {formatDate(invoice.dueDate)}
					</p>
				</div>
			</div>

			{/* Datos del cliente */}
			<div style={{
				backgroundColor: '#f9fafa',
				padding: '15px 20px',
				borderRadius: '8px',
				marginBottom: '25px',
				borderLeft: '4px solid #154241',
			}}>
				<p style={{ margin: '0 0 4px', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
					Cliente
				</p>
				<p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#333' }}>
					{invoice.client.fiscalName}
				</p>
				<p style={{ margin: '0 0 2px', fontSize: '12px', color: '#666' }}>
					NIF/CIF: {invoice.client.taxId}
				</p>
				<p style={{ margin: '0 0 2px', fontSize: '12px', color: '#666' }}>
					{invoice.client.address}
				</p>
				<p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
					{invoice.client.postalCode} {invoice.client.city}, {invoice.client.country}
				</p>
				{invoice.client.email && (
					<p style={{ margin: '2px 0 0', fontSize: '12px', color: '#666' }}>
						{invoice.client.email}
					</p>
				)}
			</div>

			{/* Periodo de servicio */}
			{(invoice.serviceStart || invoice.serviceEnd) && (
				<div style={{ marginBottom: '20px' }}>
					<p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
						<strong>Periodo de servicio:</strong> {formatDate(invoice.serviceStart)} — {formatDate(invoice.serviceEnd)}
					</p>
				</div>
			)}

			{/* Tabla de conceptos */}
			<table style={{
				width: '100%',
				borderCollapse: 'collapse',
				marginBottom: '25px',
			}}>
				<thead>
					<tr style={{ backgroundColor: '#154241' }}>
						<th style={{ padding: '10px 12px', textAlign: 'left', color: 'white', fontSize: '12px', fontWeight: 600 }}>
							Descripcion
						</th>
						<th style={{ padding: '10px 12px', textAlign: 'center', color: 'white', fontSize: '12px', fontWeight: 600, width: '80px' }}>
							Cantidad
						</th>
						<th style={{ padding: '10px 12px', textAlign: 'right', color: 'white', fontSize: '12px', fontWeight: 600, width: '120px' }}>
							Precio Unitario
						</th>
						<th style={{ padding: '10px 12px', textAlign: 'right', color: 'white', fontSize: '12px', fontWeight: 600, width: '120px' }}>
							Importe
						</th>
					</tr>
				</thead>
				<tbody>
					{invoice.lines.map((line, index) => (
						<tr key={index} style={{ borderBottom: '1px solid #e8e8e8' }}>
							<td style={{ padding: '10px 12px', fontSize: '13px' }}>
								{line.description}
							</td>
							<td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px' }}>
								{line.quantity}
							</td>
							<td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>
								{formatCurrency(line.unitPrice)}
							</td>
							<td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>
								{formatCurrency(line.total)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* Bloque de totales */}
			<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
				<div style={{ width: '280px' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
						<span style={{ color: '#666' }}>Base imponible</span>
						<span>{formatCurrency(invoice.subtotal)}</span>
					</div>
					<div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
						<span style={{ color: '#666' }}>IVA ({invoice.vatRate}%)</span>
						<span>{formatCurrency(invoice.vatAmount)}</span>
					</div>
					{invoice.retentionRate > 0 && (
						<div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
							<span style={{ color: '#666' }}>Retencion ({invoice.retentionRate}%)</span>
							<span>-{formatCurrency(invoice.retentionAmount)}</span>
						</div>
					)}
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						padding: '10px 0',
						fontSize: '16px',
						fontWeight: 700,
						borderTop: '2px solid #154241',
						marginTop: '6px',
						color: '#154241',
					}}>
						<span>TOTAL</span>
						<span>{formatCurrency(invoice.total)}</span>
					</div>
				</div>
			</div>

			{/* Info de pago */}
			<div style={{
				backgroundColor: '#f5f7f7',
				padding: '15px 20px',
				borderRadius: '8px',
				marginBottom: '30px',
			}}>
				<p style={{ margin: '0 0 6px', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
					Datos de pago
				</p>
				{invoice.paymentMethod && (
					<p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>
						<strong>Metodo:</strong> {
							{
								card: 'Tarjeta',
								transfer: 'Transferencia bancaria',
								cash: 'Efectivo',
								direct_debit: 'Domiciliacion bancaria',
							}[invoice.paymentMethod] || invoice.paymentMethod
						}
					</p>
				)}
				{invoice.issuer.iban && (
					<p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
						<strong>IBAN:</strong> {invoice.issuer.iban}
					</p>
				)}
			</div>

			{/* Pie */}
			<div style={{
				borderTop: '1px solid #e0e0e0',
				paddingTop: '15px',
				textAlign: 'center',
				fontSize: '10px',
				color: '#999',
			}}>
				<p style={{ margin: '0 0 2px' }}>
					{invoice.issuer.name} — NIF/CIF: {invoice.issuer.nifCif}
				</p>
				<p style={{ margin: '0 0 2px' }}>
					{invoice.issuer.address}, {invoice.issuer.postalCode} {invoice.issuer.city} ({invoice.issuer.province}), {invoice.issuer.country}
				</p>
				{(invoice.issuer.phone || invoice.issuer.email) && (
					<p style={{ margin: 0 }}>
						{[invoice.issuer.phone, invoice.issuer.email, invoice.issuer.website].filter(Boolean).join(' | ')}
					</p>
				)}
			</div>
		</div>
	);
};
