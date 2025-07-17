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
	vat: number;
	retention: number;
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
	paymentMethod: {
		type: string;
		details: Record<string, any>;
	};
	renewal: 'monthly' | 'quarterly' | 'biannual' | 'annual';
	paymentDate: Date;
	paymentType: 'advance' | 'arrears';
	paymentHistory: PaymentHistory[];
	status: 'active' | 'cancelled';
	createdAt?: Date;
	updatedAt?: Date;
}
