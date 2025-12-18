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
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleDownloadXML = () => {
    downloadTicketsXML(tickets);
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
            Descargar XML
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