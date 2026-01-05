// src/utils/paymentDateCalculator.ts
import { Subscription, Service } from '../types/models';

/**
 * Calcula la fecha de cobro para una suscripción
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
	const frequency = service.frequency;
	const paymentType = subscription.paymentType || 'advance';
	const renovation = service.renovation || 'first_day';

	const nextPaymentDate = new Date(startDate);

	// ✅ CASO ESPECIAL: Para pagos anticipados que empiezan el día 1 del mes,
	// la primera fecha de cobro es el mismo día de inicio (no hay período proporcional)
	const isStartingOnFirstDay = startDate.getDate() === 1;
	const isAdvancePayment = paymentType === 'advance';
	const isFirstDayRenovation = renovation === 'first_day';

	if (isAdvancePayment && isFirstDayRenovation && isStartingOnFirstDay) {
		// No sumar período - la fecha de cobro es el día de inicio
		return nextPaymentDate;
	}

	// Calcular la próxima fecha basada en frecuencia
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

	// Ajustar según el día de renovación
	if (renovation === 'first_day') {
		nextPaymentDate.setDate(1);
	} else if (renovation === 'last_day') {
		// Último día del mes
		nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1, 0);
	}

	// Si es pago vencido, agregar un período más
	if (paymentType === 'arrears') {
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
		}
	}

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

		const newPaymentDate = calculatePaymentDate(subscription, service, currentDate);
		results.push({ subscription, newPaymentDate });
	});

	return results;
};
