// src/app/flowstark/tickets/components/DeleteConfirmDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
} from '@mui/icons-material';

interface DeleteConfirmDialogProps {
  open: boolean;
  loading: boolean;
  ticketInfo?: {
    clientName?: string;
    serviceName?: string;
    amount: number;
    dueDate: Date;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  loading,
  ticketInfo,
  onConfirm,
  onCancel,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            Confirmar Eliminación
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          ¿Estás seguro de que quieres eliminar este ticket?
        </Typography>

        {ticketInfo && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Detalles del Ticket:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {ticketInfo.clientName && (
                <Typography variant="body2">
                  <strong>Cliente:</strong> {ticketInfo.clientName}
                </Typography>
              )}
              {ticketInfo.serviceName && (
                <Typography variant="body2">
                  <strong>Servicio:</strong> {ticketInfo.serviceName}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Monto:</strong> {formatCurrency(ticketInfo.amount)}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha de Vencimiento:</strong> {formatDate(ticketInfo.dueDate)}
              </Typography>
            </Box>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Esta acción no se puede deshacer.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Eliminando...' : 'Eliminar Ticket'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};