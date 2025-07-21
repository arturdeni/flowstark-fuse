// src/app/flowstark/services/components/ServiceDetailModal.tsx
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
    Euro as EuroIcon,
    Schedule as ScheduleIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { Service } from '../../../../types/models';

interface ServiceDetailModalProps {
    open: boolean;
    service: Service | null;
    onClose: () => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
    open,
    service,
    onClose,
}) => {
    if (!service) return null;

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

    const formatPrice = (price: number | undefined): string => {
        return typeof price === 'number' ? 
            `${price.toFixed(2)}€` : 
            'No definido';
    };

    const formatPercentage = (percentage: number | undefined): string => {
        return typeof percentage === 'number' ? 
            `${percentage.toFixed(2)}%` : 
            'No definido';
    };

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
                    Detalles del Servicio
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
                    {/* Nombre del servicio */}
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                        {service.name}
                    </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    {/* Información básica */}
                    <Grid item xs={12}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ 
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mb: 2
                            }}>
                                <InfoIcon color="primary" fontSize="small" />
                                Información Básica
                            </Typography>
                            
                            <Box sx={{ pl: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Descripción
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 2, fontStyle: service.description ? 'normal' : 'italic' }}>
                                    {service.description || 'Sin descripción'}
                                </Typography>

                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Frecuencia de facturación
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <ScheduleIcon color="action" fontSize="small" />
                                    <Typography variant="body1">
                                        {getFrequencyText(service.frequency)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Información de precios */}
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
                                Información de Precios
                            </Typography>
                            
                            <Grid container spacing={2} sx={{ pl: 3 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Precio Base
                                    </Typography>
                                    <Typography variant="h6" color="primary.main">
                                        {formatPrice(service.basePrice)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        IVA
                                    </Typography>
                                    <Typography variant="h6">
                                        {formatPercentage(service.vat)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Retención
                                    </Typography>
                                    <Typography variant="h6">
                                        {formatPercentage(service.retention)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Precio Final
                                    </Typography>
                                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                                        {formatPrice(service.finalPrice)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    {/* Suscripciones activas */}
                    <Grid item xs={12}>
                        <Box>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                                Estadísticas
                            </Typography>
                            
                            <Box sx={{ pl: 3 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Suscripciones activas
                                </Typography>
                                <Chip
                                    label={(service as any).activeSubscriptions || 0}
                                    color={(service as any).activeSubscriptions > 0 ? 'primary' : 'default'}
                                    sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        minWidth: '28px',
                                        height: '24px',
                                        borderRadius: '12px',
                                    }}
                                />
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