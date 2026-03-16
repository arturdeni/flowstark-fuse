// src/app/flowstark/tickets/hooks/useInvoice.ts
import { useState, useCallback } from 'react';
import { Invoice, TicketWithRelations } from '../../../../types/models';
import { userProfileService } from '../../../../services/userProfileService';
import { invoicesService } from '../../../../services/invoicesService';
import { invoiceCounterService } from '../../../../services/invoiceCounterService';
import { ticketsService } from '../../../../services/ticketsService';

interface UseInvoiceReturn {
	loading: boolean;
	error: string | null;
	generateInvoice: (ticket: TicketWithRelations) => Promise<Invoice>;
	checkExistingInvoice: (ticketId: string) => Promise<Invoice | null>;
}

export const useInvoice = (): UseInvoiceReturn => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const checkExistingInvoice = useCallback(async (ticketId: string): Promise<Invoice | null> => {
		return invoicesService.getInvoiceByTicketId(ticketId);
	}, []);

	const generateInvoice = useCallback(async (ticket: TicketWithRelations): Promise<Invoice> => {
		setLoading(true);
		setError(null);

		try {
			// 1. Validar datos del cliente
			const client = ticket.clientInfo;
			if (!client) {
				throw new Error('El ticket no tiene cliente asociado');
			}
			if (!client.fiscalName && !client.firstName) {
				throw new Error(`El cliente no tiene datos fiscales completos. Completa el nombre fiscal del cliente.`);
			}
			if (!client.taxId && !client.idNumber) {
				throw new Error(`El cliente "${client.fiscalName || client.firstName}" no tiene NIF/CIF. Completa sus datos fiscales.`);
			}

			// 2. Obtener y validar perfil del emisor
			const profile = await userProfileService.getUserProfile();
			if (!profile) {
				throw new Error('No se pudo obtener el perfil del usuario');
			}
			if (!profile.name) {
				throw new Error('Completa tus datos fiscales en Configuracion (nombre/razon social)');
			}
			if (!profile.nifCif) {
				throw new Error('Completa tus datos fiscales en Configuracion (NIF/CIF)');
			}

			// 3. Comprobar si ya existe factura para este ticket
			const existingInvoice = await checkExistingInvoice(ticket.id!);
			if (existingInvoice) {
				throw new Error('Este ticket ya tiene una factura generada');
			}

			// 4. Obtener siguiente número de factura
			const invoiceNumber = await invoiceCounterService.getNextInvoiceNumber();

			// 5. Construir snapshots
			const issuerAddress = [profile.street, profile.number].filter(Boolean).join(' ');

			const issuer = {
				name: profile.name,
				nifCif: profile.nifCif,
				address: issuerAddress || '',
				postalCode: profile.postalCode || '',
				city: profile.city || '',
				province: profile.province || '',
				country: profile.country || 'Espana',
				phone: profile.phone,
				email: profile.email,
				website: profile.website,
				iban: profile.sepaIban,
			};

			const invoiceClient = {
				fiscalName: client.fiscalName || `${client.firstName} ${client.lastName}`,
				taxId: client.taxId || client.idNumber,
				address: client.address || '',
				city: client.city || '',
				postalCode: client.postalCode || '',
				country: client.country || 'Espana',
				email: client.email,
			};

			// 6. Calcular líneas, subtotal, IVA, retención, total
			const service = ticket.serviceInfo;
			let lines;
			let vatRate = 0;
			let retentionRate = 0;
			let subtotal: number;

			if (service) {
				// Ticket con servicio asociado
				lines = [{
					description: service.name + (service.description ? ` - ${service.description}` : ''),
					quantity: 1,
					unitPrice: service.basePrice,
					total: service.basePrice,
				}];
				subtotal = service.basePrice;
				vatRate = service.vat || 0;
				retentionRate = service.retention || 0;
			} else {
				// Ticket manual sin servicio
				lines = [{
					description: ticket.description || 'Servicio profesional',
					quantity: 1,
					unitPrice: ticket.amount,
					total: ticket.amount,
				}];
				subtotal = ticket.amount;
			}

			const vatAmount = subtotal * (vatRate / 100);
			const retentionAmount = subtotal * (retentionRate / 100);
			const total = subtotal + vatAmount - retentionAmount;

			// 7. Guardar factura
			const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
				invoiceNumber,
				ticketId: ticket.id!,
				...(ticket.subscriptionId ? { subscriptionId: ticket.subscriptionId } : {}),
				clientId: client.id!,
				issuer,
				client: invoiceClient,
				lines,
				subtotal,
				vatRate,
				vatAmount,
				retentionRate,
				retentionAmount,
				total,
				issueDate: new Date(),
				serviceStart: ticket.serviceStart,
				serviceEnd: ticket.serviceEnd,
				dueDate: ticket.dueDate,
				paymentMethod: ticket.paymentMethod,
				status: ticket.status === 'paid' ? 'paid' : 'issued',
			};

			const createdInvoice = await invoicesService.createInvoice(invoiceData);

			// 8. Actualizar ticket con invoiceId
			await ticketsService.updateTicket(ticket.id!, { invoiceId: createdInvoice.id } as any);

			return createdInvoice;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido al generar la factura';
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [checkExistingInvoice]);

	return {
		loading,
		error,
		generateInvoice,
		checkExistingInvoice,
	};
};
