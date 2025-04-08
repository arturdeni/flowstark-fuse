// src/@auth/services/firebase/initializeFirebase.tsx
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import firebaseConfig from './firebaseAuthConfig';

let initialized = false;

export function initializeFirebase() {
	if (initialized) {
		console.log('Firebase already initialized');
		return true;
	}

	try {
		// Log detallado para verificar exactamente qué valores están disponibles
		console.log('Import.meta.env available:', {
			VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? 'defined' : 'undefined',
			VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'defined' : 'undefined',
			VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'defined' : 'undefined',
			VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID ? 'defined' : 'undefined'
		});

		console.log('Firebase config from import:', {
			apiKey: firebaseConfig.apiKey ? 'defined' : 'undefined',
			authDomain: firebaseConfig.authDomain ? 'defined' : 'undefined',
			projectId: firebaseConfig.projectId ? 'defined' : 'undefined',
			appId: firebaseConfig.appId ? 'defined' : 'undefined'
		});

		// Inicializar Firebase si no está ya inicializado
		if (!firebase.apps.length) {
			firebase.initializeApp(firebaseConfig);
			console.log('Firebase initialized successfully');
		} else {
			console.log('Using existing Firebase app');
		}

		initialized = true;
		return true;
	} catch (error) {
		console.error('Error initializing Firebase:', error);
		initialized = false;
		return false;
	}
}

// Intentar inicializar Firebase inmediatamente
try {
	console.log('Attempting early Firebase initialization...');
	const success = initializeFirebase();
	console.log('Early Firebase initialization:', success ? 'successful' : 'failed');
} catch (e) {
	console.error('Error in early Firebase initialization:', e);
}

export const firebaseInitialized = initialized;
