// src/app/flowstark/tickets/components/TicketFilters.tsx
import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';

interface TicketFiltersProps {
  statusFilter: 'all' | 'pending' | 'paid';
  paymentMethodFilter: 'all' | 'card' | 'transfer' | 'cash' | 'direct_debit';
  startDateFilter: Date | null;
  endDateFilter: Date | null;
  onStatusFilterChange: (status: 'all' | 'pending' | 'paid') => void;
  onPaymentMethodFilterChange: (method: 'all' | 'card' | 'transfer' | 'cash' | 'direct_debit') => void;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  statusFilter,
  paymentMethodFilter,
  startDateFilter,
  endDateFilter,
  onStatusFilterChange,
  onPaymentMethodFilterChange,
  onStartDateChange,
  onEndDateChange,
}) => {
  const handleStatusChange = (event: SelectChangeEvent) => {
    onStatusFilterChange(event.target.value as 'all' | 'pending' | 'paid');
  };

  const handlePaymentMethodChange = (event: SelectChangeEvent) => {
    onPaymentMethodFilterChange(event.target.value as 'all' | 'card' | 'transfer' | 'cash' | 'direct_debit');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        {/* Filtro por estado */}
        <FormControl size="small" sx={{ flex: 1, minWidth: 150 }}>
          <InputLabel id="status-filter-label">Estado</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Estado"
            onChange={handleStatusChange}
          >
            <MenuItem value="all">Todos los estados</MenuItem>
            <MenuItem value="pending">Pendientes</MenuItem>
            <MenuItem value="paid">Cobrados</MenuItem>
          </Select>
        </FormControl>

        {/* Filtro por tipo de cobro/pago */}
        <FormControl size="small" sx={{ flex: 1, minWidth: 160 }}>
          <InputLabel id="payment-method-filter-label">Tipo de cobro</InputLabel>
          <Select
            labelId="payment-method-filter-label"
            value={paymentMethodFilter}
            label="Tipo de cobro"
            onChange={handlePaymentMethodChange}
          >
            <MenuItem value="all">Todos los tipos</MenuItem>
            <MenuItem value="card">Tarjeta</MenuItem>
            <MenuItem value="transfer">Transferencia</MenuItem>
            <MenuItem value="cash">Efectivo</MenuItem>
            <MenuItem value="direct_debit">Domiciliación</MenuItem>
          </Select>
        </FormControl>

        {/* Filtro de fecha desde */}
        <DatePicker
          label="Fecha desde"
          value={startDateFilter}
          onChange={onStartDateChange}
          slotProps={{
            textField: {
              size: 'small',
              sx: { flex: 1, minWidth: 150 },
            },
            actionBar: {
              actions: ['clear', 'today'],
            },
          }}
        />

        {/* Filtro de fecha hasta */}
        <DatePicker
          label="Fecha hasta"
          value={endDateFilter}
          onChange={onEndDateChange}
          slotProps={{
            textField: {
              size: 'small',
              sx: { flex: 1, minWidth: 150 },
            },
            actionBar: {
              actions: ['clear', 'today'],
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};
