// src/app/flowstark/settings/Settings.tsx
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Avatar,
  Divider,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Language as LanguageIcon,
  Badge as BadgeIcon,
  AccountBalance as AccountBalanceIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  validarFormatoIbanEspanol,
  formatearIban,
  obtenerBancoPorIban,
  validarCreditorId,
  validarBic,
} from '@/utils/bancoLookup';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';
import { userProfileService } from '@/services/userProfileService';
import type { UserProfile } from '@/services/userProfileService';
import SubscriptionPanel from './components/SubscriptionPanel';

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider,
  },
}));

const StyledPaper = styled(Paper)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

function Settings() {
  const { authState } = useAuth();
  const user = authState?.user;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState<'autonomo' | 'empresa'>('autonomo');

  const [formData, setFormData] = useState({
    // Campo común según tipo
    name: '', // Nombre (autónomo) o Razón social (empresa)
    nifCif: '', // NIF (autónomo) o CIF (empresa)
    // Domicilio fiscal
    street: '',
    number: '',
    postalCode: '',
    city: '',
    province: '',
    country: '',
    // Campos comunes
    commercialName: '',
    phone: '',
    email: '',
    website: '',
    // Datos bancarios SEPA
    sepaIban: '',
    sepaBic: '',
    sepaCreditorId: '',
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const profile = await userProfileService.getUserProfile();

        if (profile) {
          setFormData({
            name: profile.name || '',
            nifCif: profile.nifCif || '',
            street: profile.street || '',
            number: profile.number || '',
            postalCode: profile.postalCode || '',
            city: profile.city || '',
            province: profile.province || '',
            country: profile.country || '',
            commercialName: profile.commercialName || '',
            phone: profile.phone || '',
            email: profile.email || (user?.email as string) || '',
            website: profile.website || '',
            sepaIban: profile.sepaIban || '',
            sepaBic: profile.sepaBic || '',
            sepaCreditorId: profile.sepaCreditorId || '',
          });

          if (profile.userType) {
            setUserType(profile.userType);
          }
        } else if (user) {
          // Si no hay perfil pero hay usuario, usar datos del usuario
          setFormData((prev) => ({
            ...prev,
            email: (user.email as string) || '',
          }));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar el perfil',
          severity: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUserTypeChange = (event: React.SyntheticEvent, newValue: 'autonomo' | 'empresa') => {
    setUserType(newValue);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Preparar datos para guardar
      const profileData: Partial<UserProfile> = {
        userType,
        name: formData.name,
        nifCif: formData.nifCif,
        street: formData.street,
        number: formData.number,
        postalCode: formData.postalCode,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        commercialName: formData.commercialName,
        phone: formData.phone,
        website: formData.website,
        sepaIban: formData.sepaIban,
        sepaBic: formData.sepaBic,
        sepaCreditorId: formData.sepaCreditorId,
      };

      // Guardar en Firebase
      await userProfileService.updateUserProfile(profileData);

      setSnackbar({
        open: true,
        message: 'Perfil actualizado correctamente',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar el perfil',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };


  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Mostrar loader mientras se cargan los datos
  if (loading) {
    return (
      <Root
        header={
          <Box className="p-6">
            <Typography variant="h4" component="h1" gutterBottom>
              Configuración
            </Typography>
          </Box>
        }
        content={
          <Box className="flex items-center justify-center h-full">
            <CircularProgress />
          </Box>
        }
      />
    );
  }

  return (
    <Root
      header={
        <Box className="p-6">
          <Typography variant="h4" component="h1" className="font-medium tracking-tight" sx={{ color: '#154241' }}>
            Configuración
          </Typography>
        </Box>
      }
      content={
        <Box className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de Datos Básicos */}
            <div className="lg:col-span-1">
              <StyledPaper elevation={1} className="p-6">
                <Box className="flex items-center mb-4">
                  <Avatar
                    sx={{ width: 60, height: 60, mr: 3, bgcolor: 'primary.main' }}
                  >
                    {userType === 'autonomo' ? (
                      <PersonIcon sx={{ fontSize: 30, color: 'white' }} />
                    ) : (
                      <BusinessIcon sx={{ fontSize: 30, color: 'white' }} />
                    )}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      Datos Fiscales
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Información fiscal y de contacto
                    </Typography>
                  </Box>
                </Box>

                <Divider className="mb-4" />

                {/* Tabs para seleccionar tipo */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs value={userType} onChange={handleUserTypeChange} aria-label="tipo de usuario">
                    <Tab label="Autónomo" value="autonomo" />
                    <Tab label="Empresa" value="empresa" />
                  </Tabs>
                </Box>

                <div className="space-y-4">
                  {/* Nombre / Razón Social */}
                  <TextField
                    fullWidth
                    label={userType === 'autonomo' ? 'Nombre y apellidos' : 'Razón Social'}
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    variant="outlined"
                    required
                    InputProps={{
                      startAdornment: (
                        <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                      ),
                    }}
                  />

                  {/* NIF / CIF */}
                  <TextField
                    fullWidth
                    label={userType === 'autonomo' ? 'NIF' : 'CIF'}
                    name="nifCif"
                    value={formData.nifCif}
                    onChange={handleInputChange}
                    variant="outlined"
                    required
                    InputProps={{
                      startAdornment: (
                        <BadgeIcon sx={{ mr: 1, color: 'action.active' }} />
                      ),
                    }}
                  />

                  {/* Domicilio Fiscal */}
                  <Typography variant="subtitle2" color="text.secondary" className="mt-4 mb-2">
                    Domicilio Fiscal
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Calle"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        variant="outlined"
                        required
                        InputProps={{
                          startAdornment: (
                            <LocationOnIcon sx={{ mr: 1, color: 'action.active' }} />
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Número"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        variant="outlined"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Código Postal"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        variant="outlined"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Municipio"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        variant="outlined"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Provincia"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        variant="outlined"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="País"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        variant="outlined"
                        required
                      />
                    </Grid>
                  </Grid>

                  {/* Nombre Comercial */}
                  <TextField
                    fullWidth
                    label="Nombre Comercial"
                    name="commercialName"
                    value={formData.commercialName}
                    onChange={handleInputChange}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                      ),
                    }}
                  />

                  {/* Teléfono de Contacto */}
                  <TextField
                    fullWidth
                    label="Teléfono de Contacto"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    variant="outlined"
                    required
                    InputProps={{
                      startAdornment: (
                        <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                      ),
                    }}
                  />

                  {/* Correo Electrónico (no editable) */}
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    variant="outlined"
                    disabled
                    helperText="Este campo no se puede editar"
                    required
                    InputProps={{
                      startAdornment: (
                        <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                      ),
                    }}
                  />

                  {/* Página Web */}
                  <TextField
                    fullWidth
                    label="Página Web"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="https://www.ejemplo.com"
                    InputProps={{
                      startAdornment: (
                        <LanguageIcon sx={{ mr: 1, color: 'action.active' }} />
                      ),
                    }}
                  />
                </div>

                <Box className="mt-6 flex justify-center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveProfile}
                    size="large"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </Box>
              </StyledPaper>
            </div>

            {/* Columna derecha: Suscripción + Datos Bancarios */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Panel de Suscripción */}
              <SubscriptionPanel />

              {/* Panel de Datos Bancarios SEPA */}
              <Paper elevation={1} className="p-6">
                <Box className="flex items-center mb-4">
                  <Avatar
                    sx={{ width: 60, height: 60, mr: 3, bgcolor: 'primary.main' }}
                  >
                    <AccountBalanceIcon sx={{ fontSize: 30, color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      Datos Bancarios
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      SEPA para domiciliaciones
                    </Typography>
                  </Box>
                </Box>

                <Divider className="mb-4" />

                <Box
                  sx={{
                    mb: 3,
                    p: 1.5,
                    backgroundColor: 'info.lighter',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  <InfoIcon sx={{ fontSize: 18, color: 'info.main', mt: 0.25 }} />
                  <Typography variant="caption" color="info.dark">
                    Campos opcionales. Solo necesarios para generar remesas SEPA.
                  </Typography>
                </Box>

                <div className="space-y-4">
                  {/* IBAN de cobro */}
                  <TextField
                    fullWidth
                    label="IBAN de cobro"
                    name="sepaIban"
                    value={formData.sepaIban}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="ES12 3456 7890 1234 5678 9012"
                    error={formData.sepaIban !== '' && !validarFormatoIbanEspanol(formData.sepaIban)}
                    helperText={
                      formData.sepaIban === ''
                        ? 'Cuenta donde recibirás los cobros'
                        : !validarFormatoIbanEspanol(formData.sepaIban)
                          ? 'Formato de IBAN no válido'
                          : obtenerBancoPorIban(formData.sepaIban)
                            ? `Banco: ${obtenerBancoPorIban(formData.sepaIban)?.nombre}`
                            : 'IBAN válido'
                    }
                    InputProps={{
                      startAdornment: (
                        <AccountBalanceIcon sx={{ mr: 1, color: 'action.active' }} />
                      ),
                    }}
                  />

                  {/* BIC/SWIFT */}
                  <TextField
                    fullWidth
                    label="BIC/SWIFT (opcional)"
                    name="sepaBic"
                    value={formData.sepaBic}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="CAIXESBBXXX"
                    error={formData.sepaBic !== '' && !validarBic(formData.sepaBic)}
                    helperText={
                      formData.sepaBic === ''
                        ? 'Código de tu banco (8 u 11 caracteres)'
                        : !validarBic(formData.sepaBic)
                          ? 'Formato de BIC no válido'
                          : 'BIC válido'
                    }
                    InputProps={{
                      startAdornment: (
                        <AccountBalanceIcon sx={{ mr: 1, color: 'action.active' }} />
                      ),
                    }}
                  />

                  {/* Creditor ID */}
                  <TextField
                    fullWidth
                    label="Identificador de Acreedor SEPA"
                    name="sepaCreditorId"
                    value={formData.sepaCreditorId}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="ES12ZZZ12345678X"
                    error={formData.sepaCreditorId !== '' && !validarCreditorId(formData.sepaCreditorId)}
                    helperText={
                      formData.sepaCreditorId === ''
                        ? 'Lo proporciona tu banco al darte de alta como acreedor'
                        : !validarCreditorId(formData.sepaCreditorId)
                          ? 'Formato no válido (debe ser ESxxZZZxxxxxxxx)'
                          : 'Creditor ID válido'
                    }
                    InputProps={{
                      startAdornment: (
                        <BadgeIcon sx={{ mr: 1, color: 'action.active' }} />
                      ),
                    }}
                  />
                </div>

                <Box className="mt-6 flex justify-center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSaveProfile}
                    size="large"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
                  >
                    {saving ? 'Guardando...' : 'Guardar Datos Bancarios'}
                  </Button>
                </Box>
              </Paper>
            </div>
          </div>

          {/* Snackbar para notificaciones */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={closeSnackbar}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
          >
            <Alert
              onClose={closeSnackbar}
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      }
    />
  );
}

export default Settings;
