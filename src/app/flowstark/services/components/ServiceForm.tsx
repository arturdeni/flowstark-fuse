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
    retention: number | string; // Nuevo campo para la retención
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
        retention: 0, // Retención por defecto 0%
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

        // La descripción ya no es obligatoria
        // if (!formData.description.trim()) {
        //     setValidationError('La descripción del servicio es requerida');
        //     return false;
        // }

        // Convertir a número para validación si es string
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
            // Asegurar que los valores numéricos se envíen como números
            const dataToSave = {
                ...formData,
                basePrice: typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice,
                vat: typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat,
                retention: typeof formData.retention === 'string' ? parseFloat(formData.retention) || 0 : formData.retention,
            };

            if (selectedService) {
                await onUpdate(selectedService.id!, dataToSave);
            } else {
                await onSave(dataToSave);
            }

            onClose();
        } catch (error) {
            console.error('Error saving service:', error);
        }
    };

    // Función para calcular el precio final (PVP)
    const calculateFinalPrice = (): number => {
        const price = typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice;
        const vatRate = typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat;
        const retentionRate = typeof formData.retention === 'string' ? parseFloat(formData.retention) || 0 : formData.retention;

        // Precio con IVA
        const priceWithVat = price * (1 + vatRate / 100);

        // Precio final con retención (la retención se resta)
        const finalPrice = priceWithVat * (1 - retentionRate / 100);

        return finalPrice;
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

                    {/* Descripción */}
                    <TextField
                        label="Descripción"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        multiline
                        rows={3}
                        sx={{
                            gridColumn: '1 / span 2',
                            '& .MuiInputBase-root': {
                                alignItems: 'flex-start',
                            },
                            '& .MuiInputBase-input': {
                                resize: 'vertical',
                                minHeight: '60px !important',
                                lineHeight: '1.4',
                                padding: '8px 12px',
                            },
                            '& .MuiInputLabel-root': {
                                transform: 'translate(14px, 12px) scale(1)',
                                '&.MuiInputLabel-shrink': {
                                    transform: 'translate(14px, -9px) scale(0.75)',
                                }
                            }
                        }}
                        helperText="Campo opcional"
                    />

                    {/* Precio Base */}
                    <TextField
                        label="Precio Base"
                        name="basePrice"
                        value={formData.basePrice}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        required
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

                    {/* IVA y Retención en la misma fila */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            label="IVA (%)"
                            name="vat"
                            value={formData.vat}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                            required
                            sx={{
                                flex: 1,
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

                        <TextField
                            label="Retención (%)"
                            name="retention"
                            value={formData.retention}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                            sx={{
                                flex: 1,
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
                    </Box>

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
                    <Box sx={{ gridColumn: '1 / span 2', mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            <strong>Cálculo del precio:</strong>
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            • Precio base: {(() => {
                                const price = typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice;
                                return price.toFixed(2);
                            })()} €
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            • Con IVA ({(() => {
                                const vatRate = typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat;
                                return vatRate.toFixed(1);
                            })()}%): {(() => {
                                const price = typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice;
                                const vatRate = typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat;
                                return (price * (1 + vatRate / 100)).toFixed(2);
                            })()} €
                        </Typography>
                        <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>
                            <strong>Precio final (PVP): {calculateFinalPrice().toFixed(2)} €</strong>
                            {(() => {
                                const retentionRate = typeof formData.retention === 'string' ? parseFloat(formData.retention) || 0 : formData.retention;
                                return retentionRate > 0 ? ` (con ${retentionRate}% de retención)` : '';
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