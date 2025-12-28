// src/services/servicesService.ts
import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';
import { Service } from '../types/models';

export const servicesService = {
	// Obtener todos los servicios del usuario actual
	getAllServices: async (): Promise<Service[]> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const querySnapshot = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('services')
				.orderBy('name')
				.get();

			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					// Asegúrate de que basePrice sea un número
					basePrice: typeof data.basePrice === 'string' ? parseFloat(data.basePrice) : data.basePrice || 0,
					// Asegúrate de que finalPrice sea un número
					finalPrice:
						typeof data.finalPrice === 'string' ? parseFloat(data.finalPrice) : data.finalPrice || 0,
					// Asegúrate de que vat sea un número
					vat: typeof data.vat === 'string' ? parseFloat(data.vat) : data.vat || 21,
					// Asegúrate de que retention sea un número
					retention: typeof data.retention === 'string' ? parseFloat(data.retention) : data.retention || 0,
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Service;
			});
		} catch (error) {
			console.error('Error getting services: ', error);
			throw error;
		}
	},

	// Obtener servicio por ID
	getServiceById: async (id: string): Promise<Service> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const docRef = db.collection('users').doc(currentUser.uid).collection('services').doc(id);
			const docSnap = await docRef.get();

			if (docSnap.exists) {
				const data = docSnap.data();
				return {
					id: docSnap.id,
					...data,
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Service;
			} else {
				throw new Error('Service not found');
			}
		} catch (error) {
			console.error(`Error getting service with ID ${id}: `, error);
			throw error;
		}
	},

	// Crear nuevo servicio
	createService: async (
		serviceData: Omit<Service, 'id' | 'active' | 'activeSubscriptions' | 'createdAt' | 'updatedAt'>
	): Promise<Service> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const timestamp = firebase.firestore.Timestamp.now();
			const serviceWithDates = {
				...serviceData,
				active: true,
				activeSubscriptions: 0,
				createdAt: timestamp,
				updatedAt: timestamp
			};

			const docRef = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('services')
				.add(serviceWithDates);

			return {
				id: docRef.id,
				...serviceData,
				active: true,
				activeSubscriptions: 0,
				createdAt: timestamp.toDate(),
				updatedAt: timestamp.toDate()
			} as Service;
		} catch (error) {
			console.error('Error creating service: ', error);
			throw error;
		}
	},

	// Actualizar servicio
	updateService: async (id: string, serviceData: Partial<Service>): Promise<Service> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const serviceRef = db.collection('users').doc(currentUser.uid).collection('services').doc(id);

			// Preparar datos para actualizar
			const updateData: Record<string, any> = { ...serviceData };

			// Eliminar ID si está presente (no se puede actualizar)
			delete updateData.id;

			// No sobrescribir fechas de creación
			delete updateData.createdAt;

			// Añadir timestamp de actualización
			updateData.updatedAt = firebase.firestore.Timestamp.now();

			await serviceRef.update(updateData);

			// Obtener los datos actualizados
			const updatedDoc = await serviceRef.get();
			const data = updatedDoc.data();

			return {
				id,
				...data,
				createdAt: data.createdAt?.toDate(),
				updatedAt: data.updatedAt?.toDate()
			} as Service;
		} catch (error) {
			console.error(`Error updating service with ID ${id}: `, error);
			throw error;
		}
	},

	// Eliminar servicio
	deleteService: async (id: string): Promise<{ id: string }> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const serviceRef = db.collection('users').doc(currentUser.uid).collection('services').doc(id);

			// Verificar si existe el servicio
			const docSnap = await serviceRef.get();

			if (!docSnap.exists) {
				throw new Error('Service not found');
			}

			// Verificar si tiene suscripciones activas
			const subscriptionsQuery = db
				.collection('users')
				.doc(currentUser.uid)
				.collection('subscriptions')
				.where('serviceId', '==', id)
				.where('status', '==', 'active');

			const subscriptionsSnapshot = await subscriptionsQuery.get();

			if (!subscriptionsSnapshot.empty) {
				throw new Error('No se puede eliminar un servicio con suscripciones activas');
			}

			// Eliminar el servicio
			await serviceRef.delete();

			return { id };
		} catch (error) {
			console.error(`Error deleting service with ID ${id}: `, error);
			throw error;
		}
	},

	// Obtener servicios activos
	getActiveServices: async (): Promise<Service[]> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const querySnapshot = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('services')
				.where('active', '==', true)
				.orderBy('name')
				.get();

			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Service;
			});
		} catch (error) {
			console.error('Error getting active services: ', error);
			throw error;
		}
	},

	// Importar múltiples servicios de forma masiva
	importBulkServices: async (
		servicesData: Omit<Service, 'id' | 'active' | 'activeSubscriptions' | 'createdAt' | 'updatedAt'>[]
	): Promise<{ success: number; failed: number; errors: string[] }> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const timestamp = firebase.firestore.Timestamp.now();
			const results = {
				success: 0,
				failed: 0,
				errors: [] as string[]
			};

			// Usar batch para optimizar las escrituras
			const batch = db.batch();
			const servicesCollection = db.collection('users').doc(currentUser.uid).collection('services');

			servicesData.forEach((serviceData, index) => {
				try {
					const serviceWithDates = {
						...serviceData,
						active: true,
						activeSubscriptions: 0,
						createdAt: timestamp,
						updatedAt: timestamp
					};

					const docRef = servicesCollection.doc(); // Genera un ID automáticamente
					batch.set(docRef, serviceWithDates);
					results.success++;
				} catch (error) {
					results.failed++;
					results.errors.push(`Fila ${index + 2}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
				}
			});

			// Ejecutar todas las escrituras en batch
			await batch.commit();

			return results;
		} catch (error) {
			console.error('Error importing bulk services: ', error);
			throw error;
		}
	}
};
