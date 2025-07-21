// src/services/subscriptionCounterService.ts
import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';

export const subscriptionCounterService = {
	/**
	 * Actualiza el contador de suscripciones activas para un servicio específico
	 */
	updateServiceSubscriptionCount: async (serviceId: string): Promise<void> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			// Contar suscripciones activas para este servicio
			const subscriptionsQuery = db
				.collection('users')
				.doc(currentUser.uid)
				.collection('subscriptions')
				.where('serviceId', '==', serviceId)
				.where('status', '==', 'active');

			const subscriptionsSnapshot = await subscriptionsQuery.get();
			const activeCount = subscriptionsSnapshot.size;

			// Actualizar el campo activeSubscriptions en el servicio
			const serviceRef = db.collection('users').doc(currentUser.uid).collection('services').doc(serviceId);

			await serviceRef.update({
				activeSubscriptions: activeCount,
				updatedAt: firebase.firestore.Timestamp.now()
			});

			console.log(`✅ Contador actualizado para servicio ${serviceId}: ${activeCount} suscripciones activas`);
		} catch (error) {
			console.error(`Error actualizando contador de suscripciones para servicio ${serviceId}:`, error);
			throw error;
		}
	},

	/**
	 * Actualiza los contadores para todos los servicios de un usuario
	 */
	updateAllServiceSubscriptionCounts: async (): Promise<void> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			// Obtener todos los servicios
			const servicesSnapshot = await db.collection('users').doc(currentUser.uid).collection('services').get();

			// Obtener todas las suscripciones activas
			const subscriptionsSnapshot = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('subscriptions')
				.where('status', '==', 'active')
				.get();

			// Crear mapa de conteo por servicio
			const subscriptionCounts: Record<string, number> = {};

			// Inicializar todos los servicios con 0
			servicesSnapshot.docs.forEach((doc) => {
				subscriptionCounts[doc.id] = 0;
			});

			// Contar suscripciones por servicio
			subscriptionsSnapshot.docs.forEach((doc) => {
				const subscription = doc.data();
				const serviceId = subscription.serviceId;

				if (serviceId && subscriptionCounts.hasOwnProperty(serviceId)) {
					subscriptionCounts[serviceId]++;
				}
			});

			// Actualizar todos los servicios en batch
			const batch = db.batch();
			const timestamp = firebase.firestore.Timestamp.now();

			Object.entries(subscriptionCounts).forEach(([serviceId, count]) => {
				const serviceRef = db.collection('users').doc(currentUser.uid).collection('services').doc(serviceId);

				batch.update(serviceRef, {
					activeSubscriptions: count,
					updatedAt: timestamp
				});
			});

			await batch.commit();

			console.log('✅ Todos los contadores de suscripciones actualizados correctamente');
		} catch (error) {
			console.error('Error actualizando contadores de todos los servicios:', error);
			throw error;
		}
	},

	/**
	 * Incrementa el contador de suscripciones para un servicio
	 */
	incrementServiceSubscriptionCount: async (serviceId: string): Promise<void> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const serviceRef = db.collection('users').doc(currentUser.uid).collection('services').doc(serviceId);

			await serviceRef.update({
				activeSubscriptions: firebase.firestore.FieldValue.increment(1),
				updatedAt: firebase.firestore.Timestamp.now()
			});

			console.log(`✅ Contador incrementado para servicio ${serviceId}`);
		} catch (error) {
			console.error(`Error incrementando contador para servicio ${serviceId}:`, error);
			throw error;
		}
	},

	/**
	 * Decrementa el contador de suscripciones para un servicio
	 */
	decrementServiceSubscriptionCount: async (serviceId: string): Promise<void> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const serviceRef = db.collection('users').doc(currentUser.uid).collection('services').doc(serviceId);

			await serviceRef.update({
				activeSubscriptions: firebase.firestore.FieldValue.increment(-1),
				updatedAt: firebase.firestore.Timestamp.now()
			});

			console.log(`✅ Contador decrementado para servicio ${serviceId}`);
		} catch (error) {
			console.error(`Error decrementando contador para servicio ${serviceId}:`, error);
			throw error;
		}
	}
};
