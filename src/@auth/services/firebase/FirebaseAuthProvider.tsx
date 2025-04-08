import { useState, useEffect, useCallback, useMemo, useImperativeHandle } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { FuseAuthProviderComponentProps, FuseAuthProviderState } from '@fuse/core/FuseAuthProvider/types/FuseAuthTypes';
import { PartialDeep } from 'type-fest';
import { initializeFirebase } from './initializeFirebase';
import { User } from '../../user';
import { FirebaseAuthContextType } from './FirebaseAuthContext';
import FirebaseAuthContext from './FirebaseAuthContext';
import { db } from '@/services/firebase/firestore';

export type FirebaseSignInPayload = {
	email: string;
	password: string;
};

export type FirebaseSignUpPayload = {
	email: string;
	password: string;
};

function FirebaseAuthProvider(props: FuseAuthProviderComponentProps) {
	const { ref, children, onAuthStateChanged } = props;

	/**
	 * Fuse Auth Provider State
	 */
	const [authState, setAuthState] = useState<FuseAuthProviderState<User>>({
		authStatus: 'configuring',
		isAuthenticated: false,
		user: null
	});

	/**
	 * Watch for changes in the auth state
	 * and pass them to the FuseAuthProvider
	 */
	useEffect(() => {
		if (onAuthStateChanged) {
			onAuthStateChanged(authState);
		}
	}, [authState, onAuthStateChanged]);

	/**
	 * Initialize Firebase on load
	 */
	useEffect(() => {
		const initialized = initializeFirebase();

		if (!initialized) {
			setAuthState({
				authStatus: 'unauthenticated',
				isAuthenticated: false,
				user: null
			});
			return undefined;
		}

		/**
		 * Watch firebase auth state changes
		 */
		const unsubscribe = firebase.auth().onAuthStateChanged(
			async (firebaseUser) => {
				/**
				 * if user is logged in
				 * */
				if (firebaseUser) {
					try {
						// Intentar obtener el documento del usuario desde Firestore
						const userDocRef = db.collection('users').doc(firebaseUser.uid);
						const userDoc = await userDocRef.get();

						let userData: User;

						if (userDoc.exists) {
							// Si el documento existe, usar esos datos
							const docData = userDoc.data();
							userData = {
								id: firebaseUser.uid,
								email: firebaseUser.email,
								displayName: docData.displayName || firebaseUser.displayName || '',
								photoURL: docData.photoURL || firebaseUser.photoURL || '',
								role: docData.role || ['admin'],
								loginRedirectUrl: docData.loginRedirectUrl || '/'
							} as User;

							// Actualizar datos si es necesario (por ejemplo, si el email cambió)
							if (userData.email !== firebaseUser.email) {
								await userDocRef.update({
									email: firebaseUser.email,
									updatedAt: firebase.firestore.FieldValue.serverTimestamp()
								});
							}
						} else {
							// Si el documento no existe, crearlo
							userData = {
								id: firebaseUser.uid,
								email: firebaseUser.email,
								displayName: firebaseUser.displayName || '',
								photoURL: firebaseUser.photoURL || '',
								role: ['admin'], // Rol predeterminado
								loginRedirectUrl: '/'
							} as User;

							await userDocRef.set({
								...userData,
								createdAt: firebase.firestore.FieldValue.serverTimestamp(),
								updatedAt: firebase.firestore.FieldValue.serverTimestamp()
							});

							console.log('User document created for:', firebaseUser.uid);
						}

						setAuthState({
							user: userData,
							isAuthenticated: true,
							authStatus: 'authenticated'
						});
					} catch (error) {
						console.error('Error handling user authentication:', error);
						setAuthState({
							authStatus: 'unauthenticated',
							isAuthenticated: false,
							user: null
						});
					}
				} else {
					/**
					 * if user is not logged in, set auth state to unauthenticated
					 */
					setAuthState({
						authStatus: 'unauthenticated',
						isAuthenticated: false,
						user: null
					});
				}
			},
			(error) => {
				console.error('Error with Firebase Auth state:', error);
				setAuthState({
					authStatus: 'unauthenticated',
					user: null,
					isAuthenticated: false
				});
			}
		);

		/**
		 * Unsubscribe from firebase auth state changes
		 * */
		return () => {
			setAuthState({
				authStatus: 'configuring',
				isAuthenticated: false,
				user: null
			});
			unsubscribe?.();
		};
	}, []);

	/**
	 * Update user data in Firestore
	 */
	const updateUser: FirebaseAuthContextType['updateUser'] = useCallback(async (_userData: PartialDeep<User>) => {
		try {
			const currentUser = firebase.auth().currentUser;

			if (!currentUser) {
				throw new Error('No user logged in');
			}

			const userRef = db.collection('users').doc(currentUser.uid);

			// Prepare data for update
			const updateData = { ..._userData };
			delete updateData.id; // ID cannot be updated

			// Add update timestamp
			const timestamp = firebase.firestore.FieldValue.serverTimestamp();
			updateData.updatedAt = timestamp;

			// Update the document
			await userRef.update(updateData);

			// Get the updated document
			const updatedDoc = await userRef.get();
			const updatedData = updatedDoc.data();

			// Create a response similar to the old API
			const responseData = {
				...updatedData,
				id: currentUser.uid
			};

			// Create a mock response
			const blob = new Blob([JSON.stringify(responseData, null, 2)], {
				type: 'application/json'
			});
			return new Response(blob, { status: 200, statusText: 'OK' });
		} catch (error) {
			console.error('Error updating user:', error);
			return Promise.reject(error);
		}
	}, []);

	/**
	 * Sign in with email and password
	 */
	const signIn: FirebaseAuthContextType['signIn'] = useCallback(({ email, password }) => {
		try {
			return firebase.auth().signInWithEmailAndPassword(email, password);
		} catch (error) {
			console.error('Error signing in:', error);
			return Promise.reject(error);
		}
	}, []);

	/**
	 * Sign up with email and password
	 */
	const signUp: FirebaseAuthContextType['signUp'] = useCallback(async ({ email, password }) => {
		try {
			const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);

			// Crear documento de usuario en Firestore
			if (userCredential.user) {
				await db
					.collection('users')
					.doc(userCredential.user.uid)
					.set({
						email: userCredential.user.email,
						displayName: userCredential.user.displayName || '',
						photoURL: userCredential.user.photoURL || '',
						role: ['admin'], // Rol predeterminado
						createdAt: firebase.firestore.FieldValue.serverTimestamp(),
						updatedAt: firebase.firestore.FieldValue.serverTimestamp()
					});
			}

			return userCredential;
		} catch (error) {
			console.error('Error during sign up:', error);
			return Promise.reject(error);
		}
	}, []);

	/**
	 * Sign out
	 */
	const handleSignOut: FirebaseAuthContextType['signOut'] = useCallback(() => {
		firebase
			.auth()
			.signOut()
			.catch((error) => {
				console.error('Error signing out:', error);
			});
	}, []);

	/**
	 * Expose methods to the FuseAuthProvider
	 */
	useImperativeHandle(ref, () => ({
		signOut: handleSignOut,
		updateUser
	}));

	const authContextValue = useMemo(
		() => ({
			...authState,
			signIn,
			signUp,
			signOut: handleSignOut,
			updateUser
		}),
		[authState, signIn, signUp, handleSignOut, updateUser]
	);

	return <FirebaseAuthContext value={authContextValue}>{children}</FirebaseAuthContext>;
}

export default FirebaseAuthProvider;
