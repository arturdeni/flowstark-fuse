// src/app/flowstark/dashboard/components/DashboardSummaryCards.tsx
import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Box,
    Typography,
    Avatar,
} from '@mui/material';
import {
    Person as PersonIcon,
    Autorenew as AutorenewIcon,
    AttachMoney as MoneyIcon,
    Inventory as InventoryIcon,
} from '@mui/icons-material';
import { DashboardMetrics } from '../hooks/useDashboard';

interface DashboardSummaryCardsProps {
    metrics: DashboardMetrics;
}

export const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
    metrics,
}) => {
    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
                <Card elevation={1}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                <PersonIcon />
                            </Avatar>
                            <Typography variant="h6" component="div">
                                Suscripciones
                            </Typography>
                        </Box>
                        <Typography variant="h4">{metrics.totalSubscriptions}</Typography>
                        <Typography variant="subtitle2" color="textSecondary">
                            {metrics.activeSubscriptions} activas
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card elevation={1}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                                <AutorenewIcon />
                            </Avatar>
                            <Typography variant="h6" component="div">
                                Renovaciones
                            </Typography>
                        </Box>
                        <Typography variant="h4">{metrics.pendingRenewals}</Typography>
                        <Typography variant="subtitle2" color="textSecondary">
                            Pendientes este mes
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card elevation={1}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                                <MoneyIcon />
                            </Avatar>
                            <Typography variant="h6" component="div">
                                Ingresos
                            </Typography>
                        </Box>
                        <Typography variant="h4">{metrics.monthlyRevenue.toFixed(2)} €</Typography>
                        <Typography variant="subtitle2" color="textSecondary">
                            Facturación mensual
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
                <Card elevation={1}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                                <InventoryIcon />
                            </Avatar>
                            <Typography variant="h6" component="div">
                                Valor Medio
                            </Typography>
                        </Box>
                        <Typography variant="h4">{metrics.averageSubscriptionValue.toFixed(2)} €</Typography>
                        <Typography variant="subtitle2" color="textSecondary">
                            Por suscripción
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};