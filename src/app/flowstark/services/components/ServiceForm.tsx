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
    basePrice: number;
    vat: number;
    frequency: 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual';
    renovation: 'first_day' | 'last_day';
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
        renovation: 'first_day',
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
                renovation: selectedService.renovation || 'first_day',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                basePrice: 0,
                vat: 21,
                frequency: 'monthly',
                renovation: 'first_day',
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
            processedValue = parseFloat(value as string) || 0;
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

        if (formData.basePrice <= 0) {
            setValidationError('El precio debe ser mayor que 0');
            return false;
        }

        if (formData.vat < 0 || formData.vat > 100) {
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
            if (selectedService) {
                await onUpdate(selectedService.id!, formData);
            } else {
                await onSave(formData);
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

    const getRenovationOptions = () => [
        { value: 'first_day', label: 'Primer día del mes' },
        { value: 'last_day', label: 'Último día del mes' },
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
            <DialogContent>
                {validationError && (
                    <Box sx={{ color: 'error.main', mb: 2, fontSize: '0.875rem' }}>
                        {validationError}
                    </Box>
                )}

                <Box
                    component="form"
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 2,
                        mt: 1,
                    }}
                >
                    {/* Nombre del servicio */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Nombre del Servicio"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        sx={{ gridColumn: '1 / span 2' }}
                    />

                    {/* Descripción */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Descripción"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        multiline
                        rows={3}
                        sx={{ gridColumn: '1 / span 2' }}
                    />

                    {/* Precio base */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Precio Base"
                        name="basePrice"
                        type="number"
                        value={formData.basePrice}
                        onChange={handleInputChange}
                        inputProps={{
                            min: 0,
                            step: 0.01
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EuroIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* IVA */}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="IVA"
                        name="vat"
                        type="number"
                        value={formData.vat}
                        onChange={handleInputChange}
                        inputProps={{
                            min: 0,
                            max: 100,
                            step: 0.1
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <PercentIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Frecuencia */}
                    <FormControl margin="normal" fullWidth>
                        <InputLabel id="frequency-label">Frecuencia de Facturación</InputLabel>
                        <Select
                            labelId="frequency-label"
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

                    {/* Renovación */}
                    <FormControl margin="normal" fullWidth>
                        <InputLabel id="renovation-label">Día de Renovación</InputLabel>
                        <Select
                            labelId="renovation-label"
                            name="renovation"
                            value={formData.renovation}
                            label="Día de Renovación"
                            onChange={handleInputChange}
                        >
                            {getRenovationOptions().map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Información adicional */}
                    <Box sx={{ gridColumn: '1 / span 2', mt: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                            <strong>Precio final:</strong> {(formData.basePrice * (1 + formData.vat / 100)).toFixed(2)} € (IVA incluido)
                        </Typography>
                    </Box>
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