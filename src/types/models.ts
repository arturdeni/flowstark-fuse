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
	paymentDate?: Date; // Nueva: Fecha de cobro calculada automáticamente
	paymentHistory: PaymentHistory[];
	status: 'active' | 'expired' | 'ending'; // Estados actualizados
	renewal?: 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual'; // Frecuencia de renovación
	createdAt?: Date;
	updatedAt?: Date;
}
