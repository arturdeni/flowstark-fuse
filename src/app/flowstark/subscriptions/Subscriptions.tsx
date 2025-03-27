import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Euro as EuroIcon,
  Refresh as RefreshIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
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

type StatusType = "active" | "paused" | "cancelled";

interface UserType {
  id: number;
  name: string;
  lastName: string;
  email: string;
}

interface ServiceType {
  id: number;
  name: string;
  price: number;
  billingCycle: "monthly" | "quarterly" | "yearly";
}

interface SubscriptionType {
  id: number;
  userId: number;
  serviceId: number;
  user: UserType;
  service: ServiceType;
  status: StatusType;
  startDate: Date;
  nextBillingDate: Date;
  endDate: Date | null;
  amount: number;
  paymentMethod: string;
  lastPaymentDate: Date | null;
}

function Subscriptions() {
  // Estados para la gestión de subscripciones
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<
    SubscriptionType[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionType | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [users, setUsers] = useState<UserType[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // Formulario para nueva/editar subscripción
  const [formData, setFormData] = useState({
    userId: "",
    serviceId: "",
    status: "active" as StatusType,
    startDate: new Date(),
    endDate: null as Date | null,
    amount: "",
    paymentMethod: "credit_card",
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
      },
      {
        id: 2,
        name: "Carlos",
        lastName: "López",
        email: "carlos.lopez@ejemplo.com",
      },
      {
        id: 3,
        name: "María",
        lastName: "Rodríguez",
        email: "maria.rodriguez@ejemplo.com",
      },
      {
        id: 4,
        name: "Juan",
        lastName: "Martínez",
        email: "juan.martinez@ejemplo.com",
      },
      {
        id: 5,
        name: "Laura",
        lastName: "Sánchez",
        email: "laura.sanchez@ejemplo.com",
      },
    ];

    const mockServices = [
      {
        id: 1,
        name: "Plan Premium",
        price: 29.99,
        billingCycle: "monthly" as const,
      },
      {
        id: 2,
        name: "Plan Básico",
        price: 9.99,
        billingCycle: "monthly" as const,
      },
      {
        id: 3,
        name: "Plan Estándar",
        price: 19.99,
        billingCycle: "monthly" as const,
      },
      {
        id: 4,
        name: "Plan Anual Premium",
        price: 299.99,
        billingCycle: "yearly" as const,
      },
    ];

    setUsers(mockUsers);
    setServices(mockServices);

    const mockSubscriptions = [
      {
        id: 1,
        userId: 1,
        serviceId: 1,
        user: mockUsers[0],
        service: mockServices[0],
        status: "active" as StatusType,
        startDate: new Date(2023, 1, 15),
        nextBillingDate: new Date(2023, 2, 15),
        endDate: null,
        amount: 29.99,
        paymentMethod: "credit_card",
        lastPaymentDate: new Date(2023, 1, 15),
      },
      {
        id: 2,
        userId: 2,
        serviceId: 2,
        user: mockUsers[1],
        service: mockServices[1],
        status: "active" as StatusType,
        startDate: new Date(2023, 0, 10),
        nextBillingDate: new Date(2023, 2, 10),
        endDate: null,
        amount: 9.99,
        paymentMethod: "paypal",
        lastPaymentDate: new Date(2023, 1, 10),
      },
      {
        id: 3,
        userId: 3,
        serviceId: 3,
        user: mockUsers[2],
        service: mockServices[2],
        status: "paused" as StatusType,
        startDate: new Date(2022, 11, 5),
        nextBillingDate: new Date(2023, 2, 5),
        endDate: null,
        amount: 19.99,
        paymentMethod: "bank_transfer",
        lastPaymentDate: new Date(2023, 0, 5),
      },
      {
        id: 4,
        userId: 4,
        serviceId: 4,
        user: mockUsers[3],
        service: mockServices[3],
        status: "cancelled" as StatusType,
        startDate: new Date(2022, 9, 20),
        nextBillingDate: new Date(2023, 9, 20),
        endDate: new Date(2023, 0, 15),
        amount: 299.99,
        paymentMethod: "credit_card",
        lastPaymentDate: new Date(2022, 9, 20),
      },
      {
        id: 5,
        userId: 5,
        serviceId: 1,
        user: mockUsers[4],
        service: mockServices[0],
        status: "active" as StatusType,
        startDate: new Date(2023, 0, 1),
        nextBillingDate: new Date(2023, 3, 1),
        endDate: null,
        amount: 29.99,
        paymentMethod: "paypal",
        lastPaymentDate: new Date(2023, 2, 1),
      },
    ];

    setSubscriptions(mockSubscriptions);
    setFilteredSubscriptions(mockSubscriptions);
  }, []);

  // Filtrado de subscripciones según término de búsqueda y filtro de estado
  useEffect(() => {
    let filtered = subscriptions;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (subscription) =>
          subscription.user.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          subscription.user.lastName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          subscription.user.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          subscription.service.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
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

  const handleStatusFilterChange = (
    e: React.ChangeEvent<{ value: unknown }>
  ) => {
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

  const handleClickOpen = (subscription: SubscriptionType | null = null) => {
    if (subscription) {
      setSelectedSubscription(subscription);
      setFormData({
        userId: subscription.userId.toString(),
        serviceId: subscription.serviceId.toString(),
        status: subscription.status,
        startDate: new Date(subscription.startDate),
        endDate: subscription.endDate ? new Date(subscription.endDate) : null,
        amount: subscription.amount.toString(),
        paymentMethod: subscription.paymentMethod,
      });
    } else {
      setSelectedSubscription(null);
      setFormData({
        userId: "",
        serviceId: "",
        status: "active",
        startDate: new Date(),
        endDate: null,
        amount: "",
        paymentMethod: "credit_card",
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

  const handleDateChange = (name: string, date: Date | null) => {
    setFormData({
      ...formData,
      [name]: date,
    });
  };

  const calculateNextBillingDate = (
    startDate: Date,
    billingCycle: string
  ): Date => {
    const nextDate = new Date(startDate);
    switch (billingCycle) {
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "quarterly":
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    return nextDate;
  };

  const handleSave = () => {
    // Validación básica
    if (
      !formData.userId ||
      !formData.serviceId ||
      !formData.amount ||
      !formData.startDate
    ) {
      setSnackbar({
        open: true,
        message: "Por favor, completa todos los campos requeridos",
        severity: "error",
      });
      return;
    }

    // Validar que el monto sea un número válido
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setSnackbar({
        open: true,
        message: "Por favor, introduce un monto válido",
        severity: "error",
      });
      return;
    }

    const userId = parseInt(formData.userId);
    const serviceId = parseInt(formData.serviceId);

    // Buscar usuario y servicio
    const user = users.find((u) => u.id === userId);
    const service = services.find((s) => s.id === serviceId);

    if (!user || !service) {
      setSnackbar({
        open: true,
        message: "Usuario o servicio no válido",
        severity: "error",
      });
      return;
    }

    const nextBillingDate = calculateNextBillingDate(
      formData.startDate,
      service.billingCycle
    );

    // Simulamos guardar (en la implementación real se haría con Firebase)
    if (selectedSubscription) {
      // Editar subscripción existente
      const updatedSubscriptions = subscriptions.map((subscription) =>
        subscription.id === selectedSubscription.id
          ? {
              ...subscription,
              userId,
              serviceId,
              user,
              service,
              status: formData.status,
              startDate: formData.startDate,
              nextBillingDate,
              endDate: formData.endDate,
              amount,
              paymentMethod: formData.paymentMethod,
            }
          : subscription
      );
      setSubscriptions(updatedSubscriptions);
      setSnackbar({
        open: true,
        message: "Subscripción actualizada correctamente",
        severity: "success",
      });
    } else {
      // Crear nueva subscripción
      const newSubscription = {
        id: subscriptions.length + 1,
        userId,
        serviceId,
        user,
        service,
        status: formData.status,
        startDate: formData.startDate,
        nextBillingDate,
        endDate: formData.endDate,
        amount,
        paymentMethod: formData.paymentMethod,
        lastPaymentDate: formData.startDate,
      };
      setSubscriptions([...subscriptions, newSubscription]);
      setSnackbar({
        open: true,
        message: "Subscripción creada correctamente",
        severity: "success",
      });
    }

    setOpen(false);
  };

  const handleChangeStatus = (id: number, newStatus: StatusType) => {
    const updatedSubscriptions = subscriptions.map((subscription) => {
      if (subscription.id === id) {
        let endDate = subscription.endDate;
        if (newStatus === "cancelled" && !endDate) {
          endDate = new Date();
        }
        return {
          ...subscription,
          status: newStatus,
          endDate,
        };
      }
      return subscription;
    });

    setSubscriptions(updatedSubscriptions);
    setSnackbar({
      open: true,
      message: `Estado de la subscripción actualizado a ${getStatusText(newStatus)}`,
      severity: "success",
    });
  };

  const handleDelete = (id: number) => {
    const updatedSubscriptions = subscriptions.filter(
      (subscription) => subscription.id !== id
    );
    setSubscriptions(updatedSubscriptions);
    setSnackbar({
      open: true,
      message: "Subscripción eliminada correctamente",
      severity: "success",
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "active":
        return "Activa";
      case "paused":
        return "Pausada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const getStatusChip = (status: StatusType) => {
    switch (status) {
      case "active":
        return <Chip label="Activa" color="success" size="small" />;
      case "paused":
        return <Chip label="Pausada" color="warning" size="small" />;
      case "cancelled":
        return <Chip label="Cancelada" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Root
      header={
        <Box className="p-6">
          <Typography variant="h4" component="h1" gutterBottom>
            Gestión de Subscripciones
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
                    Total Subscripciones
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
                    {subscriptions.filter((s) => s.status === "active").length}
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
                    {subscriptions.filter((s) => s.status === "paused").length}
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
                      subscriptions.filter((s) => s.status === "cancelled")
                        .length
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Barra de búsqueda, filtro y botón para añadir */}
          <Box sx={{ display: "flex", mb: 3 }}>
            <TextField
              variant="outlined"
              placeholder="Buscar subscripciones..."
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
            >
              Nueva Subscripción
            </Button>
          </Box>

          {/* Tabla de subscripciones */}
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de subscripciones">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Servicio</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Próximo Pago</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSubscriptions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((subscription) => (
                    <StyledTableRow key={subscription.id}>
                      <TableCell>{subscription.id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <Typography variant="body2" fontWeight="bold">
                            {subscription.user.name}{" "}
                            {subscription.user.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {subscription.user.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{subscription.service.name}</TableCell>
                      <TableCell>{subscription.amount.toFixed(2)} €</TableCell>
                      <TableCell>
                        {getStatusChip(subscription.status)}
                      </TableCell>
                      <TableCell>
                        {formatDate(subscription.startDate)}
                      </TableCell>
                      <TableCell>
                        {formatDate(subscription.nextBillingDate)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleClickOpen(subscription)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>

                        {subscription.status === "active" && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleChangeStatus(subscription.id, "paused")
                            }
                            title="Pausar"
                          >
                            <PauseIcon fontSize="small" />
                          </IconButton>
                        )}

                        {subscription.status === "paused" && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleChangeStatus(subscription.id, "active")
                            }
                            title="Activar"
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        )}

                        {(subscription.status === "active" ||
                          subscription.status === "paused") && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleChangeStatus(subscription.id, "cancelled")
                            }
                            title="Cancelar"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        )}

                        <IconButton
                          size="small"
                          onClick={() => handleDelete(subscription.id)}
                          disabled={subscription.status === "active"}
                          title="Eliminar"
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

          {/* Diálogo para añadir/editar subscripción */}
          <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
              {selectedSubscription
                ? "Editar Subscripción"
                : "Nueva Subscripción"}
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
                <FormControl margin="normal" fullWidth required>
                  <InputLabel id="user-label">Cliente</InputLabel>
                  <Select
                    labelId="user-label"
                    name="userId"
                    value={formData.userId}
                    label="Cliente"
                    onChange={handleInputChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    }
                  >
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id.toString()}>
                        {user.name} {user.lastName} ({user.email})
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
                      <MenuItem key={service.id} value={service.id.toString()}>
                        {service.name} ({service.price.toFixed(2)} € -{" "}
                        {service.billingCycle})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Monto"
                  name="amount"
                  value={formData.amount}
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
                  <InputLabel id="payment-method-label">
                    Método de Pago
                  </InputLabel>
                  <Select
                    labelId="payment-method-label"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    label="Método de Pago"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="credit_card">Tarjeta de Crédito</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="bank_transfer">
                      Transferencia Bancaria
                    </MenuItem>
                    <MenuItem value="cash">Efectivo</MenuItem>
                  </Select>
                </FormControl>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Fecha de Inicio"
                    value={formData.startDate}
                    onChange={(date) => handleDateChange("startDate", date)}
                    slotProps={{
                      textField: {
                        margin: "normal",
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
                {selectedSubscription &&
                  selectedSubscription.status === "cancelled" && (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Fecha de Finalización"
                        value={formData.endDate}
                        onChange={(date) => handleDateChange("endDate", date)}
                        slotProps={{
                          textField: {
                            margin: "normal",
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

export default Subscriptions;
