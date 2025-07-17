// src/services/subscriptionsService.ts
import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';
import { Subscription } from '../types/models';
import { clientsService } from './clientsService';
import { servicesService } from './servicesService';

export const subscriptionsService = {
	// Obtener todas las suscripciones del usuario actual
	getAllSubscriptions: async (): Promise<any[]> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const querySnapshot = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('subscriptions')
				.orderBy('startDate', 'desc')
				.get();

			const subscriptionsWithRelations = await Promise.all(
				querySnapshot.docs.map(async (doc) => {
					const data = doc.data();

					// Obtener información del cliente
					let clientData = null;
					try {
						clientData = await clientsService.getClientById(data.clientId);
					} catch (error) {
						console.warn(`Client not found for subscription ${doc.id}:`, error);
					}

					// Obtener información del servicio
					let serviceData = null;
					try {
						serviceData = await servicesService.getServiceById(data.serviceId);
					} catch (error) {
						console.warn(`Service not found for subscription ${doc.id}:`, error);
					}

					return {
						id: doc.id,
						...data,
						startDate: data.startDate?.toDate(),
						endDate: data.endDate?.toDate(),
						createdAt: data.createdAt?.toDate(),
						updatedAt: data.updatedAt?.toDate(),
						// Agregar información del cliente y servicio
						clientInfo: clientData,
						serviceInfo: serviceData
					} as Subscription & { clientInfo: any; serviceInfo: any };
				})
			);

			return subscriptionsWithRelations;
		} catch (error) {
			console.error('Error getting subscriptions: ', error);
			throw error;
		}
	},

	// Obtener suscripción por ID
	getSubscriptionById: async (id: string): Promise<Subscription & { clientInfo: any; serviceInfo: any }> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const docRef = db.collection('users').doc(currentUser.uid).collection('subscriptions').doc(id);
			const docSnap = await docRef.get();

			if (docSnap.exists) {
				const data = docSnap.data();

				// Obtener información del cliente
				const clientData = await clientsService.getClientById(data.clientId);

				// Obtener información del servicio
				const serviceData = await servicesService.getServiceById(data.serviceId);

				return {
					id: docSnap.id,
					...data,
					startDate: data.startDate?.toDate(),
					endDate: data.endDate?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate(),
					// Agregar información del cliente y servicio
					clientInfo: clientData,
					serviceInfo: serviceData
				} as Subscription & { clientInfo: any; serviceInfo: any };
			} else {
				throw new Error('Subscription not found');
			}
		} catch (error) {
			console.error(`Error getting subscription with ID ${id}: `, error);
			throw error;
		}
	},

	// Crear nueva subscripción
	createSubscription: async (
		subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<Subscription> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const timestamp = firebase.firestore.Timestamp.now();

			// Verificar que exista el cliente
			const clientRef = db
				.collection('users')
				.doc(currentUser.uid)
				.collection('clients')
				.doc(subscriptionData.clientId);
			const clientDoc = await clientRef.get();

			if (!clientDoc.exists) {
				throw new Error('Client not found');
			}

			// Verificar que exista el servicio
			const serviceRef = db
				.collection('users')
				.doc(currentUser.uid)
				.collection('services')
				.doc(subscriptionData.serviceId);
			const serviceDoc = await serviceRef.get();

			if (!serviceDoc.exists) {
				throw new Error('Service not found');
			}

			// Convertir fechas a timestamps de Firestore
			const subscriptionWithDates = {
				...subscriptionData,
				startDate:
					subscriptionData.startDate instanceof Date
						? firebase.firestore.Timestamp.fromDate(subscriptionData.startDate)
						: subscriptionData.startDate,
				endDate:
					subscriptionData.endDate instanceof Date
						? firebase.firestore.Timestamp.fromDate(subscriptionData.endDate)
						: subscriptionData.endDate,
				createdAt: timestamp,
				updatedAt: timestamp
			};

			const docRef = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('subscriptions')
				.add(subscriptionWithDates);

			return {
				id: docRef.id,
				...subscriptionData,
				createdAt: timestamp.toDate(),
				updatedAt: timestamp.toDate()
			} as Subscription;
		} catch (error) {
			console.error('Error creating subscription: ', error);
			throw error;
		}
	},

	// Actualizar subscripción existente
	updateSubscription: async (id: string, subscriptionData: Partial<Subscription>): Promise<Subscription> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const timestamp = firebase.firestore.Timestamp.now();

			// Convertir fechas a timestamps de Firestore si existen
			const updateData: any = {
				...subscriptionData,
				updatedAt: timestamp
			};

			if (subscriptionData.startDate) {
				updateData.startDate =
					subscriptionData.startDate instanceof Date
						? firebase.firestore.Timestamp.fromDate(subscriptionData.startDate)
						: subscriptionData.startDate;
			}

			if (subscriptionData.endDate) {
				updateData.endDate =
					subscriptionData.endDate instanceof Date
						? firebase.firestore.Timestamp.fromDate(subscriptionData.endDate)
						: subscriptionData.endDate;
			}

			// Eliminar campos undefined
			Object.keys(updateData).forEach((key) => {
				if (updateData[key] === undefined) {
					delete updateData[key];
				}
			});

			const docRef = db.collection('users').doc(currentUser.uid).collection('subscriptions').doc(id);

			await docRef.update(updateData);

			// Obtener los datos actualizados
			return await subscriptionsService.getSubscriptionById(id);
		} catch (error) {
			console.error(`Error updating subscription with ID ${id}: `, error);
			throw error;
		}
	},

	// Cambiar estado de la subscripción
	changeSubscriptionStatus: async (
		id: string,
		status: 'active' | 'cancelled',
		endDate?: Date
	): Promise<Subscription> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const timestamp = firebase.firestore.Timestamp.now();
			const updateData: any = {
				status,
				updatedAt: timestamp
			};

			// Si se proporciona una fecha de fin, agregarla
			if (endDate) {
				updateData.endDate = firebase.firestore.Timestamp.fromDate(endDate);
			}

			const docRef = db.collection('users').doc(currentUser.uid).collection('subscriptions').doc(id);

			await docRef.update(updateData);

			// Obtener los datos actualizados
			return await subscriptionsService.getSubscriptionById(id);
		} catch (error) {
			console.error(`Error updating subscription status with ID ${id}: `, error);
			throw error;
		}
	},

	// Eliminar subscripción
	deleteSubscription: async (id: string): Promise<void> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const docRef = db.collection('users').doc(currentUser.uid).collection('subscriptions').doc(id);

			await docRef.delete();
		} catch (error) {
			console.error(`Error deleting subscription with ID ${id}: `, error);
			throw error;
		}
	}
};
