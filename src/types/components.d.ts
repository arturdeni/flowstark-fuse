// src/types/components.d.ts
// Declaraciones de tipos para componentes

import { ReactNode } from 'react';

// Propiedades base para componentes de diálogo
export interface BaseDialogProps {
	open: boolean;
	onClose: () => void;
	children?: ReactNode;
}

// Actualización del modelo Subscription para incluir 'cancelled'
declare module '../types/models' {
	interface Subscription {
		id?: string;
		clientId: string;
		serviceId: string;
		startDate: Date;
		endDate: Date | null;
		paymentType: 'advance' | 'arrears';
		paymentDate?: Date;
		paymentHistory: PaymentHistory[];
		status: 'active' | 'expired' | 'ending' | 'cancelled'; // Agregado 'cancelled'
		renewal?: 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual';
		createdAt?: Date;
		updatedAt?: Date;
	}
}

// Extensión para React Router si es necesario
declare module 'react-router-dom' {
	export interface RouteComponentProps<TParams = {}> {
		history: any;
		location: any;
		match: any;
		staticContext?: any;
	}
}

// src/types/models.ts actualizado
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

export interface Service {
	id?: string;
	name: string;
	description: string;
	basePrice: number;
	finalPrice?: number;
	vat: number;
	retention?: number;
	frequency: 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual';
	renovation: 'first_day' | 'last_day';
	createdAt?: Date;
	updatedAt?: Date;
}

export interface PaymentHistory {
	date: Date;
	amount: number;
	status: 'paid' | 'pending' | 'failed';
	receipt?: string;
}

export interface Subscription {
	id?: string;
	clientId: string;
	serviceId: string;
	startDate: Date;
	endDate: Date | null;
	paymentType: 'advance' | 'arrears';
	paymentDate?: Date;
	paymentHistory: PaymentHistory[];
	status: 'active' | 'expired' | 'ending' | 'cancelled';
	renewal?: 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual';
	createdAt?: Date;
	updatedAt?: Date;
}
