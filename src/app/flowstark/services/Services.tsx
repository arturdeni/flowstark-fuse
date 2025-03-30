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
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';

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

interface ServiceType {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  category: string;
  isActive: boolean;
  subscriptionsCount: number;
}

function Services() {
  // Estados para la gestión de servicios
  const [services, setServices] = useState<ServiceType[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    null
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
    price: '',
    billingCycle: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    category: '',
    isActive: true,
  });

  // Simulación de datos para la demostración
  useEffect(() => {
    // En la implementación real, aquí conectaríamos con Firebase
    const mockServices = [
      {
        id: 1,
        name: 'Plan Premium',
        description: 'Acceso completo a todas las funcionalidades',
        price: 29.99,
        billingCycle: 'monthly' as const,
        category: 'Premium',
        isActive: true,
        subscriptionsCount: 15,
      },
      {
        id: 2,
        name: 'Plan Básico',
        description: 'Funcionalidades esenciales para pequeños negocios',
        price: 9.99,
        billingCycle: 'monthly' as const,
        category: 'Básico',
        isActive: true,
        subscriptionsCount: 42,
      },
      {
        id: 3,
        name: 'Plan Estándar',
        description: 'Equilibrio entre funcionalidades y precio',
        price: 19.99,
        billingCycle: 'monthly' as const,
        category: 'Estándar',
        isActive: true,
        subscriptionsCount: 28,
      },
      {
        id: 4,
        name: 'Plan Anual Premium',
        description: 'Plan Premium con facturación anual',
        price: 299.99,
        billingCycle: 'yearly' as const,
        category: 'Premium',
        isActive: true,
        subscriptionsCount: 7,
      },
      {
        id: 5,
        name: 'Plan Promocional',
        description: 'Oferta por tiempo limitado',
        price: 4.99,
        billingCycle: 'monthly' as const,
        category: 'Promocional',
        isActive: false,
        subscriptionsCount: 0,
      },
    ];

    setServices(mockServices);
    setFilteredServices(mockServices);
  }, []);

  // Filtrado de servicios según término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          service.category.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleClickOpen = (service: ServiceType | null = null) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price.toString(),
        billingCycle: service.billingCycle,
        category: service.category,
        isActive: service.isActive,
      });
    } else {
      setSelectedService(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        billingCycle: 'monthly',
        category: '',
        isActive: true,
      });
    }

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string | 'monthly' | 'quarterly' | 'yearly'>) => {
    const { name, value } = e.target as { name: string; value: string | boolean };
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isActive: e.target.checked,
    });
  };

  const handleSave = () => {
    // Validación básica
    if (
      !formData.name ||
      !formData.description ||
      !formData.price ||
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
    const price = parseFloat(formData.price);

    if (isNaN(price) || price <= 0) {
      setSnackbar({
        open: true,
        message: 'Por favor, introduce un precio válido',
        severity: 'error',
      });
      return;
    }

    // Simulamos guardar (en la implementación real se haría con Firebase)
    if (selectedService) {
      // Editar servicio existente
      const updatedServices = services.map((service) =>
        service.id === selectedService.id
          ? {
            ...service,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            billingCycle: formData.billingCycle,
            category: formData.category,
            isActive: formData.isActive,
          }
          : service
      );
      setServices(updatedServices);
      setSnackbar({
        open: true,
        message: 'Servicio actualizado correctamente',
        severity: 'success',
      });
    } else {
      // Crear nuevo servicio
      const newService = {
        id: services.length + 1,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        billingCycle: formData.billingCycle,
        category: formData.category,
        isActive: formData.isActive,
        subscriptionsCount: 0,
      };
      setServices([...services, newService]);
      setSnackbar({
        open: true,
        message: 'Servicio creado correctamente',
        severity: 'success',
      });
    }

    setOpen(false);
  };

  const handleDelete = (id: number) => {
    // En la implementación real deberíamos verificar si hay suscripciones activas
    const updatedServices = services.filter((service) => service.id !== id);
    setServices(updatedServices);
    setSnackbar({
      open: true,
      message: 'Servicio eliminado correctamente',
      severity: 'success',
    });
  };

  const handleToggleActive = (id: number) => {
    const updatedServices = services.map((service) =>
      service.id === id ? { ...service, isActive: !service.isActive } : service
    );
    setServices(updatedServices);
    setSnackbar({
      open: true,
      message: 'Estado del servicio actualizado correctamente',
      severity: 'success',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  const getBillingCycleText = (cycle: string) => {
    switch (cycle) {
      case 'monthly':
        return 'Mensual';
      case 'quarterly':
        return 'Trimestral';
      case 'yearly':
        return 'Anual';
      default:
        return cycle;
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
          {/* Barra de búsqueda y botón para añadir */}
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
            >
              Nuevo Servicio
            </Button>
          </Box>

          {/* Tabla de servicios */}
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de servicios">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Facturación</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Subscripciones</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredServices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((service) => (
                    <StyledTableRow key={service.id}>
                      <TableCell component="th" scope="row">
                        {service.name}
                      </TableCell>
                      <TableCell>{service.description}</TableCell>
                      <TableCell>{service.price.toFixed(2)} €</TableCell>
                      <TableCell>
                        {getBillingCycleText(service.billingCycle)}
                      </TableCell>
                      <TableCell>
                        <Chip label={service.category} size="small" />
                      </TableCell>
                      <TableCell>
                        {service.isActive ? (
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
                      <TableCell>{service.subscriptionsCount}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleClickOpen(service)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleActive(service.id)}
                        >
                          {service.isActive ? (
                            <CloseIcon fontSize="small" />
                          ) : (
                            <CheckIcon fontSize="small" />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(service.id)}
                          disabled={service.subscriptionsCount > 0}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </StyledTableRow>
                  ))}
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

          {/* Diálogo para añadir/editar servicio */}
          <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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
                  label="Precio"
                  name="price"
                  value={formData.price}
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
                  <InputLabel id="billing-cycle-label">
                    Ciclo de Facturación
                  </InputLabel>
                  <Select
                    labelId="billing-cycle-label"
                    name="billingCycle"
                    value={formData.billingCycle}
                    label="Ciclo de Facturación"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="monthly">Mensual</MenuItem>
                    <MenuItem value="quarterly">Trimestral</MenuItem>
                    <MenuItem value="yearly">Anual</MenuItem>
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
                      checked={formData.isActive}
                      onChange={handleToggleChange}
                      name="isActive"
                    />
                  }
                  label="Servicio Activo"
                  sx={{ gridColumn: '1 / span 2' }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleSave} variant="contained">
                Guardar
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
