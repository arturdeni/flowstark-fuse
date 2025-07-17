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

export const SubscriptionSummaryCards: React.FC<SubscriptionSummaryCardsProps> = ({
    subscriptions,
}) => {
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled').length;

    return (
        <Grid container spacing={3} className="mb-6">
            <Grid item xs={12} sm={6} md={4}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Total Suscripciones
                        </Typography>
                        <Typography variant="h4">{totalSubscriptions}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Activas
                        </Typography>
                        <Typography variant="h4">{activeSubscriptions}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <Card>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                            Canceladas
                        </Typography>
                        <Typography variant="h4">{cancelledSubscriptions}</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};