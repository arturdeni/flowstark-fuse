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
    const totalCount = subscriptions.length;

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
                <Card
                    elevation={1}
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            Activas
                        </Typography>
                        <Typography variant="h4" component="div">
                            {activeCount}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card
                    elevation={1}
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            Finalizando
                        </Typography>
                        <Typography variant="h4" component="div">
                            {endingCount}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card
                    elevation={1}
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                >
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
                <Card
                    elevation={1}
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                        border: '1px solid rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom variant="body2">
                            Total de Suscripciones
                        </Typography>
                        <Typography variant="h4" component="div">
                            {totalCount}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};