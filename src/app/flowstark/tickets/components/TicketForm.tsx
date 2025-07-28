// src/app/flowstark/tickets/components/TicketForm.tsx
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
  Alert,
  Typography,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Ticket, Subscription, Client, Service, TicketWithRelations } from '../../../../types/models';

interface TicketFormProps {
  open: boolean;
  selectedTicket: TicketWithRelations | null;
  subscriptions: Subscription[];
  clients: Client[];
  services: Service[];
  loading: boolean;
  onClose: () => void;
  onSave: (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate: (id: string, ticketData: Partial<Ticket>) => Promise<void>;
}

interface FormData {
  subscriptionId: string;
  dueDate: Date;
  amount: number;
  status: 'paid' | 'pending';
  description: string;
  isManual: boolean;
}

export const TicketForm: React.FC<TicketFormProps> = ({
  open,
  selectedTicket,
  subscriptions,
  clients,
  services,
  loading,
  onClose,
  onSave,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<FormData>({
    subscriptionId: '',
    dueDate: new Date(),
    amount: 0,
    status: 'pending',
    description: '',
    isManual: true,
  });

  const [validationError, setValidationError] = useState<string>('');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const isEditMode = Boolean(selectedTicket);

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      if (selectedTicket) {
        // Modo edición
        setFormData({
          subscriptionId: selectedTicket.subscriptionId,
          dueDate: selectedTicket.dueDate,
          amount: selectedTicket.amount,
          status: selectedTicket.status,
          description: selectedTicket.description || '',
          isManual: selectedTicket.isManual,
        });
        
        const subscription = subscriptions.find(s => s.id === selectedTicket.subscriptionId);
        setSelectedSubscription(subscription || null);
      } else {
        // Modo creación
        setFormData({
          subscriptionId: '',
          dueDate: new Date(),
          amount: 0,
          status: 'pending',
          description: '',
          isManual: true,
        });
        setSelectedSubscription(null);
      }

      setValidationError('');
    }
  }, [open, selectedTicket, subscriptions]);

  // Actualizar información cuando cambie la suscripción seleccionada
  useEffect(() => {
    if (formData.subscriptionId && !isEditMode) {
      const subscription = subscriptions.find(s => s.id === formData.subscriptionId);

      if (subscription) {
        setSelectedSubscription(subscription);
        
        // Obtener el servicio relacionado para calcular el precio
        const service = services.find(s => s.id === subscription.serviceId);

        if (service) {
          setFormData(prev => ({
            ...prev,
            amount: service.finalPrice || service.basePrice,
            dueDate: subscription.paymentDate || new Date(),
            description: `Ticket para ${service.name}`,
          }));
        }
      }
    }
  }, [formData.subscriptionId, subscriptions, services, isEditMode]);

  // Función para obtener información del cliente
  const getClientInfo = (subscription: Subscription | null) => {
    if (!subscription) return null;

    return clients.find(c => c.id === subscription.clientId);
  };

  // Función para obtener información del servicio
  const getServiceInfo = (subscription: Subscription | null) => {
    if (!subscription) return null;

    return services.find(s => s.id === subscription.serviceId);
  };

  // Validar formulario
  const validateForm = (): boolean => {
    if (!formData.subscriptionId) {
      setValidationError('Por favor selecciona una suscripción');
      return false;
    }

    if (!formData.dueDate) {
      setValidationError('Por favor selecciona una fecha de vencimiento');
      return false;
    }

    if (formData.amount <= 0) {
      setValidationError('El monto debe ser mayor a 0');
      return false;
    }

    setValidationError('');
    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
      subscriptionId: formData.subscriptionId,
      dueDate: formData.dueDate,
      amount: formData.amount,
      status: formData.status,
      generatedDate: selectedTicket?.generatedDate || new Date(),
      paidDate: formData.status === 'paid' ? (selectedTicket?.paidDate || new Date()) : undefined,
      isManual: formData.isManual,
      description: formData.description.trim() || undefined,
    };

    try {
      if (isEditMode && selectedTicket?.id) {
        await onUpdate(selectedTicket.id, ticketData);
      } else {
        await onSave(ticketData);
      }

      handleClose();
    } catch (error) {
      console.error('Error saving ticket:', error);
      setValidationError('Error al guardar el ticket. Por favor, inténtalo de nuevo.');
    }
  };

  // Manejar cierre del modal
  const handleClose = () => {
    setValidationError('');
    onClose();
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (validationError) setValidationError('');
  };

  const clientInfo = getClientInfo(selectedSubscription);
  const serviceInfo = getServiceInfo(selectedSubscription);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} locale={es}>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6">
              {isEditMode ? 'Editar Ticket' : 'Nuevo Ticket'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {/* Mensaje de error */}
            {validationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationError}
              </Alert>
            )}

            {/* Selección de Suscripción */}
            <Box>
              <FormControl fullWidth disabled={isEditMode}>
                <InputLabel>Suscripción *</InputLabel>
                <Select
                  value={formData.subscriptionId}
                  label="Suscripción *"
                  onChange={(e: SelectChangeEvent) => 
                    handleInputChange('subscriptionId', e.target.value)
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  }
                >
                  {subscriptions
                    .filter(sub => sub.status === 'active')
                    .map((subscription) => {
                      const client = clients.find(c => c.id === subscription.clientId);
                      const service = services.find(s => s.id === subscription.serviceId);
                      const clientName = client ? `${client.firstName} ${client.lastName}` : 'Cliente desconocido';
                      const serviceName = service?.name || 'Servicio desconocido';
                      
                      return (
                        <MenuItem key={subscription.id} value={subscription.id}>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {clientName} - {serviceName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Próximo cobro: {subscription.paymentDate 
                                ? new Intl.DateTimeFormat('es-ES').format(subscription.paymentDate)
                                : 'No definido'
                              }
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                </Select>
              </FormControl>

              {/* Información de la suscripción seleccionada */}
              {selectedSubscription && clientInfo && serviceInfo && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Información de la Suscripción
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Cliente:</strong> {clientInfo.firstName} {clientInfo.lastName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {clientInfo.email}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Servicio:</strong> {serviceInfo.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Precio:</strong> €{(serviceInfo.finalPrice || serviceInfo.basePrice).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Detalles del Ticket */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {/* Fecha de Vencimiento */}
              <DatePicker
                label="Fecha de Vencimiento *"
                value={formData.dueDate}
                onChange={(newValue) => handleInputChange('dueDate', newValue || new Date())}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />

              {/* Monto */}
              <TextField
                label="Monto *"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EuroIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Estado y Tipo */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 2, alignItems: 'center' }}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  label="Estado"
                  onChange={(e: SelectChangeEvent) => 
                    handleInputChange('status', e.target.value as 'paid' | 'pending')
                  }
                >
                  <MenuItem value="pending">Pendiente</MenuItem>
                  <MenuItem value="paid">Pagado</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isManual}
                    onChange={(e) => handleInputChange('isManual', e.target.checked)}
                    disabled={isEditMode}
                  />
                }
                label="Ticket Manual"
              />
            </Box>

            {/* Descripción */}
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Descripción opcional del ticket..."
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading 
              ? 'Guardando...' 
              : isEditMode 
                ? 'Actualizar Ticket' 
                : 'Crear Ticket'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};