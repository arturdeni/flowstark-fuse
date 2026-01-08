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
	 * Calcula los días reales de un mes específico
	 */
	private getActualDaysInMonth(date: Date): number {
		const year = date.getFullYear();
		const month = date.getMonth();
		// Crear fecha del primer día del mes siguiente y restar 1 día para obtener el último día del mes actual
		const lastDay = new Date(year, month + 1, 0);
		return lastDay.getDate();
	}

	/**
	 * Obtiene el número total de días según la frecuencia
	 * Para frecuencia mensual, usa los días reales del mes en cuestión
	 * Para otras frecuencias, usa valores aproximados
	 */
	private getTotalDaysForFrequency(frequency: ServiceFrequency, referenceDate?: Date): number {
		// Si es mensual y tenemos una fecha de referencia, usar días reales del mes
		if (frequency === ServiceFrequency.MONTHLY && referenceDate) {
			return this.getActualDaysInMonth(referenceDate);
		}

		// Para otras frecuencias, usar valores aproximados
		const dayMappings: Record<ServiceFrequency, number> = {
			[ServiceFrequency.MONTHLY]: 30, // Fallback si no hay fecha de referencia
			[ServiceFrequency.QUARTERLY]: 90,
			[ServiceFrequency.FOUR_MONTHLY]: 120,
			[ServiceFrequency.BIANNUAL]: 180,
			[ServiceFrequency.ANNUAL]: 365
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
	 *
	 * IMPORTANTE:
	 * - Si startDate === paymentDate (suscripción retroactiva del día 1), el período es el mes completo
	 * - Si startDate < paymentDate (período proporcional normal), el período termina un día antes de paymentDate
	 */
	private calculateProportionalEndDate(startDate: Date, nextPaymentDate: Date): Date {
		// ✅ CASO ESPECIAL: Si ambas fechas son iguales, significa que queremos el período completo del mes
		// Por ejemplo: startDate = 1 enero, paymentDate = 1 enero → período = 1-31 enero
		if (this.isSameDay(startDate, nextPaymentDate)) {
			const endDate = new Date(nextPaymentDate);
			// Ir al último día del mes
			endDate.setMonth(endDate.getMonth() + 1, 0);
			return endDate;
		}

		// ✅ CASO NORMAL: Período proporcional termina un día antes del próximo pago
		// Por ejemplo: startDate = 8 enero, paymentDate = 1 febrero → período = 8-31 enero
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
				console.log(
					'⚠️ No se requiere ticket proporcional: startDate es posterior a paymentDate'
				);
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
			// Importar calculateNextPaymentDate desde paymentDateCalculator
			const { calculateNextPaymentDate } = await import('../utils/paymentDateCalculator');
			const newPaymentDate = calculateNextPaymentDate(
				nextPaymentDate,
				service,
				subscription.paymentType || 'advance'
			);

			if (newPaymentDate) {
				await subscriptionsService.updateSubscription(subscriptionId, {
					paymentDate: newPaymentDate
				});
				console.log(`✅ PaymentDate actualizado a: ${newPaymentDate.toDateString()}`);
			}
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

			// 4. ✅ NO validar antigüedad - las suscripciones retroactivas también necesitan tickets
			// La validación de si generar o no el ticket se hace dentro de createProportionalTicket
			// basándose en si startDate <= hoy

			// 5. Crear configuración para el ticket proporcional
			const config: ProportionalTicketConfig = {
				subscriptionId: subscription.id!,
				startDate: subscription.startDate,
				nextPaymentDate: subscription.paymentDate,
				servicePrice: service.finalPrice || service.basePrice, // Usar finalPrice (con IVA) o basePrice como fallback
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
							servicePrice: service.finalPrice || service.basePrice, // Usar finalPrice (con IVA)
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
