import React, { useState, useEffect } from "react";
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
} from "@mui/material";
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
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import FusePageSimple from "@fuse/core/FusePageSimple";

// Componente de tabla con estilo
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.selected,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const Root = styled(FusePageSimple)(({ theme }) => ({
  "& .FusePageSimple-header": {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: "solid",
    borderColor: theme.palette.divider,
  },
  "& .FusePageSimple-content": {},
  "& .FusePageSimple-sidebarHeader": {},
  "& .FusePageSimple-sidebarContent": {},
}));

interface UserType {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
  status: "active" | "inactive";
  subscriptionsCount: number;
}

function Users() {
  // Estados para la gestión de usuarios
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // Formulario para nuevo/editar usuario
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    status: "active",
  });

  // Simulación de datos para la demostración
  useEffect(() => {
    // En la implementación real, aquí conectaríamos con Firebase
    const mockUsers = [
      {
        id: 1,
        name: "Ana",
        lastName: "García",
        email: "ana.garcia@ejemplo.com",
        phone: "612345678",
        address: "Calle Mayor 1",
        city: "Madrid",
        postalCode: "28001",
        notes: "Cliente premium",
        status: "active" as const,
        subscriptionsCount: 2,
      },
      {
        id: 2,
        name: "Carlos",
        lastName: "López",
        email: "carlos.lopez@ejemplo.com",
        phone: "623456789",
        address: "Calle Alcalá 15",
        city: "Madrid",
        postalCode: "28009",
        notes: "",
        status: "active" as const,
        subscriptionsCount: 1,
      },
      {
        id: 3,
        name: "María",
        lastName: "Rodríguez",
        email: "maria.rodriguez@ejemplo.com",
        phone: "634567890",
        address: "Avenida Diagonal 100",
        city: "Barcelona",
        postalCode: "08018",
        notes: "Pagos trimestrales",
        status: "inactive" as const,
        subscriptionsCount: 0,
      },
      {
        id: 4,
        name: "Juan",
        lastName: "Martínez",
        email: "juan.martinez@ejemplo.com",
        phone: "645678901",
        address: "Plaza Mayor 3",
        city: "Sevilla",
        postalCode: "41001",
        notes: "",
        status: "active" as const,
        subscriptionsCount: 3,
      },
      {
        id: 5,
        name: "Laura",
        lastName: "Sánchez",
        email: "laura.sanchez@ejemplo.com",
        phone: "656789012",
        address: "Calle Gran Vía 30",
        city: "Madrid",
        postalCode: "28013",
        notes: "Cliente nuevo",
        status: "active" as const,
        subscriptionsCount: 1,
      },
    ];

    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);

  // Filtrado de usuarios según término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm)
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

  const handleClickOpen = (user: UserType | null = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        postalCode: user.postalCode,
        notes: user.notes,
        status: user.status,
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
        notes: "",
        status: "active",
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target as { name: string; value: string };
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    // Validación básica
    if (!formData.name || !formData.lastName || !formData.email) {
      setSnackbar({
        open: true,
        message: "Por favor, completa los campos requeridos",
        severity: "error",
      });
      return;
    }

    // Simulamos guardar (en la implementación real se haría con Firebase)
    if (selectedUser) {
      // Editar usuario existente
      const updatedUsers = users.map((user) =>
        user.id === selectedUser.id ? { ...user, ...formData } : user
      );
      setUsers(updatedUsers);
      setSnackbar({
        open: true,
        message: "Usuario actualizado correctamente",
        severity: "success",
      });
    } else {
      // Crear nuevo usuario
      const newUser = {
        id: users.length + 1,
        ...formData,
        status: formData.status as "active" | "inactive",
        subscriptionsCount: 0,
      };
      setUsers([...users, newUser]);
      setSnackbar({
        open: true,
        message: "Usuario creado correctamente",
        severity: "success",
      });
    }

    setOpen(false);
  };

  const handleDelete = (id: number) => {
    // En la implementación real deberíamos verificar si tiene subscripciones activas
    const updatedUsers = users.filter((user) => user.id !== id);
    setUsers(updatedUsers);
    setSnackbar({
      open: true,
      message: "Usuario eliminado correctamente",
      severity: "success",
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  return (
    <Root
      header={
        <Box className="p-6">
          <Typography variant="h4" component="h1" gutterBottom>
            Gestión de Usuarios
          </Typography>
        </Box>
      }
      content={
        <Box className="p-6">
          {/* Barra de búsqueda y botón para añadir */}
          <Box sx={{ display: "flex", mb: 3 }}>
            <TextField
              variant="outlined"
              placeholder="Buscar usuarios..."
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
              Nuevo Usuario
            </Button>
          </Box>

          {/* Tabla de usuarios */}
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de usuarios">
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
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <StyledTableRow key={user.id}>
                      <TableCell component="th" scope="row">
                        {user.name} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.city}</TableCell>
                      <TableCell>
                        {user.status === "active" ? (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <CheckCircleIcon
                              color="success"
                              fontSize="small"
                              sx={{ mr: 0.5 }}
                            />
                            <Typography variant="body2">Activo</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <CancelIcon
                              color="error"
                              fontSize="small"
                              sx={{ mr: 0.5 }}
                            />
                            <Typography variant="body2">Inactivo</Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{user.subscriptionsCount}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleClickOpen(user)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(user.id)}
                          disabled={user.subscriptionsCount > 0}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </StyledTableRow>
                  ))}
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

          {/* Diálogo para añadir/editar usuario */}
          <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
              {selectedUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogContent>
              <Box
                component="form"
                sx={{
                  mt: 1,
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                }}
              >
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Nombre"
                  name="name"
                  value={formData.name}
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
                <FormControl margin="normal" fullWidth>
                  <InputLabel id="status-label">Estado</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    label="Estado"
                    onChange={handleInputChange}
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
                  sx={{ gridColumn: "1 / span 2" }}
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
              sx={{ width: "100%" }}
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
