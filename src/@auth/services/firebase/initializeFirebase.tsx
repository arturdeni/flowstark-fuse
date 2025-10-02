// src/@auth/services/firebase/initializeFirebase.tsx
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/functions';
import firebaseConfig from './firebaseAuthConfig';

let initialized = false;

export function initializeFirebase() {
	if (initialized) {
		console.log('Firebase already initialized, skipping...');
		return true;
	}

	try {
		// Verificar que tenemos todos los valores necesarios
		if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
			console.error('Firebase config is missing critical values:', {
				hasApiKey: !!firebaseConfig.apiKey,
				hasProjectId: !!firebaseConfig.projectId,
				hasAppId: !!firebaseConfig.appId
			});
			return false;
		}

		// Inicializar la aplicación de Firebase si no está ya inicializada
		if (!firebase.apps.length) {
			console.log('Initializing Firebase app...');
			firebase.initializeApp(firebaseConfig);
			console.log('Firebase app initialized successfully');
		} else {
			console.log('Using existing Firebase app');
		}

		// Inicializar Firebase Auth explícitamente
		const auth = firebase.auth();
		console.log('Firebase auth initialized:', !!auth);

		// Verificar la conexión a Firebase Auth
		auth.tenantId; // Acceder a una propiedad para verificar que la instancia es válida

		initialized = true;
		return true;
	} catch (error) {
		console.error('Error initializing Firebase:', error);
		initialized = false;
		return false;
	}
}

// Intenta inicializar Firebase inmediatamente
try {
	console.log('Attempting early Firebase initialization...');
	const success = initializeFirebase();
	console.log('Early Firebase initialization:', success ? 'successful' : 'failed');
} catch (e) {
	console.error('Error in early Firebase initialization:', e);
}

export const firebaseInitialized = initialized;
