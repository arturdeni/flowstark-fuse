// src/app/flowstark/tickets/components/TicketSearchAndActions.tsx - VERSIÓN LIMPIA
import React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { TicketWithRelations } from '../../../../types/models';
import { downloadTicketsXML } from '../utils/xmlGenerator';

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
}

export const TicketSearchAndActions: React.FC<TicketSearchAndActionsProps> = ({
  searchTerm,
  ticketCount,
  paidCount,
  pendingCount,
  loading,
  tickets,
  onSearchChange,
  onAddTicket,
  onRefresh,
  selectedTickets = [],
  selectedCount = 0,
  onClearSelection,
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleDownloadXML = () => {
    // Si hay tickets seleccionados, descargar solo esos, sino descargar todos
    const ticketsToDownload = selectedCount > 0 ? selectedTickets : tickets;
    downloadTicketsXML(ticketsToDownload);
  };

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

        {/* Botón de descarga XML */}
        {ticketCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadXML}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            {selectedCount > 0
              ? `Descargar ${selectedCount} XML`
              : 'Descargar XML'}
          </Button>
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
    </Box>
  );
};