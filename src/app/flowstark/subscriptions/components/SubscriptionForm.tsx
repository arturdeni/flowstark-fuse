// src/app/flowstark/subscriptions/components/SubscriptionForm.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import {
    Person as PersonIcon,
    Inventory as InventoryIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Subscription, Client, Service } from '../../../../types/models';
import { SubscriptionWithRelations } from '../hooks/useSubscriptions';

interface SubscriptionFormProps {
    open: boolean;
    selectedSubscription: SubscriptionWithRelations | null;
    clients: Client[];
    services: Service[];
    loading: boolean;
    onClose: () => void;
    onSave: (subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onUpdate: (id: string, subscriptionData: Partial<Subscription>) => Promise<void>;
}

interface FormData {
    clientId: string;
    serviceId: string;
    status: 'active' | 'cancelled';
    startDate: Date;
    endDate: Date | null;
    paymentType: 'advance' | 'arrears';
    paymentHistory: any[];
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
    open,
    selectedSubscription,
    clients,
    services,
    loading,
    onClose,
    onSave,
    onUpdate,
}) => {
    const [formData, setFormData] = useState<FormData>({
        clientId: '',
        serviceId: '',
        status: 'active',
        startDate: new Date(),
        endDate: null,
        paymentType: 'advance', // Por defecto pago anticipado
        paymentHistory: [],
    });

    const [validationError, setValidationError] = useState<string>('');

    // Actualizar formulario cuando cambie la suscripción seleccionada
    useEffect(() => {
        if (selectedSubscription) {
            setFormData({
                clientId: selectedSubscription.clientId,
                serviceId: selectedSubscription.serviceId,
                status: selectedSubscription.status,
                startDate: selectedSubscription.startDate,
                endDate: selectedSubscription.endDate,
                paymentType: selectedSubscription.paymentType || 'advance',
                paymentHistory: selectedSubscription.paymentHistory || [],
            });
        } else {
            setFormData({
                clientId: '',
                serviceId: '',
                status: 'active',
                startDate: new Date(),
                endDate: null,
                paymentType: 'advance',
                paymentHistory: [],
            });
        }

        setValidationError('');
    }, [selectedSubscription, open]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> |
            SelectChangeEvent<string | 'active' | 'cancelled'>
    ) => {
        const { name, value } = e.target as { name: string; value: string };

        setFormData({
            ...formData,
            [name]: value
        });

        // Limpiar error de validación cuando el usuario empiece a escribir
        if (validationError) {
            setValidationError('');
        }
    };

    const handleDateChange = (name: string, date: Date | null) => {
        setFormData({
            ...formData,
            [name]: date,
        });
    };

    const validateForm = (): boolean => {
        if (!formData.clientId || !formData.serviceId || !formData.startDate) {
            setValidationError('Por favor, completa todos los campos requeridos');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            // Preparar el historial de pagos inicial si es una nueva suscripción
            const paymentHistory = formData.paymentHistory.length 
                ? formData.paymentHistory 
                : [{
                    date: new Date(),
                    amount: 0,
                    status: 'pending' as const,
                }];

            const subscriptionData = {
                ...formData,
                paymentHistory,
            };

            if (selectedSubscription?.id) {
                await onUpdate(selectedSubscription.id, subscriptionData);
            } else {
                await onSave(subscriptionData);
            }

            onClose();
        } catch (error) {
            console.error('Error saving subscription:', error);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Dialog 
                open={open} 
                onClose={onClose} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle>
                    {selectedSubscription ? 'Editar Suscripción' : 'Nueva Suscripción'}
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                        {validationError && (
                            <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                                <Typography color="error" variant="body2">
                                    {validationError}
                                </Typography>
                            </Box>
                        )}

                        {/* Cliente */}
                        <FormControl fullWidth required>
                            <InputLabel id="client-select-label">Cliente</InputLabel>
                            <Select
                                labelId="client-select-label"
                                name="clientId"
                                value={formData.clientId}
                                label="Cliente"
                                onChange={handleInputChange}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <PersonIcon />
                                    </InputAdornment>
                                }
                            >
                                {clients.map((client) => (
                                    <MenuItem key={client.id} value={client.id}>
                                        {`${client.firstName} ${client.lastName} - ${client.email}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Servicio */}
                        <FormControl fullWidth required>
                            <InputLabel id="service-select-label">Servicio</InputLabel>
                            <Select
                                labelId="service-select-label"
                                name="serviceId"
                                value={formData.serviceId}
                                label="Servicio"
                                onChange={handleInputChange}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <InventoryIcon />
                                    </InputAdornment>
                                }
                            >
                                {services.map((service) => (
                                    <MenuItem key={service.id} value={service.id}>
                                        {`${service.name} - €${service.basePrice}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {/* Fecha de inicio */}
                            <DatePicker
                                label="Fecha de inicio"
                                value={formData.startDate}
                                onChange={(date) => handleDateChange('startDate', date)}
                                format="dd/MM/yyyy"
                                sx={{ flex: 1 }}
                                slotProps={{
                                    textField: {
                                        required: true,
                                        InputProps: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarIcon />
                                                </InputAdornment>
                                            ),
                                        },
                                    },
                                }}
                            />

                            {/* Fecha de fin */}
                            <DatePicker
                                label="Fecha de fin (opcional)"
                                value={formData.endDate}
                                onChange={(date) => handleDateChange('endDate', date)}
                                format="dd/MM/yyyy"
                                sx={{ flex: 1 }}
                                slotProps={{
                                    textField: {
                                        InputProps: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarIcon />
                                                </InputAdornment>
                                            ),
                                        },
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {/* Tipo de pago */}
                            <FormControl fullWidth required sx={{ flex: 1 }}>
                                <InputLabel id="payment-type-select-label">Tipo de pago</InputLabel>
                                <Select
                                    labelId="payment-type-select-label"
                                    name="paymentType"
                                    value={formData.paymentType}
                                    label="Tipo de pago"
                                    onChange={handleInputChange}
                                >
                                    <MenuItem value="advance">Pago anticipado</MenuItem>
                                    <MenuItem value="arrears">Pago vencido</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Estado */}
                            <FormControl fullWidth required sx={{ flex: 1 }}>
                                <InputLabel id="status-select-label">Estado</InputLabel>
                                <Select
                                    labelId="status-select-label"
                                    name="status"
                                    value={formData.status}
                                    label="Estado"
                                    onChange={handleInputChange}
                                >
                                    <MenuItem value="active">Activa</MenuItem>
                                    <MenuItem value="cancelled">Cancelada</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Guardando...' : (selectedSubscription ? 'Actualizar' : 'Crear')}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
};