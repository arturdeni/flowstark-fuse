// src/services/ticketsService.ts
import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';
import { Ticket } from '../types/models';

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
					dueDate: data.dueDate?.toDate(),
					generatedDate: data.generatedDate?.toDate(),
					paidDate: data.paidDate?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Ticket;
			} else {
				throw new Error('Ticket not found');
			}
		} catch (error) {
			console.error(`Error getting ticket with ID ${id}: `, error);
			throw error;
		}
	},

	// Crear nuevo ticket
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
				createdAt: timestamp,
				updatedAt: timestamp
			};

			const docRef = await db.collection('users').doc(currentUser.uid).collection('tickets').add(processedData);

			const createdDoc = await docRef.get();
			const createdData = createdDoc.data();

			return {
				id: createdDoc.id,
				...createdData,
				dueDate: createdData.dueDate?.toDate(),
				generatedDate: createdData.generatedDate?.toDate(),
				paidDate: createdData.paidDate?.toDate(),
				createdAt: createdData.createdAt?.toDate(),
				updatedAt: createdData.updatedAt?.toDate()
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

			await docRef.update(processedData);

			// Obtener el documento actualizado
			const updatedDoc = await docRef.get();
			const updatedData = updatedDoc.data();

			return {
				id: updatedDoc.id,
				...updatedData,
				dueDate: updatedData.dueDate?.toDate(),
				generatedDate: updatedData.generatedDate?.toDate(),
				paidDate: updatedData.paidDate?.toDate(),
				createdAt: updatedData.createdAt?.toDate(),
				updatedAt: updatedData.updatedAt?.toDate()
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

	// Marcar ticket como pagado
	markAsPaid: async (id: string): Promise<Ticket> => {
		return ticketsService.updateTicket(id, {
			status: 'paid',
			paidDate: new Date()
		});
	},

	// Marcar ticket como pendiente
	markAsPending: async (id: string): Promise<Ticket> => {
		return ticketsService.updateTicket(id, {
			status: 'pending',
			paidDate: null
		});
	},

	// Generar tickets automáticamente para suscripciones con paymentDate
	generateAutomaticTickets: async (): Promise<{ created: number; errors: string[] }> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			// Importar servicios necesarios
			const { subscriptionsService } = await import('./subscriptionsService');
			const { servicesService } = await import('./servicesService');

			// Obtener todas las suscripciones activas
			const subscriptions = await subscriptionsService.getAllSubscriptions();
			const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active' && sub.paymentDate);

			// Obtener todos los tickets existentes
			const existingTickets = await ticketsService.getAllTickets();

			// Obtener todos los servicios para calcular precios
			const services = await servicesService.getAllServices();
			const servicesMap = new Map(services.map((service) => [service.id, service]));

			let created = 0;
			const errors: string[] = [];

			for (const subscription of activeSubscriptions) {
				try {
					const service = servicesMap.get(subscription.serviceId);

					if (!service) {
						errors.push(`Servicio no encontrado para suscripción ${subscription.id}`);
						continue;
					}

					// Verificar si ya existe un ticket para esta fecha de pago
					const existingTicket = existingTickets.find(
						(ticket) =>
							ticket.subscriptionId === subscription.id &&
							ticket.dueDate.getTime() === subscription.paymentDate.getTime() &&
							!ticket.isManual
					);

					if (!existingTicket) {
						// Crear nuevo ticket automático
						await ticketsService.createTicket({
							subscriptionId: subscription.id,
							dueDate: subscription.paymentDate,
							amount: service.finalPrice || service.basePrice,
							status: 'pending',
							generatedDate: new Date(),
							isManual: false,
							description: `Ticket automático para ${service.name}`
						});
						created++;
					}
				} catch (error) {
					errors.push(`Error procesando suscripción ${subscription.id}: ${error.message}`);
				}
			}

			return { created, errors };
		} catch (error) {
			console.error('Error generating automatic tickets: ', error);
			throw error;
		}
	}
};
