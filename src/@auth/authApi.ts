import { User } from '@auth/user';
import { PartialDeep } from 'type-fest';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Esta función simula la respuesta HTTP
const createResponse = (data: any): Response => {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: 'application/json'
	});

	const init = { status: 200, statusText: 'OK' };
	return new Response(blob, init);
};

// Usuario de prueba para desarrollo
const demoUser: User = {
	id: 'demo-user-id',
	displayName: 'Usuario Demo',
	email: 'demo@example.com',
	role: ['admin'], // Asigna los roles que necesites
	photoURL: '',
	loginRedirectUrl: '/'
};

/**
 * Refreshes the access token
 */
export async function authRefreshToken(): Promise<Response> {
	// Simular token refresh exitoso
	return createResponse({
		token: `demo-token-${Date.now()}`
	});
}

/**
 * Sign in with token
 */
export async function authSignInWithToken(accessToken: string): Promise<Response> {
	// Simular un inicio de sesión exitoso
	return createResponse({
		user: demoUser
	});
}

/**
 * Sign in
 */
export async function authSignIn(credentials: { email: string; password: string }): Promise<Response> {
	// Aquí podrías verificar las credenciales para desarrollo
	// Por ejemplo, permitir solo ciertos usuarios de prueba
	if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
		return createResponse({
			user: demoUser,
			access_token: `demo-token-${Date.now()}`
		});
	}

	// O simplemente aceptar cualquier credencial para fines de desarrollo
	return createResponse({
		user: {
			...demoUser,
			email: credentials.email,
			displayName: credentials.email.split('@')[0]
		},
		access_token: `demo-token-${Date.now()}`
	});
}

/**
 * Sign up
 */
export async function authSignUp(data: { displayName: string; email: string; password: string }): Promise<Response> {
	// Simular un registro exitoso
	return createResponse({
		user: {
			...demoUser,
			displayName: data.displayName,
			email: data.email
		},
		access_token: `demo-token-${Date.now()}`
	});
}

/**
 * Get user by id
 */
export async function authGetDbUser(userId: string): Promise<Response> {
	// Buscar en Firestore si existe, sino devolver usuario demo
	try {
		const db = firebase.firestore();
		const userDoc = await db.collection('users').doc(userId).get();

		if (userDoc.exists) {
			const userData = userDoc.data();
			return createResponse({
				...userData,
				id: userId
			});
		}
	} catch (error) {
		console.warn('Error fetching user from Firestore:', error);
	}

	// Si no existe o hay error, devolver usuario demo
	return createResponse(demoUser);
}

/**
 * Get user by email
 */
export async function authGetDbUserByEmail(email: string): Promise<Response> {
	// Simular búsqueda por email
	return createResponse({
		...demoUser,
		email
	});
}

/**
 * Update user
 */
export function authUpdateDbUser(user: PartialDeep<User>): Promise<Response> {
	// Simular actualización exitosa
	return Promise.resolve(
		createResponse({
			...demoUser,
			...user
		})
	);
}

/**
 * Create user
 */
export async function authCreateDbUser(user: PartialDeep<User>): Promise<Response> {
	// Simular creación exitosa
	return createResponse({
		...demoUser,
		...user,
		id: `user-${Date.now()}`
	});
}
