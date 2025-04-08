import './styles/index.css';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { initializeFirebase } from '@auth/services/firebase/initializeFirebase';
import routes from 'src/configs/routesConfig';

// Inicializar Firebase lo antes posible
const firebaseInitialized = initializeFirebase();

// Función de configuración inicial vacía, ya no iniciamos MSW
async function appSetup() {
	// Aquí puedes mantener cualquier otra configuración inicial que necesites
	return Promise.resolve();
}

/**
 * The root element of the application.
 */
const container = document.getElementById('app');

if (!container) {
	throw new Error('Failed to find the root element');
}

appSetup().then(() => {
	/**
	 * The root component of the application.
	 */
	const root = createRoot(container, {
		onUncaughtError: (error, errorInfo) => {
			console.error('UncaughtError error', error, errorInfo.componentStack);
		},
		onCaughtError: (error, errorInfo) => {
			console.error('Caught error', error, errorInfo.componentStack);
		}
	});

	const router = createBrowserRouter(routes);

	root.render(<RouterProvider router={router} />);
});
