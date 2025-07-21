// src/app/flowstark/subscriptions/components/SubscriptionSummaryCards.tsx
import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
} from '@mui/material';
import { SubscriptionWithRelations } from '../hooks/useSubscriptions';

interface SubscriptionSummaryCardsProps {
    subscriptions: SubscriptionWithRelations[];
}

// Función para calcular el estado dinámico de la suscripción
const getSubscriptionStatus = (subscription: SubscriptionWithRelations): 'active' | 'expired' | 'ending' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (subscription.endDate) {
        const endDate = new Date(subscription.endDate);
        endDate.setHours(0, 0, 0, 0);

        if (endDate < today) {
            return 'expired';
        } else if (endDate >= today) {
            return 'ending';
        }
    }

    return subscription.status === 'cancelled' ? 'expired' : 'active';
};

export const SubscriptionSummaryCards: React.FC<SubscriptionSummaryCardsProps> = ({
    subscriptions,
}) => {
    const totalSubscriptions = subscriptions.length;

    // Calcular estados usando la función dinámica
    const activeSubscriptions = subscriptions.filter(s => getSubscriptionStatus(s) === 'active').length;
    const endingSubscriptions = subscriptions.filter(s => getSubscriptionStatus(s) === 'ending').length;
    const expiredSubscriptions = subscriptions.filter(s => getSubscriptionStatus(s) === 'expired').length;

    return (
        <Grid container spacing={3} className="mb-6">
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Total Suscripciones
                        </Typography>
                        <Typography variant="h4">{totalSubscriptions}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Activas
                        </Typography>
                        <Typography variant="h4">{activeSubscriptions}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Finalizan
                        </Typography>
                        <Typography variant="h4">{endingSubscriptions}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Caducadas
                        </Typography>
                        <Typography variant="h4">{expiredSubscriptions}</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};