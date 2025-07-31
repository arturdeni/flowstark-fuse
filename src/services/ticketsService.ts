// src/services/ticketsService.ts - Sin errores de lint

import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';
import { Ticket, PaymentType, ServiceFrequency } from '../types/models';

export const ticketsService = {
	// Obtener todos los tickets del usuario actual
	getAllTickets: async (): Promise<Ticket[]> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const querySnapshot = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('tickets')
				.orderBy('dueDate', 'desc')
				.get();

			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					dueDate: data.dueDate?.toDate(),
					generatedDate: data.generatedDate?.toDate(),
					paidDate: data.paidDate?.toDate(),
					// ✅ NUEVOS CAMPOS
					serviceStart: data.serviceStart?.toDate(),
					serviceEnd: data.serviceEnd?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Ticket;
			});
		} catch (error) {
			console.error('Error getting tickets: ', error);
			throw error;
		}
	},

	// Obtener tickets por suscripción
	getTicketsBySubscription: async (subscriptionId: string): Promise<Ticket[]> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const querySnapshot = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('tickets')
				.where('subscriptionId', '==', subscriptionId)
				.orderBy('dueDate', 'desc')
				.get();

			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					dueDate: data.dueDate?.toDate(),
					generatedDate: data.generatedDate?.toDate(),
					paidDate: data.paidDate?.toDate(),
					// ✅ NUEVOS CAMPOS
					serviceStart: data.serviceStart?.toDate(),
					serviceEnd: data.serviceEnd?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Ticket;
			});
		} catch (error) {
			console.error('Error getting tickets by subscription: ', error);
			throw error;
		}
	},

	// Obtener ticket por ID
	getTicketById: async (id: string): Promise<Ticket> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const docRef = db.collection('users').doc(currentUser.uid).collection('tickets').doc(id);
			const docSnap = await docRef.get();

			if (docSnap.exists) {
				const data = docSnap.data();
				return {
					id: docSnap.id,
					...data,
					dueDate: data?.dueDate?.toDate(),
					generatedDate: data?.generatedDate?.toDate(),
					paidDate: data?.paidDate?.toDate(),
					// ✅ NUEVOS CAMPOS
					serviceStart: data?.serviceStart?.toDate(),
					serviceEnd: data?.serviceEnd?.toDate(),
					createdAt: data?.createdAt?.toDate(),
					updatedAt: data?.updatedAt?.toDate()
				} as Ticket;
			} else {
				throw new Error('Ticket not found');
			}
		} catch (error) {
			console.error(`Error getting ticket with ID ${id}: `, error);
			throw error;
		}
	},

	// Crear nuevo ticket (con período de servicio)
	createTicket: async (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const timestamp = firebase.firestore.Timestamp.now();

			// Convertir fechas a Firestore Timestamps
			const processedData = {
				...ticketData,
				dueDate: firebase.firestore.Timestamp.fromDate(ticketData.dueDate),
				generatedDate: firebase.firestore.Timestamp.fromDate(ticketData.generatedDate),
				paidDate: ticketData.paidDate ? firebase.firestore.Timestamp.fromDate(ticketData.paidDate) : null,
				// ✅ NUEVOS CAMPOS
				serviceStart: firebase.firestore.Timestamp.fromDate(ticketData.serviceStart),
				serviceEnd: firebase.firestore.Timestamp.fromDate(ticketData.serviceEnd),
				createdAt: timestamp,
				updatedAt: timestamp
			};

			const docRef = await db.collection('users').doc(currentUser.uid).collection('tickets').add(processedData);

			const createdDoc = await docRef.get();
			const createdData = createdDoc.data();

			return {
				id: createdDoc.id,
				...createdData,
				dueDate: createdData?.dueDate?.toDate(),
				generatedDate: createdData?.generatedDate?.toDate(),
				paidDate: createdData?.paidDate?.toDate(),
				// ✅ NUEVOS CAMPOS
				serviceStart: createdData?.serviceStart?.toDate(),
				serviceEnd: createdData?.serviceEnd?.toDate(),
				createdAt: createdData?.createdAt?.toDate(),
				updatedAt: createdData?.updatedAt?.toDate()
			} as Ticket;
		} catch (error) {
			console.error('Error creating ticket: ', error);
			throw error;
		}
	},

	// Actualizar ticket
	updateTicket: async (
		id: string,
		ticketData: Partial<Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>>
	): Promise<Ticket> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const docRef = db.collection('users').doc(currentUser.uid).collection('tickets').doc(id);

			// Convertir fechas a Firestore Timestamps si están presentes
			const processedData: any = {
				...ticketData,
				updatedAt: firebase.firestore.Timestamp.now()
			};

			// Convertir fechas individuales si existen
			if (ticketData.dueDate instanceof Date) {
				processedData.dueDate = firebase.firestore.Timestamp.fromDate(ticketData.dueDate);
			}

			if (ticketData.generatedDate instanceof Date) {
				processedData.generatedDate = firebase.firestore.Timestamp.fromDate(ticketData.generatedDate);
			}

			if (ticketData.paidDate instanceof Date) {
				processedData.paidDate = firebase.firestore.Timestamp.fromDate(ticketData.paidDate);
			} else if (ticketData.paidDate === null) {
				processedData.paidDate = null;
			}

			// ✅ NUEVOS CAMPOS
			if (ticketData.serviceStart instanceof Date) {
				processedData.serviceStart = firebase.firestore.Timestamp.fromDate(ticketData.serviceStart);
			}

			if (ticketData.serviceEnd instanceof Date) {
				processedData.serviceEnd = firebase.firestore.Timestamp.fromDate(ticketData.serviceEnd);
			}

			await docRef.update(processedData);

			// Obtener el documento actualizado
			const updatedDoc = await docRef.get();
			const updatedData = updatedDoc.data();

			return {
				id: updatedDoc.id,
				...updatedData,
				dueDate: updatedData?.dueDate?.toDate(),
				generatedDate: updatedData?.generatedDate?.toDate(),
				paidDate: updatedData?.paidDate?.toDate(),
				// ✅ NUEVOS CAMPOS
				serviceStart: updatedData?.serviceStart?.toDate(),
				serviceEnd: updatedData?.serviceEnd?.toDate(),
				createdAt: updatedData?.createdAt?.toDate(),
				updatedAt: updatedData?.updatedAt?.toDate()
			} as Ticket;
		} catch (error) {
			console.error('Error updating ticket: ', error);
			throw error;
		}
	},

	// Eliminar ticket
	deleteTicket: async (id: string): Promise<void> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			await db.collection('users').doc(currentUser.uid).collection('tickets').doc(id).delete();
		} catch (error) {
			console.error('Error deleting ticket: ', error);
			throw error;
		}
	},

	// Marcar ticket como pagado con fecha personalizada
	markAsPaid: async (id: string, paidDate?: Date): Promise<Ticket> => {
		return ticketsService.updateTicket(id, {
			status: 'paid',
			paidDate: paidDate || new Date()
		});
	},

	// Marcar ticket como pendiente
	markAsPending: async (id: string): Promise<Ticket> => {
		return ticketsService.updateTicket(id, {
			status: 'pending',
			paidDate: null
		});
	},

	// ✅ NUEVA FUNCIÓN: Crear ticket manual con período de servicio calculado
	createManualTicketWithPeriod: async (
		subscriptionId: string,
		dueDate: Date,
		amount: number,
		description?: string
	): Promise<Ticket> => {
		try {
			// Usar imports dinámicos para evitar circular dependencies
			const { subscriptionsService } = await import('./subscriptionsService');
			const { servicesService } = await import('./servicesService');
			const { calculateServicePeriod } = await import('../utils/servicePeriodCalculator');

			// Obtener datos de la suscripción y servicio
			const subscription = await subscriptionsService.getSubscriptionById(subscriptionId);
			const service = await servicesService.getServiceById(subscription.serviceId);

			// Calcular período de servicio
			const servicePeriod = calculateServicePeriod(
				dueDate,
				subscription.paymentType as PaymentType,
				service.frequency as ServiceFrequency,
				service.name
			);

			// Crear ticket con período calculado
			return await ticketsService.createTicket({
				subscriptionId,
				dueDate,
				amount,
				status: 'pending',
				generatedDate: new Date(),
				isManual: true,
				description: description || servicePeriod.description,
				serviceStart: servicePeriod.start,
				serviceEnd: servicePeriod.end
			});
		} catch (error) {
			console.error('Error creating manual ticket with period:', error);
			throw error;
		}
	},

	// ✅ NUEVA FUNCIÓN: Obtener tickets por rango de fechas de servicio
	getTicketsByServicePeriod: async (startDate: Date, endDate: Date): Promise<Ticket[]> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const querySnapshot = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('tickets')
				.where('serviceStart', '>=', firebase.firestore.Timestamp.fromDate(startDate))
				.where('serviceStart', '<=', firebase.firestore.Timestamp.fromDate(endDate))
				.orderBy('serviceStart', 'asc')
				.get();

			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					dueDate: data.dueDate?.toDate(),
					generatedDate: data.generatedDate?.toDate(),
					paidDate: data.paidDate?.toDate(),
					serviceStart: data.serviceStart?.toDate(),
					serviceEnd: data.serviceEnd?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Ticket;
			});
		} catch (error) {
			console.error('Error getting tickets by service period: ', error);
			throw error;
		}
	},

	// ✅ NUEVA FUNCIÓN: Validar solapamiento de períodos de servicio
	validateServicePeriodOverlap: async (
		subscriptionId: string,
		serviceStart: Date,
		serviceEnd: Date,
		excludeTicketId?: string
	): Promise<{ hasOverlap: boolean; overlappingTickets: Ticket[] }> => {
		try {
			const tickets = await ticketsService.getTicketsBySubscription(subscriptionId);

			const overlappingTickets = tickets.filter((ticket) => {
				// Excluir el ticket actual si se está editando
				if (excludeTicketId && ticket.id === excludeTicketId) {
					return false;
				}

				// Verificar solapamiento de fechas
				const ticketStart = ticket.serviceStart;
				const ticketEnd = ticket.serviceEnd;

				if (!ticketStart || !ticketEnd) return false;

				// Lógica de solapamiento: dos períodos se solapan si uno empieza antes de que termine el otro
				return serviceStart <= ticketEnd && serviceEnd >= ticketStart;
			});

			return {
				hasOverlap: overlappingTickets.length > 0,
				overlappingTickets
			};
		} catch (error) {
			console.error('Error validating service period overlap:', error);
			throw error;
		}
	}
};
