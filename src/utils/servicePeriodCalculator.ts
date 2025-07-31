// src/utils/servicePeriodCalculator.ts

import { ServicePeriod, PaymentType, ServiceFrequency } from '../types/models';

/**
 * Calcula el período de servicio que cubre un ticket según el tipo de pago y frecuencia
 *
 * @param paymentDate - Fecha en la que se genera el ticket (paymentDate de la suscripción)
 * @param paymentType - Tipo de pago (anticipado o vencido)
 * @param frequency - Frecuencia del servicio
 * @param serviceName - Nombre del servicio para generar descripción
 * @returns ServicePeriod con las fechas de inicio y fin del período cubierto
 */
export function calculateServicePeriod(
	paymentDate: Date,
	paymentType: PaymentType,
	frequency: ServiceFrequency,
	serviceName: string
): ServicePeriod {
	const periodMonths = getMonthsForFrequency(frequency);
	const frequencyText = getFrequencyText(frequency);

	if (paymentType === PaymentType.ADVANCE) {
		// PAGO ANTICIPADO: El ticket cubre el período SIGUIENTE
		return calculateAdvancePeriod(paymentDate, periodMonths, frequencyText, serviceName);
	} else {
		// PAGO VENCIDO: El ticket cubre el período ANTERIOR
		return calculateArrearsPeriod(paymentDate, periodMonths, frequencyText, serviceName);
	}
}

/**
 * Calcula período para pago anticipado
 * El ticket generado el día X cubre desde X hasta X + período
 */
function calculateAdvancePeriod(
	paymentDate: Date,
	periodMonths: number,
	frequencyText: string,
	serviceName: string
): ServicePeriod {
	const start = new Date(paymentDate);
	const end = new Date(paymentDate);

	if (periodMonths === 1) {
		// Para mensual: del primer día del mes siguiente al último día de ese mes
		start.setDate(1); // Primer día del mes de pago
		end.setMonth(end.getMonth() + 1);
		end.setDate(0); // Último día del mes siguiente
	} else {
		// Para otros períodos: desde la fecha de pago + período completo
		end.setMonth(end.getMonth() + periodMonths);
		end.setDate(end.getDate() - 1); // Un día antes para no solapar
	}

	const description = `${serviceName} - ${frequencyText} anticipado (${formatDateRange(start, end)})`;

	return { start, end, description };
}

/**
 * Calcula período para pago vencido
 * El ticket generado el último día del mes cubre el período anterior
 */
function calculateArrearsPeriod(
	paymentDate: Date,
	periodMonths: number,
	frequencyText: string,
	serviceName: string
): ServicePeriod {
	const end = new Date(paymentDate);
	const start = new Date(paymentDate);

	if (periodMonths === 1) {
		// Para mensual vencido: del primer día del mes actual al último día
		start.setDate(1); // Primer día del mes de pago
		// end ya es el último día del mes (paymentDate)
	} else {
		// Para otros períodos: retroceder el período completo
		start.setMonth(start.getMonth() - periodMonths);
		start.setDate(start.getDate() + 1); // Un día después para no solapar
	}

	const description = `${serviceName} - ${frequencyText} vencido (${formatDateRange(start, end)})`;

	return { start, end, description };
}

/**
 * Convierte la frecuencia en número de meses
 */
function getMonthsForFrequency(frequency: ServiceFrequency): number {
	switch (frequency) {
		case ServiceFrequency.MONTHLY:
			return 1;
		case ServiceFrequency.QUARTERLY:
			return 3;
		case ServiceFrequency.FOUR_MONTHLY:
			return 4;
		case ServiceFrequency.BIANNUAL:
			return 6;
		case ServiceFrequency.ANNUAL:
			return 12;
		default:
			throw new Error(`Frecuencia no soportada: ${frequency}`);
	}
}

/**
 * Obtiene el texto legible de la frecuencia
 */
function getFrequencyText(frequency: ServiceFrequency): string {
	switch (frequency) {
		case ServiceFrequency.MONTHLY:
			return 'Mensual';
		case ServiceFrequency.QUARTERLY:
			return 'Trimestral';
		case ServiceFrequency.FOUR_MONTHLY:
			return 'Cuatrimestral';
		case ServiceFrequency.BIANNUAL:
			return 'Semestral';
		case ServiceFrequency.ANNUAL:
			return 'Anual';
		default:
			return frequency;
	}
}

/**
 * Formatea un rango de fechas para mostrar en la descripción
 */
function formatDateRange(start: Date, end: Date): string {
	const formatOptions: Intl.DateTimeFormatOptions = {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	};

	const startStr = start.toLocaleDateString('es-ES', formatOptions);
	const endStr = end.toLocaleDateString('es-ES', formatOptions);

	return `${startStr} - ${endStr}`;
}

/**
 * Valida si una fecha está dentro del período de servicio
 */
export function isDateInServicePeriod(date: Date, period: ServicePeriod): boolean {
	return date >= period.start && date <= period.end;
}

/**
 * Calcula el próximo período de servicio después del actual
 */
export function getNextServicePeriod(
	currentPeriod: ServicePeriod,
	frequency: ServiceFrequency,
	paymentType: PaymentType,
	serviceName: string
): ServicePeriod {
	const periodMonths = getMonthsForFrequency(frequency);
	const nextPaymentDate = new Date(currentPeriod.end);
	nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);

	return calculateServicePeriod(nextPaymentDate, paymentType, frequency, serviceName);
}

/**
 * Ejemplo de uso y casos de prueba
 */
export function getServicePeriodExamples() {
	const examples = [
		{
			case: 'Mensual anticipado - 1 de mes',
			paymentDate: new Date(2025, 0, 1), // 1 enero 2025
			paymentType: PaymentType.ADVANCE,
			frequency: ServiceFrequency.MONTHLY,
			expected: 'Enero 2025 (01/01/2025 - 31/01/2025)'
		},
		{
			case: 'Mensual vencido - último día de mes',
			paymentDate: new Date(2025, 0, 31), // 31 enero 2025
			paymentType: PaymentType.ARREARS,
			frequency: ServiceFrequency.MONTHLY,
			expected: 'Enero 2025 (01/01/2025 - 31/01/2025)'
		},
		{
			case: 'Trimestral anticipado',
			paymentDate: new Date(2025, 0, 1), // 1 enero 2025
			paymentType: PaymentType.ADVANCE,
			frequency: ServiceFrequency.QUARTERLY,
			expected: 'Trimestre siguiente (01/01/2025 - 31/03/2025)'
		},
		{
			case: 'Anual vencido',
			paymentDate: new Date(2025, 11, 31), // 31 diciembre 2025
			paymentType: PaymentType.ARREARS,
			frequency: ServiceFrequency.ANNUAL,
			expected: 'Año 2025 (01/01/2025 - 31/12/2025)'
		}
	];

	return examples;
}
