// src/app/flowstark/settings/hooks/useSubscriptionManagement.ts
import { useState } from 'react';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/functions';

export const useSubscriptionManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const user = authState?.user;

  const cancelSubscription = async (immediately = false) => {
    if (!user) {
      setError('Usuario no autenticado');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const functions = firebase.app().functions('europe-west1');
      const cancelFn = functions.httpsCallable('cancelSubscription');

      await cancelFn({ immediately });

      return true;
    } catch (err: any) {
      console.error('Error cancelando suscripción:', err);

      let errorMessage = 'Error al cancelar la suscripción. Por favor, inténtalo de nuevo.';

      if (err?.code === 'failed-precondition') {
        errorMessage = 'No hay suscripción activa para cancelar.';
      } else if (err?.code === 'unauthenticated') {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reactivateSubscription = async () => {
    if (!user) {
      setError('Usuario no autenticado');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const functions = firebase.app().functions('europe-west1');
      const reactivateFn = functions.httpsCallable('reactivateSubscription');

      await reactivateFn({});

      return true;
    } catch (err: any) {
      console.error('Error reactivando suscripción:', err);

      let errorMessage = 'Error al reactivar la suscripción. Por favor, inténtalo de nuevo.';

      if (err?.code === 'failed-precondition') {
        errorMessage = 'La suscripción no está programada para cancelación.';
      } else if (err?.code === 'unauthenticated') {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cancelSubscription,
    reactivateSubscription,
    isLoading,
    error
  };
};
