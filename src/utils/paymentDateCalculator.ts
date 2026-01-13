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

	// ✅ PARA PAGOS VENCIDOS: La fecha de cobro es SIEMPRE el último día del período
	// Los pagos vencidos SIEMPRE se cobran al final del período, no importa la configuración de 'renovation'
	const frequency = service.frequency;
	const nextPaymentDate = new Date(startDate);

	// Sumar el período correspondiente para llegar al final del período
	switch (frequency) {
		case 'monthly':
			// Para mensual: último día del mes en curso
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1, 0);
			break;
		case 'quarterly':
			// Para trimestral: último día del tercer mes
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3, 0);
			break;
		case 'four_monthly':
			// Para cuatrimestral: último día del cuarto mes
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 4, 0);
			break;
		case 'biannual':
			// Para semestral: último día del sexto mes
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6, 0);
			break;
		case 'annual':
			// Para anual: último día del año (mes + 12, día 0)
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 12, 0);
			break;
		default:
			return null;
	}

	return nextPaymentDate;
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

	// ✅ PARA PAGOS VENCIDOS: SIEMPRE último día del período
	if (paymentType === 'arrears') {
		switch (frequency) {
			case 'monthly':
				nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1, 0);
				break;
			case 'quarterly':
				nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3, 0);
				break;
			case 'four_monthly':
				nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 4, 0);
				break;
			case 'biannual':
				nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6, 0);
				break;
			case 'annual':
				nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 12, 0);
				break;
			default:
				return null;
		}
		return nextPaymentDate;
	}

	// ✅ PARA PAGOS ANTICIPADOS: Aplicar lógica de renovación
	// Sumar el período correspondiente
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

	// Ajustar según el día de renovación (solo para pagos anticipados)
	if (renovation === 'first_day') {
		nextPaymentDate.setDate(1);
	} else if (renovation === 'last_day') {
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
