// src/app/flowstark/tickets/components/TicketSearchAndActions.tsx
import React from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  AutoMode as AutoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';

interface TicketSearchAndActionsProps {
  searchTerm: string;
  statusFilter: 'all' | 'paid' | 'pending';
  ticketCount: number;
  paidCount: number;
  pendingCount: number;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (status: 'all' | 'paid' | 'pending') => void;
  onAddTicket: () => void;
  onGenerateAutomatic: () => void;
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
  onGenerateAutomatic,
  onRefresh,
}) => {
  const handleStatusChange = (event: SelectChangeEvent) => {
    onStatusFilterChange(event.target.value as 'all' | 'paid' | 'pending');
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Estadísticas rápidas */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip
          label={`Total: ${ticketCount}`}
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`Pagados: ${paidCount}`}
          color="success"
          variant="outlined"
        />
        <Chip
          label={`Pendientes: ${pendingCount}`}
          color="warning"
          variant="outlined"
        />
      </Box>

      {/* Barra de búsqueda y filtros */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        {/* Campo de búsqueda */}
        <TextField
          label="Buscar tickets"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 300, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          placeholder="Buscar por cliente, servicio, monto..."
        />

        {/* Filtro por estado */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Estado</InputLabel>
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
            variant="outlined"
            startIcon={<AutoIcon />}
            onClick={onGenerateAutomatic}
            disabled={loading}
            size="small"
            color="secondary"
          >
            Generar Automático
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

      {/* Información adicional */}
      <Typography variant="body2" color="text.secondary">
        {ticketCount === 0
          ? 'No se encontraron tickets'
          : `Mostrando ${ticketCount} ticket${ticketCount !== 1 ? 's' : ''}`
        }
      </Typography>
    </Box>
  );
};