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
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Escuchar cambios en tiempo real usando Firebase v8 compat
    const unsubscribe = db.collection('users').doc(user.uid as string).onSnapshot(
      (docSnap) => {
        if (docSnap.exists) {
          const data = docSnap.data();

          if (data && data.subscription) {
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
            setSubscription({
              plan: 'free',
              status: 'active',
              limits: {
                maxClients: 5,
                maxServices: 2,
                maxSubscriptions: 10
              }
            });
          }
        }

        setLoading(false);
      },
      (error) => {
        console.error('Error obteniendo suscripción:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active';
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
