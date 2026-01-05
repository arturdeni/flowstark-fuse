// src/app/flowstark/tickets/components/PaymentDateDialog.tsx
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
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import {
    Payment as PaymentIcon,
} from '@mui/icons-material';

interface PaymentDateDialogProps {
    open: boolean;
    loading: boolean;
    onConfirm: (paidDate: Date) => void;
    onCancel: () => void;
}

export const PaymentDateDialog: React.FC<PaymentDateDialogProps> = ({
    open,
    loading,
    onConfirm,
    onCancel,
}) => {
    const [paidDate, setPaidDate] = useState<Date | null>(null);
    const [dateError, setDateError] = useState<string>('');

    // Inicializar con la fecha de hoy cuando se abre el diálogo
    useEffect(() => {
        if (open) {
            const today = new Date();
            setPaidDate(today);
            setDateError('');
        }
    }, [open]);

    // Manejar cambio de fecha
    const handleDateChange = (date: Date | null) => {
        setPaidDate(date);

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
        if (!paidDate) {
            setDateError('La fecha es obligatoria');
            return;
        }

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (paidDate > today) {
            setDateError('La fecha no puede ser futura');
            return;
        }

        onConfirm(paidDate);
    };

    // Manejar cancelación
    const handleCancel = () => {
        setPaidDate(null);
        setDateError('');
        onCancel();
    };

    // Función para validar si la fecha es válida
    const isDateValid = paidDate && !dateError;

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
                        <PaymentIcon color="success" />
                        Marcar como Cobrado
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        ¿Cuándo fue cobrado este ticket?
                    </Typography>

                    {/* Campo de fecha */}
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <DatePicker
                            label="Fecha de cobro"
                            value={paidDate}
                            onChange={handleDateChange}
                            format="dd/MM/yyyy"
                            maxDate={new Date()} // No permitir fechas futuras
                            slotProps={{
                                textField: {
                                    required: true,
                                    error: !!dateError,
                                    helperText: dateError || 'Fecha en la que se realizó el cobro (hoy o anterior)',
                                    size: 'small',
                                    variant: 'outlined',
                                    fullWidth: true,
                                },
                            }}
                        />
                    </Box>
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
                        color="success"
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={16} /> : null}
                    >
                        {loading ? 'Marcando...' : 'Marcar como Cobrado'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};