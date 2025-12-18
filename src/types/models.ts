// Cliente
export interface Client {
	id?: string;
	firstName: string;
	lastName: string;
	fiscalName: string;
	email: string;
	phone: string;
	idNumber: string;
	taxId: string;
	registeredDate: Date;
	paymentMethod: {
		type: string;
		details: Record<string, any>;
	};
	address: string;
	city: string;
	postalCode: string;
	country: string;
	notes: string;
	active: boolean;
	iban: string;
	bank: string;
	createdAt?: Date;
	updatedAt?: Date;
}

// Servicio
export interface Service {
	id?: string;
	name: string;
	description: string;
	basePrice: number;
	finalPrice?: number; // Campo opcional para compatibilidad
	vat: number;
	retention?: number; // Campo opcional para compatibilidad
	frequency: 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual';
	renovation: 'first_day' | 'last_day';
	createdAt?: Date;
	updatedAt?: Date;
}

// Historial de pago
export interface PaymentHistory {
	date: Date;
	amount: number;
	status: 'paid' | 'pending' | 'failed';
	receipt?: string;
}

// Suscripción
export interface Subscription {
	id?: string;
	clientId: string;
	serviceId: string;
	startDate: Date;
	endDate: Date | null;
	paymentType: 'advance' | 'arrears'; // Pago anticipado o vencido
	paymentDate?: Date; // Fecha de cobro calculada automáticamente
	paymentHistory: PaymentHistory[];
	status: 'active' | 'expired' | 'ending'; // Estados: activa, caducada, finalizando
	renewal?: 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual'; // Frecuencia de renovación
	createdAt?: Date;
	updatedAt?: Date;
}

// Ticket/Recibo
export interface Ticket {
	id?: string;
	subscriptionId: string;
	dueDate: Date; // Fecha de vencimiento (basada en paymentDate de la suscripción)
	amount: number; // Precio calculado desde el servicio
	status: 'paid' | 'pending'; // Estado: pagado o pendiente
	generatedDate: Date; // Fecha en que se generó el ticket
	paidDate?: Date; // Fecha en que se marcó como pagado (opcional)
	isManual: boolean; // true si fue generado manualmente, false si fue automático
	description?: string; // Descripción opcional del ticket
	serviceStart: Date; // Fecha de inicio del período de servicio
	serviceEnd: Date; // Fecha de fin del período de servicio
	paymentMethod?: string; // Método de pago del cliente (card, transfer, cash, direct_debit)
	createdAt?: Date;
	updatedAt?: Date;
}

// Interfaz para la lógica de cálculo de períodos de servicio
export interface ServicePeriod {
	start: Date;
	end: Date;
	description: string;
}

// Enum para tipos de pago para mayor claridad
export enum PaymentType {
	ADVANCE = 'advance', // Pago anticipado
	ARREARS = 'arrears' // Pago vencido
}

// Enum para frecuencias de servicio
export enum ServiceFrequency {
	MONTHLY = 'monthly',
	QUARTERLY = 'quarterly',
	FOUR_MONTHLY = 'four_monthly',
	BIANNUAL = 'biannual',
	ANNUAL = 'annual'
}

// Ticket con información extendida (para las vistas)
export interface TicketWithRelations extends Ticket {
	subscriptionInfo?: Subscription;
	clientInfo?: Client;
	serviceInfo?: Service;
}
