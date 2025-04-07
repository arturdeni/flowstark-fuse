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
  Card,
  CardContent,
  CardActions,
  Grid,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
  Snackbar,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Euro as EuroIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';

import { servicesService } from '../../../services/servicesService';
import { Service } from '../../../types/models';

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

function Services() {
  // Estados para la gestión de servicios
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [categories, setCategories] = useState([
    'Premium',
    'Básico',
    'Estándar',
    'Personalizado',
    'Promocional',
  ]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Formulario para nuevo/editar servicio
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    vat: 21, // IVA por defecto del 21%
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual',
    category: '',
    active: true,
  });

  // Cargar servicios desde Firestore
  const fetchServices = async () => {
    setLoading(true);
    try {
      const servicesData = await servicesService.getAllServices();
      setServices(servicesData);
      setFilteredServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los servicios. Por favor, inténtalo de nuevo.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchServices();
  }, []);

  // Función para refrescar los datos
  const refreshData = async () => {
    await fetchServices();
  };

  // Filtrado de servicios según término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (service.category && service.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchTerm, services]);

  // Manejadores de eventos
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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

  const handleClickOpen = (service: Service | null = null) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name || '',
        description: service.description || '',
        basePrice: service.basePrice?.toString() || '',
        vat: service.vat ?? 21,
        frequency: service.frequency || 'monthly',
        category: service.category || '',
        active: service.active !== false,
      });
    } else {
      setSelectedService(null);
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

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string | number | 'monthly' | 'quarterly' | 'four_monthly' | 'biannual' | 'annual'>) => {
    const { name, value } = e.target as { name: string; value: string | number | boolean };
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      active: e.target.checked,
    });
  };

  const handleSave = async () => {
    // Validación básica
    if (
      !formData.name ||
      !formData.description ||
      !formData.basePrice ||
      !formData.category
    ) {
      setSnackbar({
        open: true,
        message: 'Por favor, completa todos los campos requeridos',
        severity: 'error',
      });
      return;
    }

    // Validar que el precio sea un número válido
    const price = parseFloat(formData.basePrice);

    if (isNaN(price) || price <= 0) {
      setSnackbar({
        open: true,
        message: 'Por favor, introduce un precio válido',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const serviceData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        vat: Number(formData.vat),
      };

      if (selectedService) {
        // Editar servicio existente
        const updatedService = await servicesService.updateService(selectedService.id!, serviceData);

        // Actualizar el estado local
        setServices(services.map(service =>
          service.id === updatedService.id ? updatedService : service
        ));

        setSnackbar({
          open: true,
          message: 'Servicio actualizado correctamente',
          severity: 'success',
        });
      } else {
        // Crear nuevo servicio
        const newService = await servicesService.createService(serviceData);

        // Actualizar el estado local
        setServices([...services, newService]);

        setSnackbar({
          open: true,
          message: 'Servicio creado correctamente',
          severity: 'success',
        });
      }

      setOpen(false);
      // Refrescar datos para asegurar la sincronización
      await refreshData();
    } catch (error) {
      console.error('Error saving service:', error);
      setSnackbar({
        open: true,
        message: `Error al ${selectedService ? 'actualizar' : 'crear'} el servicio: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (serviceToDelete) {
      try {
        setLoading(true);
        await servicesService.deleteService(serviceToDelete);

        // Actualizar el estado local
        setServices(services.filter(service => service.id !== serviceToDelete));

        setSnackbar({
          open: true,
          message: 'Servicio eliminado correctamente',
          severity: 'success',
        });

        // Refrescar datos para asegurar la sincronización
        await refreshData();
      } catch (error) {
        console.error('Error deleting service:', error);
        setSnackbar({
          open: true,
          message: `Error al eliminar el servicio: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          severity: 'error',
        });
      } finally {
        setLoading(false);
        setDeleteConfirmOpen(false);
        setServiceToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setServiceToDelete(null);
  };

  const handleToggleActive = async (id: string) => {
    try {
      setLoading(true);
      // Encontrar el servicio actual
      const service = services.find(s => s.id === id);

      if (!service) return;

      // Invertir el estado active
      const updatedService = await servicesService.updateService(id, {
        active: !service.active
      });

      // Actualizar el estado local
      setServices(services.map(service =>
        service.id === id ? updatedService : service
      ));

      setSnackbar({
        open: true,
        message: `Servicio ${updatedService.active ? 'activado' : 'desactivado'} correctamente`,
        severity: 'success',
      });

      // Refrescar datos para asegurar la sincronización
      await refreshData();
    } catch (error) {
      console.error('Error toggling service active state:', error);
      setSnackbar({
        open: true,
        message: `Error al cambiar el estado del servicio: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'Mensual';
      case 'quarterly':
        return 'Trimestral';
      case 'four_monthly':
        return 'Cuatrimestral';
      case 'biannual':
        return 'Semestral';
      case 'annual':
        return 'Anual';
      default:
        return frequency;
    }
  };

  return (
    <Root
      header={
        <Box className="p-6">
          <Typography variant="h4" component="h1" gutterBottom>
            Servicios
          </Typography>
        </Box>
      }
      content={
        <Box className="p-6">
          {/* Barra de búsqueda y botones para añadir/refrescar */}
          <Box sx={{ display: 'flex', mb: 3 }}>
            <TextField
              variant="outlined"
              placeholder="Buscar servicios..."
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
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleClickOpen()}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Nuevo Servicio
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

          {/* Tabla de servicios con estado de carga */}
          {loading && services.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="tabla de servicios">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>IVA</TableCell>
                    <TableCell>Facturación</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Subscripciones</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No se encontraron servicios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServices
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((service) => (
                        <StyledTableRow key={service.id}>
                          <TableCell component="th" scope="row">
                            {service.name}
                          </TableCell>
                          <TableCell>{service.description}</TableCell>
                          <TableCell>{typeof service.basePrice === 'number' ? service.basePrice.toFixed(2) : '0.00'} €</TableCell>
                          <TableCell>{service.vat}%</TableCell>
                          <TableCell>
                            {getFrequencyText(service.frequency)}
                          </TableCell>
                          <TableCell>
                            <Chip label={service.category} size="small" />
                          </TableCell>
                          <TableCell>
                            {service.active !== false ? (
                              <Chip
                                icon={<CheckIcon />}
                                label="Activo"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                icon={<CloseIcon />}
                                label="Inactivo"
                                color="error"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>{service.activeSubscriptions || 0}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleClickOpen(service)}
                              disabled={loading}
                              title="Editar"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => service.id && handleToggleActive(service.id)}
                              disabled={loading}
                              title={service.active ? 'Desactivar' : 'Activar'}
                            >
                              {service.active ? (
                                <CloseIcon fontSize="small" />
                              ) : (
                                <CheckIcon fontSize="small" />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => service.id && handleDeleteClick(service.id)}
                              disabled={loading || (service.activeSubscriptions && service.activeSubscriptions > 0)}
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
                count={filteredServices.length}
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

          {/* Diálogo para añadir/editar servicio */}
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
              {selectedService ? 'Editar Servicio' : 'Nuevo Servicio'}
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
                    <MenuItem value={0}>0%</MenuItem>
                    <MenuItem value={4}>4%</MenuItem>
                    <MenuItem value={10}>10%</MenuItem>
                    <MenuItem value={21}>21%</MenuItem>
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
                    <MenuItem value="monthly">Mensual</MenuItem>
                    <MenuItem value="quarterly">Trimestral</MenuItem>
                    <MenuItem value="four_monthly">Cuatrimestral</MenuItem>
                    <MenuItem value="biannual">Semestral</MenuItem>
                    <MenuItem value="annual">Anual</MenuItem>
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
                ¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.
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

export default Services;