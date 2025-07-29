// src/app/flowstark/tickets/components/TicketDetailModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { TicketWithRelations } from '../../../../types/models';

interface TicketDetailModalProps {
  open: boolean;
  ticket: TicketWithRelations | null;
  onClose: () => void;
  onEdit?: (ticket: TicketWithRelations) => void;
  onMarkAsPaid?: (ticketId: string) => void;
  onMarkAsPending?: (ticketId: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  open,
  ticket,
  onClose,
  onEdit,
  onMarkAsPaid,
  onMarkAsPending,
}) => {
  // Estado interno para el ticket
  const [currentTicket, setCurrentTicket] = useState<TicketWithRelations | null>(null);

  // Actualizar el estado interno cuando cambie el ticket prop
  useEffect(() => {
    setCurrentTicket(ticket);
  }, [ticket]);

  if (!currentTicket) return null;

  // Función para manejar marcar como pagado
  const handleMarkAsPaid = async () => {
    if (currentTicket.id && onMarkAsPaid) {
      await onMarkAsPaid(currentTicket.id);

      // Actualizar el estado interno
      setCurrentTicket({
        ...currentTicket,
        status: 'paid',
        paidDate: new Date()
      });
    }
  };

  // Función para manejar marcar como pendiente
  const handleMarkAsPending = async () => {
    if (currentTicket.id && onMarkAsPending) {
      await onMarkAsPending(currentTicket.id);

      // Actualizar el estado interno
      setCurrentTicket({
        ...currentTicket,
        status: 'pending',
        paidDate: undefined
      });
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateOnly = (date: Date | undefined) => {
    if (!date) return 'N/A';

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const isOverdue = currentTicket.status === 'pending' && new Date() > currentTicket.dueDate;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6">
              Detalle del Ticket
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 1 }}>
          <Grid container spacing={3}>
            {/* Estado y Información Básica */}
            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip
                    label={currentTicket.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    color={currentTicket.status === 'paid' ? 'success' : 'warning'}
                    size="medium"
                  />
                  <Chip
                    label={currentTicket.isManual ? 'Manual' : 'Automático'}
                    size="medium"
                    variant="outlined"
                    color={currentTicket.isManual ? 'primary' : 'default'}
                  />
                  {isOverdue && (
                    <Chip
                      label="Vencido"
                      color="error"
                      size="medium"
                    />
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Monto
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {formatCurrency(currentTicket.amount)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha de vencimiento
                    </Typography>
                    <Typography variant="body1" color={isOverdue ? 'error.main' : 'text.primary'}>
                      {formatDateOnly(currentTicket.dueDate)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha de generación
                    </Typography>
                    <Typography variant="body1">
                      {formatDateOnly(currentTicket.generatedDate)}
                    </Typography>
                  </Grid>

                  {currentTicket.paidDate && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Fecha de pago
                      </Typography>
                      <Typography variant="body1" color="success.main">
                        {formatDateOnly(currentTicket.paidDate)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Grid>

            {/* Información del Cliente */}
            {currentTicket.clientInfo && (
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    <PersonIcon color="primary" fontSize="small" />
                    Cliente
                  </Typography>

                  <Box sx={{ pl: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Nombre completo
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {currentTicket.clientInfo.firstName} {currentTicket.clientInfo.lastName}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {currentTicket.clientInfo.email}
                        </Typography>
                      </Grid>

                      {currentTicket.clientInfo.phone && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Teléfono
                          </Typography>
                          <Typography variant="body1">
                            {currentTicket.clientInfo.phone}
                          </Typography>
                        </Grid>
                      )}

                      {currentTicket.clientInfo.fiscalName && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Nombre fiscal
                          </Typography>
                          <Typography variant="body1">
                            {currentTicket.clientInfo.fiscalName}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Información del Servicio */}
            {currentTicket.serviceInfo && (
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    <InventoryIcon color="primary" fontSize="small" />
                    Servicio
                  </Typography>

                  <Box sx={{ pl: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Nombre del servicio
                    </Typography>
                    <Typography variant="body1" fontWeight={500} gutterBottom>
                      {currentTicket.serviceInfo.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Descripción
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {currentTicket.serviceInfo.description || 'Sin descripción'}
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Precio base
                        </Typography>
                        <Typography variant="body1">
                          {formatCurrency(currentTicket.serviceInfo.basePrice || 0)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          IVA
                        </Typography>
                        <Typography variant="body1">
                          {currentTicket.serviceInfo.vat || 0}%
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Descripción del Ticket */}
            {currentTicket.description && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Descripción del ticket
                  </Typography>
                  <Typography variant="body1" sx={{
                    fontStyle: currentTicket.description ? 'normal' : 'italic'
                  }}>
                    {currentTicket.description || 'Sin descripción'}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Información de Auditoría */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Información de Auditoría
              </Typography>
              <Grid container spacing={2}>
                {currentTicket.createdAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Creado: {formatDate(currentTicket.createdAt)}
                    </Typography>
                  </Grid>
                )}
                {currentTicket.updatedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Actualizado: {formatDate(currentTicket.updatedAt)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Botón cambiar estado */}
            {currentTicket.status === 'pending' && onMarkAsPaid ? (
              <Button
                startIcon={<PaymentIcon />}
                variant="outlined"
                color="success"
                onClick={handleMarkAsPaid}
              >
                Marcar como Pagado
              </Button>
            ) : currentTicket.status === 'paid' && onMarkAsPending ? (
              <Button
                startIcon={<ScheduleIcon />}
                variant="outlined"
                color="warning"
                onClick={handleMarkAsPending}
              >
                Marcar como Pendiente
              </Button>
            ) : null}

            {/* Botón editar */}
            {onEdit && (
              <Button
                variant="outlined"
                onClick={() => onEdit(currentTicket)}
              >
                Editar
              </Button>
            )}
          </Box>

          <Button onClick={onClose} variant="contained">
            Cerrar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};