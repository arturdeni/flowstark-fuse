// src/app/flowstark/tickets/components/TicketDetailModal.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  GetApp as DownloadIcon,
} from '@mui/icons-material';
import html2pdf from 'html2pdf.js';
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Ref para el contenido del PDF
  const pdfContentRef = useRef<HTMLDivElement>(null);

  // Actualizar el estado interno cuando cambie el ticket prop
  useEffect(() => {
    setCurrentTicket(ticket);
  }, [ticket]);

  if (!currentTicket) return null;

  // Función para manejar marcar como pagado
  const handleMarkAsPaid = async () => {
    if (currentTicket.id && onMarkAsPaid) {
      await onMarkAsPaid(currentTicket.id);
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
      setCurrentTicket({
        ...currentTicket,
        status: 'pending',
        paidDate: undefined
      });
    }
  };

  // Función para generar y descargar el PDF
  const handleDownloadPDF = async () => {
    if (!pdfContentRef.current || !currentTicket) return;

    setIsGeneratingPdf(true);

    try {
      const element = pdfContentRef.current;

      const opt = {
        margin: 1,
        filename: `ticket-${currentTicket.id || 'sin-id'}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
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
        {/* Contenido visible para el PDF */}
        <div ref={pdfContentRef}>
          <PDFContent ticket={currentTicket} />
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Botón descargar PDF */}
            <Button
              startIcon={<DownloadIcon />}
              variant="outlined"
              color="primary"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
            </Button>

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

// Componente separado para el contenido del PDF
const PDFContent: React.FC<{ ticket: TicketWithRelations }> = ({ ticket }) => {
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
    <Box sx={{ py: 1 }}>
      {/* Encabezado del PDF */}
      <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
          TICKET DE PAGO
        </Typography>
        <Typography variant="h6" sx={{ color: '#666' }}>
          ID: {ticket.id || 'Sin ID'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Generado el {formatDate(new Date())}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Estado y Información Básica */}
        <Grid item xs={12}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
              Estado del Ticket
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Box sx={{
                px: 2, py: 1,
                backgroundColor: ticket.status === 'paid' ? '#4caf50' : '#ff9800',
                color: 'white',
                borderRadius: 1,
                fontWeight: 'bold'
              }}>
                {ticket.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
              </Box>

              <Box sx={{
                px: 2, py: 1,
                backgroundColor: ticket.isManual ? '#2196f3' : '#757575',
                color: 'white',
                borderRadius: 1
              }}>
                {ticket.isManual ? 'Manual' : 'Automático'}
              </Box>

              {isOverdue && (
                <Box sx={{
                  px: 2, py: 1,
                  backgroundColor: '#f44336',
                  color: 'white',
                  borderRadius: 1,
                  fontWeight: 'bold'
                }}>
                  VENCIDO
                </Box>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                    MONTO
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    {formatCurrency(ticket.amount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                    VENCIMIENTO
                  </Typography>
                  <Typography variant="body1" sx={{ color: isOverdue ? '#f44336' : '#333', fontWeight: 'bold' }}>
                    {formatDateOnly(ticket.dueDate)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                    GENERACIÓN
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatDateOnly(ticket.generatedDate)}
                  </Typography>
                </Box>
              </Grid>

              {ticket.paidDate && (
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                      FECHA DE PAGO
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                      {formatDateOnly(ticket.paidDate)}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>

        {/* Información del Cliente */}
        {ticket.clientInfo && (
          <Grid item xs={12} md={6}>
            <Box sx={{ border: '2px solid #e0e0e0', borderRadius: 2, p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                Información del Cliente
              </Typography>

              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {ticket.clientInfo.firstName} {ticket.clientInfo.lastName}
              </Typography>

              {ticket.clientInfo.email && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Email:</strong> {ticket.clientInfo.email}
                </Typography>
              )}

              {ticket.clientInfo.phone && (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Teléfono:</strong> {ticket.clientInfo.phone}
                </Typography>
              )}

              {ticket.clientInfo.address && (
                <Typography variant="body2">
                  <strong>Dirección:</strong> {ticket.clientInfo.address}
                </Typography>
              )}
            </Box>
          </Grid>
        )}

        {/* Información del Servicio */}
        {ticket.serviceInfo && (
          <Grid item xs={12} md={6}>
            <Box sx={{ border: '2px solid #e0e0e0', borderRadius: 2, p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
                Información del Servicio
              </Typography>

              <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {ticket.serviceInfo.name}
              </Typography>

              {ticket.serviceInfo.description && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {ticket.serviceInfo.description}
                </Typography>
              )}

              <Typography variant="body2">
                <strong>Precio base:</strong> {formatCurrency(ticket.serviceInfo.price)}
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Descripción/Notas */}
        {ticket.description && (
          <Grid item xs={12}>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, backgroundColor: '#fafafa' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                Descripción/Notas
              </Typography>
              <Typography variant="body2">
                {ticket.description}
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Información de Auditoría */}
        <Grid item xs={12}>
          <Box sx={{ borderTop: '1px solid #ddd', pt: 2, mt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#666', mb: 2 }}>
              Información de Auditoría
            </Typography>
            <Grid container spacing={2}>
              {ticket.createdAt && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Creado:</strong> {formatDate(ticket.createdAt)}
                  </Typography>
                </Grid>
              )}
              {ticket.updatedAt && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Actualizado:</strong> {formatDate(ticket.updatedAt)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};