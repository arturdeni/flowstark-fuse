// src/app/flowstark/tickets/components/TicketSearchAndActions.tsx - VERSIÓN LIMPIA
import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface TicketSearchAndActionsProps {
  searchTerm: string;
  statusFilter: 'all' | 'pending' | 'paid';
  ticketCount: number;
  paidCount: number;
  pendingCount: number;
  loading: boolean;
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (status: 'all' | 'pending' | 'paid') => void;
  onAddTicket: () => void;
  onRefresh: () => void;
}

export const TicketSearchAndActions: React.FC<TicketSearchAndActionsProps> = ({
  searchTerm,
  statusFilter,
  ticketCount,
  paidCount,
  pendingCount,
  loading,
  onSearchChange,
  onStatusFilterChange,
  onAddTicket,
  onRefresh,
}) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    onStatusFilterChange(event.target.value as 'all' | 'pending' | 'paid');
  };

  return (
    <Box sx={{ mb: 3 }}>
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

        {/* Filtro por estado */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="status-filter-label">Estado</InputLabel>
          <Select
            value={statusFilter}
            label="Estado"
            onChange={handleStatusChange}
          >
            <MenuItem value="all">Todos los estados</MenuItem>
            <MenuItem value="pending">Pendientes</MenuItem>
            <MenuItem value="paid">Pagados</MenuItem>
          </Select>
        </FormControl>

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
            startIcon={<AddIcon />}
            onClick={onAddTicket}
            disabled={loading}
            size="small"
          >
            Nuevo Ticket
          </Button>
        </Box>
      </Box>

      {/* Información adicional con estadísticas */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {ticketCount === 0
            ? 'No se encontraron tickets'
            : `Mostrando ${ticketCount} ticket${ticketCount !== 1 ? 's' : ''}`
          }
        </Typography>

        {ticketCount > 0 && (
          <>
            <Typography variant="body2" color="success.main">
              {paidCount} pagados
            </Typography>
            <Typography variant="body2" color="warning.main">
              {pendingCount} pendientes
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};