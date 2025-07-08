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
    AccountBalance as BankIcon,
    CreditCard as IbanIcon,
} from '@mui/icons-material';
import { Client } from '../../../../types/models';
import {
    obtenerBancoPorIban,
    formatearIban,
    validarFormatoIbanEspanol,
} from '../../../../utils/bancoLookup';

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
    active: boolean;
    clientType: 'particular' | 'empresa';
    paymentMethod: {
        type: string;
        details: Record<string, any>;
    };
    iban: string;
    bank: string;
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
        active: true,
        clientType: 'particular', // Por defecto "Particular"
        paymentMethod: {
            type: 'direct_debit', // Método de pago por defecto: Domiciliación
            details: {},
        },
        iban: '',
        bank: '',
    });

    const [validationError, setValidationError] = useState<string>('');
    const [tabValue, setTabValue] = useState(0); // 0 = Particular, 1 = Empresa
    const [ibanError, setIbanError] = useState<string>('');

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
                active: selectedUser.active !== false,
                clientType,
                paymentMethod: selectedUser.paymentMethod || {
                    type: 'direct_debit',
                    details: {},
                },
                iban: selectedUser.iban || '',
                bank: selectedUser.bank || '',
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
                active: true,
                clientType: 'particular',
                paymentMethod: {
                    type: 'direct_debit', // Método de pago por defecto: Domiciliación
                    details: {},
                },
                iban: '',
                bank: '',
            });
            setTabValue(0); // Por defecto "Particular"
        }

        setValidationError('');
        setIbanError('');
    }, [selectedUser, open]);

    // Función para detectar banco automáticamente cuando cambia el IBAN
    const handleIbanChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            iban: value
        }));

        // Limpiar errores previos
        setIbanError('');

        // Si el IBAN tiene suficientes caracteres, intentar detectar el banco
        if (value.length >= 8) { // ES + 2 dígitos control + 4 dígitos entidad
            const bancoInfo = obtenerBancoPorIban(value);

            if (bancoInfo) {
                // Banco detectado automáticamente
                setFormData(prev => ({
                    ...prev,
                    iban: value,
                    bank: bancoInfo.nombre
                }));
                console.log(`✅ Banco detectado automáticamente: ${bancoInfo.nombre}`);
            } else if (value.length >= 20) {
                // IBAN parece completo pero no se reconoce el banco
                if (validarFormatoIbanEspanol(value)) {
                    setIbanError('Banco no reconocido en nuestra base de datos');
                } else {
                    setIbanError('Formato de IBAN español no válido');
                }
            }
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> |
            SelectChangeEvent<string>
    ) => {
        const { name, value } = e.target as { name: string; value: string | boolean };

        // Manejar cambio de IBAN con detección automática
        if (name === 'iban') {
            handleIbanChange(value as string);
            return;
        }

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

        // Validación de IBAN si el método de pago es domiciliación
        if (formData.paymentMethod.type === 'direct_debit') {
            if (!formData.iban) {
                setValidationError('El IBAN es obligatorio cuando el método de pago es Domiciliación');
                return false;
            }

            if (!validarFormatoIbanEspanol(formData.iban)) {
                setValidationError('El formato del IBAN español no es válido');
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
            // Formatear IBAN antes de guardar
            const ibanFormateado = formData.iban ? formatearIban(formData.iban) : '';

            // Para empresa, el lastName se deja vacío y el firstName contiene el nombre comercial
            const userData = {
                ...formData,
                iban: ibanFormateado,
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
        { value: 'direct_debit', label: 'Domiciliación' }, // Primero en la lista
        { value: 'card', label: 'Tarjeta' },
        { value: 'transfer', label: 'Transferencia' },
        { value: 'cash', label: 'Efectivo' },
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



                {/* Tabs para tipo de cliente */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="tipo de cliente" variant='fullWidth'>
                        <Tab
                            icon={<PersonIcon />}
                            label="Particular"
                            {...a11yProps(0)}
                            iconPosition="start"
                        />
                        <Tab
                            icon={<BusinessIcon />}
                            label="Empresa"
                            {...a11yProps(1)}
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Panel Particular */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
                        <TextField
                            label="Nombre *"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            label="Apellidos *"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            label="Email *"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Teléfono"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PhoneIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="DNI"
                            name="idNumber"
                            value={formData.idNumber}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel>Método de Pago</InputLabel>
                            <Select
                                name="paymentMethod.type"
                                value={formData.paymentMethod.type}
                                onChange={handleInputChange}
                                label="Método de Pago"
                            >
                                {getPaymentMethodOptions().map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Campos IBAN y Banco - Solo si método de pago es domiciliación */}
                        {formData.paymentMethod.type === 'direct_debit' && (
                            <>
                                <TextField
                                    label="IBAN"
                                    name="iban"
                                    value={formData.iban}
                                    onChange={handleInputChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="ES00 0000 0000 0000 0000 0000"
                                    required
                                    error={!!ibanError}
                                    helperText={ibanError || (formData.iban && validarFormatoIbanEspanol(formData.iban) ? '✅ IBAN válido' : '')}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IbanIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    label="Banco"
                                    name="bank"
                                    value={formData.bank}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BankIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </>
                        )}

                        <TextField
                            label="Dirección"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{ gridColumn: '1 / -1' }}
                        />
                    </Box>

                    {/* Fila separada para Ciudad, Código Postal y País */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 2, width: '100%' }}>
                        <TextField
                            label="Ciudad"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ flex: '1 1 50%' }}
                        />
                        <TextField
                            label="Código Postal"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ flex: '1 1 20%' }}
                        />
                        <TextField
                            label="País"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ flex: '1 1 30%' }}
                        />
                    </Box>
                </TabPanel>

                {/* Panel Empresa */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
                        <TextField
                            label="Nombre Comercial *"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            label="Nombre Fiscal *"
                            name="fiscalName"
                            value={formData.fiscalName}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <TextField
                            label="Email *"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Teléfono"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PhoneIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="CIF"
                            name="taxId"
                            value={formData.taxId}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />
                        <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel>Método de Pago</InputLabel>
                            <Select
                                name="paymentMethod.type"
                                value={formData.paymentMethod.type}
                                onChange={handleInputChange}
                                label="Método de Pago"
                            >
                                {getPaymentMethodOptions().map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Campos IBAN y Banco - Solo si método de pago es domiciliación */}
                        {formData.paymentMethod.type === 'direct_debit' && (
                            <>
                                <TextField
                                    label={'IBAN'}
                                    name="iban"
                                    value={formData.iban}
                                    onChange={handleInputChange}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="ES00 0000 0000 0000 0000 0000"
                                    required
                                    error={!!ibanError}
                                    helperText={ibanError || (formData.iban && validarFormatoIbanEspanol(formData.iban) ? '✅ IBAN válido' : '')}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <IbanIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    label="Banco"
                                    name="bank"
                                    value={formData.bank}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BankIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </>
                        )}
                        <TextField
                            label="Dirección"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{ gridColumn: '1 / -1' }}
                        />
                    </Box>

                    {/* Fila separada para Ciudad, Código Postal y País */}
                    <Box sx={{ display: 'flex', gap: 2, mt: 2, width: '100%' }}>
                        <TextField
                            label="Ciudad"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ flex: '1 1 50%' }}
                        />
                        <TextField
                            label="Código Postal"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ flex: '1 1 20%' }}
                        />
                        <TextField
                            label="País"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            sx={{ flex: '1 1 30%' }}
                        />
                    </Box>
                </TabPanel>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color="inherit">
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {selectedUser ? 'Actualizar' : 'Crear'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};