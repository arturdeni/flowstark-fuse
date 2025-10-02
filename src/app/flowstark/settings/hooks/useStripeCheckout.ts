// src/app/flowstark/settings/hooks/useStripeCheckout.ts
import { useState } from 'react';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';

interface CheckoutResponse {
  success: boolean;
  url: string;
  sessionId: string;
}

export const useStripeCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const user = authState?.user;

  const createCheckout = async (returnUrl?: string) => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Configurar la región correcta: europe-west1 (donde están desplegadas las funciones)
      const functions = firebase.app().functions('europe-west1');

      // Primero, asegurarse de que el usuario tiene un customer de Stripe
      const createStripeCustomer = functions.httpsCallable('createStripeCustomer');

      console.log('Creando/verificando cliente Stripe...');
      await createStripeCustomer({
        email: user.email,
        name: user.displayName || user.email
      });

      // Ahora crear la sesión de checkout
      const createCheckoutSession = functions.httpsCallable('createCheckoutSession');

      // URL de retorno (donde volver después del pago)
      const finalReturnUrl = returnUrl || `${window.location.origin}/settings?upgrade=success`;

      console.log('Creando sesión de checkout...');
      const result = await createCheckoutSession({
        returnUrl: finalReturnUrl
      });

      const data = result.data as CheckoutResponse;

      if (data.success && data.url) {
        console.log('Redirigiendo a Stripe Checkout...');
        // Redirigir a Stripe Checkout
        window.location.href = data.url;
        return data;
      } else {
        throw new Error('No se pudo crear la sesión de checkout');
      }
    } catch (err: any) {
      console.error('Error en checkout:', err);

      let errorMessage = 'Error al procesar el upgrade. Por favor, inténtalo de nuevo.';

      if (err?.code === 'already-exists') {
        errorMessage = 'Ya tienes una suscripción premium activa.';
      } else if (err?.code === 'failed-precondition') {
        errorMessage = 'Error de configuración. Necesitas completar tu perfil primero.';
      } else if (err?.code === 'unauthenticated') {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckout,
    isLoading,
    error
  };
};
