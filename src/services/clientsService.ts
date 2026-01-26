// src/services/clientsService.ts
import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';
import { Client, SepaMandate } from '../types/models';

/**
 * Genera un mandato SEPA para un cliente con domiciliación bancaria
 * @param clientId - ID del cliente (puede ser temporal antes de crear)
 * @returns Objeto SepaMandate con los datos del mandato
 */
function generateSepaMandate(clientId: string): SepaMandate {
	const year = new Date().getFullYear();

	return {
		mandateId: `FLOWSTARK-${clientId}-${year}`,
		signatureDate: new Date(),
		status: 'active'
	};
}

/**
 * Prepara el mandato SEPA para guardar en Firestore (convierte Date a Timestamp)
 */
function prepareSepaMandate(mandate: SepaMandate): Record<string, any> {
	return {
		mandateId: mandate.mandateId,
		signatureDate: firebase.firestore.Timestamp.fromDate(mandate.signatureDate),
		status: mandate.status
	};
}

export const clientsService = {
	// Obtener todos los clientes del usuario actual
	getAllClients: async (): Promise<Client[]> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const querySnapshot = await db
				.collection('users')
				.doc(currentUser.uid)
				.collection('clients')
				.orderBy('firstName')
				.get();

			return querySnapshot.docs.map((doc) => {
				const data = doc.data();
				const client: Client = {
					id: doc.id,
					...data,
					registeredDate: data.registeredDate?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Client;

				// Convertir fecha del mandato SEPA si existe
				if (data.sepaMandate) {
					client.sepaMandate = {
						mandateId: data.sepaMandate.mandateId,
						signatureDate: data.sepaMandate.signatureDate?.toDate(),
						status: data.sepaMandate.status
					};
				}

				return client;
			});
		} catch (error) {
			console.error('Error getting clients: ', error);
			throw error;
		}
	},

	// Obtener cliente por ID
	getClientById: async (id: string): Promise<Client> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const docRef = db.collection('users').doc(currentUser.uid).collection('clients').doc(id);

			const docSnap = await docRef.get();

			if (docSnap.exists) {
				const data = docSnap.data();
				const client: Client = {
					id: docSnap.id,
					...data,
					registeredDate: data.registeredDate?.toDate(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Client;

				// Convertir fecha del mandato SEPA si existe
				if (data.sepaMandate) {
					client.sepaMandate = {
						mandateId: data.sepaMandate.mandateId,
						signatureDate: data.sepaMandate.signatureDate?.toDate(),
						status: data.sepaMandate.status
					};
				}

				return client;
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
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const timestamp = firebase.firestore.Timestamp.now();
			const clientsCollection = db.collection('users').doc(currentUser.uid).collection('clients');

			// Generar el ID del documento antes de crear
			const docRef = clientsCollection.doc();
			const clientId = docRef.id;

			// Preparar datos del cliente
			const clientWithDates: Record<string, any> = {
				...clientData,
				registeredDate: timestamp,
				active: true,
				createdAt: timestamp,
				updatedAt: timestamp
			};

			// Si el método de pago es domiciliación, generar mandato SEPA automáticamente
			if (clientData.paymentMethod?.type === 'direct_debit' && clientData.iban) {
				const mandate = generateSepaMandate(clientId);
				clientWithDates.sepaMandate = prepareSepaMandate(mandate);
			}

			await docRef.set(clientWithDates);

			// Construir objeto de retorno
			const result: Client = {
				id: clientId,
				...clientData,
				registeredDate: timestamp.toDate(),
				active: true,
				createdAt: timestamp.toDate(),
				updatedAt: timestamp.toDate()
			};

			// Añadir mandato al resultado si se generó
			if (clientWithDates.sepaMandate) {
				result.sepaMandate = {
					mandateId: clientWithDates.sepaMandate.mandateId,
					signatureDate: clientWithDates.sepaMandate.signatureDate.toDate(),
					status: clientWithDates.sepaMandate.status
				};
			}

			return result;
		} catch (error) {
			console.error('Error creating client: ', error);
			throw error;
		}
	},

	// Actualizar cliente
	updateClient: async (id: string, clientData: Partial<Client>): Promise<Client> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const clientRef = db.collection('users').doc(currentUser.uid).collection('clients').doc(id);

			// Obtener datos actuales para verificar si ya tiene mandato
			const currentDoc = await clientRef.get();
			const currentData = currentDoc.data();

			// Preparar datos para actualizar
			const updateData: Record<string, any> = { ...clientData };

			// Eliminar ID si está presente (no se puede actualizar)
			delete updateData.id;

			// Asegurarse de que registeredDate no se sobrescriba
			delete updateData.registeredDate;
			delete updateData.createdAt;

			// Si cambia a domiciliación y no tiene mandato, generar uno nuevo
			const newPaymentType = clientData.paymentMethod?.type;
			const hasMandate = currentData?.sepaMandate?.mandateId;
			const hasIban = clientData.iban || currentData?.iban;

			if (newPaymentType === 'direct_debit' && !hasMandate && hasIban) {
				const mandate = generateSepaMandate(id);
				updateData.sepaMandate = prepareSepaMandate(mandate);
			}

			// Añadir timestamp de actualización
			updateData.updatedAt = firebase.firestore.Timestamp.now();

			await clientRef.update(updateData);

			// Obtener los datos actualizados
			const updatedDoc = await clientRef.get();
			const data = updatedDoc.data();

			const result: Client = {
				id,
				...data,
				registeredDate: data.registeredDate?.toDate(),
				createdAt: data.createdAt?.toDate(),
				updatedAt: data.updatedAt?.toDate()
			} as Client;

			// Convertir fecha del mandato si existe
			if (data?.sepaMandate) {
				result.sepaMandate = {
					mandateId: data.sepaMandate.mandateId,
					signatureDate: data.sepaMandate.signatureDate?.toDate(),
					status: data.sepaMandate.status
				};
			}

			return result;
		} catch (error) {
			console.error(`Error updating client with ID ${id}: `, error);
			throw error;
		}
	},

	// Eliminar cliente (o marcarlo como inactivo)
	deleteClient: async (id: string): Promise<{ id: string }> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const clientRef = db.collection('users').doc(currentUser.uid).collection('clients').doc(id);

			// Verificar si existe el cliente
			const docSnap = await clientRef.get();

			if (!docSnap.exists) {
				throw new Error('Client not found');
			}

			// Verificar si tiene suscripciones activas
			const subscriptionsQuery = db
				.collection('users')
				.doc(currentUser.uid)
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
	},

	// Importar múltiples clientes de forma masiva
	importBulkClients: async (
		clientsData: Omit<Client, 'id' | 'registeredDate' | 'active' | 'createdAt' | 'updatedAt'>[]
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
			const clientsCollection = db.collection('users').doc(currentUser.uid).collection('clients');

			clientsData.forEach((clientData, index) => {
				try {
					const docRef = clientsCollection.doc(); // Genera un ID automáticamente
					const clientId = docRef.id;

					const clientWithDates: Record<string, unknown> = {
						...clientData,
						registeredDate: timestamp,
						active: true,
						createdAt: timestamp,
						updatedAt: timestamp
					};

					// Si el método de pago es domiciliación, generar mandato SEPA
					if (clientData.paymentMethod?.type === 'direct_debit' && clientData.iban) {
						const mandate = generateSepaMandate(clientId);
						clientWithDates.sepaMandate = prepareSepaMandate(mandate);
					}

					batch.set(docRef, clientWithDates);
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
			console.error('Error importing bulk clients: ', error);
			throw error;
		}
	}
};
