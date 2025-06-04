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
    Switch,
    FormControlLabel,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    Euro as EuroIcon,
    Category as CategoryIcon,
    Description as DescriptionIcon,
} from '@mui/icons-material';
import { Service } from '../../../../types/models';

interface ServiceFormProps {
    open: boolean;
    selectedService: Service | null;
    loading: boolean;
    onClose: () => void;
    onSave: (serviceData: Omit<Service, 'id' | 'active' | 'activeSubscriptions' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onUpdate: (id: string, serviceData: Partial<Service>) => Promise<void>;
    categories: string[];
}

interface FormData {
    name: string;
    description: string;
    basePrice: string;
    vat: number;
    frequency: 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual';
    category: string;
    active: boolean;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
    open,
    selectedService,
    loading,
    onClose,
    onSave,
    onUpdate,
    categories,
}) => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        basePrice: '',
        vat: 21,
        frequency: 'monthly',
        category: '',
        active: true,
    });

    const [validationError, setValidationError] = useState<string>('');

    // Actualizar formulario cuando cambie el servicio seleccionado
    useEffect(() => {
        if (selectedService) {
            setFormData({
                name: selectedService.name || '',
                description: selectedService.description || '',
                basePrice: selectedService.basePrice?.toString() || '',
                vat: selectedService.vat ?? 21,
                frequency: selectedService.frequency || 'monthly',
                category: selectedService.category || '',
                active: selectedService.active !== false,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                basePrice: '',
                vat: 21,
                frequency: 'monthly',
                category: '',
                active: true,
            });
        }

        setValidationError('');
    }, [selectedService, open]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> |
            SelectChangeEvent<string | number | 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual'>
    ) => {
        const { name, value } = e.target as { name: string; value: string | number | boolean };
        setFormData({
            ...formData,
            [name]: value
        });

        // Limpiar error de validación cuando el usuario empiece a escribir
        if (validationError) {
            setValidationError('');
        }
    };

    const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            active: e.target.checked,
        });
    };

    const validateForm = (): boolean => {
        if (!formData.name || !formData.description || !formData.basePrice || !formData.category) {
            setValidationError('Por favor, completa todos los campos requeridos');
            return false;
        }

        const price = parseFloat(formData.basePrice);

        if (isNaN(price) || price <= 0) {
            setValidationError('Por favor, introduce un precio válido');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            const serviceData = {
                ...formData,
                basePrice: parseFloat(formData.basePrice),
                vat: Number(formData.vat),
            };

            if (selectedService) {
                await onUpdate(selectedService.id!, serviceData);
            } else {
                await onSave(serviceData);
            }

            onClose();
        } catch (error) {
            // Error handling is done in the hook
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

    const getVatOptions = () => [
        { value: 0, label: '0%' },
        { value: 4, label: '4%' },
        { value: 10, label: '10%' },
        { value: 21, label: '21%' },
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
                        label="Nombre del Servicio"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                    />
                    <FormControl margin="normal" fullWidth required>
                        <InputLabel id="category-label">Categoría</InputLabel>
                        <Select
                            labelId="category-label"
                            name="category"
                            value={formData.category}
                            label="Categoría"
                            onChange={handleInputChange}
                            startAdornment={
                                <InputAdornment position="start">
                                    <CategoryIcon fontSize="small" />
                                </InputAdornment>
                            }
                        >
                            {categories.map((category) => (
                                <MenuItem key={category} value={category}>
                                    {category}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Precio Base"
                        name="basePrice"
                        value={formData.basePrice}
                        onChange={handleInputChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EuroIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl margin="normal" fullWidth required>
                        <InputLabel id="vat-label">IVA</InputLabel>
                        <Select
                            labelId="vat-label"
                            name="vat"
                            value={formData.vat}
                            label="IVA"
                            onChange={handleInputChange}
                        >
                            {getVatOptions().map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl margin="normal" fullWidth required>
                        <InputLabel id="frequency-label">
                            Frecuencia de Facturación
                        </InputLabel>
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
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Descripción"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        multiline
                        rows={4}
                        sx={{ gridColumn: '1 / span 2' }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <DescriptionIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.active}
                                onChange={handleToggleChange}
                                name="active"
                            />
                        }
                        label="Servicio Activo"
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