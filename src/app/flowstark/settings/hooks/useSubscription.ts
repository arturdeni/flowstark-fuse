// src/app/flowstark/settings/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';
import { db } from '@/services/firebase/firestore';

export type PlanType = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

interface SubscriptionData {
  plan: PlanType;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
  limits: {
    maxClients: number;
    maxServices: number;
    maxSubscriptions: number;
  };
  lastPayment?: {
    date: Date;
    amount: number;
    status: 'paid' | 'failed';
    invoiceId: string;
  };
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const { authState } = useAuth();
  const user = authState?.user;

  useEffect(() => {
    console.log('useSubscription: useEffect triggered');
    console.log('useSubscription: authState:', authState);
    console.log('useSubscription: user object:', user);
    console.log('useSubscription: user.uid:', user?.uid);
    console.log('useSubscription: user.id:', (user as any)?.id);

    // Intentar con user.id en lugar de user.uid
    const userId = user?.uid || (user as any)?.id;

    if (!userId) {
      console.log('useSubscription: No user ID found (tried uid and id)');
      setLoading(false);
      return;
    }

    console.log('useSubscription: Setting up listener for user:', userId);

    // Escuchar cambios en tiempo real usando Firebase v8 compat
    const unsubscribe = db.collection('users').doc(userId).onSnapshot(
      (docSnap) => {
        console.log('useSubscription: Snapshot received, exists:', docSnap.exists);

        if (docSnap.exists) {
          const data = docSnap.data();
          console.log('useSubscription: Document data:', data);

          if (data && data.subscription) {
            console.log('useSubscription: Subscription data found:', data.subscription);
            setSubscription({
              ...data.subscription,
              currentPeriodEnd: data.subscription.currentPeriodEnd?.toDate(),
              trialEnd: data.subscription.trialEnd?.toDate(),
              lastPayment: data.subscription.lastPayment ? {
                ...data.subscription.lastPayment,
                date: data.subscription.lastPayment.date?.toDate()
              } : undefined
            });
          } else {
            // Si no tiene subscription, asignar plan free por defecto
            console.log('useSubscription: No subscription field found, using default free plan');
            setSubscription({
              plan: 'free',
              status: 'active',
              limits: {
                maxClients: 50,
                maxServices: 30,
                maxSubscriptions: 30
              }
            });
          }
        } else {
          console.log('useSubscription: Document does not exist');
        }

        setLoading(false);
      },
      (error) => {
        console.error('Error obteniendo suscripción:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, (user as any)?.id]);

  const isPremium = subscription?.plan === 'premium' && (subscription?.status === 'active' || subscription?.status === 'trialing');
  const isTrial = subscription?.status === 'trialing';
  const isCanceled = subscription?.status === 'canceled' || subscription?.cancelAtPeriodEnd;

  return {
    subscription,
    loading,
    isPremium,
    isTrial,
    isCanceled
  };
};
