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
    Alert,
    Divider,
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
    finalPrice: number | string;
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
        finalPrice: 0,
        vat: 21,
        retention: 0,
        frequency: 'monthly',
    });

    const [validationError, setValidationError] = useState<string>('');
    const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

    // Actualizar formulario cuando cambie el servicio seleccionado
    useEffect(() => {
        if (selectedService) {
            setFormData({
                name: selectedService.name || '',
                description: selectedService.description || '',
                basePrice: selectedService.basePrice || 0,
                finalPrice: (selectedService as any).finalPrice || 0,
                vat: selectedService.vat || 21,
                retention: (selectedService as any).retention || 0,
                frequency: selectedService.frequency || 'monthly',
            });
        } else {
            setFormData({
                name: '',
                description: '',
                basePrice: 0,
                finalPrice: 0,
                vat: 21,
                retention: 0,
                frequency: 'monthly',
            });
        }

        setValidationError('');
    }, [selectedService, open]);

    // Función para calcular precio final basado en precio base
    const calculateFinalPriceFromBase = (basePrice: number, vat: number, retention: number): number => {
        const priceWithVat = basePrice * (1 + vat / 100);
        const finalPrice = priceWithVat * (1 - retention / 100);
        return finalPrice;
    };

    // Función para calcular precio base basado en precio final
    const calculateBasePriceFromFinal = (finalPrice: number, vat: number, retention: number): number => {
        const divisor = (1 + vat / 100) * (1 - retention / 100);
        return divisor !== 0 ? finalPrice / divisor : 0;
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> |
            SelectChangeEvent<string>
    ) => {
        if (isUpdatingPrice) return; // Evitar loops infinitos
        
        const { name, value } = e.target as { name: string; value: string | number };

        let processedValue: string | number = value;

        if (name === 'basePrice' || name === 'finalPrice' || name === 'vat' || name === 'retention') {
            // Permitir valores vacíos temporalmente - NO convertir a 0 inmediatamente
            if (value === '' || value === null || value === undefined) {
                processedValue = '';
            } else {
                // Limitar a máximo 2 decimales solo si hay un valor válido
                const numValue = parseFloat(value as string);

                if (!isNaN(numValue)) {
                    processedValue = Math.round(numValue * 100) / 100;
                } else {
                    processedValue = '';
                }
            }
        }

        // Calcular el precio complementario dinámicamente solo si tenemos valores válidos
        setIsUpdatingPrice(true);
        
        const newFormData = {
            ...formData,
            [name]: processedValue
        };

        // Solo calcular si tenemos valores numéricos válidos
        const getNumericValue = (val: string | number): number => {
            if (val === '' || val === null || val === undefined) return 0;

            const num = typeof val === 'string' ? parseFloat(val) : val;
            return isNaN(num) ? 0 : num;
        };

        // Si cambió el precio base, calcular el precio final (solo si basePrice no está vacío)
        if ((name === 'basePrice' || name === 'vat' || name === 'retention') && 
            newFormData.basePrice !== '') {
            
            const basePrice = getNumericValue(newFormData.basePrice);
            const vat = getNumericValue(newFormData.vat);
            const retention = getNumericValue(newFormData.retention);
            
            if (basePrice > 0) {
                const calculatedFinalPrice = calculateFinalPriceFromBase(basePrice, vat, retention);
                newFormData.finalPrice = Math.round(calculatedFinalPrice * 100) / 100;
            }
        }
        
        // Si cambió el precio final, calcular el precio base (solo si finalPrice no está vacío)
        if (name === 'finalPrice' && newFormData.finalPrice !== '') {
            const finalPrice = getNumericValue(newFormData.finalPrice);
            const vat = getNumericValue(newFormData.vat);
            const retention = getNumericValue(newFormData.retention);
            
            if (finalPrice > 0) {
                const calculatedBasePrice = calculateBasePriceFromFinal(finalPrice, vat, retention);
                newFormData.basePrice = Math.round(calculatedBasePrice * 100) / 100;
            }
        }

        setFormData(newFormData);
        setIsUpdatingPrice(false);

        if (validationError) {
            setValidationError('');
        }
    };

    // Manejar cuando el usuario sale del campo (convertir vacíos a 0)
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'basePrice' || name === 'finalPrice' || name === 'vat' || name === 'retention') {
            if (value === '' || value === null || value === undefined) {
                setFormData(prev => ({
                    ...prev,
                    [name]: 0
                }));
            }
        }
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            setValidationError('El nombre del servicio es requerido');
            return false;
        }

        // Convertir valores vacíos a 0 para validación
        const basePrice = formData.basePrice === '' ? 0 : 
            typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice;
        const finalPrice = formData.finalPrice === '' ? 0 : 
            typeof formData.finalPrice === 'string' ? parseFloat(formData.finalPrice) || 0 : formData.finalPrice;
        const vat = formData.vat === '' ? 0 : 
            typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat;
        const retention = formData.retention === '' ? 0 : 
            typeof formData.retention === 'string' ? parseFloat(formData.retention) || 0 : formData.retention;

        if (basePrice <= 0) {
            setValidationError('El precio base debe ser mayor que 0');
            return false;
        }

        if (finalPrice <= 0) {
            setValidationError('El precio final debe ser mayor que 0');
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
            // Convertir valores vacíos a 0 antes de guardar
            const dataToSave = {
                ...formData,
                basePrice: formData.basePrice === '' ? 0 : 
                    typeof formData.basePrice === 'string' ? parseFloat(formData.basePrice) || 0 : formData.basePrice,
                finalPrice: formData.finalPrice === '' ? 0 : 
                    typeof formData.finalPrice === 'string' ? parseFloat(formData.finalPrice) || 0 : formData.finalPrice,
                vat: formData.vat === '' ? 0 : 
                    typeof formData.vat === 'string' ? parseFloat(formData.vat) || 0 : formData.vat,
                retention: formData.retention === '' ? 0 : 
                    typeof formData.retention === 'string' ? parseFloat(formData.retention) || 0 : formData.retention,
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

    const formatNumberValue = (value: number | string): number | string => {
        if (value === '' || value === null || value === undefined) return '';

        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        return Math.round(numValue * 100) / 100; // Máximo 2 decimales
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: { minHeight: '600px' }
            }}
        >
            <DialogTitle>
                {selectedService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </DialogTitle>

            <DialogContent dividers>
                {validationError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {validationError}
                    </Alert>
                )}

                {/* Información básica */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Información básica
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Nombre del servicio"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            required
                            fullWidth
                        />

                        <TextField
                            label="Descripción"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="medium"
                            multiline
                            rows={3}
                            fullWidth
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Precios */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Configuración de precios
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                        <TextField
                            label="Precio Base"
                            name="basePrice"
                            type="number"
                            value={formData.basePrice}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            variant="outlined"
                            size="small"
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <EuroIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{
                                min: 0,
                                step: 0.01,
                                style: { 
                                    MozAppearance: 'textfield' // Firefox
                                }
                            }}
                            sx={{
                                '& input[type=number]::-webkit-outer-spin-button': {
                                    '-webkit-appearance': 'none',
                                    margin: 0,
                                },
                                '& input[type=number]::-webkit-inner-spin-button': {
                                    '-webkit-appearance': 'none',
                                    margin: 0,
                                },
                            }}
                        />

                        <TextField
                            label="Precio Final"
                            name="finalPrice"
                            type="number"
                            value={formatNumberValue(formData.finalPrice)}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            variant="outlined"
                            size="small"
                            required
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <EuroIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{
                                min: 0,
                                step: 0.01,
                                style: { 
                                    MozAppearance: 'textfield' // Firefox
                                }
                            }}
                            sx={{
                                '& input[type=number]::-webkit-outer-spin-button': {
                                    '-webkit-appearance': 'none',
                                    margin: 0,
                                },
                                '& input[type=number]::-webkit-inner-spin-button': {
                                    '-webkit-appearance': 'none',
                                    margin: 0,
                                },
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                    },
                                }
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        <TextField
                            label="IVA"
                            name="vat"
                            type="number"
                            value={formData.vat}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
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
                                style: { 
                                    MozAppearance: 'textfield' // Firefox
                                }
                            }}
                            sx={{
                                '& input[type=number]::-webkit-outer-spin-button': {
                                    '-webkit-appearance': 'none',
                                    margin: 0,
                                },
                                '& input[type=number]::-webkit-inner-spin-button': {
                                    '-webkit-appearance': 'none',
                                    margin: 0,
                                },
                            }}
                        />

                        <TextField
                            label="Retención"
                            name="retention"
                            type="number"
                            value={formData.retention}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
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
                                style: { 
                                    MozAppearance: 'textfield' // Firefox
                                }
                            }}
                            sx={{
                                '& input[type=number]::-webkit-outer-spin-button': {
                                    '-webkit-appearance': 'none',
                                    margin: 0,
                                },
                                '& input[type=number]::-webkit-inner-spin-button': {
                                    '-webkit-appearance': 'none',
                                    margin: 0,
                                },
                            }}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Configuración de facturación */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Configuración de facturación
                    </Typography>

                    <FormControl size="small" required fullWidth>
                        <InputLabel id="frequency-select-label">Frecuencia de Renovación</InputLabel>
                        <Select
                            labelId="frequency-select-label"
                            name="frequency"
                            value={formData.frequency}
                            label="Frecuencia de Renovación"
                            onChange={handleInputChange}
                        >
                            <MenuItem value="monthly">Mensual</MenuItem>
                            <MenuItem value="quarterly">Trimestral</MenuItem>
                            <MenuItem value="four_monthly">Cuatrimestral</MenuItem>
                            <MenuItem value="biannual">Semestral</MenuItem>
                            <MenuItem value="annual">Anual</MenuItem>
                        </Select>
                    </FormControl>
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