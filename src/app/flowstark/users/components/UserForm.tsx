// src/app/flowstark/users/components/UserForm.tsx
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
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
} from '@mui/icons-material';
import { Client } from '../../../../types/models';

interface UserFormProps {
    open: boolean;
    selectedUser: Client | null;
    loading: boolean;
    onClose: () => void;
    onSave: (userData: Omit<Client, 'id' | 'registeredDate' | 'active' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onUpdate: (id: string, userData: Partial<Client>) => Promise<void>;
}

interface FormData {
    firstName: string;
    lastName: string;
    fiscalName: string;
    email: string;
    phone: string;
    idNumber: string;
    taxId: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    notes: string;
    active: boolean;
    paymentMethod: {
        type: string;
        details: Record<string, any>;
    };
}

export const UserForm: React.FC<UserFormProps> = ({
    open,
    selectedUser,
    loading,
    onClose,
    onSave,
    onUpdate,
}) => {
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        fiscalName: '',
        email: '',
        phone: '',
        idNumber: '',
        taxId: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        notes: '',
        active: true,
        paymentMethod: {
            type: 'card',
            details: {},
        },
    });

    const [validationError, setValidationError] = useState<string>('');

    // Actualizar formulario cuando cambie el usuario seleccionado
    useEffect(() => {
        if (selectedUser) {
            setFormData({
                firstName: selectedUser.firstName || '',
                lastName: selectedUser.lastName || '',
                fiscalName: selectedUser.fiscalName || '',
                email: selectedUser.email || '',
                phone: selectedUser.phone || '',
                idNumber: selectedUser.idNumber || '',
                taxId: selectedUser.taxId || '',
                address: selectedUser.address || '',
                city: selectedUser.city || '',
                postalCode: selectedUser.postalCode || '',
                country: selectedUser.country || '',
                notes: selectedUser.notes || '',
                active: selectedUser.active !== false,
                paymentMethod: selectedUser.paymentMethod || {
                    type: 'card',
                    details: {},
                },
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                fiscalName: '',
                email: '',
                phone: '',
                idNumber: '',
                taxId: '',
                address: '',
                city: '',
                postalCode: '',
                country: '',
                notes: '',
                active: true,
                paymentMethod: {
                    type: 'card',
                    details: {},
                },
            });
        }

        setValidationError('');
    }, [selectedUser, open]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> |
            SelectChangeEvent<string>
    ) => {
        const { name, value } = e.target as { name: string; value: string | boolean };

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

    const validateForm = (): boolean => {
        if (!formData.firstName || !formData.lastName || !formData.email) {
            setValidationError('Por favor, completa los campos requeridos');
            return false;
        }

        // Validación básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(formData.email)) {
            setValidationError('Por favor, introduce un email válido');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const userData = {
                ...formData,
                registeredDate: new Date(), // Se añadirá automáticamente en el servicio
            };

            if (selectedUser) {
                await onUpdate(selectedUser.id!, formData);
            } else {
                await onSave(userData);
            }

            onClose();
        } catch (error) {
            // Error handling is done in the hook
            console.error('Error in form save:', error);
        }
    };

    const getPaymentMethodOptions = () => [
        { value: 'card', label: 'Tarjeta' },
        { value: 'transfer', label: 'Transferencia' },
        { value: 'cash', label: 'Efectivo' },
        { value: 'direct_debit', label: 'Domiciliación' },
    ];

    const getStatusOptions = () => [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
    ];

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
                {selectedUser ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Nombre"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Apellidos"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Nombre Fiscal"
                        name="fiscalName"
                        value={formData.fiscalName}
                        onChange={handleInputChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Teléfono"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PhoneIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="DNI/NIF"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="CIF"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleInputChange}
                    />
                    <FormControl margin="normal" fullWidth>
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
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Dirección"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Ciudad"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Código Postal"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        label="País"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                    />
                    <FormControl margin="normal" fullWidth>
                        <InputLabel id="status-label">Estado</InputLabel>
                        <Select
                            labelId="status-label"
                            name="active"
                            value={formData.active ? 'active' : 'inactive'}
                            label="Estado"
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    active: e.target.value === 'active'
                                });
                            }}
                        >
                            {getStatusOptions().map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Notas"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        multiline
                        rows={4}
                        sx={{ gridColumn: '1 / span 2' }}
                    />
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