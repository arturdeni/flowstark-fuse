// src/app/flowstark/tickets/components/TicketDetailModal.tsx
import React from 'react';
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
  if (!ticket) return null;

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

  const isOverdue = ticket.status === 'pending' && new Date() > ticket.dueDate;

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
                    label={ticket.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    color={ticket.status === 'paid' ? 'success' : 'warning'}
                    size="medium"
                  />
                  <Chip
                    label={ticket.isManual ? 'Manual' : 'Automático'}
                    variant="outlined"
                    color={ticket.isManual ? 'primary' : 'default'}
                    size="medium"
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
                      {formatCurrency(ticket.amount)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha de vencimiento
                    </Typography>
                    <Typography variant="body1" color={isOverdue ? 'error.main' : 'text.primary'}>
                      {formatDateOnly(ticket.dueDate)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha de generación
                    </Typography>
                    <Typography variant="body1">
                      {formatDateOnly(ticket.generatedDate)}
                    </Typography>
                  </Grid>

                  {ticket.paidDate && ticket.status === 'paid' && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Fecha de pago
                      </Typography>
                      <Typography variant="body1" color="success.main">
                        {formatDateOnly(ticket.paidDate)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Grid>

            {/* Información del Cliente */}
            {ticket.clientInfo && (
              <Grid item xs={12}>
                <Box sx={{ mb: 3 }}>
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
                          {ticket.clientInfo.firstName} {ticket.clientInfo.lastName}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {ticket.clientInfo.email}
                        </Typography>
                      </Grid>

                      {ticket.clientInfo.phone && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Teléfono
                          </Typography>
                          <Typography variant="body1">
                            {ticket.clientInfo.phone}
                          </Typography>
                        </Grid>
                      )}

                      {ticket.clientInfo.fiscalName && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Nombre fiscal
                          </Typography>
                          <Typography variant="body1">
                            {ticket.clientInfo.fiscalName}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Información del Servicio */}
            {ticket.serviceInfo && (
              <Grid item xs={12}>
                <Box sx={{ mb: 3 }}>
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
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                      {ticket.serviceInfo.name}
                    </Typography>

                    {ticket.serviceInfo.description && (
                      <>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Descripción
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {ticket.serviceInfo.description}
                        </Typography>
                      </>
                    )}

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Precio base
                        </Typography>
                        <Typography variant="body1">
                          {formatCurrency(ticket.serviceInfo.basePrice)}
                        </Typography>
                      </Grid>

                      {ticket.serviceInfo.finalPrice && ticket.serviceInfo.finalPrice !== ticket.serviceInfo.basePrice && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Precio final
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {formatCurrency(ticket.serviceInfo.finalPrice)}
                          </Typography>
                        </Grid>
                      )}

                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          IVA
                        </Typography>
                        <Typography variant="body1">
                          {ticket.serviceInfo.vat}%
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Frecuencia
                        </Typography>
                        <Typography variant="body1">
                          {ticket.serviceInfo.frequency}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Información de la Suscripción */}
            {ticket.subscriptionInfo && (
              <Grid item xs={12}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2
                  }}>
                    <CalendarIcon color="primary" fontSize="small" />
                    Suscripción
                  </Typography>

                  <Box sx={{ pl: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Fecha de inicio
                        </Typography>
                        <Typography variant="body1">
                          {formatDateOnly(ticket.subscriptionInfo.startDate)}
                        </Typography>
                      </Grid>

                      {ticket.subscriptionInfo.endDate && (
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Fecha de finalización
                          </Typography>
                          <Typography variant="body1" color="warning.main">
                            {formatDateOnly(ticket.subscriptionInfo.endDate)}
                          </Typography>
                        </Grid>
                      )}

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Estado de la suscripción
                        </Typography>
                        <Chip
                          label={ticket.subscriptionInfo.status}
                          size="small"
                          color={ticket.subscriptionInfo.status === 'active' ? 'success' : 'default'}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Descripción del Ticket */}
            {ticket.description && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{
                    fontWeight: 600,
                    mb: 1
                  }}>
                    Descripción
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    fontStyle: ticket.description ? 'normal' : 'italic'
                  }}>
                    {ticket.description || 'Sin descripción'}
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
                {ticket.createdAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Creado: {formatDate(ticket.createdAt)}
                    </Typography>
                  </Grid>
                )}
                {ticket.updatedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Actualizado: {formatDate(ticket.updatedAt)}
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
            {ticket.status === 'pending' && onMarkAsPaid ? (
              <Button
                startIcon={<PaymentIcon />}
                variant="outlined"
                color="success"
                onClick={() => onMarkAsPaid(ticket.id!)}
              >
                Marcar como Pagado
              </Button>
            ) : ticket.status === 'paid' && onMarkAsPending ? (
              <Button
                startIcon={<ScheduleIcon />}
                variant="outlined"
                color="warning"
                onClick={() => onMarkAsPending(ticket.id!)}
              >
                Marcar como Pendiente
              </Button>
            ) : null}

            {/* Botón editar */}
            {onEdit && (
              <Button
                variant="outlined"
                onClick={() => onEdit(ticket)}
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