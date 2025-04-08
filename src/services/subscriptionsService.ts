import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';
import { Subscription } from '../types/models';

// Colección de subscripciones
const subscriptionsCollection = db.collection('subscriptions');

export const subscriptionsService = {
	// Obtener todas las subscripciones con datos de cliente y servicio
	getAllSubscriptions: async (): Promise<Subscription[]> => {
		try {
			const querySnapshot = await subscriptionsCollection.orderBy('startDate', 'desc').get();

			const subscriptions = await Promise.all(
				querySnapshot.docs.map(async (doc) => {
					const data = doc.data();

					// Obtener datos del cliente
					let clientData = null;

					if (data.clientId) {
						const clientDoc = await db.collection('clients').doc(data.clientId).get();

						if (clientDoc.exists) {
							clientData = clientDoc.data();
						}
					}

					// Obtener datos del servicio
					let serviceData = null;

					if (data.serviceId) {
						const serviceDoc = await db.collection('services').doc(data.serviceId).get();

						if (serviceDoc.exists) {
							serviceData = serviceDoc.data();
						}
					}

					return {
						id: doc.id,
						...data,
						startDate: data.startDate?.toDate(),
						endDate: data.endDate?.toDate(),
						paymentDate: data.paymentDate?.toDate(),
						createdAt: data.createdAt?.toDate(),
						updatedAt: data.updatedAt?.toDate(),
						// Agregar información del cliente y servicio para mostrar en la UI
						clientInfo: clientData,
						serviceInfo: serviceData
					} as Subscription & { clientInfo: any; serviceInfo: any };
				})
			);

			return subscriptions;
		} catch (error) {
			console.error('Error getting subscriptions: ', error);
			throw error;
		}
	},

	// Obtener subscripción por ID
	getSubscriptionById: async (id: string): Promise<Subscription> => {
		try {
			const docRef = subscriptionsCollection.doc(id);
			const docSnap = await docRef.get();

			if (docSnap.exists) {
				const data = docSnap.data();

				// Obtener datos del cliente
				let clientData = null;

				if (data.clientId) {
					const clientDoc = await db.collection('clients').doc(data.clientId).get();

					if (clientDoc.exists) {
						clientData = clientDoc.data();
					}
				}

				// Obtener datos del servicio
				let serviceData = null;

				if (data.serviceId) {
					const serviceDoc = await db.collection('services').doc(data.serviceId).get();

					if (serviceDoc.exists) {
						serviceData = serviceDoc.data();
					}
				}

				return {
					id: docSnap.id,
					...data,
					startDate: data.startDate?.toDate(),
					endDate: data.endDate?.toDate(),
					paymentDate: data.paymentDate?.toDate(),
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
			const timestamp = firebase.firestore.Timestamp.now();

			// Verificar que exista el cliente
			const clientRef = db.collection('clients').doc(subscriptionData.clientId);
			const clientDoc = await clientRef.get();

			if (!clientDoc.exists) {
				throw new Error('Client not found');
			}

			// Verificar que exista el servicio
			const serviceRef = db.collection('services').doc(subscriptionData.serviceId);
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
				paymentDate:
					subscriptionData.paymentDate instanceof Date
						? firebase.firestore.Timestamp.fromDate(subscriptionData.paymentDate)
						: subscriptionData.paymentDate,
				createdAt: timestamp,
				updatedAt: timestamp
			};

			const docRef = await subscriptionsCollection.add(subscriptionWithDates);

			// Actualizar contador de suscripciones activas en el servicio
			if (subscriptionData.status === 'active') {
				await serviceRef.update({
					activeSubscriptions: firebase.firestore.FieldValue.increment(1)
				});
			}

			// Obtener los datos completos
			return await subscriptionsService.getSubscriptionById(docRef.id);
		} catch (error) {
			console.error('Error creating subscription: ', error);
			throw error;
		}
	},

	// Actualizar subscripción
	updateSubscription: async (id: string, subscriptionData: Partial<Subscription>): Promise<Subscription> => {
		try {
			const subscriptionRef = subscriptionsCollection.doc(id);

			// Obtener los datos actuales para comparar el estado
			const currentDoc = await subscriptionRef.get();

			if (!currentDoc.exists) {
				throw new Error('Subscription not found');
			}

			const currentData = currentDoc.data();
			const wasActive = currentData.status === 'active';
			const willBeActive = subscriptionData.status === 'active';

			// Preparar datos para actualizar
			const updateData: Record<string, any> = { ...subscriptionData };

			// Eliminar ID si está presente (no se puede actualizar)
			delete updateData.id;
			delete updateData.createdAt;

			// Convertir fechas a timestamps de Firestore
			if (updateData.startDate instanceof Date) {
				updateData.startDate = firebase.firestore.Timestamp.fromDate(updateData.startDate);
			}

			if (updateData.endDate instanceof Date) {
				updateData.endDate = firebase.firestore.Timestamp.fromDate(updateData.endDate);
			}

			if (updateData.paymentDate instanceof Date) {
				updateData.paymentDate = firebase.firestore.Timestamp.fromDate(updateData.paymentDate);
			}

			// Añadir timestamp de actualización
			updateData.updatedAt = firebase.firestore.Timestamp.now();

			await subscriptionRef.update(updateData);

			// Actualizar el contador de suscripciones activas en el servicio si es necesario
			if (wasActive !== willBeActive && currentData.serviceId) {
				const serviceRef = db.collection('services').doc(currentData.serviceId);
				await serviceRef.update({
					activeSubscriptions: firebase.firestore.FieldValue.increment(willBeActive ? 1 : -1)
				});
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
		status: 'active' | 'paused' | 'cancelled',
		endDate?: Date
	): Promise<Subscription> => {
		try {
			const subscriptionRef = subscriptionsCollection.doc(id);

			// Obtener los datos actuales
			const currentDoc = await subscriptionRef.get();

			if (!currentDoc.exists) {
				throw new Error('Subscription not found');
			}

			const currentData = currentDoc.data();
			const currentStatus = currentData.status;

			// Si no hay cambio, no hacer nada
			if (currentStatus === status) {
				return await subscriptionsService.getSubscriptionById(id);
			}

			const updateData: Record<string, any> = {
				status,
				updatedAt: firebase.firestore.Timestamp.now()
			};

			// Si se cancela, establecer la fecha de finalización
			if (status === 'cancelled' && endDate) {
				updateData.endDate = firebase.firestore.Timestamp.fromDate(endDate);
			} else if (status === 'cancelled' && !endDate) {
				updateData.endDate = firebase.firestore.Timestamp.now();
			}

			await subscriptionRef.update(updateData);

			// Actualizar el contador de suscripciones activas en el servicio
			if (currentData.serviceId) {
				const serviceRef = db.collection('services').doc(currentData.serviceId);

				if (currentStatus === 'active' && status !== 'active') {
					// Si estaba activa y ahora no, decrementar
					await serviceRef.update({
						activeSubscriptions: firebase.firestore.FieldValue.increment(-1)
					});
				} else if (currentStatus !== 'active' && status === 'active') {
					// Si no estaba activa y ahora sí, incrementar
					await serviceRef.update({
						activeSubscriptions: firebase.firestore.FieldValue.increment(1)
					});
				}
			}

			return await subscriptionsService.getSubscriptionById(id);
		} catch (error) {
			console.error(`Error changing status of subscription with ID ${id}: `, error);
			throw error;
		}
	},

	// Eliminar subscripción
	deleteSubscription: async (id: string): Promise<{ id: string }> => {
		try {
			const subscriptionRef = subscriptionsCollection.doc(id);

			// Verificar si existe la subscripción
			const docSnap = await subscriptionRef.get();

			if (!docSnap.exists) {
				throw new Error('Subscription not found');
			}

			const subscriptionData = docSnap.data();

			// Si está activa, no permitir la eliminación
			if (subscriptionData.status === 'active') {
				throw new Error('Cannot delete active subscription. Change status to cancelled first.');
			}

			// Decrementar contador de suscripciones activas si es necesario
			if (subscriptionData.status === 'active' && subscriptionData.serviceId) {
				const serviceRef = db.collection('services').doc(subscriptionData.serviceId);
				await serviceRef.update({
					activeSubscriptions: firebase.firestore.FieldValue.increment(-1)
				});
			}

			// Eliminar la subscripción
			await subscriptionRef.delete();

			return { id };
		} catch (error) {
			console.error(`Error deleting subscription with ID ${id}: `, error);
			throw error;
		}
	},

	// Obtener subscripciones por cliente
	getSubscriptionsByClient: async (clientId: string): Promise<Subscription[]> => {
		try {
			const querySnapshot = await subscriptionsCollection
				.where('clientId', '==', clientId)
				.orderBy('startDate', 'desc')
				.get();

			const subscriptions = await Promise.all(
				querySnapshot.docs.map(async (doc) => {
					const data = doc.data();

					// Obtener datos del servicio
					let serviceData = null;

					if (data.serviceId) {
						const serviceDoc = await db.collection('services').doc(data.serviceId).get();

						if (serviceDoc.exists) {
							serviceData = serviceDoc.data();
						}
					}

					return {
						id: doc.id,
						...data,
						startDate: data.startDate?.toDate(),
						endDate: data.endDate?.toDate(),
						paymentDate: data.paymentDate?.toDate(),
						createdAt: data.createdAt?.toDate(),
						updatedAt: data.updatedAt?.toDate(),
						serviceInfo: serviceData
					} as Subscription & { serviceInfo: any };
				})
			);

			return subscriptions;
		} catch (error) {
			console.error(`Error getting subscriptions for client ${clientId}: `, error);
			throw error;
		}
	},

	// Obtener subscripciones por servicio
	getSubscriptionsByService: async (serviceId: string): Promise<Subscription[]> => {
		try {
			const querySnapshot = await subscriptionsCollection
				.where('serviceId', '==', serviceId)
				.orderBy('startDate', 'desc')
				.get();

			const subscriptions = await Promise.all(
				querySnapshot.docs.map(async (doc) => {
					const data = doc.data();

					// Obtener datos del cliente
					let clientData = null;

					if (data.clientId) {
						const clientDoc = await db.collection('clients').doc(data.clientId).get();

						if (clientDoc.exists) {
							clientData = clientDoc.data();
						}
					}

					return {
						id: doc.id,
						...data,
						startDate: data.startDate?.toDate(),
						endDate: data.endDate?.toDate(),
						paymentDate: data.paymentDate?.toDate(),
						createdAt: data.createdAt?.toDate(),
						updatedAt: data.updatedAt?.toDate(),
						clientInfo: clientData
					} as Subscription & { clientInfo: any };
				})
			);

			return subscriptions;
		} catch (error) {
			console.error(`Error getting subscriptions for service ${serviceId}: `, error);
			throw error;
		}
	}
};
