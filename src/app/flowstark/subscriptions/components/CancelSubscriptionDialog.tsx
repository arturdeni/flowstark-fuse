// src/app/flowstark/subscriptions/components/CancelSubscriptionDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Button,
    Typography,
    CircularProgress,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import {
    Warning as WarningIcon,
} from '@mui/icons-material';

interface CancelSubscriptionDialogProps {
    open: boolean;
    loading: boolean;
    subscriptionName?: string;
    onConfirm: (endDate: Date) => void;
    onCancel: () => void;
}

export const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
    open,
    loading,
    subscriptionName,
    onConfirm,
    onCancel,
}) => {
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [validationError, setValidationError] = useState('');

    // Establecer fecha de hoy como valor por defecto cuando se abre el diálogo
    useEffect(() => {
        if (open) {
            const today = new Date();
            setEndDate(today);
            setValidationError('');
        }
    }, [open]);

    const handleConfirm = () => {
        // Validar que se haya seleccionado una fecha
        if (!endDate) {
            setValidationError('Por favor, selecciona una fecha de finalización');
            return;
        }

        // Validar que la fecha no sea anterior a hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
        const selectedDate = new Date(endDate);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            setValidationError('La fecha de finalización no puede ser anterior a hoy');
            return;
        }

        // Confirmar cancelación
        onConfirm(endDate);
    };

    const handleDateChange = (date: Date | null) => {
        setEndDate(date);

        if (validationError) {
            setValidationError('');
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Dialog
                open={open}
                onClose={onCancel}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <WarningIcon color="warning" sx={{ fontSize: '2rem' }} />
                        <Typography variant="h6" component="div">
                            Cancelar Suscripción
                        </Typography>
                    </Box>
                </DialogTitle>

                <DialogContent sx={{ pt: 1 }}>
                    {validationError && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                            <Typography color="error" variant="body2">
                                {validationError}
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="body1" sx={{ mb: 3 }}>
                        ¿Estás seguro de que quieres cancelar la suscripción
                        {subscriptionName && (
                            <strong> "{subscriptionName}"</strong>
                        )}?
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Esta acción no se puede deshacer. Una vez cancelada, la suscripción no se podrá editar ni reactivar.
                    </Typography>

                    <DatePicker
                        label="Fecha de finalización"
                        value={endDate}
                        onChange={handleDateChange}
                        format="dd/MM/yyyy"
                        sx={{ width: '100%', mt: 1 }}
                        slotProps={{
                            textField: {
                                required: true,
                                helperText: 'Selecciona cuándo debe finalizar la suscripción',
                                size: 'small',
                                variant: 'outlined',
                                fullWidth: true,
                            },
                        }}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button
                        onClick={onCancel}
                        disabled={loading}
                        color="inherit"
                    >
                        Mantener Activa
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        color="error"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Cancelando...' : 'Cancelar Suscripción'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};