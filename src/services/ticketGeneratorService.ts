// src/services/ticketGeneratorService.ts
import { subscriptionsService } from './subscriptionsService';
import { servicesService } from './servicesService';
import { ticketsService } from './ticketsService';
import { Ticket } from '../types/models';

export interface TicketGenerationResult {
	generated: number;
	skipped: number;
	errors: string[];
	details: {
		subscriptionId: string;
		clientName?: string;
		serviceName?: string;
		amount: number;
		dueDate: Date;
		status: 'generated' | 'skipped' | 'error';
		reason?: string;
	}[];
}

class TicketGeneratorService {
	/**
	 * Genera tickets automáticamente para todas las suscripciones activas
	 * que tengan paymentDate definido y no tengan ya un ticket para esa fecha
	 */
	async generateAutomaticTickets(): Promise<TicketGenerationResult> {
		const result: TicketGenerationResult = {
			generated: 0,
			skipped: 0,
			errors: [],
			details: []
		};

		try {
			// 1. Obtener todas las suscripciones activas con paymentDate
			const subscriptions = await subscriptionsService.getAllSubscriptions();
			const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active' && sub.paymentDate);

			if (activeSubscriptions.length === 0) {
				console.log('No hay suscripciones activas con fecha de pago definida');
				return result;
			}

			// 2. Obtener servicios para calcular precios
			const services = await servicesService.getAllServices();
			const servicesMap = new Map(services.map((service) => [service.id, service]));

			// 3. Obtener tickets existentes para evitar duplicados
			const existingTickets = await ticketsService.getAllTickets();

			// 4. Procesar cada suscripción
			for (const subscription of activeSubscriptions) {
				try {
					const service = servicesMap.get(subscription.serviceId);

					if (!service) {
						const error = `Servicio no encontrado para suscripción ${subscription.id}`;
						result.errors.push(error);
						result.details.push({
							subscriptionId: subscription.id!,
							serviceName: 'Servicio no encontrado',
							amount: 0,
							dueDate: subscription.paymentDate!,
							status: 'error',
							reason: error
						});
						continue;
					}

					// Verificar si ya existe un ticket para esta fecha de pago
					const existingTicket = existingTickets.find(
						(ticket) =>
							ticket.subscriptionId === subscription.id &&
							this.isSameDate(ticket.dueDate, subscription.paymentDate!) &&
							!ticket.isManual // Solo consideramos tickets automáticos
					);

					if (existingTicket) {
						result.skipped++;
						result.details.push({
							subscriptionId: subscription.id!,
							serviceName: service.name,
							amount: service.finalPrice || service.basePrice,
							dueDate: subscription.paymentDate!,
							status: 'skipped',
							reason: 'Ya existe un ticket para esta fecha'
						});
						continue;
					}

					// Generar nuevo ticket
					const ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
						subscriptionId: subscription.id!,
						dueDate: subscription.paymentDate!,
						amount: service.finalPrice || service.basePrice,
						status: 'pending',
						generatedDate: new Date(),
						isManual: false,
						description: `Ticket automático - ${service.name}`
					};

					await ticketsService.createTicket(ticketData);

					result.generated++;
					result.details.push({
						subscriptionId: subscription.id!,
						serviceName: service.name,
						amount: ticketData.amount,
						dueDate: ticketData.dueDate,
						status: 'generated'
					});

					console.log(
						`Ticket generado para suscripción ${subscription.id}: ${service.name} - €${ticketData.amount}`
					);
				} catch (error) {
					const errorMsg = `Error procesando suscripción ${subscription.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
					result.errors.push(errorMsg);
					result.details.push({
						subscriptionId: subscription.id!,
						serviceName: servicesMap.get(subscription.serviceId)?.name || 'Desconocido',
						amount: 0,
						dueDate: subscription.paymentDate!,
						status: 'error',
						reason: errorMsg
					});
				}
			}

			console.log(
				`Generación de tickets completada: ${result.generated} generados, ${result.skipped} omitidos, ${result.errors.length} errores`
			);

			return result;
		} catch (error) {
			const errorMsg = `Error general en la generación de tickets: ${error instanceof Error ? error.message : 'Error desconocido'}`;
			result.errors.push(errorMsg);
			console.error(errorMsg, error);
			return result;
		}
	}

	/**
	 * Genera tickets para una suscripción específica
	 */
	async generateTicketForSubscription(
		subscriptionId: string
	): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
		try {
			const subscription = await subscriptionsService.getSubscriptionById(subscriptionId);

			if (subscription.status !== 'active') {
				return { success: false, error: 'La suscripción no está activa' };
			}

			if (!subscription.paymentDate) {
				return { success: false, error: 'La suscripción no tiene fecha de pago definida' };
			}

			const service = await servicesService.getServiceById(subscription.serviceId);

			// Verificar si ya existe un ticket para esta fecha
			const existingTickets = await ticketsService.getTicketsBySubscription(subscriptionId);
			const existingTicket = existingTickets.find(
				(ticket) => this.isSameDate(ticket.dueDate, subscription.paymentDate!) && !ticket.isManual
			);

			if (existingTicket) {
				return { success: false, error: 'Ya existe un ticket automático para esta fecha' };
			}

			// Crear el ticket
			const ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
				subscriptionId: subscription.id!,
				dueDate: subscription.paymentDate,
				amount: service.finalPrice || service.basePrice,
				status: 'pending',
				generatedDate: new Date(),
				isManual: false,
				description: `Ticket automático - ${service.name}`
			};

			const createdTicket = await ticketsService.createTicket(ticketData);

			return { success: true, ticket: createdTicket };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido'
			};
		}
	}

	/**
	 * Programa la generación automática de tickets (para ejecutar periódicamente)
	 * Esta función debería ser llamada por un cron job o similar
	 */
	async scheduleAutomaticGeneration(): Promise<void> {
		console.log('Iniciando generación automática programada de tickets...');

		try {
			const result = await this.generateAutomaticTickets();

			if (result.generated > 0) {
				console.log(`✅ Generación automática completada: ${result.generated} tickets creados`);
			} else if (result.skipped > 0) {
				console.log(`ℹ️ Generación automática: ${result.skipped} tickets ya existían`);
			} else {
				console.log('ℹ️ Generación automática: No hay tickets para generar');
			}

			if (result.errors.length > 0) {
				console.error(`❌ Errores en generación automática:`, result.errors);
			}
		} catch (error) {
			console.error('❌ Error en generación automática programada:', error);
		}
	}

	/**
	 * Verifica si dos fechas son el mismo día (ignora hora)
	 */
	private isSameDate(date1: Date, date2: Date): boolean {
		return (
			date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate()
		);
	}

	/**
	 * Obtiene las próximas fechas de vencimiento para generar tickets
	 */
	async getUpcomingTicketDates(daysAhead = 30): Promise<
		{
			subscriptionId: string;
			clientName: string;
			serviceName: string;
			dueDate: Date;
			amount: number;
			hasTicket: boolean;
		}[]
	> {
		try {
			const subscriptions = await subscriptionsService.getAllSubscriptions();
			const services = await servicesService.getAllServices();
			const existingTickets = await ticketsService.getAllTickets();

			// También necesitaríamos el servicio de clientes
			const { clientsService } = await import('./clientsService');
			const clients = await clientsService.getAllClients();

			const servicesMap = new Map(services.map((s) => [s.id, s]));
			const clientsMap = new Map(clients.map((c) => [c.id, c]));

			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

			return subscriptions
				.filter((sub) => sub.status === 'active' && sub.paymentDate && sub.paymentDate <= cutoffDate)
				.map((sub) => {
					const service = servicesMap.get(sub.serviceId);
					const client = clientsMap.get(sub.clientId);
					const hasTicket = existingTickets.some(
						(ticket) =>
							ticket.subscriptionId === sub.id && this.isSameDate(ticket.dueDate, sub.paymentDate!)
					);

					return {
						subscriptionId: sub.id!,
						clientName: client ? `${client.firstName} ${client.lastName}` : 'Cliente desconocido',
						serviceName: service?.name || 'Servicio desconocido',
						dueDate: sub.paymentDate!,
						amount: service?.finalPrice || service?.basePrice || 0,
						hasTicket
					};
				})
				.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
		} catch (error) {
			console.error('Error obteniendo próximas fechas de tickets:', error);
			return [];
		}
	}
}

export const ticketGeneratorService = new TicketGeneratorService();
