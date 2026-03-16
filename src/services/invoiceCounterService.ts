// src/services/invoiceCounterService.ts
import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';

export const invoiceCounterService = {
	/**
	 * Obtiene el siguiente número de factura usando una transacción atómica.
	 * Formato: "YYYY-NNNN" (ej: "2026-0001")
	 * Si cambia el año, resetea el contador a 1.
	 */
	getNextInvoiceNumber: async (): Promise<string> => {
		const currentUser = firebase.auth().currentUser;

		if (!currentUser) {
			throw new Error('No user logged in');
		}

		const counterRef = db
			.collection('users')
			.doc(currentUser.uid)
			.collection('counters')
			.doc('invoices');

		const currentYear = new Date().getFullYear();

		const newNumber = await db.runTransaction(async (transaction) => {
			const counterDoc = await transaction.get(counterRef);

			let lastNumber = 0;

			if (counterDoc.exists) {
				const data = counterDoc.data();
				const storedYear = data?.year || 0;

				if (storedYear === currentYear) {
					lastNumber = data?.lastNumber || 0;
				}
				// Si el año cambió, lastNumber queda en 0 (reset)
			}

			const nextNumber = lastNumber + 1;

			transaction.set(counterRef, {
				year: currentYear,
				lastNumber: nextNumber,
				updatedAt: firebase.firestore.Timestamp.now(),
			});

			return nextNumber;
		});

		const paddedNumber = String(newNumber).padStart(4, '0');
		return `${currentYear}-${paddedNumber}`;
	},
};
