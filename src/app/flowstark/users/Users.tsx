import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  TextField,
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
  Snackbar,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';

import { clientsService } from '../../../services/clientsService';
import { Client } from '../../../types/models';

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

function Users() {
  // Estados para la gestión de usuarios
  const [users, setUsers] = useState<Client[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Client | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Formulario para nuevo/editar usuario
  const [formData, setFormData] = useState({
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
    paymentMethod: {
      type: 'card',
      details: {},
    },
  });

  // Cargar usuarios desde Firestore
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const clientsData = await clientsService.getAllClients();
      setUsers(clientsData);
      setFilteredUsers(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los clientes. Por favor, inténtalo de nuevo.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchUsers();
  }, []);

  // Función para refrescar los datos
  const refreshData = async () => {
    await fetchUsers();
  };

  // Filtrado de usuarios según término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone?.includes(searchTerm)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

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

  const handleClickOpen = (user: Client | null = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fiscalName: user.fiscalName || '',
        email: user.email || '',
        phone: user.phone || '',
        idNumber: user.idNumber || '',
        taxId: user.taxId || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postalCode || '',
        country: user.country || '',
        notes: user.notes || '',
        active: user.active !== false, // default to true if undefined
        paymentMethod: user.paymentMethod || {
          type: 'card',
          details: {},
        },
      });
    } else {
      setSelectedUser(null);
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
        paymentMethod: {
          type: 'card',
          details: {},
        },
      });
    }

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
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
  };

  const handleSave = async () => {
    // Validación básica
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setSnackbar({
        open: true,
        message: 'Por favor, completa los campos requeridos',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      if (selectedUser) {
        // Editar usuario existente
        const updatedClient = await clientsService.updateClient(selectedUser.id!, formData);

        // Actualizar el estado local
        setUsers(users.map(user =>
          user.id === updatedClient.id ? updatedClient : user
        ));

        setSnackbar({
          open: true,
          message: 'Cliente actualizado correctamente',
          severity: 'success',
        });
      } else {
        // Crear nuevo usuario
        const newClient = await clientsService.createClient(formData);

        // Actualizar el estado local
        setUsers([...users, newClient]);

        setSnackbar({
          open: true,
          message: 'Cliente creado correctamente',
          severity: 'success',
        });
      }

      setOpen(false);
      // Refrescar datos para asegurar la sincronización
      await refreshData();
    } catch (error) {
      console.error('Error saving client:', error);
      setSnackbar({
        open: true,
        message: `Error al ${selectedUser ? 'actualizar' : 'crear'} el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      try {
        setLoading(true);
        await clientsService.deleteClient(clientToDelete);

        // Actualizar el estado local
        setUsers(users.filter(user => user.id !== clientToDelete));

        setSnackbar({
          open: true,
          message: 'Cliente eliminado correctamente',
          severity: 'success',
        });

        // Refrescar datos para asegurar la sincronización
        await refreshData();
      } catch (error) {
        console.error('Error deleting client:', error);
        setSnackbar({
          open: true,
          message: `Error al eliminar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          severity: 'error',
        });
      } finally {
        setLoading(false);
        setDeleteConfirmOpen(false);
        setClientToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setClientToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Calcular el número de suscripciones para cada cliente (esto sería ideal hacerlo en el backend)
  // Por ahora simplemente devolvemos 0 o un placeholder
  const getSubscriptionCount = (client: Client) => {
    // Aquí podrías implementar una lógica para obtener el recuento de suscripciones
    return 0; // Por defecto devolvemos 0
  };

  return (
    <Root
      header={
        <Box className="p-6">
          <Typography variant="h4" component="h1" gutterBottom>
            Clientes
          </Typography>
        </Box>
      }
      content={
        <Box className="p-6">
          {/* Barra de búsqueda y botones para añadir/refrescar */}
          <Box sx={{ display: 'flex', mb: 3 }}>
            <TextField
              variant="outlined"
              placeholder="Buscar clientes..."
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
              Nuevo Cliente
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

          {/* Tabla de usuarios con estado de carga */}
          {loading && users.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="tabla de clientes">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Ciudad</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Subscripciones</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No se encontraron clientes
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((user) => (
                        <StyledTableRow key={user.id}>
                          <TableCell component="th" scope="row">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>{user.city}</TableCell>
                          <TableCell>
                            {user.active !== false ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CheckCircleIcon
                                  color="success"
                                  fontSize="small"
                                  sx={{ mr: 0.5 }}
                                />
                                <Typography variant="body2">Activo</Typography>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CancelIcon
                                  color="error"
                                  fontSize="small"
                                  sx={{ mr: 0.5 }}
                                />
                                <Typography variant="body2">Inactivo</Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>{getSubscriptionCount(user)}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleClickOpen(user)}
                              disabled={loading}
                              title="Editar"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => user.id && handleDeleteClick(user.id)}
                              disabled={loading || getSubscriptionCount(user) > 0}
                              title="Eliminar"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" title="Más opciones">
                              <MoreVertIcon fontSize="small" />
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
                count={filteredUsers.length}
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

          {/* Diálogo para añadir/editar usuario */}
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
              {selectedUser ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                  label="DNI/NIF"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
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
                    <MenuItem value="card">Tarjeta</MenuItem>
                    <MenuItem value="transfer">Transferencia</MenuItem>
                    <MenuItem value="cash">Efectivo</MenuItem>
                    <MenuItem value="direct_debit">Domiciliación</MenuItem>
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
                <FormControl margin="normal" fullWidth>
                  <InputLabel id="status-label">Estado</InputLabel>
                  <Select
                    labelId="status-label"
                    name="active"
                    value={formData.active ? 'active' : 'inactive'}
                    label="Estado"
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        active: e.target.value === 'active'
                      });
                    }}
                  >
                    <MenuItem value="active">Activo</MenuItem>
                    <MenuItem value="inactive">Inactivo</MenuItem>
                  </Select>
                </FormControl>
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
                ¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.
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

export default Users;