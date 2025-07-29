// src/app/flowstark/subscriptions/components/SubscriptionDetailModal.tsx
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
    Chip,
    Grid,
} from '@mui/material';
import {
    Close as CloseIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Schedule as ScheduleIcon,
    Payment as PaymentIcon,
    Euro as EuroIcon,
    CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { SubscriptionWithRelations } from '../hooks/useSubscriptions';

interface SubscriptionDetailModalProps {
    open: boolean;
    subscription: SubscriptionWithRelations | null;
    onClose: () => void;
}

export const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
    open,
    subscription,
    onClose,
}) => {
    if (!subscription) return null;

    const getFrequencyText = (frequency: string) => {
        switch (frequency) {
            case 'monthly':
                return 'Mensual';
            case 'quarterly':
                return 'Trimestral';
            case 'four_monthly':
                return 'Cuatrimestral';
            case 'biannual':
                return 'Semestral';
            case 'annual':
                return 'Anual';
            default:
                return frequency;
        }
    };

    const getPaymentTypeText = (paymentType: string) => {
        switch (paymentType) {
            case 'advance':
                return 'Anticipado';
            case 'arrears':
                return 'Vencido';
            default:
                return paymentType;
        }
    };

    const getPaymentMethodText = (paymentMethodType: string) => {
        switch (paymentMethodType) {
            case 'credit_card':
            case 'card': // Por si hay inconsistencias
                return 'Tarjeta de crédito';
            case 'cash':
                return 'Efectivo';
            case 'direct_debit':
                return 'Domiciliación';
            case 'bank_transfer':
            case 'transfer': // Por si hay inconsistencias
                return 'Transferencia bancaria';
            default:
                return 'No especificado';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'Activa';
            case 'expired':
                return 'Caducada';
            case 'ending':
                return 'Finalizando';
            default:
                return status;
        }
    };

    const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
        switch (status) {
            case 'active':
                return 'success';
            case 'expired':
                return 'error';
            case 'ending':
                return 'warning';
            default:
                return 'default';
        }
    };

    const formatPrice = (price: number | undefined): string => {
        return typeof price === 'number' ?
            `${price.toFixed(2)}€` :
            'No definido';
    };

    const formatDate = (date: Date | null | undefined): string => {
        if (!date) return 'No definida';

        try {
            return new Date(date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Fecha inválida';
        }
    };

    const getClientType = (): 'empresa' | 'particular' => {
        return (subscription.clientInfo?.fiscalName || subscription.clientInfo?.taxId) ?
            'empresa' : 'particular';
    };

    const getClientDisplayName = (): string => {
        const client = subscription.clientInfo;

        if (!client) return 'Cliente no encontrado';

        if (getClientType() === 'empresa') {
            return client.fiscalName || `${client.firstName} ${client.lastName}`;
        }

        return `${client.firstName} ${client.lastName}`;
    };

    // Calcular estado dinámico
    const getSubscriptionStatus = (): 'active' | 'expired' | 'ending' => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (subscription.endDate) {
            const endDate = new Date(subscription.endDate);
            endDate.setHours(0, 0, 0, 0);

            if (endDate <= today) {
                return 'expired';
            } else {
                return 'ending';
            }
        }

        return 'active';
    };

    const currentStatus = getSubscriptionStatus();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: '90vh',
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 2
            }}>
                <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
                    Detalles de la Suscripción
                </Typography>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 0 }}>
                <Box sx={{ mb: 3 }}>
                    {/* Estado de la suscripción */}
                    <Chip
                        label={getStatusText(currentStatus)}
                        color={getStatusColor(currentStatus)}
                        size="small"
                        sx={{ mb: 2 }}
                    />
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    {/* Información del Cliente */}
                    <Grid item xs={12}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 2
                            }}>
                                {getClientType() === 'empresa' ? (
                                    <BusinessIcon color="primary" fontSize="small" />
                                ) : (
                                    <PersonIcon color="primary" fontSize="small" />
                                )}
                                Cliente
                            </Typography>

                            <Box sx={{ pl: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Nombre
                                </Typography>
                                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                                    {getClientDisplayName()}
                                </Typography>

                                {subscription.clientInfo?.email && (
                                    <>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Email
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 2 }}>
                                            {subscription.clientInfo.email}
                                        </Typography>
                                    </>
                                )}

                                {subscription.clientInfo?.phone && (
                                    <>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Teléfono
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 2 }}>
                                            {subscription.clientInfo.phone}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Grid>

                    {/* Información del Servicio */}
                    <Grid item xs={12}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 2
                            }}>
                                <EuroIcon color="primary" fontSize="small" />
                                Servicio
                            </Typography>

                            <Box sx={{ pl: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Nombre del servicio
                                </Typography>
                                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                                    {subscription.serviceInfo?.name || 'Servicio no encontrado'}
                                </Typography>

                                {subscription.serviceInfo?.description && (
                                    <>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Descripción
                                        </Typography>
                                        <Typography variant="body1" sx={{ mb: 2 }}>
                                            {subscription.serviceInfo.description}
                                        </Typography>
                                    </>
                                )}

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Frecuencia
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <ScheduleIcon color="action" fontSize="small" />
                                            <Typography variant="body1">
                                                {getFrequencyText(subscription.serviceInfo?.frequency || '')}
                                            </Typography>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Precio
                                        </Typography>
                                        <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                                            {formatPrice(subscription.serviceInfo?.finalPrice || subscription.serviceInfo?.basePrice)}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Información de Fechas */}
                    <Grid item xs={12}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 2
                            }}>
                                <CalendarTodayIcon color="primary" fontSize="small" />
                                Fechas
                            </Typography>

                            <Grid container spacing={2} sx={{ pl: 3 }}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Fecha de inicio
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(subscription.startDate)}
                                    </Typography>
                                </Grid>

                                {subscription.endDate && (
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Fecha de finalización
                                        </Typography>
                                        <Typography variant="body1" color="warning.main">
                                            {formatDate(subscription.endDate)}
                                        </Typography>
                                    </Grid>
                                )}

                                {subscription.paymentDate && (
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Próximo cobro
                                        </Typography>
                                        <Typography variant="body1" color="primary.main">
                                            {formatDate(subscription.paymentDate)}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Grid>

                    {/* Información de Pago */}
                    <Grid item xs={12}>
                        <Box>
                            <Typography variant="subtitle1" gutterBottom sx={{
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 2
                            }}>
                                <PaymentIcon color="primary" fontSize="small" />
                                Configuración de Cobros
                            </Typography>

                            <Box sx={{ pl: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Tipo de cobro
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {getPaymentTypeText(subscription.paymentType || '')}
                                </Typography>

                                {subscription.clientInfo?.paymentMethod && (
                                    <>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Método de pago preferido
                                        </Typography>
                                        <Typography variant="body1">
                                            {getPaymentMethodText(subscription.clientInfo.paymentMethod.type || '')}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    color="primary"
                    sx={{ minWidth: 100 }}
                >
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};