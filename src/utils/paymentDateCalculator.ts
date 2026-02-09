// src/utils/paymentDateCalculator.ts
import { Subscription, Service } from '../types/models';

/**
 * Calcula la fecha de cobro para una suscripción
 *
 * IMPORTANTE: Esta función calcula la PRIMERA fecha de cobro cuando se crea la suscripción.
 * Para pagos anticipados, la primera fecha de cobro es SIEMPRE la fecha de inicio.
 *
 * Para recalcular la SIGUIENTE fecha de cobro (después de generar un ticket),
 * usar calculateNextPaymentDate() en su lugar.
 */
export const calculatePaymentDate = (
	subscription: Subscription,
	service: Service,
	currentDate: Date = new Date()
): Date | null => {
	if (!subscription.startDate || !service.frequency) {
		console.warn('Missing required data for payment calculation');
		return null;
	}

	// Si la suscripción está cancelada, no calcular fecha de pago
	if (subscription.status === 'cancelled' || subscription.status === 'expired') {
		return null;
	}

	const startDate = new Date(subscription.startDate);
	const paymentType = subscription.paymentType || 'advance';

	// ✅ PARA PAGOS ANTICIPADOS: La primera fecha de cobro es SIEMPRE la fecha de inicio
	// Esto es porque el cliente paga por adelantado desde el día que empieza el servicio
	if (paymentType === 'advance') {
		return new Date(startDate);
	}

	// ✅ PARA PAGOS ANIVERSARIO: La primera fecha de cobro es la fecha de inicio
	// Se cobra el mismo día cada año (solo para servicios anuales)
	if (paymentType === 'anniversary') {
		return new Date(startDate);
	}

	// ✅ PARA PAGOS VENCIDOS: último día del período natural actual
	const frequency = service.frequency;
	const month = startDate.getMonth();
	const year = startDate.getFullYear();

	switch (frequency) {
		case 'monthly':
			// Mensual: último día del mes en curso
			return new Date(year, month + 1, 0);
		case 'quarterly': {
			// Trimestral natural: fin de Ene-Mar, Abr-Jun, Jul-Sep, Oct-Dic
			const endMonth = (Math.floor(month / 3) + 1) * 3;
			return new Date(year, endMonth, 0);
		}
		case 'four_monthly': {
			// Cuatrimestral natural: fin de Ene-Abr, May-Ago, Sep-Dic
			const endMonth = (Math.floor(month / 4) + 1) * 4;
			return new Date(year, endMonth, 0);
		}
		case 'biannual': {
			// Semestral natural: fin de Ene-Jun, Jul-Dic
			const endMonth = (Math.floor(month / 6) + 1) * 6;
			return new Date(year, endMonth, 0);
		}
		case 'annual':
			// Anual: 31 de diciembre del año en curso
			return new Date(year, 12, 0);
		default:
			return null;
	}
};

/**
 * Calcula la SIGUIENTE fecha de cobro después de generar un ticket
 *
 * Esta función se usa para recalcular paymentDate después de que la Cloud Function
 * genera un ticket automático.
 *
 * Para pagos anticipados con renovación first_day:
 * - Si el ticket se generó el día 15 → próximo cobro: día 1 del mes siguiente
 * - Si el ticket se generó el día 1 → próximo cobro: día 1 del mes siguiente
 *
 * Para pagos vencidos (arrears):
 * - SIEMPRE se cobra el último día del período, independientemente de 'renovation'
 *
 * Para pagos aniversario (anniversary):
 * - SIEMPRE se cobra el mismo día del año siguiente (solo para servicios anuales)
 */
export const calculateNextPaymentDate = (
	currentPaymentDate: Date,
	service: Service,
	paymentType: 'advance' | 'arrears' | 'anniversary' = 'advance'
): Date | null => {
	if (!service.frequency) {
		console.warn('Missing frequency for next payment calculation');
		return null;
	}

	const frequency = service.frequency;
	const renovation = service.renovation || 'first_day';
	const nextPaymentDate = new Date(currentPaymentDate);

	// ✅ PARA PAGOS ANIVERSARIO: SIEMPRE el mismo día del año siguiente
	if (paymentType === 'anniversary') {
		nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
		return nextPaymentDate;
	}

	// ✅ PARA PAGOS VENCIDOS: último día del SIGUIENTE período natural
	if (paymentType === 'arrears') {
		const month = nextPaymentDate.getMonth();
		const year = nextPaymentDate.getFullYear();

		switch (frequency) {
			case 'monthly':
				// Mensual: último día del siguiente mes
				return new Date(year, month + 2, 0);
			case 'quarterly': {
				// Trimestral: fin del siguiente trimestre natural
				const endMonth = (Math.floor(month / 3) + 2) * 3;
				return new Date(year, endMonth, 0);
			}
			case 'four_monthly': {
				// Cuatrimestral: fin del siguiente cuatrimestre natural
				const endMonth = (Math.floor(month / 4) + 2) * 4;
				return new Date(year, endMonth, 0);
			}
			case 'biannual': {
				// Semestral: fin del siguiente semestre natural
				const endMonth = (Math.floor(month / 6) + 2) * 6;
				return new Date(year, endMonth, 0);
			}
			case 'annual':
				// Anual: 31 de diciembre del siguiente año
				return new Date(year + 1, 12, 0);
			default:
				return null;
		}
	}

	// ✅ PARA PAGOS ANTICIPADOS: Aplicar lógica de renovación

	// Para first_day: usar períodos naturales (Ene-Mar, Abr-Jun, Jul-Sep, Oct-Dic, etc.)
	if (renovation === 'first_day') {
		const month = nextPaymentDate.getMonth();
		const year = nextPaymentDate.getFullYear();

		switch (frequency) {
			case 'monthly':
				// Mensual: 1 del siguiente mes (ya es período natural)
				return new Date(year, month + 1, 1);
			case 'quarterly': {
				// Trimestral natural: Ene(0), Abr(3), Jul(6), Oct(9)
				const nextQuarterMonth = (Math.floor(month / 3) + 1) * 3;
				return nextQuarterMonth >= 12
					? new Date(year + 1, nextQuarterMonth - 12, 1)
					: new Date(year, nextQuarterMonth, 1);
			}
			case 'four_monthly': {
				// Cuatrimestral natural: Ene(0), May(4), Sep(8)
				const nextFourMonth = (Math.floor(month / 4) + 1) * 4;
				return nextFourMonth >= 12
					? new Date(year + 1, nextFourMonth - 12, 1)
					: new Date(year, nextFourMonth, 1);
			}
			case 'biannual': {
				// Semestral natural: Ene(0), Jul(6)
				const nextSemester = (Math.floor(month / 6) + 1) * 6;
				return nextSemester >= 12
					? new Date(year + 1, nextSemester - 12, 1)
					: new Date(year, nextSemester, 1);
			}
			case 'annual':
				// Anual: 1 de enero del siguiente año
				return new Date(year + 1, 0, 1);
			default:
				return null;
		}
	}

	// Para last_day y same_day: mantener lógica de período activo
	switch (frequency) {
		case 'monthly':
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
			break;
		case 'quarterly':
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
			break;
		case 'four_monthly':
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 4);
			break;
		case 'biannual':
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6);
			break;
		case 'annual':
			nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
			break;
		default:
			return null;
	}

	if (renovation === 'last_day') {
		// Último día del mes
		nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1, 0);
	}
	// Si renovation === 'same_day', mantener el mismo día del mes

	return nextPaymentDate;
};

/**
 * Formatea una fecha para mostrar en la UI
 */
export const formatPaymentDate = (date: Date | null): string => {
	if (!date) return 'Sin fecha';

	try {
		return new Intl.DateTimeFormat('es-ES', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		}).format(date);
	} catch (error) {
		console.error('Error formatting date:', error);
		return 'Fecha inválida';
	}
};

/**
 * Interfaz para información de cálculo de fecha de pago
 */
export interface PaymentDateCalculation {
	nextPaymentDate: Date;
	shouldRecalculate: boolean;
	isOverdue: boolean;
	daysUntilPayment: number;
}

/**
 * Calcula información adicional sobre el estado de pago
 */
export const calculatePaymentInfo = (
	subscription: Subscription,
	paymentDate: Date | null,
	currentDate: Date = new Date()
): PaymentDateCalculation | null => {
	if (!paymentDate) return null;

	const today = new Date(currentDate);
	today.setHours(0, 0, 0, 0);

	const payment = new Date(paymentDate);
	payment.setHours(0, 0, 0, 0);

	const daysUntilPayment = Math.ceil((payment.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	const isOverdue = daysUntilPayment < 0;
	const shouldRecalculate = payment.getTime() <= today.getTime();

	return {
		nextPaymentDate: payment,
		shouldRecalculate,
		isOverdue,
		daysUntilPayment
	};
};

/**
 * Obtiene el texto descriptivo del estado de pago
 */
export const getPaymentStatus = (
	subscription: Subscription,
	calculation: PaymentDateCalculation | null
): {
	status: 'upcoming' | 'due' | 'overdue' | 'unknown';
	text: string;
	color: 'success' | 'warning' | 'error' | 'default';
} => {
	if (!calculation) {
		return {
			status: 'unknown',
			text: 'Sin fecha de pago',
			color: 'default'
		};
	}

	const { daysUntilPayment, isOverdue } = calculation;

	if (isOverdue) {
		return {
			status: 'overdue',
			text: `Vencido (${Math.abs(daysUntilPayment)} días)`,
			color: 'error'
		};
	}

	if (daysUntilPayment <= 7) {
		return {
			status: 'due',
			text: `Próximo (${daysUntilPayment} días)`,
			color: 'warning'
		};
	}

	return {
		status: 'upcoming',
		text: `En ${daysUntilPayment} días`,
		color: 'success'
	};
};

/**
 * Obtiene todas las suscripciones que necesitan recálculo de fecha de pago
 */
export const getSubscriptionsNeedingRecalculation = (
	subscriptions: Subscription[],
	services: Service[],
	currentDate: Date = new Date()
): Subscription[] => {
	const today = new Date(currentDate);
	today.setHours(0, 0, 0, 0);

	return subscriptions.filter((subscription) => {
		// Solo procesar suscripciones activas
		if (subscription.status === 'cancelled' || subscription.status === 'expired') {
			return false;
		}

		// Si no tiene fecha de pago, necesita cálculo inicial
		if (!subscription.paymentDate) {
			return true;
		}

		// Si la fecha de pago ya pasó, necesita recálculo
		const paymentDate = new Date(subscription.paymentDate);
		paymentDate.setHours(0, 0, 0, 0);

		return paymentDate <= today;
	});
};

/**
 * Recalcula automáticamente las fechas de pago para múltiples suscripciones
 *
 * Esta función se usa para RECALCULAR la siguiente fecha de cobro después
 * de que se generó un ticket (cuando paymentDate <= hoy).
 */
export const recalculatePaymentDates = (
	subscriptions: Subscription[],
	services: Service[],
	currentDate: Date = new Date()
): { subscription: Subscription; newPaymentDate: Date | null }[] => {
	const results: { subscription: Subscription; newPaymentDate: Date | null }[] = [];

	subscriptions.forEach((subscription) => {
		const service = services.find((s) => s.id === subscription.serviceId);

		if (!service) {
			console.warn(`Servicio no encontrado para suscripción ${subscription.id}`);
			results.push({ subscription, newPaymentDate: null });
			return;
		}

		// ✅ Si la suscripción NO tiene paymentDate, calcular la primera fecha
		if (!subscription.paymentDate) {
			const newPaymentDate = calculatePaymentDate(subscription, service, currentDate);
			results.push({ subscription, newPaymentDate });
			return;
		}

		// ✅ Si la suscripción YA tiene paymentDate, calcular la SIGUIENTE fecha
		// (esto significa que ya se generó un ticket y necesitamos la próxima fecha)
		const newPaymentDate = calculateNextPaymentDate(
			subscription.paymentDate,
			service,
			subscription.paymentType || 'advance'
		);
		results.push({ subscription, newPaymentDate });
	});

	return results;
};
