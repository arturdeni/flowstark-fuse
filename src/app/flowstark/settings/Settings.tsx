// src/app/flowstark/settings/Settings.tsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Avatar,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationOnIcon,
  Language as LanguageIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider,
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const StyledPaper = styled(Paper)(() => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
}));

function Settings() {
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

  // Estado de suscripción (simulado - debería venir del backend)
  const [subscriptionStatus] = useState({
    isPremium: false,
    plan: 'Free',
    features: [
      'Hasta 10 clientes',
      'Hasta 5 servicios',
      'Soporte por email',
    ],
  });

  const premiumFeatures = [
    'Clientes ilimitados',
    'Servicios ilimitados',
    'Soporte prioritario 24/7',
    'Reportes avanzados',
    'Exportación de datos',
    'API de integración',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUserTypeChange = (event: React.SyntheticEvent, newValue: 'autonomo' | 'empresa') => {
    setUserType(newValue);
  };

  const handleSaveProfile = () => {
    // Aquí iría la lógica para guardar los datos del perfil
    setSnackbar({
      open: true,
      message: 'Perfil actualizado correctamente',
      severity: 'success',
    });
  };

  const handleUpgradeToPremium = () => {
    // Aquí iría la lógica para actualizar a Premium (integración con Stripe)
    setSnackbar({
      open: true,
      message: 'Redirigiendo a la página de pago...',
      severity: 'info',
    });
  };

  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
                  >
                    Guardar Cambios
                  </Button>
                </Box>
              </StyledPaper>
            </div>

            {/* Panel de Suscripción */}
            <div className="lg:col-span-1">
              <StyledCard elevation={1}>
                <CardContent className="flex-1">
                  <Box className="flex items-center justify-between mb-4">
                    <Typography variant="h6">
                      Plan Actual
                    </Typography>
                    <Chip
                      label={subscriptionStatus.plan}
                      color={subscriptionStatus.isPremium ? 'primary' : 'default'}
                      icon={subscriptionStatus.isPremium ? <StarIcon /> : undefined}
                    />
                  </Box>

                  <Divider className="mb-4" />

                  {subscriptionStatus.isPremium ? (
                    <>
                      <Typography variant="body2" color="text.secondary" className="mb-3">
                        Disfrutas de todos los beneficios Premium:
                      </Typography>
                      <ul className="space-y-2">
                        {premiumFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircleIcon className="text-green-500 mt-1 flex-shrink-0" sx={{ fontSize: 20 }} />
                            <Typography variant="body2">{feature}</Typography>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary" className="mb-3">
                        Características actuales:
                      </Typography>
                      <ul className="space-y-2 mb-4">
                        {subscriptionStatus.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircleIcon className="text-gray-400 mt-1 flex-shrink-0" sx={{ fontSize: 20 }} />
                            <Typography variant="body2">{feature}</Typography>
                          </li>
                        ))}
                      </ul>

                      <Divider className="my-4" />

                      <Box className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg mb-4">
                        <Box className="flex items-center gap-2 mb-2">
                          <StarIcon className="text-yellow-500" sx={{ fontSize: 24 }} />
                          <Typography variant="subtitle1" fontWeight="bold">
                            Premium
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" className="mb-3">
                          Desbloquea todo el potencial:
                        </Typography>
                        <ul className="space-y-2">
                          {premiumFeatures.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircleIcon className="text-green-500 mt-0.5 flex-shrink-0" sx={{ fontSize: 18 }} />
                              <Typography variant="body2">{feature}</Typography>
                            </li>
                          ))}
                          <li>
                            <Typography variant="body2" color="text.secondary">Y mucho más...</Typography>
                          </li>
                        </ul>
                      </Box>
                    </>
                  )}
                </CardContent>

                {!subscriptionStatus.isPremium && (
                  <CardActions className="p-4 pt-0">
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={handleUpgradeToPremium}
                      startIcon={<StarIcon />}
                      size="large"
                    >
                      Mejorar a Premium
                    </Button>
                  </CardActions>
                )}
              </StyledCard>
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
