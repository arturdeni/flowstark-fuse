// src/app/flowstark/dashboard/components/DashboardServicePopularity.tsx
import React from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    Box,
    Typography,
    LinearProgress,
    Divider,
    Chip,
    Grid,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { ServicePopularity } from '../hooks/useDashboard';

interface DashboardServicePopularityProps {
    servicePopularity: ServicePopularity[];
    loading: boolean;
}

export const DashboardServicePopularity: React.FC<DashboardServicePopularityProps> = ({
    servicePopularity,
    loading,
}) => {
    const formatCurrency = (amount: number): string => {
        return `€${amount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getProgressColor = (index: number) => {
        const colors = ['primary', 'secondary', 'success', 'warning', 'info'];
        return colors[index % colors.length];
    };

    const cardStyle = {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
    };

    if (loading) {
        return (
            <Card sx={cardStyle}>
                <CardHeader
                    title="Popularidad de Servicios"
                    titleTypographyProps={{ variant: 'h6' }}
                />
                <Divider />
                <CardContent>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="textSecondary">Cargando datos de servicios...</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (servicePopularity.length === 0) {
        return (
            <Card sx={cardStyle}>
                <CardHeader
                    title="Popularidad de Servicios"
                    titleTypographyProps={{ variant: 'h6' }}
                />
                <Divider />
                <CardContent>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="textSecondary">No hay datos de servicios disponibles</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    const topService = servicePopularity[0];
    const maxSubscriptions = Math.max(...servicePopularity.map(s => s.subscriptions));

    return (
        <Card sx={cardStyle}>
            <CardHeader
                title="Popularidad de Servicios"
                titleTypographyProps={{ variant: 'h6' }}
                action={
                    <Chip
                        icon={<StarIcon />}
                        label="Top 5"
                        color="primary"
                        variant="outlined"
                        size="small"
                    />
                }
            />
            <Divider />
            <CardContent>
                <Grid container spacing={3}>
                    {/* Servicio más popular destacado */}
                    <Grid item xs={12} md={4}>
                        <Box 
                            sx={{ 
                                p: 3, 
                                bgcolor: 'primary.light', 
                                borderRadius: 2, 
                                color: 'primary.contrastText',
                                textAlign: 'center',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <TrendingUpIcon sx={{ fontSize: 48, mb: 1, mx: 'auto' }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Servicio Estrella
                            </Typography>
                            <Typography variant="h5" sx={{ mb: 1 }}>
                                {topService.name}
                            </Typography>
                            <Typography variant="body1">
                                {topService.subscriptions} suscripciones activas
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                                {formatCurrency(topService.revenue)} ingresos/mes
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Lista de todos los servicios */}
                    <Grid item xs={12} md={8}>
                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Ranking de Servicios
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {servicePopularity.map((service, index) => (
                                <Box key={service.name}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Chip
                                                label={`#${index + 1}`}
                                                size="small"
                                                color={index === 0 ? 'primary' : 'default'}
                                                variant={index === 0 ? 'filled' : 'outlined'}
                                            />
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {service.name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {service.subscriptions} suscripciones
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {formatCurrency(service.revenue)}/mes
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(service.subscriptions / maxSubscriptions) * 100}
                                            color={getProgressColor(index) as any}
                                            sx={{ 
                                                flex: 1, 
                                                height: 8, 
                                                borderRadius: 1,
                                                bgcolor: 'grey.100'
                                            }}
                                        />
                                        <Typography variant="caption" color="textSecondary" sx={{ minWidth: 45 }}>
                                            {service.percentage.toFixed(1)}%
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};