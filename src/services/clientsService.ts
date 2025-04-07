import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';
import { Client } from '../types/models';

// Colección de clientes
const clientsCollection = db.collection('clients');

export const clientsService = {
	// Obtener todos los clientes
	getAllClients: async (): Promise<Client[]> => {
		try {
			const querySnapshot = await clientsCollection.orderBy('firstName').get();
			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				return {
					id: doc.id,
					...data,
					registeredDate: data.registeredDate?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Client;
			});
		} catch (error) {
			console.error('Error getting clients: ', error);
			throw error;
		}
	},

	// Obtener cliente por ID
	getClientById: async (id: string): Promise<Client> => {
		try {
			const docRef = clientsCollection.doc(id);
			const docSnap = await docRef.get();

			if (docSnap.exists) {
				const data = docSnap.data();
				return {
					id: docSnap.id,
					...data,
					registeredDate: data.registeredDate?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Client;
			} else {
				throw new Error('Client not found');
			}
		} catch (error) {
			console.error(`Error getting client with ID ${id}: `, error);
			throw error;
		}
	},

	// Crear nuevo cliente
	createClient: async (
		clientData: Omit<Client, 'id' | 'registeredDate' | 'active' | 'createdAt' | 'updatedAt'>
	): Promise<Client> => {
		try {
			const timestamp = firebase.firestore.Timestamp.now();
			const clientWithDates = {
				...clientData,
				registeredDate: timestamp,
				active: true,
				createdAt: timestamp,
				updatedAt: timestamp
			};

			const docRef = await clientsCollection.add(clientWithDates);

			return {
				id: docRef.id,
				...clientData,
				registeredDate: timestamp.toDate(),
				active: true,
				createdAt: timestamp.toDate(),
				updatedAt: timestamp.toDate()
			} as Client;
		} catch (error) {
			console.error('Error creating client: ', error);
			throw error;
		}
	},

	// Actualizar cliente
	updateClient: async (id: string, clientData: Partial<Client>): Promise<Client> => {
		try {
			const clientRef = clientsCollection.doc(id);

			// Preparar datos para actualizar
			const updateData: Record<string, any> = { ...clientData };

			// Eliminar ID si está presente (no se puede actualizar)
			delete updateData.id;

			// Asegurarse de que registeredDate no se sobrescriba
			delete updateData.registeredDate;
			delete updateData.createdAt;

			// Añadir timestamp de actualización
			updateData.updatedAt = firebase.firestore.Timestamp.now();

			await clientRef.update(updateData);

			// Obtener los datos actualizados
			const updatedDoc = await clientRef.get();
			const data = updatedDoc.data();

			return {
				id,
				...data,
				registeredDate: data.registeredDate?.toDate(),
				createdAt: data.createdAt?.toDate(),
				updatedAt: data.updatedAt?.toDate()
			} as Client;
		} catch (error) {
			console.error(`Error updating client with ID ${id}: `, error);
			throw error;
		}
	},

	// Eliminar cliente (o marcarlo como inactivo)
	deleteClient: async (id: string): Promise<{ id: string }> => {
		try {
			const clientRef = clientsCollection.doc(id);

			// Verificar si existe el cliente
			const docSnap = await clientRef.get();

			if (!docSnap.exists) {
				throw new Error('Client not found');
			}

			// Verificar si tiene suscripciones activas
			const subscriptionsQuery = db
				.collection('subscriptions')
				.where('clientId', '==', id)
				.where('status', '==', 'active');

			const subscriptionsSnapshot = await subscriptionsQuery.get();

			if (!subscriptionsSnapshot.empty) {
				// Si tiene suscripciones, solo marcar como inactivo
				await clientRef.update({
					active: false,
					updatedAt: firebase.firestore.Timestamp.now()
				});
			} else {
				// Si no tiene suscripciones, eliminar documento
				await clientRef.delete();
			}

			return { id };
		} catch (error) {
			console.error(`Error deleting client with ID ${id}: `, error);
			throw error;
		}
	}
};
