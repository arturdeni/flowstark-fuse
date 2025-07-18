// utils/paymentDateCalculator.ts

import { Subscription, Service } from '../types/models';

export const calculatePaymentDate = (subscription: Subscription, service: Service): Date | null => {
	if (!subscription.startDate || !service.frequency) return null;

	const startDate = new Date(subscription.startDate);
	const frequency = service.frequency;
	const paymentType = subscription.paymentType || 'advance';
	const renovation = service.renovation || 'first_day';

	const nextPaymentDate = new Date(startDate);

	// Calcular la próxima fecha de renovación basada en frecuencia
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

	// Ajustar según el día de renovación configurado
	if (renovation === 'first_day') {
		nextPaymentDate.setDate(1);
	} else if (renovation === 'last_day') {
		// Último día del mes
		nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1, 0);
	}

	// Ajustar según el tipo de pago
	if (paymentType === 'advance') {
		// Pago anticipado: cobrar antes del período de servicio
		// La fecha calculada es correcta
	} else if (paymentType === 'arrears') {
		// Pago vencido: cobrar después del período de servicio
		// Agregar un período más
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

// Función para actualizar automáticamente el estado de las suscripciones
export const updateSubscriptionStatus = (subscription: Subscription): Subscription['status'] => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (subscription.endDate) {
		const endDate = new Date(subscription.endDate);
		endDate.setHours(0, 0, 0, 0);

		if (endDate < today) {
			return 'expired'; // Fecha de fin ya pasó
		} else if (endDate >= today) {
			return 'ending'; // Fecha de fin es futura
		}
	}

	// Si no tiene endDate, mantener como activa (a menos que haya sido cancelada manualmente)
	return subscription.status === 'cancelled' ? 'expired' : 'active';
};

// Función para obtener todas las suscripciones con estados actualizados
export const getSubscriptionsWithUpdatedStatus = (subscriptions: Subscription[]): Subscription[] => {
	return subscriptions.map((subscription) => ({
		...subscription,
		status: updateSubscriptionStatus(subscription)
	}));
};
