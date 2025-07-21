// src/utils/paymentDateCalculator.ts
import { Subscription, Service } from '../types/models';

export interface PaymentDateCalculation {
	nextPaymentDate: Date;
	shouldRecalculate: boolean;
	isOverdue: boolean;
	daysUntilPayment: number;
}

/**
 * Calcula la fecha de cobro para una suscripción
 * @param subscription - La suscripción
 * @param service - El servicio asociado
 * @param currentDate - Fecha actual (opcional, para testing)
 * @returns Información sobre la fecha de pago calculada
 */
export const calculatePaymentDate = (
	subscription: Subscription,
	service: Service,
	currentDate: Date = new Date()
): PaymentDateCalculation | null => {
	if (!subscription.startDate || !service.frequency) {
		console.warn('Missing required data for payment calculation:', {
			hasStartDate: !!subscription.startDate,
			hasFrequency: !!service.frequency
		});
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

	// Normalizar fecha actual para comparaciones
	const today = new Date(currentDate);
	today.setHours(0, 0, 0, 0);

	let nextPaymentDate: Date;

	// Si ya existe una fecha de pago y no ha pasado, verificar si necesita recálculo
	if (subscription.paymentDate) {
		const existingPaymentDate = new Date(subscription.paymentDate);
		existingPaymentDate.setHours(0, 0, 0, 0);

		// Si la fecha de pago ya pasó, recalcular la siguiente
		if (existingPaymentDate <= today) {
			nextPaymentDate = calculateNextPaymentFromExisting(existingPaymentDate, frequency, renovation);
		} else {
			// La fecha de pago aún es válida
			nextPaymentDate = existingPaymentDate;
		}
	} else {
		// Primera vez calculando la fecha de pago
		nextPaymentDate = calculateInitialPaymentDate(startDate, frequency, paymentType, renovation);
	}

	// Calcular información adicional
	const daysUntilPayment = Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	const isOverdue = daysUntilPayment < 0;
	const shouldRecalculate = subscription.paymentDate
		? new Date(subscription.paymentDate).getTime() <= today.getTime()
		: false;

	return {
		nextPaymentDate,
		shouldRecalculate,
		isOverdue,
		daysUntilPayment
	};
};

/**
 * Calcula la fecha inicial de pago para una nueva suscripción
 */
function calculateInitialPaymentDate(
	startDate: Date,
	frequency: Service['frequency'],
	paymentType: Subscription['paymentType'],
	renovation: Service['renovation']
): Date {
	const paymentDate = new Date(startDate);

	// Para pago anticipado, la primera fecha de pago es inmediata (en la fecha de inicio)
	if (paymentType === 'advance') {
		// Ajustar según el tipo de renovación
		if (renovation === 'first_day') {
			paymentDate.setDate(1);
		} else if (renovation === 'last_day') {
			// Último día del mes de inicio
			paymentDate.setMonth(paymentDate.getMonth() + 1, 0);
		}

		return paymentDate;
	}

	// Para pago vencido, agregar un período completo
	if (paymentType === 'arrears') {
		addPeriodToDate(paymentDate, frequency);

		// Ajustar según el tipo de renovación
		if (renovation === 'first_day') {
			paymentDate.setDate(1);
		} else if (renovation === 'last_day') {
			// Último día del mes después del período
			paymentDate.setMonth(paymentDate.getMonth() + 1, 0);
		}
	}

	return paymentDate;
}

/**
 * Calcula la siguiente fecha de pago basándose en una fecha existente
 */
function calculateNextPaymentFromExisting(
	existingDate: Date,
	frequency: Service['frequency'],
	renovation: Service['renovation']
): Date {
	const nextDate = new Date(existingDate);

	// Agregar el período correspondiente
	addPeriodToDate(nextDate, frequency);

	// Ajustar según el tipo de renovación
	if (renovation === 'first_day') {
		nextDate.setDate(1);
	} else if (renovation === 'last_day') {
		// Último día del mes siguiente
		nextDate.setMonth(nextDate.getMonth() + 1, 0);
	}

	return nextDate;
}

/**
 * Agrega un período de tiempo a una fecha basándose en la frecuencia
 */
function addPeriodToDate(date: Date, frequency: Service['frequency']): void {
	switch (frequency) {
		case 'monthly':
			date.setMonth(date.getMonth() + 1);
			break;
		case 'quarterly':
			date.setMonth(date.getMonth() + 3);
			break;
		case 'four_monthly':
			date.setMonth(date.getMonth() + 4);
			break;
		case 'biannual':
			date.setMonth(date.getMonth() + 6);
			break;
		case 'annual':
			date.setFullYear(date.getFullYear() + 1);
			break;
		default:
			throw new Error(`Frecuencia no soportada: ${frequency}`);
	}
}

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

		const calculation = calculatePaymentDate(subscription, service, currentDate);
		const newPaymentDate = calculation?.nextPaymentDate || null;

		results.push({ subscription, newPaymentDate });
	});

	return results;
};

/**
 * Formatea una fecha para mostrar en la UI
 */
export const formatPaymentDate = (date: Date | null): string => {
	if (!date) return 'Sin fecha';

	return new Intl.DateTimeFormat('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).format(date);
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
