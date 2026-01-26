// src/app/flowstark/tickets/components/TicketSearchAndActions.tsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { TicketWithRelations } from '../../../../types/models';

interface TicketSearchAndActionsProps {
  searchTerm: string;
  ticketCount: number;
  paidCount: number;
  pendingCount: number;
  loading: boolean;
  tickets: TicketWithRelations[];
  onSearchChange: (term: string) => void;
  onAddTicket: () => void;
  onRefresh: () => void;
  // Props para selección
  selectedTickets?: TicketWithRelations[];
  selectedCount?: number;
  onClearSelection?: () => void;
  // Props para remesa SEPA
  onGenerateSepa?: (ticketsToProcess: TicketWithRelations[]) => void;
  sepaLoading?: boolean;
}

export const TicketSearchAndActions: React.FC<TicketSearchAndActionsProps> = ({
  searchTerm,
  ticketCount,
  loading,
  tickets,
  onSearchChange,
  onAddTicket,
  onRefresh,
  selectedTickets = [],
  selectedCount = 0,
  onClearSelection,
  onGenerateSepa,
  sepaLoading = false,
}) => {
  // Estado para el modal de aviso
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  // Calcular tickets por tipo de pago
  const ticketAnalysis = useMemo(() => {
    const ticketsToAnalyze = selectedCount > 0 ? selectedTickets : tickets;

    const directDebitTickets = ticketsToAnalyze.filter(
      t => t.paymentMethod === 'direct_debit' && t.status === 'pending'
    );
    const nonDirectDebitTickets = ticketsToAnalyze.filter(
      t => t.paymentMethod !== 'direct_debit' || t.status !== 'pending'
    );

    return {
      directDebitTickets,
      directDebitCount: directDebitTickets.length,
      nonDirectDebitCount: nonDirectDebitTickets.length,
      hasNonDirectDebit: nonDirectDebitTickets.length > 0,
      totalToProcess: directDebitTickets.length,
    };
  }, [tickets, selectedTickets, selectedCount]);

  // Handler para click en botón de remesa
  const handleRemesaClick = () => {
    if (!onGenerateSepa) return;

    // Si hay tickets seleccionados que no son domiciliación, mostrar aviso
    if (selectedCount > 0 && ticketAnalysis.hasNonDirectDebit) {
      setWarningDialogOpen(true);
    } else {
      // Generar directamente con los tickets de domiciliación
      onGenerateSepa(ticketAnalysis.directDebitTickets);
    }
  };

  // Handler para continuar después del aviso
  const handleContinueWithDirectDebit = () => {
    setWarningDialogOpen(false);

    if (onGenerateSepa) {
      onGenerateSepa(ticketAnalysis.directDebitTickets);
    }
  };

  // Calcular tooltip y estado del botón
  const sepaButtonState = useMemo(() => {
    if (ticketAnalysis.directDebitCount === 0) {
      return {
        enabled: false,
        tooltip: 'No hay tickets pendientes con domiciliación bancaria',
      };
    }

    return {
      enabled: true,
      tooltip: `Generar remesa con ${ticketAnalysis.directDebitCount} ticket(s)`,
    };
  }, [ticketAnalysis]);

  // Texto del botón
  const buttonText = useMemo(() => {
    if (sepaLoading) return 'Generando...';

    if (selectedCount > 0) {
      if (ticketAnalysis.directDebitCount > 0) {
        return `Generar ${ticketAnalysis.directDebitCount} Remesa${ticketAnalysis.directDebitCount !== 1 ? 's' : ''}`;
      }

      return 'Generar Remesa';
    }

    return 'Generar Remesa';
  }, [sepaLoading, selectedCount, ticketAnalysis.directDebitCount]);

  return (
    <Box sx={{ mb: 1 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        {/* Campo de búsqueda */}
        <TextField
          placeholder="Buscar tickets..."
          value={searchTerm}
          onChange={handleSearchChange}
          size="small"
          sx={{ minWidth: 200, flex: 1 }}
        />

        {/* Mostrar cantidad de seleccionados */}
        {selectedCount > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="primary" fontWeight={500}>
              {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
            </Typography>
            <Button
              variant="text"
              size="small"
              startIcon={<ClearIcon />}
              onClick={onClearSelection}
              sx={{
                textTransform: 'none',
                minWidth: 'auto',
                px: 1,
              }}
            >
              Limpiar
            </Button>
          </Box>
        )}

        {/* Botón de generar remesa SEPA */}
        {ticketCount > 0 && onGenerateSepa && (
          <Tooltip title={sepaButtonState.tooltip} arrow>
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AccountBalanceIcon />}
                onClick={handleRemesaClick}
                disabled={loading || sepaLoading || !sepaButtonState.enabled}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                {buttonText}
              </Button>
            </span>
          </Tooltip>
        )}

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
            size="small"
          >
            Actualizar
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddTicket}
            disabled={loading}
            size="small"
            sx={{
              mr: 1,
              '&:hover': {
                backgroundColor: '#2C645E'
              }
            }}
          >
            Nuevo Ticket
          </Button>
        </Box>
      </Box>

      {/* Modal de aviso para tickets no domiciliados */}
      <Dialog
        open={warningDialogOpen}
        onClose={() => setWarningDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: 'warning.main' }} />
          Tickets no domiciliados detectados
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            De los <strong>{selectedCount}</strong> tickets seleccionados:
          </DialogContentText>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>{ticketAnalysis.directDebitCount}</strong> ticket{ticketAnalysis.directDebitCount !== 1 ? 's' : ''} con domiciliación bancaria (se incluirán en la remesa)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • <strong>{ticketAnalysis.nonDirectDebitCount}</strong> ticket{ticketAnalysis.nonDirectDebitCount !== 1 ? 's' : ''} con otro método de pago (no se incluirán)
            </Typography>
          </Box>
          <DialogContentText>
            Las remesas SEPA solo funcionan con tickets que tienen domiciliación bancaria como método de pago.
            ¿Deseas continuar generando la remesa solo con los {ticketAnalysis.directDebitCount} ticket{ticketAnalysis.directDebitCount !== 1 ? 's' : ''} domiciliado{ticketAnalysis.directDebitCount !== 1 ? 's' : ''}?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setWarningDialogOpen(false)}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleContinueWithDirectDebit}
            color="primary"
            variant="contained"
            disabled={ticketAnalysis.directDebitCount === 0}
            sx={{
              backgroundColor: '#154241',
              '&:hover': {
                backgroundColor: '#0F302F',
              },
            }}
          >
            Continuar con {ticketAnalysis.directDebitCount} ticket{ticketAnalysis.directDebitCount !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
