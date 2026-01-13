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
	 * Calcula los días entre dos fechas (INCLUSIVO)
	 * Ejemplo: del 5 al 31 de enero = 27 días (5, 6, 7, ..., 31)
	 */
	private calculateDaysBetween(startDate: Date, endDate: Date): number {
		const timeDiff = endDate.getTime() - startDate.getTime();
		const daysDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));
		// Sumar 1 para contar inclusivamente (ambos días cuentan)
		return daysDifference + 1;
	}

	/**
	 * Obtiene el número total de días según la frecuencia
	 * Calcula los días REALES del período específico basándose en la fecha de referencia
	 */
	private getTotalDaysForFrequency(frequency: ServiceFrequency, referenceDate?: Date): number {
		if (!referenceDate) {
			// Fallback: valores aproximados si no hay fecha de referencia
			const dayMappings: Record<ServiceFrequency, number> = {
				[ServiceFrequency.MONTHLY]: 30,
				[ServiceFrequency.QUARTERLY]: 90,
				[ServiceFrequency.FOUR_MONTHLY]: 120,
				[ServiceFrequency.BIANNUAL]: 180,
				[ServiceFrequency.ANNUAL]: 365
			};
			return dayMappings[frequency];
		}

		// ✅ Calcular días reales del período basándose en la fecha de inicio
		const startDate = new Date(referenceDate);
		startDate.setHours(0, 0, 0, 0);

		// Calcular fecha de fin del período sumando la frecuencia
		const endDate = new Date(startDate);

		switch (frequency) {
			case ServiceFrequency.MONTHLY:
				// Para mensual: último día del mismo mes
				endDate.setMonth(endDate.getMonth() + 1, 0);
				break;
			case ServiceFrequency.QUARTERLY:
				// Para trimestral: 3 meses después, último día del mes
				endDate.setMonth(endDate.getMonth() + 3, 0);
				break;
			case ServiceFrequency.FOUR_MONTHLY:
				// Para cuatrimestral: 4 meses después, último día del mes
				endDate.setMonth(endDate.getMonth() + 4, 0);
				break;
			case ServiceFrequency.BIANNUAL:
				// Para semestral: 6 meses después, último día del mes
				endDate.setMonth(endDate.getMonth() + 6, 0);
				break;
			case ServiceFrequency.ANNUAL:
				// Para anual: 1 año después, último día del mes
				endDate.setFullYear(endDate.getFullYear() + 1);
				endDate.setMonth(endDate.getMonth(), 0); // Último día del mes
				break;
			default:
				return 30; // Fallback
		}

		// Calcular días entre startDate (día 1 del mes) y endDate (último día del período)
		// Para calcular el total de días del período completo
		const periodStartDate = new Date(startDate);
		periodStartDate.setDate(1); // Primer día del mes de inicio

		const diffTime = endDate.getTime() - periodStartDate.getTime();
		const totalDays = Math.ceil(diffTime / (1000 * 3600 * 24)) + 1; // +1 para incluir ambos días

		return totalDays;
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
		// El período proporcional termina un día antes del próximo pago
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

		return `${serviceName} - Período (${startStr} - ${endStr}) - ${daysUsed}/${totalDays} días`;
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
	 *
	 * CASOS MANEJADOS:
	 * 1. Suscripción futura (startDate > hoy): NO genera ticket, espera a Cloud Function
	 * 2. Suscripción actual/retroactiva (startDate <= hoy): Genera ticket AHORA con dueDate = hoy
	 *    - Si startDate = hoy: Genera ticket con período desde hoy
	 *    - Si startDate < hoy: Genera ticket retroactivo con período desde startDate
	 */
	async createProportionalTicket(config: ProportionalTicketConfig): Promise<void> {
		try {
			const { subscriptionId, startDate, nextPaymentDate, servicePrice, frequency } = config;

			// 1. ✅ Normalizar fechas
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const startDateOnly = new Date(startDate);
			startDateOnly.setHours(0, 0, 0, 0);

			const nextPaymentDateOnly = new Date(nextPaymentDate);
			nextPaymentDateOnly.setHours(0, 0, 0, 0);

			// 2. ✅ CASO 1: Suscripción futura (startDate > hoy)
			// No generar ticket ahora, la Cloud Function lo generará cuando llegue startDate
			if (startDateOnly > today) {
				console.log(
					`📅 Suscripción futura: startDate (${startDate.toDateString()}) > hoy (${today.toDateString()}). No se genera ticket ahora.`
				);
				return;
			}

			// 3. ✅ CASO 2: Suscripción actual o retroactiva (startDate <= hoy)
			// Generar ticket AHORA con dueDate = hoy

			console.log(
				`✅ Suscripción actual/retroactiva: startDate (${startDate.toDateString()}) <= hoy (${today.toDateString()}). Generando ticket...`
			);

			// 4. ✅ Validar coherencia de fechas
			// IMPORTANTE: Si startDate === paymentDate pero ambos son <= hoy,
			// SÍ debemos generar el ticket (es una suscripción retroactiva)
			if (startDate > nextPaymentDate) {
				console.log('⚠️ No se requiere ticket proporcional: startDate es posterior a paymentDate');
				return;
			}

			// ✅ CASO ESPECIAL: Si startDate === paymentDate (ambos iguales)
			// Y si paymentDate <= hoy, significa que debemos generar el ticket del mes completo
			if (this.isSameDay(startDate, nextPaymentDate)) {
				if (nextPaymentDateOnly <= today) {
					console.log(
						`✅ Suscripción retroactiva con startDate === paymentDate. Generando ticket completo del período.`
					);
					// Continuar para generar el ticket del mes completo
				} else {
					console.log(
						`📅 Suscripción con startDate === paymentDate en el futuro. La Cloud Function lo generará.`
					);
					return;
				}
			}

			// 5. Calcular el período proporcional
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

			// 4. ✅ Calcular precio proporcional usando días reales del mes
			// Usar la fecha de inicio como referencia para obtener los días reales del mes
			const totalDaysInPeriod = this.getTotalDaysForFrequency(frequency, startDate);

			// ✅ CASO ESPECIAL: Si startDate es día 1 del mes y paymentDate es último día del mismo mes,
			// significa que el ticket cubre TODO el mes → precio COMPLETO
			const isStartDayOne = startDate.getDate() === 1;
			const isFullMonthCoverage =
				startDate.getMonth() === nextPaymentDate.getMonth() &&
				startDate.getFullYear() === nextPaymentDate.getFullYear();

			const proportionalPrice =
				isStartDayOne && isFullMonthCoverage
					? servicePrice // Precio completo si cubre el mes entero
					: this.calculateProportionalPrice(servicePrice, daysUsed, totalDaysInPeriod);

			if (proportionalPrice <= 0) {
				console.log('No se crea ticket proporcional: precio calculado es 0');
				return;
			}

			console.log('📊 Cálculo de precio:', {
				startDate: startDate.toDateString(),
				nextPaymentDate: nextPaymentDate.toDateString(),
				daysUsed,
				totalDaysInPeriod,
				isStartDayOne,
				isFullMonthCoverage,
				servicePrice,
				proportionalPrice
			});

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

			// 6. ✅ Crear el ticket proporcional con dueDate = HOY
			await ticketsService.createTicket({
				subscriptionId,
				dueDate: today, // ✅ El ticket vence HOY (no en nextPaymentDate)
				amount: proportionalPrice,
				status: 'pending',
				generatedDate: today,
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
				period: `${startDate.toDateString()} - ${proportionalEndDate.toDateString()}`,
				nextPaymentDate: nextPaymentDate.toDateString()
			});

			// 7. ✅ ACTUALIZAR paymentDate de la suscripción a la PRÓXIMA fecha de cobro
			// El nextPaymentDate que recibimos YA es la próxima fecha de cobro calculada correctamente
			await subscriptionsService.updateSubscription(subscriptionId, {
				paymentDate: nextPaymentDate
			});
			console.log(`✅ PaymentDate actualizado a: ${nextPaymentDate.toDateString()}`);
		} catch (error) {
			console.error('Error creating proportional ticket:', error);
			throw error;
		}
	}

	/**
	 * Procesa todas las suscripciones nuevas para generar tickets proporcionales
	 * Debe ser llamado después de crear una nueva suscripción
	 *
	 * NOTA: Para pagos tipo 'anniversary', NO genera tickets proporcionales.
	 * En su lugar, genera el ticket del año completo inmediatamente.
	 */
	async processNewSubscriptionForProportionalTicket(subscriptionId: string): Promise<void> {
		try {
			console.log(`🎫 Procesando suscripción ${subscriptionId} para ticket`);

			// 1. Obtener la suscripción
			const subscription = await subscriptionsService.getSubscriptionById(subscriptionId);

			// 2. Obtener el servicio asociado
			const service = await servicesService.getServiceById(subscription.serviceId);

			// 3. Validar que tenga fecha de pago calculada
			if (!subscription.paymentDate) {
				console.log('Suscripción sin fecha de pago, no se puede crear ticket');
				return;
			}

			// ✅ CASO ESPECIAL: Para pagos tipo ANNIVERSARY, generar ticket del año completo
			if (subscription.paymentType === 'anniversary') {
				console.log('🎂 Pago tipo ANNIVERSARY detectado: generando ticket del año completo');
				await this.createAnniversaryTicket(subscription, service);
				return;
			}

			// 4. ✅ NO validar antigüedad - las suscripciones retroactivas también necesitan tickets
			// La validación de si generar o no el ticket se hace dentro de createProportionalTicket
			// basándose en si startDate <= hoy

			// 5. ✅ Calcular el VERDADERO nextPaymentDate (el SIGUIENTE pago después del actual)
			// Para pagos anticipados: subscription.paymentDate === startDate
			// Necesitamos calcular cuándo será el PRÓXIMO pago
			const { calculateNextPaymentDate } = await import('../utils/paymentDateCalculator');
			const realNextPaymentDate = calculateNextPaymentDate(
				subscription.paymentDate,
				service,
				subscription.paymentType || 'advance'
			);

			if (!realNextPaymentDate) {
				console.log('No se pudo calcular el próximo pago, abortando');
				return;
			}

			// 6. Crear configuración para el ticket proporcional
			const config: ProportionalTicketConfig = {
				subscriptionId: subscription.id!,
				startDate: subscription.startDate,
				nextPaymentDate: realNextPaymentDate, // ✅ Usamos el PRÓXIMO pago, no el actual
				servicePrice: service.finalPrice || service.basePrice, // Usar finalPrice (con IVA) o basePrice como fallback
				frequency: service.frequency as ServiceFrequency
			};

			// 7. Crear el ticket proporcional
			await this.createProportionalTicket(config);
		} catch (error) {
			console.error('Error processing new subscription for ticket:', error);
			throw error;
		}
	}

	/**
	 * Crea un ticket del año completo para suscripciones tipo ANNIVERSARY
	 * NO calcula proporcional, siempre cobra el año completo desde el inicio
	 *
	 * IMPORTANTE: Solo genera el ticket si startDate <= hoy
	 * Si la suscripción es futura, la Cloud Function lo generará cuando llegue la fecha
	 */
	private async createAnniversaryTicket(subscription: { id?: string; startDate: Date; clientId: string }, service: { name: string; finalPrice?: number; basePrice: number }): Promise<void> {
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const startDate = new Date(subscription.startDate);
			startDate.setHours(0, 0, 0, 0);

			// ✅ VALIDACIÓN: Solo generar ticket si la suscripción empieza hoy o antes
			if (startDate > today) {
				console.log(
					`📅 Suscripción aniversario futura: startDate (${startDate.toDateString()}) > hoy (${today.toDateString()}). La Cloud Function lo generará.`
				);
				return;
			}

			// Calcular el fin del período anual (1 año después, menos 1 día)
			const endDate = new Date(startDate);
			endDate.setFullYear(endDate.getFullYear() + 1);
			endDate.setDate(endDate.getDate() - 1);

			// Verificar si ya existe un ticket para este período
			const ticketExists = await this.checkIfProportionalTicketExists(
				subscription.id!,
				startDate,
				endDate
			);

			if (ticketExists) {
				console.log('Ya existe un ticket aniversario para este período, omitiendo creación');
				return;
			}

			// Obtener el método de pago del cliente
			const client = await clientsService.getClientById(subscription.clientId);
			const paymentMethod = client.paymentMethod?.type || undefined;

			// Descripción del ticket
			const description = `${service.name} - Anual aniversario (${startDate.toLocaleDateString('es-ES')} - ${endDate.toLocaleDateString('es-ES')})`;

			// Crear el ticket con precio completo
			await ticketsService.createTicket({
				subscriptionId: subscription.id!,
				dueDate: startDate, // El ticket vence el mismo día de inicio
				amount: service.finalPrice || service.basePrice,
				status: 'pending',
				generatedDate: today,
				isManual: false,
				description,
				serviceStart: startDate,
				serviceEnd: endDate,
				paymentMethod
			});

			console.log(`✅ Ticket aniversario creado:`, {
				subscriptionId: subscription.id,
				serviceName: service.name,
				amount: service.finalPrice || service.basePrice,
				period: `${startDate.toDateString()} - ${endDate.toDateString()}`,
				dueDate: startDate.toDateString()
			});

			// ✅ ACTUALIZAR paymentDate de la suscripción al próximo año
			const nextPaymentDate = new Date(startDate);
			nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);

			await subscriptionsService.updateSubscription(subscription.id!, {
				paymentDate: nextPaymentDate
			});
			console.log(`✅ PaymentDate actualizado a: ${nextPaymentDate.toDateString()}`);
		} catch (error) {
			console.error('Error creating anniversary ticket:', error);
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

						// ✅ Calcular el VERDADERO nextPaymentDate (el SIGUIENTE pago después del actual)
						const { calculateNextPaymentDate } = await import('../utils/paymentDateCalculator');
						const realNextPaymentDate = calculateNextPaymentDate(
							subscription.paymentDate,
							service,
							subscription.paymentType || 'advance'
						);

						if (!realNextPaymentDate) continue;

						const config: ProportionalTicketConfig = {
							subscriptionId: subscription.id,
							startDate: subscription.startDate,
							nextPaymentDate: realNextPaymentDate, // ✅ Usamos el PRÓXIMO pago, no el actual
							servicePrice: service.finalPrice || service.basePrice, // Usar finalPrice (con IVA)
							frequency: service.frequency as ServiceFrequency
						};

						// Verificar si ya existe el ticket
						const proportionalEndDate = this.calculateProportionalEndDate(
							subscription.startDate,
							realNextPaymentDate
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
