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
    status: 'active' | 'paused' | 'cancelled';
    startDate: Date;
    endDate: Date | null;
    paymentDate: Date;
    paymentMethod: {
        type: string;
        details: Record<string, any>;
    };
    renewal: 'monthly' | 'quarterly' | 'biannual' | 'annual';
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
        paymentDate: new Date(),
        paymentMethod: {
            type: 'credit_card',
            details: {},
        },
        renewal: 'monthly',
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
                paymentDate: selectedSubscription.paymentDate || new Date(),
                paymentMethod: selectedSubscription.paymentMethod || {
                    type: 'credit_card',
                    details: {},
                },
                renewal: selectedSubscription.renewal || 'monthly',
                paymentHistory: selectedSubscription.paymentHistory || [],
            });
        } else {
            setFormData({
                clientId: '',
                serviceId: '',
                status: 'active',
                startDate: new Date(),
                endDate: null,
                paymentDate: new Date(),
                paymentMethod: {
                    type: 'credit_card',
                    details: {},
                },
                renewal: 'monthly',
                paymentHistory: [],
            });
        }

        setValidationError('');
    }, [selectedSubscription, open]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> |
            SelectChangeEvent<string | 'active' | 'paused' | 'cancelled'>
    ) => {
        const { name, value } = e.target as { name: string; value: string };

        // Manejar campos anidados para paymentMethod
        if (name.startsWith('paymentMethod.')) {
            const field = name.split('.')[1];
            setFormData({
                ...formData,
                paymentMethod: {
                    ...formData.paymentMethod,
                    [field]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }

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
            const paymentHistory = formData.paymentHistory.length ? formData.paymentHistory : [
                {
                    date: formData.paymentDate || new Date(),
                    amount: 0, // Se actualizará con el precio del servicio
                    status: 'paid',
                }
            ];

            const subscriptionData = {
                ...formData,
                paymentHistory
            };

            if (selectedSubscription) {
                await onUpdate(selectedSubscription.id!, subscriptionData);
            } else {
                await onSave(subscriptionData);
            }

            onClose();
        } catch (error) {
            // Error handling is done in the hook
            console.error('Error in form save:', error);
        }
    };

    const getRenewalOptions = () => [
        { value: 'monthly', label: 'Mensual' },
        { value: 'quarterly', label: 'Trimestral' },
        { value: 'biannual', label: 'Semestral' },
        { value: 'annual', label: 'Anual' },
    ];

    const getPaymentMethodOptions = () => [
        { value: 'credit_card', label: 'Tarjeta de Crédito' },
        { value: 'paypal', label: 'PayPal' },
        { value: 'bank_transfer', label: 'Transferencia Bancaria' },
        { value: 'cash', label: 'Efectivo' },
        { value: 'direct_debit', label: 'Domiciliación' },
    ];

    const getRenewalText = (renewal: string): string => {
        switch (renewal) {
            case 'monthly':
                return 'Mensual';
            case 'quarterly':
                return 'Trimestral';
            case 'biannual':
                return 'Semestral';
            case 'annual':
                return 'Anual';
            default:
                return renewal;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { overflowY: 'visible' }
            }}
        >
            <DialogTitle>
                {selectedSubscription ? 'Editar Suscripción' : 'Nueva Suscripción'}
            </DialogTitle>
            <DialogContent>
                {validationError && (
                    <Box sx={{ color: 'error.main', mb: 2, fontSize: '0.875rem' }}>
                        {validationError}
                    </Box>
                )}
                <Box
                    component="form"
                    sx={{
                        mt: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 2,
                    }}
                >
                    <FormControl margin="normal" fullWidth required>
                        <InputLabel id="client-label">Cliente</InputLabel>
                        <Select
                            labelId="client-label"
                            name="clientId"
                            value={formData.clientId}
                            label="Cliente"
                            onChange={handleInputChange}
                            startAdornment={
                                <InputAdornment position="start">
                                    <PersonIcon fontSize="small" />
                                </InputAdornment>
                            }
                        >
                            {clients.map((client) => (
                                <MenuItem key={client.id} value={client.id}>
                                    {client.firstName} {client.lastName} ({client.email})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl margin="normal" fullWidth required>
                        <InputLabel id="service-label">Servicio</InputLabel>
                        <Select
                            labelId="service-label"
                            name="serviceId"
                            value={formData.serviceId}
                            label="Servicio"
                            onChange={handleInputChange}
                            startAdornment={
                                <InputAdornment position="start">
                                    <InventoryIcon fontSize="small" />
                                </InputAdornment>
                            }
                        >
                            {services.map((service) => (
                                <MenuItem key={service.id} value={service.id}>
                                    {service.name} ({service.basePrice?.toFixed(2)} € - {getRenewalText(service.frequency)})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl margin="normal" fullWidth required>
                        <InputLabel id="renewal-label">Frecuencia</InputLabel>
                        <Select
                            labelId="renewal-label"
                            name="renewal"
                            value={formData.renewal}
                            label="Frecuencia"
                            onChange={handleInputChange}
                        >
                            {getRenewalOptions().map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl margin="normal" fullWidth required>
                        <InputLabel id="payment-method-label">Método de Pago</InputLabel>
                        <Select
                            labelId="payment-method-label"
                            name="paymentMethod.type"
                            value={formData.paymentMethod.type}
                            label="Método de Pago"
                            onChange={handleInputChange}
                        >
                            {getPaymentMethodOptions().map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Fecha de Inicio"
                            value={formData.startDate}
                            onChange={(date) => handleDateChange('startDate', date)}
                            slotProps={{
                                textField: {
                                    margin: 'normal',
                                    fullWidth: true,
                                    required: true,
                                    InputProps: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                },
                            }}
                        />
                    </LocalizationProvider>

                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Fecha de Pago"
                            value={formData.paymentDate}
                            onChange={(date) => handleDateChange('paymentDate', date)}
                            slotProps={{
                                textField: {
                                    margin: 'normal',
                                    fullWidth: true,
                                    required: true,
                                    InputProps: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                },
                            }}
                        />
                    </LocalizationProvider>

                    {(selectedSubscription?.status === 'cancelled' || formData.status === 'cancelled') && (
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Fecha de Finalización"
                                value={formData.endDate}
                                onChange={(date) => handleDateChange('endDate', date)}
                                slotProps={{
                                    textField: {
                                        margin: 'normal',
                                        fullWidth: true,
                                        InputProps: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        },
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    )}

                    {selectedSubscription && (
                        <FormControl margin="normal" fullWidth>
                            <InputLabel id="status-label">Estado</InputLabel>
                            <Select
                                labelId="status-label"
                                name="status"
                                value={formData.status}
                                label="Estado"
                                onChange={handleInputChange}
                            >
                                <MenuItem value="active">Activa</MenuItem>
                                <MenuItem value="paused">Pausada</MenuItem>
                                <MenuItem value="cancelled">Cancelada</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};