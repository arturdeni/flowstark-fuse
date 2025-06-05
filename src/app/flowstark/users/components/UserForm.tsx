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
    Tabs,
    Tab,
    Typography,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
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
    clientType: 'particular' | 'empresa'; // Nuevo campo para el tipo de cliente
    paymentMethod: {
        type: string;
        details: Record<string, any>;
    };
}

// Componente para el panel de tabs
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`client-tabpanel-${index}`}
            aria-labelledby={`client-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `client-tab-${index}`,
        'aria-controls': `client-tabpanel-${index}`,
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
        clientType: 'particular', // Por defecto "Particular"
        paymentMethod: {
            type: 'card',
            details: {},
        },
    });

    const [validationError, setValidationError] = useState<string>('');
    const [tabValue, setTabValue] = useState(0); // 0 = Particular, 1 = Empresa

    // Actualizar formulario cuando cambie el usuario seleccionado
    useEffect(() => {
        if (selectedUser) {
            // Determinar el tipo de cliente basado en si tiene fiscalName y taxId
            const isEmpresa = Boolean(selectedUser.fiscalName || selectedUser.taxId);
            const clientType = isEmpresa ? 'empresa' : 'particular';
            
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
                clientType,
                paymentMethod: selectedUser.paymentMethod || {
                    type: 'card',
                    details: {},
                },
            });
            
            // Establecer el tab correcto
            setTabValue(isEmpresa ? 1 : 0);
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
                clientType: 'particular',
                paymentMethod: {
                    type: 'card',
                    details: {},
                },
            });
            setTabValue(0); // Por defecto "Particular"
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

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        
        // Actualizar el tipo de cliente y limpiar campos específicos
        if (newValue === 0) { // Particular
            setFormData({
                ...formData,
                clientType: 'particular',
                fiscalName: '', // Limpiar campos de empresa
                taxId: '',
            });
        } else { // Empresa
            setFormData({
                ...formData,
                clientType: 'empresa',
                lastName: '', // Limpiar apellidos en empresa
            });
        }
    };

    const validateForm = (): boolean => {
        if (tabValue === 0) { // Particular
            if (!formData.firstName || !formData.lastName || !formData.email) {
                setValidationError('Por favor, completa los campos requeridos (Nombre, Apellidos, Email)');
                return false;
            }
        } else { // Empresa
            if (!formData.firstName || !formData.fiscalName || !formData.email) {
                setValidationError('Por favor, completa los campos requeridos (Nombre Comercial, Nombre Fiscal, Email)');
                return false;
            }
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
            // Para empresa, el lastName se deja vacío y el firstName contiene el nombre comercial
            const userData = {
                ...formData,
                // Si es empresa, lastName se deja vacío
                lastName: tabValue === 1 ? '' : formData.lastName,
                // Si es particular, fiscalName y taxId se dejan vacíos
                fiscalName: tabValue === 0 ? '' : formData.fiscalName,
                taxId: tabValue === 0 ? '' : formData.taxId,
                registeredDate: new Date(), // Se añadirá automáticamente en el servicio
            };

            // Remover el campo clientType ya que no se almacena en la BD
            const { clientType, ...userDataToSave } = userData;

            if (selectedUser) {
                await onUpdate(selectedUser.id!, userDataToSave);
            } else {
                await onSave(userDataToSave);
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

                {/* Tabs para tipo de cliente */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange} 
                        aria-label="Tipo de cliente"
                        variant="fullWidth"
                    >
                        <Tab 
                            icon={<PersonIcon />} 
                            label="Particular" 
                            {...a11yProps(0)} 
                        />
                        <Tab 
                            icon={<BusinessIcon />} 
                            label="Empresa" 
                            {...a11yProps(1)} 
                        />
                    </Tabs>
                </Box>

                {/* Panel para Particular */}
                <TabPanel value={tabValue} index={0}>
                    <Box
                        component="form"
                        sx={{
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
                </TabPanel>

                {/* Panel para Empresa */}
                <TabPanel value={tabValue} index={1}>
                    <Box
                        component="form"
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 2,
                        }}
                    >
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Nombre Comercial"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                        />
                        <TextField
                            margin="normal"
                            required
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
                </TabPanel>
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