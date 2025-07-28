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
    Alert,
    Typography,
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
    Payment as PaymentIcon,
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
        startDate: new Date(),
        endDate: null,
        paymentType: 'advance',
        paymentHistory: [],
    });

    const [validationError, setValidationError] = useState<string>('');

    // Actualizar formulario cuando cambie la suscripción seleccionada
    useEffect(() => {
        if (selectedSubscription) {
            setFormData({
                clientId: selectedSubscription.clientId,
                serviceId: selectedSubscription.serviceId,
                startDate: selectedSubscription.startDate,
                endDate: selectedSubscription.endDate,
                paymentType: selectedSubscription.paymentType || 'advance',
                paymentHistory: selectedSubscription.paymentHistory || [],
            });
        } else {
            setFormData({
                clientId: '',
                serviceId: '',
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
            SelectChangeEvent<string>
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

        // Validar que la fecha de fin sea posterior a la fecha de inicio
        if (formData.endDate && formData.startDate && formData.endDate <= formData.startDate) {
            setValidationError('La fecha de finalización debe ser posterior a la fecha de inicio');
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
                status: 'active' as const, // Siempre crear como activa
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

    // Función para obtener el nombre completo del cliente
    const getClientDisplayName = (client: Client): string => {
        return `${client.firstName} ${client.lastName} - ${client.email}`;
    };

    // Función para obtener el texto de la frecuencia
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

    // Función para obtener información del servicio
    const getServiceDisplayName = (service: Service): string => {
        const price = service.finalPrice || service.basePrice || 0;
        const frequency = getFrequencyText(service.frequency);
        return `${service.name} - ${price.toFixed(2)}€ - ${frequency}`;
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
                            <Alert severity="error">
                                {validationError}
                            </Alert>
                        )}

                        {/* Información básica */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Información básica
                            </Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
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
                                                {getClientDisplayName(client)}
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
                                                {getServiceDisplayName(service)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>

                        {/* Configuración de pagos */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Configuración de cobros
                            </Typography>

                            <FormControl fullWidth required>
                                <InputLabel id="payment-type-select-label">Tipo de Cobro</InputLabel>
                                <Select
                                    labelId="payment-type-select-label"
                                    name="paymentType"
                                    value={formData.paymentType}
                                    label="Tipo de Cobro"
                                    onChange={handleInputChange}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <PaymentIcon />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="advance">Anticipado (se cobra antes del servicio)</MenuItem>
                                    <MenuItem value="arrears">Vencido (se cobra después del servicio)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Fechas */}
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Fechas de la suscripción
                            </Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                {/* Fecha de inicio */}
                                <DatePicker
                                    label="Fecha de Inicio *"
                                    value={formData.startDate}
                                    onChange={(date) => handleDateChange('startDate', date)}
                                    slotProps={{
                                        textField: {
                                            variant: 'outlined',
                                            size: 'small',
                                            fullWidth: true,
                                            required: true,
                                            InputProps: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <CalendarIcon />
                                                    </InputAdornment>
                                                ),
                                            }
                                        }
                                    }}
                                />

                                {/* Fecha de fin */}
                                <DatePicker
                                    label="Fecha de Finalización (Opcional)"
                                    value={formData.endDate}
                                    onChange={(date) => handleDateChange('endDate', date)}
                                    minDate={formData.startDate}
                                    slotProps={{
                                        textField: {
                                            variant: 'outlined',
                                            size: 'small',
                                            fullWidth: true,
                                            InputProps: {
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <CalendarIcon />
                                                    </InputAdornment>
                                                ),
                                            }
                                        }
                                    }}
                                />
                            </Box>

                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Si no especificas fecha de finalización, la suscripción permanecerá activa indefinidamente.
                            </Typography>
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