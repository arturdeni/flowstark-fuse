// src/services/servicesService.ts
import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';
import { Service } from '../types/models';

// Colección de servicios
const servicesCollection = db.collection('services');

export const servicesService = {
	// Obtener todos los servicios
	getAllServices: async (): Promise<Service[]> => {
		try {
			const querySnapshot = await servicesCollection.orderBy('name').get();
			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					// Asegúrate de que basePrice sea un número
					basePrice: typeof data.basePrice === 'string' ? parseFloat(data.basePrice) : data.basePrice || 0,
					// Asegúrate de que vat sea un número
					vat: typeof data.vat === 'string' ? parseFloat(data.vat) : data.vat || 21,
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
			const docRef = servicesCollection.doc(id);
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
			const timestamp = firebase.firestore.Timestamp.now();
			const serviceWithDates = {
				...serviceData,
				active: true,
				activeSubscriptions: 0,
				createdAt: timestamp,
				updatedAt: timestamp
			};

			const docRef = await servicesCollection.add(serviceWithDates);

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
			const serviceRef = servicesCollection.doc(id);

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
			const serviceRef = servicesCollection.doc(id);

			// Verificar si existe el servicio
			const docSnap = await serviceRef.get();

			if (!docSnap.exists) {
				throw new Error('Service not found');
			}

			// Verificar si tiene suscripciones activas
			const subscriptionsQuery = db
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
			const querySnapshot = await servicesCollection.where('active', '==', true).orderBy('name').get();

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
	}
};
