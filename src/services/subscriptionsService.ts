// src/services/subscriptionsService.ts
import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';
import { Subscription } from '../types/models';
import { subscriptionCounterService } from './subscriptionCounterService';

export const subscriptionsService = {
	// Obtener todas las suscripciones del usuario actual
	getAllSubscriptions: async (): Promise<Subscription[]> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const querySnapshot = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('subscriptions')
				.orderBy('createdAt', 'desc')
				.get();

			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					startDate: data.startDate?.toDate(),
					endDate: data.endDate?.toDate(),
					paymentDate: data.paymentDate?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Subscription;
			});
		} catch (error) {
			console.error('Error getting subscriptions: ', error);
			throw error;
		}
	},

	// Obtener suscripción por ID
	getSubscriptionById: async (id: string): Promise<Subscription> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const docRef = db.collection('users').doc(currentUser.uid).collection('subscriptions').doc(id);
			const docSnap = await docRef.get();

			if (docSnap.exists) {
				const data = docSnap.data();
				return {
					id: docSnap.id,
					...data,
					startDate: data.startDate?.toDate(),
					endDate: data.endDate?.toDate(),
					paymentDate: data.paymentDate?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Subscription;
			} else {
				throw new Error('Subscription not found');
			}
		} catch (error) {
			console.error(`Error getting subscription with ID ${id}: `, error);
			throw error;
		}
	},

	// Crear nueva suscripción
	createSubscription: async (
		subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
	): Promise<Subscription> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const timestamp = firebase.firestore.Timestamp.now();

			// Convertir fechas a Firestore Timestamps
			const processedData = {
				...subscriptionData,
				startDate:
					subscriptionData.startDate instanceof Date
						? firebase.firestore.Timestamp.fromDate(subscriptionData.startDate)
						: subscriptionData.startDate,
				endDate:
					subscriptionData.endDate instanceof Date
						? firebase.firestore.Timestamp.fromDate(subscriptionData.endDate)
						: subscriptionData.endDate,
				paymentDate:
					subscriptionData.paymentDate instanceof Date
						? firebase.firestore.Timestamp.fromDate(subscriptionData.paymentDate)
						: subscriptionData.paymentDate,
				createdAt: timestamp,
				updatedAt: timestamp
			};

			const docRef = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('subscriptions')
				.add(processedData);

			// 🔥 ACTUALIZAR CONTADOR SI LA SUSCRIPCIÓN ES ACTIVA
			if (subscriptionData.status === 'active') {
				await subscriptionCounterService.updateServiceSubscriptionCount(subscriptionData.serviceId);
			}

			// Obtener los datos creados
			const createdDoc = await docRef.get();
			const createdData = createdDoc.data();

			return {
				id: createdDoc.id,
				...createdData,
				startDate: createdData.startDate?.toDate(),
				endDate: createdData.endDate?.toDate(),
				paymentDate: createdData.paymentDate?.toDate(),
				createdAt: createdData.createdAt?.toDate(),
				updatedAt: createdData.updatedAt?.toDate()
			} as Subscription;
		} catch (error) {
			console.error('Error creating subscription: ', error);
			throw error;
		}
	},

	// Actualizar suscripción existente
	updateSubscription: async (id: string, subscriptionData: Partial<Subscription>): Promise<Subscription> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			// Obtener la suscripción actual para conocer el estado previo
			const currentSubscription = await subscriptionsService.getSubscriptionById(id);
			const previousStatus = currentSubscription.status;

			const timestamp = firebase.firestore.Timestamp.now();

			// Crear una copia de los datos para procesar
			const updateData: any = {
				...subscriptionData,
				updatedAt: timestamp
			};

			// Convertir fechas a Firestore Timestamps si es necesario
			if (subscriptionData.paymentDate) {
				updateData.paymentDate =
					subscriptionData.paymentDate instanceof Date
						? firebase.firestore.Timestamp.fromDate(subscriptionData.paymentDate)
						: subscriptionData.paymentDate;
			}

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

			// 🔥 ACTUALIZAR CONTADOR SOLO SI CAMBIÓ EL ESTADO
			if (subscriptionData.status && previousStatus !== subscriptionData.status) {
				await subscriptionCounterService.updateServiceSubscriptionCount(currentSubscription.serviceId);
			}

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

			// Obtener la suscripción actual para conocer el estado previo
			const currentSubscription = await subscriptionsService.getSubscriptionById(id);
			const previousStatus = currentSubscription.status;

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

			// 🔥 ACTUALIZAR CONTADOR SOLO SI CAMBIÓ EL ESTADO
			if (previousStatus !== status) {
				await subscriptionCounterService.updateServiceSubscriptionCount(currentSubscription.serviceId);
			}

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

			// Obtener la suscripción antes de eliminarla para actualizar el contador
			const subscription = await subscriptionsService.getSubscriptionById(id);
			const wasActive = subscription.status === 'active';

			const docRef = db.collection('users').doc(currentUser.uid).collection('subscriptions').doc(id);

			await docRef.delete();

			// 🔥 ACTUALIZAR CONTADOR SI LA SUSCRIPCIÓN ELIMINADA ESTABA ACTIVA
			if (wasActive) {
				await subscriptionCounterService.updateServiceSubscriptionCount(subscription.serviceId);
			}
		} catch (error) {
			console.error(`Error deleting subscription with ID ${id}: `, error);
			throw error;
		}
	},

	// Nueva función para recalcular todos los contadores (útil para arreglar inconsistencias)
	recalculateAllSubscriptionCounts: async (): Promise<void> => {
		try {
			await subscriptionCounterService.updateAllServiceSubscriptionCounts();
		} catch (error) {
			console.error('Error recalculando contadores de suscripciones:', error);
			throw error;
		}
	}
};
