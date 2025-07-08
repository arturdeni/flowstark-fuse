// src/app/flowstark/services/components/ServiceForm.tsx
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
    Typography,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    Euro as EuroIcon,
    Percent as PercentIcon,
} from '@mui/icons-material';
import { Service } from '../../../../types/models';

interface ServiceFormProps {
    open: boolean;
    selectedService: Service | null;
    loading: boolean;
    onClose: () => void;
    onSave: (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'activeSubscriptions'>) => Promise<void>;
    onUpdate: (id: string, serviceData: Partial<Service>) => Promise<void>;
}

interface FormData {
    name: string;
    description: string;
    basePrice: number | string; // Permitir string para mejor UX al editar
    vat: number | string; // Permitir string para mejor UX al editar
    frequency: 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual';
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
    open,
    selectedService,
    loading,
    onClose,
    onSave,
    onUpdate,
}) => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        basePrice: 0,
        vat: 21, // IVA por defecto en España
        frequency: 'monthly',
    });

    const [validationError, setValidationError] = useState<string>('');

    // Actualizar formulario cuando cambie el servicio seleccionado
    useEffect(() => {
        if (selectedService) {
            setFormData({
                name: selectedService.name || '',
                description: selectedService.description || '',
                basePrice: selectedService.basePrice || 0,
                vat: selectedService.vat || 21,
                frequency: selectedService.frequency || 'monthly',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                basePrice: 0,
                vat: 21,
                frequency: 'monthly',
            });
        }

        setValidationError('');
    }, [selectedService, open]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> |
            SelectChangeEvent<string>
    ) => {
        const { name, value } = e.target as { name: string; value: string | number };

        // Convertir valores numéricos
        let processedValue: string | number = value;

        if (name === 'basePrice' || name === 'vat') {
            // Si el valor está vacío, dejarlo como string vacío para mejor UX
            if (value === '' || value === null || value === undefined) {
                processedValue = '';
            } else {
                processedValue = parseFloat(value as string) || 0;
            }
        }

        setFormData({
            ...formData,
            [name]: processedValue
        });

        // Limpiar error de validación cuando el usuario empiece a escribir
        if (validationError) {
            setValidationError('');
        }
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            setValidationError('El nombre del servicio es requerido');
            return false;
        }

        if (!formData.description.trim()) {
            setValidationError('La descripción del servicio es requerida');
            return false;
        }

        // Convertir a número para validación si es string
        const basePrice = typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice;
        const vat = typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat;

        if (basePrice <= 0) {
            setValidationError('El precio debe ser mayor que 0');
            return false;
        }

        if (vat < 0 || vat > 100) {
            setValidationError('El IVA debe estar entre 0 y 100%');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            // Asegurar que los valores numéricos se envíen como números
            const dataToSave = {
                ...formData,
                basePrice: typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice,
                vat: typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat,
            };

            if (selectedService) {
                await onUpdate(selectedService.id!, dataToSave);
            } else {
                await onSave(dataToSave);
            }

            onClose();
        } catch (error) {
            console.error('Error in form save:', error);
        }
    };

    const getFrequencyOptions = () => [
        { value: 'monthly', label: 'Mensual' },
        { value: 'quarterly', label: 'Trimestral' },
        { value: 'four_monthly', label: 'Cuatrimestral' },
        { value: 'biannual', label: 'Semestral' },
        { value: 'annual', label: 'Anual' },
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
                {selectedService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2 }}>
                {validationError && (
                    <Typography
                        color="error"
                        variant="body2"
                        sx={{ mb: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}
                    >
                        {validationError}
                    </Typography>
                )}

                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
                    {/* Nombre del servicio */}
                    <TextField
                        label="Nombre del Servicio *"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={{ gridColumn: '1 / span 2' }}
                    />

                    {/* Descripción */}
                    <TextField
                        label="Descripción *"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        multiline
                        rows={3}
                        sx={{ gridColumn: '1 / span 2' }}
                    />

                    {/* Precio */}
                    <TextField
                        label="Precio Base *"
                        name="basePrice"
                        type="number"
                        value={formData.basePrice}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        inputProps={{
                            min: 0,
                            step: 0.01,
                            style: {
                                MozAppearance: 'textfield', // Firefox
                                WebkitAppearance: 'none', // Chrome/Safari
                            }
                        }}
                        sx={{
                            '& input[type=number]::-webkit-outer-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0,
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0,
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EuroIcon />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* IVA */}
                    <TextField
                        label="IVA (%)"
                        name="vat"
                        type="number"
                        value={formData.vat}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        inputProps={{
                            min: 0,
                            max: 100,
                            step: 0.01,
                            style: {
                                MozAppearance: 'textfield', // Firefox
                                WebkitAppearance: 'none', // Chrome/Safari
                            }
                        }}
                        sx={{
                            '& input[type=number]::-webkit-outer-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0,
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0,
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PercentIcon />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Frecuencia */}
                    <FormControl fullWidth size="small" variant="outlined" sx={{ gridColumn: '1 / span 2' }}>
                        <InputLabel>Frecuencia de Facturación</InputLabel>
                        <Select
                            name="frequency"
                            value={formData.frequency}
                            label="Frecuencia de Facturación"
                            onChange={handleInputChange}
                        >
                            {getFrequencyOptions().map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Información del precio final */}
                    <Box sx={{ gridColumn: '1 / span 2', mt: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                            <strong>Precio final:</strong> {(() => {
                                const price = typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice;
                                const vatRate = typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat;
                                return (price * (1 + vatRate / 100)).toFixed(2);
                            })()} € 
                            {(() => {
                                const vatRate = typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat;
                                return vatRate > 0 ? ' (IVA incluido)' : ' (sin IVA)';
                            })()}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={loading} color="inherit">
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Guardando...' : selectedService ? 'Actualizar' : 'Crear'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};