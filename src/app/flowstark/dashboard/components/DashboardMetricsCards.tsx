// src/app/flowstark/dashboard/components/DashboardMetricsCards.tsx
import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Avatar,
    Chip,
} from '@mui/material';
import {
    Subscriptions as SubscriptionsIcon,
    People as PeopleIcon,
    Inventory as InventoryIcon,
    TrendingUp as TrendingUpIcon,
    Euro as EuroIcon,
    Schedule as ScheduleIcon,
    Assessment as AssessmentIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { DashboardMetrics } from '../hooks/useDashboard';

interface DashboardMetricsCardsProps {
    metrics: DashboardMetrics;
    loading: boolean;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    color,
    trend
}) => (
    <Card
        sx={{
            height: '100%',
            minHeight: 140,
            position: 'relative',
            overflow: 'visible',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease',
            '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                transform: 'translateY(-2px)',
            }
        }}
    >
        <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
                    {title}
                </Typography>
                <Box
                    sx={{
                        color: `${color}.main`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        ml: 1,
                        '& svg': {
                            fontSize: 28,
                        }
                    }}
                >
                    {icon}
                </Box>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.75rem', lineHeight: 1.2 }}>
                        {value}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.813rem', lineHeight: 1.3 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {trend && (
                    <Box sx={{ mt: 1 }}>
                        <Chip
                            size="small"
                            label={`${trend.isPositive ? '+' : ''}${trend.value.toFixed(1)}%`}
                            color={trend.isPositive ? 'success' : 'error'}
                            sx={{ fontSize: '0.75rem', height: 22 }}
                        />
                    </Box>
                )}
            </Box>
        </CardContent>
    </Card>
);

export const DashboardMetricsCards: React.FC<DashboardMetricsCardsProps> = ({
    metrics,
    loading,
}) => {
    const formatCurrency = (amount: number): string => {
        return `€${amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const formatDecimal = (amount: number): string => {
        return `€${amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const metricsData = [
        {
            title: 'Suscripciones Activas',
            value: loading ? '...' : metrics.activeSubscriptions,
            subtitle: `de ${metrics.totalSubscriptions} totales`,
            icon: <SubscriptionsIcon />,
            color: 'success',
            trend: metrics.growthRate !== 0 ? {
                value: metrics.growthRate,
                isPositive: metrics.growthRate > 0
            } : undefined,
        },
        {
            title: 'Ingresos Mensuales',
            value: loading ? '...' : formatCurrency(metrics.monthlyRevenue),
            subtitle: 'Ingresos recurrentes',
            icon: <EuroIcon />,
            color: 'primary',
        },
        {
            title: 'Clientes Activos',
            value: loading ? '...' : metrics.activeClients,
            subtitle: `de ${metrics.totalClients} registrados`,
            icon: <PeopleIcon />,
            color: 'info',
        },
        {
            title: 'Servicios Disponibles',
            value: loading ? '...' : metrics.activeServices,
            subtitle: `de ${metrics.totalServices} creados`,
            icon: <InventoryIcon />,
            color: 'secondary',
        },
        {
            title: 'Valor Promedio',
            value: loading ? '...' : formatDecimal(metrics.averageSubscriptionValue),
            subtitle: 'Por suscripción/mes',
            icon: <AssessmentIcon />,
            color: 'warning',
        },
        {
            title: 'Próximas Renovaciones',
            value: loading ? '...' : metrics.pendingRenewals,
            subtitle: 'En los próximos 30 días',
            icon: <ScheduleIcon />,
            color: 'info',
        },
        {
            title: 'Suscripciones Canceladas',
            value: loading ? '...' : metrics.cancelledSubscriptions,
            subtitle: 'Total históricas',
            icon: <CancelIcon />,
            color: 'error',
        },
        {
            title: 'Tasa de Crecimiento',
            value: loading ? '...' : `${metrics.growthRate.toFixed(1)}%`,
            subtitle: 'Últimos 3 meses',
            icon: <TrendingUpIcon />,
            color: metrics.growthRate >= 0 ? 'success' : 'error',
        },
    ];

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {metricsData.map((metric, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <MetricCard {...metric} />
                </Grid>
            ))}
        </Grid>
    );
};