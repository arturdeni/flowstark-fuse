// src/services/invoicesService.ts
import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';
import { Invoice } from '../types/models';

// Campos de fecha que necesitan conversión Timestamp <-> Date
const dateFields = ['issueDate', 'serviceStart', 'serviceEnd', 'dueDate', 'createdAt', 'updatedAt'] as const;

function convertTimestampsToDate(data: any): Invoice {
	const result = { ...data };
	for (const field of dateFields) {
		if (result[field]?.toDate) {
			result[field] = result[field].toDate();
		}
	}
	return result as Invoice;
}

function convertDatesToTimestamps(data: any): any {
	const result = { ...data };
	for (const field of dateFields) {
		if (result[field] instanceof Date) {
			result[field] = firebase.firestore.Timestamp.fromDate(result[field]);
		}
	}
	return result;
}

export const invoicesService = {
	// Crear factura
	createInvoice: async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
		const currentUser = firebase.auth().currentUser;
		if (!currentUser) throw new Error('No user logged in');

		const timestamp = firebase.firestore.Timestamp.now();
		const converted = convertDatesToTimestamps(invoiceData);
		// Firestore no acepta valores undefined — eliminarlos
		const processedData: any = { createdAt: timestamp, updatedAt: timestamp };
		for (const [key, value] of Object.entries(converted)) {
			if (value !== undefined) {
				processedData[key] = value;
			}
		}

		const docRef = await db
			.collection('users')
			.doc(currentUser.uid)
			.collection('invoices')
			.add(processedData);

		const createdDoc = await docRef.get();
		return {
			id: createdDoc.id,
			...convertTimestampsToDate(createdDoc.data()),
		};
	},

	// Obtener factura por ticketId
	getInvoiceByTicketId: async (ticketId: string): Promise<Invoice | null> => {
		const currentUser = firebase.auth().currentUser;
		if (!currentUser) throw new Error('No user logged in');

		const querySnapshot = await db
			.collection('users')
			.doc(currentUser.uid)
			.collection('invoices')
			.where('ticketId', '==', ticketId)
			.limit(1)
			.get();

		if (querySnapshot.empty) return null;

		const doc = querySnapshot.docs[0];
		return {
			id: doc.id,
			...convertTimestampsToDate(doc.data()),
		};
	},

	// Obtener factura por ID
	getInvoiceById: async (id: string): Promise<Invoice> => {
		const currentUser = firebase.auth().currentUser;
		if (!currentUser) throw new Error('No user logged in');

		const docSnap = await db
			.collection('users')
			.doc(currentUser.uid)
			.collection('invoices')
			.doc(id)
			.get();

		if (!docSnap.exists) throw new Error('Invoice not found');

		return {
			id: docSnap.id,
			...convertTimestampsToDate(docSnap.data()),
		};
	},

	// Cancelar factura (nunca borrar)
	cancelInvoice: async (id: string): Promise<Invoice> => {
		const currentUser = firebase.auth().currentUser;
		if (!currentUser) throw new Error('No user logged in');

		const docRef = db
			.collection('users')
			.doc(currentUser.uid)
			.collection('invoices')
			.doc(id);

		await docRef.update({
			status: 'cancelled',
			updatedAt: firebase.firestore.Timestamp.now(),
		});

		const updatedDoc = await docRef.get();
		return {
			id: updatedDoc.id,
			...convertTimestampsToDate(updatedDoc.data()),
		};
	},
};
