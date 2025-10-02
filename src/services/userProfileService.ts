// src/services/userProfileService.ts
import { db } from './firebase/firestore';
import firebase from 'firebase/compat/app';

export interface UserProfile {
	// Tipo de usuario
	userType?: 'autonomo' | 'empresa';

	// Datos básicos
	name?: string; // Nombre (autónomo) o Razón social (empresa)
	nifCif?: string; // NIF (autónomo) o CIF (empresa)

	// Domicilio fiscal
	street?: string;
	number?: string;
	postalCode?: string;
	city?: string;
	province?: string;
	country?: string;

	// Campos comunes
	commercialName?: string;
	phone?: string;
	website?: string;

	// Datos de autenticación (solo lectura)
	email?: string;
	displayName?: string;

	// Timestamps
	createdAt?: Date;
	updatedAt?: Date;
}

export const userProfileService = {
	// Obtener el perfil del usuario actual
	getUserProfile: async (): Promise<UserProfile | null> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const userDoc = await db.collection('users').doc(currentUser.uid).get();

			if (userDoc.exists) {
				const data = userDoc.data();
				return {
					userType: data?.userType,
					name: data?.name,
					nifCif: data?.nifCif,
					street: data?.street,
					number: data?.number,
					postalCode: data?.postalCode,
					city: data?.city,
					province: data?.province,
					country: data?.country,
					commercialName: data?.commercialName,
					phone: data?.phone,
					website: data?.website,
					email: data?.email || currentUser.email,
					displayName: data?.displayName,
					createdAt: data?.createdAt?.toDate(),
					updatedAt: data?.updatedAt?.toDate()
				};
			}

			// Si no existe el perfil, devolver los datos básicos del usuario autenticado
			return {
				email: currentUser.email,
				displayName: currentUser.displayName || ''
			};
		} catch (error) {
			console.error('Error getting user profile: ', error);
			throw error;
		}
	},

	// Actualizar el perfil del usuario
	updateUserProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const userRef = db.collection('users').doc(currentUser.uid);

			// Preparar datos para actualizar
			const updateData: Record<string, any> = { ...profileData };

			// Eliminar campos que no se deben actualizar
			delete updateData.email;
			delete updateData.createdAt;

			// Añadir timestamp de actualización
			updateData.updatedAt = firebase.firestore.Timestamp.now();

			await userRef.update(updateData);

			// Obtener los datos actualizados
			const updatedDoc = await userRef.get();
			const data = updatedDoc.data();

			return {
				userType: data?.userType,
				name: data?.name,
				nifCif: data?.nifCif,
				street: data?.street,
				number: data?.number,
				postalCode: data?.postalCode,
				city: data?.city,
				province: data?.province,
				country: data?.country,
				commercialName: data?.commercialName,
				phone: data?.phone,
				website: data?.website,
				email: data?.email || currentUser.email,
				displayName: data?.displayName,
				createdAt: data?.createdAt?.toDate(),
				updatedAt: data?.updatedAt?.toDate()
			};
		} catch (error) {
			console.error('Error updating user profile: ', error);
			throw error;
		}
	}
};
