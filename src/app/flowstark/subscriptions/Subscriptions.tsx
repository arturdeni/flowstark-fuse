import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Euro as EuroIcon,
  Refresh as RefreshIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FusePageSimple from '@fuse/core/FusePageSimple';

import { subscriptionsService } from '../../../services/subscriptionsService';
import { clientsService } from '../../../services/clientsService';
import { servicesService } from '../../../services/servicesService';
import { Subscription, Client, Service } from '../../../types/models';

// Componente de tabla con estilo
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider,
  },
  '& .FusePageSimple-content': {},
  '& .FusePageSimple-sidebarHeader': {},
  '& .FusePageSimple-sidebarContent': {},
}));

// Tipo extendido para incluir la información relacionada
type SubscriptionWithRelations = Subscription & {
  clientInfo?: any;
  serviceInfo?: any;
};

function Subscriptions() {
  // Estados para la gestión de subscripciones
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithRelations[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionWithRelations[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithRelations | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Formulario para nueva/editar subscripción
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    status: 'active' as 'active' | 'paused' | 'cancelled',
    startDate: new Date(),
    endDate: null as Date | null,
    paymentDate: new Date(),
    paymentMethod: {
      type: 'credit_card',
      details: {},
    },
    renewal: 'monthly' as 'monthly' | 'quarterly' | 'biannual' | 'annual',
    paymentHistory: [] as any[],
  });

  // Cargar datos iniciales
  useEffect(() => {
    fetchSubscriptions();
    fetchClients();
    fetchServices();
  }, []);

  // Cargar subscripciones desde Firestore
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const subscriptionsData = await subscriptionsService.getAllSubscriptions();
      setSubscriptions(subscriptionsData);
      setFilteredSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar las suscripciones. Por favor, inténtalo de nuevo.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes desde Firestore
  const fetchClients = async () => {
    try {
      const clientsData = await clientsService.getAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Cargar servicios desde Firestore
  const fetchServices = async () => {
    try {
      const servicesData = await servicesService.getAllServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Función para refrescar los datos
  const refreshData = async () => {
    await fetchSubscriptions();
  };

  // Filtrado de subscripciones según término de búsqueda y filtro de estado
  useEffect(() => {
    let filtered = subscriptions;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (subscription) =>
          subscription.clientInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subscription.clientInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subscription.clientInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subscription.serviceInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (subscription) => subscription.status === statusFilter
      );
    }

    setFilteredSubscriptions(filtered);
  }, [searchTerm, statusFilter, subscriptions]);

  // Manejadores de eventos
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value as string);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClickOpen = (subscription: SubscriptionWithRelations | null = null) => {
    if (subscription) {
      setSelectedSubscription(subscription);
      setFormData({
        clientId: subscription.clientId,
        serviceId: subscription.serviceId,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        paymentDate: subscription.paymentDate || new Date(),
        paymentMethod: subscription.paymentMethod || {
          type: 'credit_card',
          details: {},
        },
        renewal: subscription.renewal || 'monthly',
        paymentHistory: subscription.paymentHistory || [],
      });
    } else {
      setSelectedSubscription(null);
      setFormData({
        clientId: '',
        serviceId: '',
        status: 'active',
        startDate: new Date(),
        endDate: null,
        paymentDate: new Date(),
        paymentMethod: {
          type: 'credit_card',
          details: {},
        },
        renewal: 'monthly',
        paymentHistory: [],
      });
    }

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string | 'active' | 'paused' | 'cancelled'>) => {
    const { name, value } = e.target as { name: string; value: string };

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
  };

  const handleDateChange = (name: string, date: Date | null) => {
    setFormData({
      ...formData,
      [name]: date,
    });
  };

  const calculateNextBillingDate = (
    startDate: Date,
    renewal: string
  ): Date => {
    const nextDate = new Date(startDate);
    switch (renewal) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'biannual':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    return nextDate;
  };

  const handleSave = async () => {
    // Validación básica
    if (
      !formData.clientId ||
      !formData.serviceId ||
      !formData.startDate
    ) {
      setSnackbar({
        open: true,
        message: 'Por favor, completa todos los campos requeridos',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // Preparar el historial de pagos inicial si es una nueva suscripción
      const paymentHistory = formData.paymentHistory.length ? formData.paymentHistory : [
        {
          date: formData.paymentDate || new Date(),
          amount: 0, // Se actualizará con el precio del servicio
          status: 'paid',
        }
      ];

      if (selectedSubscription) {
        // Editar subscripción existente
        const updatedSubscription = await subscriptionsService.updateSubscription(selectedSubscription.id!, {
          ...formData,
          paymentHistory
        });

        setSnackbar({
          open: true,
          message: 'Suscripción actualizada correctamente',
          severity: 'success',
        });
      } else {
        // Crear nueva subscripción
        const newSubscription = await subscriptionsService.createSubscription({
          ...formData,
          paymentHistory
        });

        setSnackbar({
          open: true,
          message: 'Suscripción creada correctamente',
          severity: 'success',
        });
      }

      setOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Error saving subscription:', error);
      setSnackbar({
        open: true,
        message: `Error al ${selectedSubscription ? 'actualizar' : 'crear'} la suscripción: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: 'active' | 'paused' | 'cancelled') => {
    try {
      setLoading(true);
      await subscriptionsService.changeSubscriptionStatus(id, newStatus);

      setSnackbar({
        open: true,
        message: `Estado de la suscripción actualizado a ${getStatusText(newStatus)}`,
        severity: 'success',
      });

      await refreshData();
    } catch (error) {
      console.error('Error changing subscription status:', error);
      setSnackbar({
        open: true,
        message: `Error al cambiar el estado de la suscripción: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSubscriptionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (subscriptionToDelete) {
      try {
        setLoading(true);
        await subscriptionsService.deleteSubscription(subscriptionToDelete);

        setSnackbar({
          open: true,
          message: 'Suscripción eliminada correctamente',
          severity: 'success',
        });

        await refreshData();
      } catch (error) {
        console.error('Error deleting subscription:', error);
        setSnackbar({
          open: true,
          message: `Error al eliminar la suscripción: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          severity: 'error',
        });
      } finally {
        setLoading(false);
        setDeleteConfirmOpen(false);
        setSubscriptionToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSubscriptionToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'paused':
        return 'Pausada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusChip = (status: 'active' | 'paused' | 'cancelled') => {
    switch (status) {
      case 'active':
        return <Chip label="Activa" color="success" size="small" />;
      case 'paused':
        return <Chip label="Pausada" color="warning" size="small" />;
      case 'cancelled':
        return <Chip label="Cancelada" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRenewalText = (renewal: string): string => {
    switch (renewal) {
      case 'monthly':
        return 'Mensual';
      case 'quarterly':
        return 'Trimestral';
      case 'biannual':
        return 'Semestral';
      case 'annual':
        return 'Anual';
      default:
        return renewal;
    }
  };

  const getPaymentMethodText = (method: string): string => {
    switch (method) {
      case 'credit_card':
        return 'Tarjeta de Crédito';
      case 'paypal':
        return 'PayPal';
      case 'bank_transfer':
        return 'Transferencia Bancaria';
      case 'cash':
        return 'Efectivo';
      case 'direct_debit':
        return 'Domiciliación';
      default:
        return method;
    }
  };

  return (
    <Root
      header={
        <Box className="p-6">
          <Typography variant="h4" component="h1" gutterBottom>
            Suscripciones
          </Typography>
        </Box>
      }
      content={
        <Box className="p-6">
          {/* Resumen de subscripciones */}
          <Grid container spacing={3} className="mb-6">
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Suscripciones
                  </Typography>
                  <Typography variant="h4">{subscriptions.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Activas
                  </Typography>
                  <Typography variant="h4">
                    {subscriptions.filter((s) => s.status === 'active').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Pausadas
                  </Typography>
                  <Typography variant="h4">
                    {subscriptions.filter((s) => s.status === 'paused').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Canceladas
                  </Typography>
                  <Typography variant="h4">
                    {
                      subscriptions.filter((s) => s.status === 'cancelled')
                        .length
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Barra de búsqueda, filtro y botón para añadir */}
          <Box sx={{ display: 'flex', mb: 3 }}>
            <TextField
              variant="outlined"
              placeholder="Buscar suscripciones..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ mr: 2, flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl variant="outlined" sx={{ minWidth: 120, mr: 2 }}>
              <InputLabel id="status-filter-label">Estado</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Estado"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activas</MenuItem>
                <MenuItem value="paused">Pausadas</MenuItem>
                <MenuItem value="cancelled">Canceladas</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleClickOpen()}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Nueva Suscripción
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={refreshData}
              disabled={loading}
            >
              Actualizar
            </Button>
          </Box>

          {/* Tabla de subscripciones con estado de carga */}
          {loading && subscriptions.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="tabla de suscripciones">
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Servicio</TableCell>
                    <TableCell>Frecuencia</TableCell>
                    <TableCell>Método de Pago</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Inicio</TableCell>
                    <TableCell>Fin</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No se encontraron suscripciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((subscription) => (
                        <StyledTableRow key={subscription.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="body2" fontWeight="bold">
                                {subscription.clientInfo?.firstName}{' '}
                                {subscription.clientInfo?.lastName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {subscription.clientInfo?.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{subscription.serviceInfo?.name}</TableCell>
                          <TableCell>{getRenewalText(subscription.renewal)}</TableCell>
                          <TableCell>{getPaymentMethodText(subscription.paymentMethod?.type)}</TableCell>
                          <TableCell>
                            {getStatusChip(subscription.status)}
                          </TableCell>
                          <TableCell>
                            {formatDate(subscription.startDate)}
                          </TableCell>
                          <TableCell>
                            {formatDate(subscription.endDate)}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleClickOpen(subscription)}
                              disabled={loading}
                              title="Editar"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>

                            {subscription.status === 'active' && (
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleChangeStatus(subscription.id!, 'paused')
                                }
                                disabled={loading}
                                title="Pausar"
                              >
                                <PauseIcon fontSize="small" />
                              </IconButton>
                            )}

                            {subscription.status === 'paused' && (
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleChangeStatus(subscription.id!, 'active')
                                }
                                disabled={loading}
                                title="Activar"
                              >
                                <PlayArrowIcon fontSize="small" />
                              </IconButton>
                            )}

                            {(subscription.status === 'active' ||
                              subscription.status === 'paused') && (
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleChangeStatus(subscription.id!, 'cancelled')
                                  }
                                  disabled={loading}
                                  title="Cancelar"
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              )}

                            <IconButton
                              size="small"
                              onClick={() => subscription.id && handleDeleteClick(subscription.id)}
                              disabled={loading || subscription.status === 'active'}
                              title="Eliminar"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </StyledTableRow>
                      ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredSubscriptions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count}`
                }
              />
            </TableContainer>
          )}

          {/* Diálogo para añadir/editar subscripción */}
          <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: { overflowY: 'visible' }
            }}
          >
            <DialogTitle>
              {selectedSubscription
                ? 'Editar Suscripción'
                : 'Nueva Suscripción'}
            </DialogTitle>
            <DialogContent>
              <Box
                component="form"
                sx={{
                  mt: 1,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2,
                }}
              >
                <FormControl margin="normal" fullWidth required>
                  <InputLabel id="client-label">Cliente</InputLabel>
                  <Select
                    labelId="client-label"
                    name="clientId"
                    value={formData.clientId}
                    label="Cliente"
                    onChange={handleInputChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    }
                  >
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName} ({client.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl margin="normal" fullWidth required>
                  <InputLabel id="service-label">Servicio</InputLabel>
                  <Select
                    labelId="service-label"
                    name="serviceId"
                    value={formData.serviceId}
                    label="Servicio"
                    onChange={handleInputChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <InventoryIcon fontSize="small" />
                      </InputAdornment>
                    }
                  >
                    {services.map((service) => (
                      <MenuItem key={service.id} value={service.id}>
                        {service.name} ({service.basePrice?.toFixed(2)} € - {getRenewalText(service.frequency)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl margin="normal" fullWidth required>
                  <InputLabel id="renewal-label">Frecuencia</InputLabel>
                  <Select
                    labelId="renewal-label"
                    name="renewal"
                    value={formData.renewal}
                    label="Frecuencia"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="monthly">Mensual</MenuItem>
                    <MenuItem value="quarterly">Trimestral</MenuItem>
                    <MenuItem value="biannual">Semestral</MenuItem>
                    <MenuItem value="annual">Anual</MenuItem>
                  </Select>
                </FormControl>
                <FormControl margin="normal" fullWidth required>
                  <InputLabel id="payment-method-label">
                    Método de Pago
                  </InputLabel>
                  <Select
                    labelId="payment-method-label"
                    name="paymentMethod.type"
                    value={formData.paymentMethod.type}
                    label="Método de Pago"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="credit_card">Tarjeta de Crédito</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="bank_transfer">Transferencia Bancaria</MenuItem>
                    <MenuItem value="cash">Efectivo</MenuItem>
                    <MenuItem value="direct_debit">Domiciliación</MenuItem>
                  </Select>
                </FormControl>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Fecha de Inicio"
                    value={formData.startDate}
                    onChange={(date) => handleDateChange('startDate', date)}
                    slotProps={{
                      textField: {
                        margin: 'normal',
                        fullWidth: true,
                        required: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                </LocalizationProvider>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Fecha de Pago"
                    value={formData.paymentDate}
                    onChange={(date) => handleDateChange('paymentDate', date)}
                    slotProps={{
                      textField: {
                        margin: 'normal',
                        fullWidth: true,
                        required: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        },
                      },
                    }}
                  />
                </LocalizationProvider>

                {(selectedSubscription?.status === 'cancelled' || formData.status === 'cancelled') && (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Fecha de Finalización"
                      value={formData.endDate}
                      onChange={(date) => handleDateChange('endDate', date)}
                      slotProps={{
                        textField: {
                          margin: 'normal',
                          fullWidth: true,
                          InputProps: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                )}

                {selectedSubscription && (
                  <FormControl margin="normal" fullWidth>
                    <InputLabel id="status-label">Estado</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={formData.status}
                      label="Estado"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="active">Activa</MenuItem>
                      <MenuItem value="paused">Pausada</MenuItem>
                      <MenuItem value="cancelled">Cancelada</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} disabled={loading}>Cancelar</Button>
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

          {/* Diálogo de confirmación para eliminar */}
          <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogContent>
              <Typography>
                ¿Estás seguro de que deseas eliminar esta suscripción? Esta acción no se puede deshacer.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelDelete} disabled={loading}>Cancelar</Button>
              <Button
                onClick={handleConfirmDelete}
                color="error"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar para notificaciones */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert
              onClose={handleCloseSnackbar}
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

export default Subscriptions;