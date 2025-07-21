// src/app/flowstark/subscriptions/components/PaymentDateDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Button,
    LinearProgress,
    Alert,
    Box,
    Chip,
    IconButton,
    Tooltip,
    Divider,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    AutoMode as AutoModeIcon,
} from '@mui/icons-material';
import { paymentDateService, PaymentDateUpdateResult } from '../../../../services/paymentDateService';

interface PaymentDateDashboardProps {
    onRefreshRequested?: () => void;
}

export const PaymentDateDashboard: React.FC<PaymentDateDashboardProps> = ({
    onRefreshRequested
}) => {
    const [stats, setStats] = useState({
        total: 0,
        withValidDates: 0,
        needingUpdate: 0,
        overdue: 0
    });
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [updateResult, setUpdateResult] = useState<PaymentDateUpdateResult | null>(null);
    const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);

    // Cargar estadísticas iniciales
    useEffect(() => {
        loadStats();
    }, []);

    // Configurar actualización automática
    useEffect(() => {
        if (!autoUpdateEnabled) return;

        const cleanup = paymentDateService.scheduleAutoUpdate(60); // Cada hora
        return cleanup;
    }, [autoUpdateEnabled]);

    const loadStats = async () => {
        try {
            const newStats = await paymentDateService.getPaymentDateStats();
            setStats(newStats);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    };

    const handleManualUpdate = async () => {
        setLoading(true);
        setUpdateResult(null);
        
        try {
            const result = await paymentDateService.autoUpdatePaymentDates();
            setUpdateResult(result);
            setLastUpdate(new Date());
            
            // Recargar estadísticas después de la actualización
            await loadStats();
            
            // Notificar al componente padre que debe refrescar
            if (onRefreshRequested) {
                onRefreshRequested();
            }
        } catch (error) {
            console.error('Error en actualización manual:', error);
            setUpdateResult({
                updated: 0,
                failed: 1,
                errors: [{ subscriptionId: 'manual', error: 'Error en actualización manual' }]
            });
        } finally {
            setLoading(false);
        }
    };

    const getHealthStatus = () => {
        const percentage = stats.total > 0 ? (stats.withValidDates / stats.total) * 100 : 100;
        
        if (percentage >= 95) return { color: 'success', label: 'Excelente' };
        if (percentage >= 80) return { color: 'warning', label: 'Bueno' };
        return { color: 'error', label: 'Necesita atención' };
    };

    const formatDateTime = (date: Date | null) => {
        if (!date) return 'Nunca';
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const healthStatus = getHealthStatus();

    return (
        <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" gutterBottom>
                        Estado de Fechas de Pago
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center">
                        <Tooltip title={autoUpdateEnabled ? "Desactivar actualización automática" : "Activar actualización automática"}>
                            <IconButton
                                onClick={() => setAutoUpdateEnabled(!autoUpdateEnabled)}
                                color={autoUpdateEnabled ? "primary" : "default"}
                                size="small"
                            >
                                <AutoModeIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Actualizar ahora">
                            <IconButton
                                onClick={handleManualUpdate}
                                disabled={loading}
                                color="primary"
                                size="small"
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {loading && (
                    <Box mb={2}>
                        <LinearProgress />
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            Actualizando fechas de pago...
                        </Typography>
                    </Box>
                )}

                <Grid container spacing={2} mb={2}>
                    <Grid item xs={12} sm={3}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Typography variant="h4" color="primary" gutterBottom>
                                    {stats.total}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Suscripciones
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={1}>
                                    <CheckCircleIcon color="success" fontSize="small" />
                                    <Typography variant="h4" color="success.main">
                                        {stats.withValidDates}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Con Fecha Válida
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={1}>
                                    <ScheduleIcon color="warning" fontSize="small" />
                                    <Typography variant="h4" color="warning.main">
                                        {stats.needingUpdate}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Necesitan Actualización
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={1}>
                                    <WarningIcon color="error" fontSize="small" />
                                    <Typography variant="h4" color="error.main">
                                        {stats.overdue}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Vencidas
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Typography variant="body2" color="text.secondary">
                        Estado general:
                    </Typography>
                    <Chip 
                        label={healthStatus.label}
                        color={healthStatus.color as any}
                        size="small"
                        icon={<InfoIcon />}
                    />
                    <Typography variant="body2" color="text.secondary">
                        Auto-actualización: {autoUpdateEnabled ? 'Activa' : 'Inactiva'}
                    </Typography>
                </Box>

                {updateResult && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" gutterBottom>
                            Última Actualización Manual
                        </Typography>
                        
                        {updateResult.updated > 0 && (
                            <Alert severity="success" sx={{ mb: 1 }}>
                                ✅ Se actualizaron {updateResult.updated} fechas de pago exitosamente
                            </Alert>
                        )}
                        
                        {updateResult.failed > 0 && (
                            <Alert severity="error" sx={{ mb: 1 }}>
                                ❌ {updateResult.failed} actualizaciones fallaron
                                {updateResult.errors.length > 0 && (
                                    <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                                        {updateResult.errors.slice(0, 3).map((error, index) => (
                                            <li key={index}>
                                                <Typography variant="caption">
                                                    {error.subscriptionId}: {error.error}
                                                </Typography>
                                            </li>
                                        ))}
                                        {updateResult.errors.length > 3 && (
                                            <li>
                                                <Typography variant="caption">
                                                    ... y {updateResult.errors.length - 3} errores más
                                                </Typography>
                                            </li>
                                        )}
                                    </Box>
                                )}
                            </Alert>
                        )}
                        
                        {updateResult.updated === 0 && updateResult.failed === 0 && (
                            <Alert severity="info">
                                ℹ️ No se encontraron fechas de pago que necesiten actualización
                            </Alert>
                        )}
                    </>
                )}

                {lastUpdate && (
                    <Typography variant="caption" color="text.secondary">
                        Última actualización manual: {formatDateTime(lastUpdate)}
                    </Typography>
                )}

                <Box mt={2}>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={handleManualUpdate}
                        disabled={loading}
                        size="small"
                    >
                        Recalcular Todas las Fechas
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};