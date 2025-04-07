import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Asegurarse de que Firebase está inicializado
import { initializeFirebase } from '@auth/services/firebase/initializeFirebase';
initializeFirebase();

// Usar la instancia de Firestore existente
const db = firebase.firestore();

export { db };
