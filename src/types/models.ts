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
	amount: number; // Monto calculado desde el servicio
	status: 'paid' | 'pending'; // Estado: pagado o pendiente
	generatedDate: Date; // Fecha en que se generó el ticket
	paidDate?: Date; // Fecha en que se marcó como pagado (opcional)
	isManual: boolean; // true si fue generado manualmente, false si fue automático
	description?: string; // Descripción opcional del ticket
	createdAt?: Date;
	updatedAt?: Date;
}

// Ticket con información extendida (para las vistas)
export interface TicketWithRelations extends Ticket {
	subscriptionInfo?: Subscription;
	clientInfo?: Client;
	serviceInfo?: Service;
}
