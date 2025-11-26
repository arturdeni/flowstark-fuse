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
} from '@mui/icons-material';
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
                <Box className="flex items-center mb-6">
                  <Avatar
                    sx={{ width: 80, height: 80, mr: 3 }}
                    alt="Usuario"
                  >
                    {userType === 'autonomo' ? (
                      <PersonIcon sx={{ fontSize: 40 }} />
                    ) : (
                      <BusinessIcon sx={{ fontSize: 40 }} />
                    )}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      Datos Fiscales
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Actualiza tu información fiscal y de contacto
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
                  <Box className="flex items-center gap-3">
                    <PersonIcon className="text-gray-500" sx={{ fontSize: 24 }} />
                    <TextField
                      fullWidth
                      label={userType === 'autonomo' ? 'Nombre y apellidos' : 'Razón Social'}
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      variant="outlined"
                      required
                    />
                  </Box>

                  {/* NIF / CIF */}
                  <Box className="flex items-center gap-3">
                    <BadgeIcon className="text-gray-500" sx={{ fontSize: 24 }} />
                    <TextField
                      fullWidth
                      label={userType === 'autonomo' ? 'NIF' : 'CIF'}
                      name="nifCif"
                      value={formData.nifCif}
                      onChange={handleInputChange}
                      variant="outlined"
                      required
                    />
                  </Box>

                  {/* Domicilio Fiscal */}
                  <Typography variant="subtitle2" color="text.secondary" className="mt-4 mb-2">
                    Domicilio Fiscal
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Box className="flex items-center gap-3">
                        <LocationOnIcon className="text-gray-500" sx={{ fontSize: 24 }} />
                        <TextField
                          fullWidth
                          label="Calle"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          variant="outlined"
                          required
                        />
                      </Box>
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
                  <Box className="flex items-center gap-3">
                    <BusinessIcon className="text-gray-500" sx={{ fontSize: 24 }} />
                    <TextField
                      fullWidth
                      label="Nombre Comercial"
                      name="commercialName"
                      value={formData.commercialName}
                      onChange={handleInputChange}
                      variant="outlined"
                    />
                  </Box>

                  {/* Teléfono de Contacto */}
                  <Box className="flex items-center gap-3">
                    <PhoneIcon className="text-gray-500" sx={{ fontSize: 24 }} />
                    <TextField
                      fullWidth
                      label="Teléfono de Contacto"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      variant="outlined"
                      required
                    />
                  </Box>

                  {/* Correo Electrónico (no editable) */}
                  <Box className="flex items-center gap-3">
                    <EmailIcon className="text-gray-500" sx={{ fontSize: 24 }} />
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
                    />
                  </Box>

                  {/* Página Web */}
                  <Box className="flex items-center gap-3">
                    <LanguageIcon className="text-gray-500" sx={{ fontSize: 24 }} />
                    <TextField
                      fullWidth
                      label="Página Web"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      variant="outlined"
                      placeholder="https://www.ejemplo.com"
                    />
                  </Box>
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

            {/* Panel de Suscripción */}
            <div className="lg:col-span-1">
              <SubscriptionPanel />
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
