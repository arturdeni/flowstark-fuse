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
    basePrice: number | string;
    vat: number | string;
    retention: number | string;
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
        vat: 21,
        retention: 0,
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
                retention: selectedService.retention || 0,
                frequency: selectedService.frequency || 'monthly',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                basePrice: 0,
                vat: 21,
                retention: 0,
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

        if (name === 'basePrice' || name === 'vat' || name === 'retention') {
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

        if (validationError) {
            setValidationError('');
        }
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            setValidationError('El nombre del servicio es requerido');
            return false;
        }

        const basePrice = typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice;
        const vat = typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat;
        const retention = typeof formData.retention === 'string' ? parseFloat(formData.retention) || 0 : formData.retention;

        if (basePrice <= 0) {
            setValidationError('El precio debe ser mayor que 0');
            return false;
        }

        if (vat < 0 || vat > 100) {
            setValidationError('El IVA debe estar entre 0 y 100%');
            return false;
        }

        if (retention < 0 || retention > 100) {
            setValidationError('La retención debe estar entre 0 y 100%');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const dataToSave = {
                ...formData,
                basePrice: typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice,
                vat: typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat,
                retention: typeof formData.retention === 'string' ? parseFloat(formData.retention) || 0 : formData.retention,
            };

            if (selectedService?.id) {
                await onUpdate(selectedService.id, dataToSave);
            } else {
                await onSave(dataToSave);
            }

            onClose();
        } catch (error) {
            console.error('Error saving service:', error);
        }
    };

    // Función para calcular precio final
    const calculateFinalPrice = (): number => {
        const basePrice = typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice;
        const vat = typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat;
        const retention = typeof formData.retention === 'string' ? parseFloat(formData.retention) || 0 : formData.retention;

        const priceWithVat = basePrice * (1 + vat / 100);
        const finalPrice = priceWithVat * (1 - retention / 100);

        return finalPrice;
    };

    return (
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
                {selectedService ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                {validationError && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                        <Typography color="error" variant="body2">
                            {validationError}
                        </Typography>
                    </Box>
                )}

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 2,
                        mt: 1
                    }}
                >
                    {/* Nombre */}
                    <TextField
                        label="Nombre del Servicio"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        required
                        sx={{ gridColumn: '1 / span 2' }}
                    />

                    {/* Descripción - Campo mejorado con redimensionado automático */}
                    <TextField
                        label="Descripción"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="medium"
                        multiline
                        minRows={1}
                        maxRows={8}
                        sx={{
                            gridColumn: '1 / span 2',
                            '& .MuiInputBase-root': {
                                lineHeight: 1.5,
                            }
                        }}
                        placeholder="Describe las características y detalles del servicio..."
                    />

                    {/* Precio Base */}
                    <TextField
                        label="Precio Base"
                        name="basePrice"
                        type="number"
                        value={formData.basePrice}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EuroIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{
                            min: 0,
                            step: 0.01,
                        }}
                    />

                    {/* Frecuencia de Facturación */}
                    <FormControl variant="outlined" size="small" required>
                        <InputLabel id="frequency-select-label">Frecuencia de Facturación</InputLabel>
                        <Select
                            labelId="frequency-select-label"
                            name="frequency"
                            value={formData.frequency}
                            label="Frecuencia de Facturación"
                            onChange={handleInputChange}
                        >
                            <MenuItem value="monthly">Mensual</MenuItem>
                            <MenuItem value="quarterly">Trimestral</MenuItem>
                            <MenuItem value="four_monthly">Cuatrimestral</MenuItem>
                            <MenuItem value="biannual">Semestral</MenuItem>
                            <MenuItem value="annual">Anual</MenuItem>
                        </Select>
                    </FormControl>

                    {/* IVA */}
                    <TextField
                        label="IVA"
                        name="vat"
                        type="number"
                        value={formData.vat}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <PercentIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{
                            min: 0,
                            max: 100,
                            step: 0.1,
                        }}
                    />

                    {/* Retención */}
                    <TextField
                        label="Retención"
                        name="retention"
                        type="number"
                        value={formData.retention}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <PercentIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{
                            min: 0,
                            max: 100,
                            step: 0.1,
                        }}
                    />
                </Box>

                {/* Cálculo del precio final */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Cálculo del precio:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • Precio base: {typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice}.00 €
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • Con IVA ({typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat}%): {(
                            (typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice) *
                            (1 + (typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat) / 100)
                        ).toFixed(2)} €
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                        Precio final (PVP): {calculateFinalPrice().toFixed(2)} €
                    </Typography>
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
                    {loading ? 'Guardando...' : (selectedService ? 'Actualizar' : 'Crear')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};