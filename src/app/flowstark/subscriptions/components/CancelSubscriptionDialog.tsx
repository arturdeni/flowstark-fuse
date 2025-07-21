// src/app/flowstark/subscriptions/components/CancelSubscriptionDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
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
    clientName?: string;
    onConfirm: (endDate: Date) => void;
    onCancel: () => void;
}

export const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
    open,
    loading,
    subscriptionName,
    clientName,
    onConfirm,
    onCancel,
}) => {
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [dateError, setDateError] = useState<string>('');

    // Inicializar con la fecha de hoy cuando se abre el diálogo
    useEffect(() => {
        if (open) {
            const today = new Date();
            setEndDate(today);
            setDateError('');
        }
    }, [open]);

    // Manejar cambio de fecha
    const handleDateChange = (date: Date | null) => {
        setEndDate(date);

        // Validar fecha
        if (!date) {
            setDateError('La fecha es obligatoria');
            return;
        }

        const today = new Date();
        today.setHours(23, 59, 59, 999); // Fin del día de hoy

        if (date > today) {
            setDateError('La fecha no puede ser futura');
        } else {
            setDateError('');
        }
    };

    // Manejar confirmación
    const handleConfirm = () => {
        if (!endDate) {
            setDateError('La fecha es obligatoria');
            return;
        }

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (endDate > today) {
            setDateError('La fecha no puede ser futura');
            return;
        }

        onConfirm(endDate);
    };

    // Manejar cancelación
    const handleCancel = () => {
        setEndDate(null);
        setDateError('');
        onCancel();
    };

    // Función para validar si la fecha es válida
    const isDateValid = endDate && !dateError;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Dialog
                open={open}
                onClose={handleCancel}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <WarningIcon color="warning" />
                        Finalizar Suscripción
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        ¿Estás seguro de que quieres finalizar esta suscripción?
                    </Typography>

                    {/* Información de la suscripción */}
                    {(subscriptionName || clientName) && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            {clientName && (
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                                    <strong>Cliente:</strong> {clientName}
                                </Typography>
                            )}
                            {subscriptionName && (
                                <Typography variant="body2" color="textSecondary">
                                    <strong>Servicio:</strong> {subscriptionName}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Campo de fecha */}
                    <Box sx={{ mb: 2 }}>
                        <DatePicker
                            label="Fecha de finalización"
                            value={endDate}
                            onChange={handleDateChange}
                            format="dd/MM/yyyy"
                            maxDate={new Date()} // No permitir fechas futuras
                            slotProps={{
                                textField: {
                                    required: true,
                                    error: !!dateError,
                                    helperText: dateError || 'Fecha en la que finaliza la suscripción (hoy o anterior)',
                                    size: 'small',
                                    variant: 'outlined',
                                    fullWidth: true,
                                },
                            }}
                        />
                    </Box>

                    <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                            La suscripción se marcará como finalizada en la fecha indicada.
                            Si la fecha es hoy o anterior, aparecerá como "Caducada".
                            Si es futura, aparecerá como "Finaliza".
                        </Typography>
                    </Alert>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={handleCancel}
                        disabled={loading}
                        color="inherit"
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={handleConfirm}
                        disabled={loading || !isDateValid}
                        color="warning"
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        {loading ? 'Finalizando...' : 'Finalizar Suscripción'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};