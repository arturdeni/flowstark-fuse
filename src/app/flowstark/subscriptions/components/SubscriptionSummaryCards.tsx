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

    // Si tiene endDate, verificar si ya ha caducado
    if (subscription.endDate) {
        const endDate = new Date(subscription.endDate);
        endDate.setHours(0, 0, 0, 0);

        // Si la fecha de fin es hoy o anterior, está caducada
        if (endDate <= today) {
            return 'expired';
        } else {
            // Si la fecha de fin es futura, está finalizando
            return 'ending';
        }
    }

    // Si no tiene endDate, está activa
    return 'active';
};

export const SubscriptionSummaryCards: React.FC<SubscriptionSummaryCardsProps> = ({ subscriptions }) => {
    // Calcular métricas
    const activeCount = subscriptions.filter(sub => getSubscriptionStatus(sub) === 'active').length;
    const endingCount = subscriptions.filter(sub => getSubscriptionStatus(sub) === 'ending').length;
    const expiredCount = subscriptions.filter(sub => getSubscriptionStatus(sub) === 'expired').length;
    
    const totalRevenue = subscriptions
        .filter(sub => getSubscriptionStatus(sub) === 'active')
        .reduce((sum, sub) => {
            const price = sub.serviceInfo?.finalPrice || sub.serviceInfo?.basePrice || 0;
            return sum + price;
        }, 0);

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            Suscripciones Activas
                        </Typography>
                        <Typography variant="h4" component="div">
                            {activeCount}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            Finalizan
                        </Typography>
                        <Typography variant="h4" component="div">
                            {endingCount}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            Caducadas
                        </Typography>
                        <Typography variant="h4" component="div">
                            {expiredCount}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            Ingresos Mensuales
                        </Typography>
                        <Typography variant="h4" component="div">
                            €{totalRevenue.toFixed(2)}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};