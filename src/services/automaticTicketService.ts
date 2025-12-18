// src/services/automaticTicketService.ts - VERSIÓN CORREGIDA
import { subscriptionsService } from './subscriptionsService';
import { servicesService } from './servicesService';
import { ticketsService } from './ticketsService';
import { clientsService } from './clientsService';
import { ServiceFrequency } from '../types/models';

export interface ProportionalTicketConfig {
	subscriptionId: string;
	startDate: Date;
	nextPaymentDate: Date;
	servicePrice: number;
	frequency: ServiceFrequency;
}

class AutomaticTicketService {
	/**
	 * Calcula los días entre dos fechas
	 */
	private calculateDaysBetween(startDate: Date, endDate: Date): number {
		const timeDiff = endDate.getTime() - startDate.getTime();
		return Math.ceil(timeDiff / (1000 * 3600 * 24));
	}

	/**
	 * Obtiene el número total de días según la frecuencia
	 */
	private getTotalDaysForFrequency(frequency: ServiceFrequency): number {
		const dayMappings: Record<ServiceFrequency, number> = {
			[ServiceFrequency.MONTHLY]: 30,
			[ServiceFrequency.QUARTERLY]: 90,
			[ServiceFrequency.FOUR_MONTHLY]: 120,
			[ServiceFrequency.BIANNUAL]: 180,
			[ServiceFrequency.ANNUAL]: 360
		};

		return dayMappings[frequency];
	}

	/**
	 * Calcula el precio proporcional basado en los días utilizados
	 */
	private calculateProportionalPrice(basePrice: number, daysUsed: number, totalDaysInPeriod: number): number {
		if (daysUsed <= 0 || totalDaysInPeriod <= 0) return 0;

		const proportion = Math.min(daysUsed / totalDaysInPeriod, 1);
		return Math.round(basePrice * proportion * 100) / 100; // Redondear a 2 decimales
	}

	/**
	 * Calcula la fecha de fin del período proporcional
	 */
	private calculateProportionalEndDate(startDate: Date, nextPaymentDate: Date): Date {
		// La fecha de fin del período proporcional es un día antes del próximo pago
		const endDate = new Date(nextPaymentDate);
		endDate.setDate(endDate.getDate() - 1);
		return endDate;
	}

	/**
	 * Genera descripción para el ticket proporcional
	 */
	private generateProportionalDescription(
		serviceName: string,
		startDate: Date,
		endDate: Date,
		daysUsed: number,
		totalDays: number
	): string {
		const startStr = startDate.toLocaleDateString('es-ES');
		const endStr = endDate.toLocaleDateString('es-ES');

		return `${serviceName} - Período proporcional (${startStr} - ${endStr}) - ${daysUsed}/${totalDays} días`;
	}

	/**
	 * Verifica si ya existe un ticket para el período proporcional
	 */
	private async checkIfProportionalTicketExists(
		subscriptionId: string,
		serviceStart: Date,
		serviceEnd: Date
	): Promise<boolean> {
		try {
			const existingTickets = await ticketsService.getTicketsByServicePeriod(serviceStart, serviceEnd);

			return existingTickets.some(
				(ticket) =>
					ticket.subscriptionId === subscriptionId &&
					this.isSameDay(ticket.serviceStart, serviceStart) &&
					this.isSameDay(ticket.serviceEnd, serviceEnd)
			);
		} catch (error) {
			console.error('Error checking existing proportional tickets:', error);
			return false; // En caso de error, asumir que no existe para intentar crear
		}
	}

	/**
	 * Utilidad para comparar si dos fechas son el mismo día
	 */
	private isSameDay(date1: Date, date2: Date): boolean {
		return date1.toDateString() === date2.toDateString();
	}

	/**
	 * Crea un ticket automático para el período proporcional de una nueva suscripción
	 */
	async createProportionalTicket(config: ProportionalTicketConfig): Promise<void> {
		try {
			const { subscriptionId, startDate, nextPaymentDate, servicePrice, frequency } = config;

			// 1. Validar que las fechas sean coherentes
			if (startDate >= nextPaymentDate) {
				console.log(
					'No se requiere ticket proporcional: la fecha de inicio es igual o posterior al próximo pago'
				);
				return;
			}

			// 2. Calcular el período proporcional
			const proportionalEndDate = this.calculateProportionalEndDate(startDate, nextPaymentDate);
			const daysUsed = this.calculateDaysBetween(startDate, proportionalEndDate);

			if (daysUsed <= 0) {
				console.log('No se requiere ticket proporcional: no hay días a facturar');
				return;
			}

			// 3. Verificar si ya existe un ticket para este período
			const ticketExists = await this.checkIfProportionalTicketExists(
				subscriptionId,
				startDate,
				proportionalEndDate
			);

			if (ticketExists) {
				console.log('Ya existe un ticket para el período proporcional, omitiendo creación');
				return;
			}

			// 4. Calcular precio proporcional
			const totalDaysInPeriod = this.getTotalDaysForFrequency(frequency);
			const proportionalPrice = this.calculateProportionalPrice(servicePrice, daysUsed, totalDaysInPeriod);

			if (proportionalPrice <= 0) {
				console.log('No se crea ticket proporcional: precio calculado es 0');
				return;
			}

			// 5. ✅ CORREGIDO: Obtener información del servicio correctamente
			const subscription = await subscriptionsService.getSubscriptionById(subscriptionId);
			const service = await servicesService.getServiceById(subscription.serviceId);

			// 5.5. Obtener el método de pago del cliente
			const client = await clientsService.getClientById(subscription.clientId);
			const paymentMethod = client.paymentMethod?.type || undefined;

			const description = this.generateProportionalDescription(
				service.name,
				startDate,
				proportionalEndDate,
				daysUsed,
				totalDaysInPeriod
			);

			// 6. Crear el ticket proporcional
			await ticketsService.createTicket({
				subscriptionId,
				dueDate: nextPaymentDate, // El ticket vence en la próxima fecha de pago
				amount: proportionalPrice,
				status: 'pending',
				generatedDate: new Date(),
				isManual: false, // Es automático
				description,
				serviceStart: startDate,
				serviceEnd: proportionalEndDate,
				paymentMethod
			});

			console.log(`✅ Ticket proporcional creado exitosamente:`, {
				subscriptionId,
				serviceName: service.name,
				daysUsed,
				totalDaysInPeriod,
				proportionalPrice,
				period: `${startDate.toDateString()} - ${proportionalEndDate.toDateString()}`
			});
		} catch (error) {
			console.error('Error creating proportional ticket:', error);
			throw error;
		}
	}

	/**
	 * Procesa todas las suscripciones nuevas para generar tickets proporcionales
	 * Debe ser llamado después de crear una nueva suscripción
	 */
	async processNewSubscriptionForProportionalTicket(subscriptionId: string): Promise<void> {
		try {
			console.log(`🎫 Procesando suscripción ${subscriptionId} para ticket proporcional`);

			// 1. Obtener la suscripción
			const subscription = await subscriptionsService.getSubscriptionById(subscriptionId);

			// 2. Obtener el servicio asociado
			const service = await servicesService.getServiceById(subscription.serviceId);

			// 3. Validar que tenga fecha de pago calculada
			if (!subscription.paymentDate) {
				console.log('Suscripción sin fecha de pago, no se puede crear ticket proporcional');
				return;
			}

			// 4. Verificar que es una suscripción nueva (startDate reciente)
			const now = new Date();
			const daysSinceStart = this.calculateDaysBetween(subscription.startDate, now);

			// Solo procesar si la suscripción se creó recientemente (menos de 7 días)
			if (daysSinceStart > 7) {
				console.log('Suscripción no es reciente, omitiendo ticket proporcional');
				return;
			}

			// 5. Crear configuración para el ticket proporcional
			const config: ProportionalTicketConfig = {
				subscriptionId: subscription.id!,
				startDate: subscription.startDate,
				nextPaymentDate: subscription.paymentDate,
				servicePrice: service.basePrice,
				frequency: service.frequency as ServiceFrequency
			};

			// 6. Crear el ticket proporcional
			await this.createProportionalTicket(config);
		} catch (error) {
			console.error('Error processing new subscription for proportional ticket:', error);
			throw error;
		}
	}

	/**
	 * Procesa todas las suscripciones activas para buscar casos donde falten tickets proporcionales
	 * Útil para migración o corrección de datos
	 */
	async processAllSubscriptionsForMissingProportionalTickets(): Promise<{
		processed: number;
		created: number;
		errors: string[];
	}> {
		const result = {
			processed: 0,
			created: 0,
			errors: [] as string[]
		};

		try {
			// 1. Obtener todas las suscripciones activas
			const allSubscriptions = await subscriptionsService.getAllSubscriptions();
			const activeSubscriptions = allSubscriptions.filter((sub) => sub.status === 'active');

			console.log(`Procesando ${activeSubscriptions.length} suscripciones activas...`);

			// 2. Procesar cada suscripción
			for (const subscription of activeSubscriptions) {
				try {
					result.processed++;

					if (!subscription.id) continue;

					// Solo procesar suscripciones que podrían necesitar ticket proporcional
					if (!subscription.paymentDate) continue;

					const daysSinceStart = this.calculateDaysBetween(subscription.startDate, subscription.paymentDate);

					// Si hay días entre el inicio y el primer pago, podría necesitar ticket proporcional
					if (daysSinceStart > 0) {
						const service = await servicesService.getServiceById(subscription.serviceId);

						const config: ProportionalTicketConfig = {
							subscriptionId: subscription.id,
							startDate: subscription.startDate,
							nextPaymentDate: subscription.paymentDate,
							servicePrice: service.basePrice,
							frequency: service.frequency as ServiceFrequency
						};

						// Verificar si ya existe el ticket
						const proportionalEndDate = this.calculateProportionalEndDate(
							subscription.startDate,
							subscription.paymentDate
						);

						const ticketExists = await this.checkIfProportionalTicketExists(
							subscription.id,
							subscription.startDate,
							proportionalEndDate
						);

						if (!ticketExists) {
							await this.createProportionalTicket(config);
							result.created++;
						}
					}
				} catch (error) {
					result.errors.push(`Error en suscripción ${subscription.id}: ${error}`);
				}
			}

			console.log(`Procesamiento completo:`, result);
			return result;
		} catch (error) {
			console.error('Error processing all subscriptions:', error);
			result.errors.push(`Error general: ${error}`);
			return result;
		}
	}
}

// Exportar instancia singleton
export const automaticTicketService = new AutomaticTicketService();
