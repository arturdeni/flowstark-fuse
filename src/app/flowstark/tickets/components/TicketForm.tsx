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
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import { Ticket, Client, TicketWithRelations } from '../../../../types/models';

interface TicketFormProps {
  open: boolean;
  selectedTicket: TicketWithRelations | null;
  clients: Client[];
  loading: boolean;
  onClose: () => void;
  onSave: (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate: (id: string, ticketData: Partial<Ticket>) => Promise<void>;
}

interface FormData {
  clientId: string;
  serviceDescription: string;
  basePrice: number | string;
  finalPrice: number | string;
  vat: number | string;
  retention: number | string;
  dueDate: Date;
  status: 'paid' | 'pending';
}

export const TicketForm: React.FC<TicketFormProps> = ({
  open,
  selectedTicket,
  clients,
  loading,
  onClose,
  onSave,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    serviceDescription: '',
    basePrice: 0,
    finalPrice: 0,
    vat: 21,
    retention: 0,
    dueDate: new Date(),
    status: 'pending',
  });

  const [validationError, setValidationError] = useState<string>('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const isEditMode = Boolean(selectedTicket);

  // Resetear formulario cuando se abre/cierra
  useEffect(() => {
    if (open) {
      if (selectedTicket) {
        // Modo edición - extraer datos del ticket existente
        setFormData({
          clientId: selectedTicket.clientInfo?.id || '',
          serviceDescription: selectedTicket.description || '',
          basePrice: 0, // No podemos extraer estos valores del ticket existente
          finalPrice: selectedTicket.amount,
          vat: 21,
          retention: 0,
          dueDate: selectedTicket.dueDate,
          status: selectedTicket.status,
        });
      } else {
        // Modo creación
        setFormData({
          clientId: '',
          serviceDescription: '',
          basePrice: 0,
          finalPrice: 0,
          vat: 21,
          retention: 0,
          dueDate: new Date(),
          status: 'pending',
        });
      }

      setValidationError('');
    }
  }, [open, selectedTicket]);

  // Función para calcular precio final basado en precio base
  const calculateFinalPriceFromBase = (basePrice: number, vat: number, retention: number): number => {
    const priceWithVat = basePrice * (1 + vat / 100);
    const finalPrice = priceWithVat * (1 - retention / 100);
    return finalPrice;
  };

  // Función para calcular precio base basado en precio final
  const calculateBasePriceFromFinal = (finalPrice: number, vat: number, retention: number): number => {
    const divisor = (1 + vat / 100) * (1 - retention / 100);
    return divisor !== 0 ? finalPrice / divisor : 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> |
      SelectChangeEvent<string>
  ) => {
    if (isUpdatingPrice) return; // Evitar loops infinitos

    const { name, value } = e.target as { name: string; value: string | number };

    let processedValue: string | number = value;

    if (name === 'basePrice' || name === 'finalPrice' || name === 'vat' || name === 'retention') {
      // Permitir valores vacíos temporalmente
      if (value === '' || value === null || value === undefined) {
        processedValue = '';
      } else {
        // Limitar a máximo 2 decimales
        const numValue = parseFloat(value as string);

        if (!isNaN(numValue)) {
          processedValue = Math.round(numValue * 100) / 100;
        } else {
          processedValue = '';
        }
      }
    }

    // Calcular el precio complementario dinámicamente
    setIsUpdatingPrice(true);

    const newFormData = {
      ...formData,
      [name]: processedValue
    };

    // Función helper para obtener valor numérico
    const getNumericValue = (val: string | number): number => {
      if (val === '' || val === null || val === undefined) return 0;

      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? 0 : num;
    };

    // Si cambió el precio base, calcular el precio final
    if ((name === 'basePrice' || name === 'vat' || name === 'retention') &&
      newFormData.basePrice !== '') {

      const basePrice = getNumericValue(newFormData.basePrice);
      const vat = getNumericValue(newFormData.vat);
      const retention = getNumericValue(newFormData.retention);

      if (basePrice > 0) {
        const calculatedFinalPrice = calculateFinalPriceFromBase(basePrice, vat, retention);
        newFormData.finalPrice = Math.round(calculatedFinalPrice * 100) / 100;
      }
    }

    // Si cambió el precio final, calcular el precio base
    if (name === 'finalPrice' && newFormData.finalPrice !== '') {
      const finalPrice = getNumericValue(newFormData.finalPrice);
      const vat = getNumericValue(newFormData.vat);
      const retention = getNumericValue(newFormData.retention);

      if (finalPrice > 0) {
        const calculatedBasePrice = calculateBasePriceFromFinal(finalPrice, vat, retention);
        newFormData.basePrice = Math.round(calculatedBasePrice * 100) / 100;
      }
    }

    setFormData(newFormData);
    setIsUpdatingPrice(false);

    if (validationError) {
      setValidationError('');
    }
  };

  // Manejar cuando el usuario sale del campo (convertir vacíos a 0)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'basePrice' || name === 'finalPrice' || name === 'vat' || name === 'retention') {
      if (value === '' || value === null || value === undefined) {
        setFormData(prev => ({
          ...prev,
          [name]: 0
        }));
      }
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    if (!formData.clientId) {
      setValidationError('Por favor selecciona un cliente');
      return false;
    }

    if (!formData.serviceDescription.trim()) {
      setValidationError('Por favor describe el servicio');
      return false;
    }

    const finalPrice = typeof formData.finalPrice === 'string' ?
      parseFloat(formData.finalPrice) || 0 : formData.finalPrice;

    if (finalPrice <= 0) {
      setValidationError('El precio final debe ser mayor que 0');
      return false;
    }

    const vat = typeof formData.vat === 'string' ?
      parseFloat(formData.vat) || 0 : formData.vat;
    const retention = typeof formData.retention === 'string' ?
      parseFloat(formData.retention) || 0 : formData.retention;

    if (vat < 0 || vat > 100) {
      setValidationError('El IVA debe estar entre 0 y 100%');
      return false;
    }

    if (retention < 0 || retention > 100) {
      setValidationError('La retención debe estar entre 0 y 100%');
      return false;
    }

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const finalPrice = typeof formData.finalPrice === 'string' ?
      parseFloat(formData.finalPrice) || 0 : formData.finalPrice;

    // Para tickets manuales, no necesitamos subscriptionId pero sí clientId
    const ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
      subscriptionId: '', // Vacío para tickets manuales
      clientId: formData.clientId, // Guardar el cliente seleccionado
      dueDate: formData.dueDate,
      amount: finalPrice,
      status: formData.status,
      generatedDate: selectedTicket?.generatedDate || new Date(),
      paidDate: formData.status === 'paid' ? (selectedTicket?.paidDate || new Date()) : undefined,
      isManual: true,
      description: formData.serviceDescription.trim(),
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

  // Obtener información del cliente seleccionado
  const selectedClient = clients.find(c => c.id === formData.clientId);

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
              {isEditMode ? 'Editar Ticket' : 'Nuevo Ticket Manual'}
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

            {/* Selección de Cliente */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Cliente
              </Typography>

              <FormControl fullWidth>
                <InputLabel>Cliente *</InputLabel>
                <Select
                  value={formData.clientId}
                  label="Cliente *"
                  onChange={(e: SelectChangeEvent) =>
                    handleInputChange({ target: { name: 'clientId', value: e.target.value } } as any)
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  }
                >
                  {clients
                    .filter(client => client.active !== false)
                    .map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {`${client.firstName} ${client.lastName}`.trim() || client.fiscalName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {client.email}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Información del cliente seleccionado */}
              {selectedClient && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Información del Cliente
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Nombre:</strong> {selectedClient.firstName} {selectedClient.lastName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedClient.email}
                    </Typography>
                    {selectedClient.phone && (
                      <Typography variant="body2">
                        <strong>Teléfono:</strong> {selectedClient.phone}
                      </Typography>
                    )}
                    {selectedClient.fiscalName && (
                      <Typography variant="body2">
                        <strong>Nombre fiscal:</strong> {selectedClient.fiscalName}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Descripción del servicio */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Descripción del servicio
              </Typography>

              <TextField
                label="Describe el servicio"
                name="serviceDescription"
                value={formData.serviceDescription}
                onChange={handleInputChange}
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                required
                placeholder="Ej: Material de Pilates - Esterilla y banda elástica"
              />
            </Box>

            <Divider />

            {/* Configuración de precios */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Configuración de precios
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                <TextField
                  label="Precio Base"
                  name="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EuroIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    min: 0,
                    step: 0.01,
                    style: {
                      MozAppearance: 'textfield' // Firefox
                    }
                  }}
                  sx={{
                    '& input[type=number]::-webkit-outer-spin-button': {
                      '-webkit-appearance': 'none',
                      margin: 0,
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      '-webkit-appearance': 'none',
                      margin: 0,
                    },
                  }}
                />

                <TextField
                  label="Precio Final"
                  name="finalPrice"
                  type="number"
                  value={formData.finalPrice}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EuroIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    min: 0,
                    step: 0.01,
                    style: {
                      MozAppearance: 'textfield'
                    }
                  }}
                  sx={{
                    '& input[type=number]::-webkit-outer-spin-button': {
                      '-webkit-appearance': 'none',
                      margin: 0,
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      '-webkit-appearance': 'none',
                      margin: 0,
                    },
                  }}
                />

                <TextField
                  label="IVA"
                  name="vat"
                  type="number"
                  value={formData.vat}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <PercentIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 0.1,
                    style: {
                      MozAppearance: 'textfield'
                    }
                  }}
                  sx={{
                    '& input[type=number]::-webkit-outer-spin-button': {
                      '-webkit-appearance': 'none',
                      margin: 0,
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      '-webkit-appearance': 'none',
                      margin: 0,
                    },
                  }}
                />

                <TextField
                  label="Retención"
                  name="retention"
                  type="number"
                  value={formData.retention}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <PercentIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 0.1,
                    style: {
                      MozAppearance: 'textfield'
                    }
                  }}
                  sx={{
                    '& input[type=number]::-webkit-outer-spin-button': {
                      '-webkit-appearance': 'none',
                      margin: 0,
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      '-webkit-appearance': 'none',
                      margin: 0,
                    },
                  }}
                />
              </Box>
            </Box>

            <Divider />

            {/* Configuración del ticket */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Configuración del ticket
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <DatePicker
                  label="Fecha"
                  format="dd/MM/yyyy"
                  value={formData.dueDate}
                  onChange={(date) =>
                    handleInputChange({ target: { name: 'dueDate', value: date } } as any)
                  }
                  slotProps={{
                    textField: {
                      variant: 'outlined',
                      size: 'small',
                      fullWidth: true,
                      required: true,
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }
                    }
                  }}
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status}
                    label="Estado"
                    onChange={(e: SelectChangeEvent) =>
                      handleInputChange({ target: { name: 'status', value: e.target.value } } as any)
                    }
                  >
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="paid">Cobrado</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear Ticket')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};