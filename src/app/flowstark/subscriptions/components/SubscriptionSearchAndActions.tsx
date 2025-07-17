// src/app/flowstark/subscriptions/components/SubscriptionSearchAndActions.tsx
import React from 'react';
import {
    Box,
    TextField,
    Button,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SubscriptionSearchAndActionsProps {
    searchTerm: string;
    statusFilter: string;
    loading: boolean;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onStatusFilterChange: (e: SelectChangeEvent) => void;
    onAddNew: () => void;
    onRefresh: () => void;
}

export const SubscriptionSearchAndActions: React.FC<SubscriptionSearchAndActionsProps> = ({
    searchTerm,
    statusFilter,
    loading,
    onSearchChange,
    onStatusFilterChange,
    onAddNew,
    onRefresh,
}) => {
    return (
        <Box sx={{ display: 'flex', mb: 3 }}>
            <TextField
                variant="outlined"
                placeholder="Buscar suscripciones..."
                value={searchTerm}
                onChange={onSearchChange}
                sx={{ mr: 2, flexGrow: 1 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />
            <FormControl variant="outlined" sx={{ minWidth: 120, mr: 2 }}>
                <InputLabel id="status-filter-label">Estado</InputLabel>
                <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    onChange={onStatusFilterChange}
                    label="Estado"
                >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="active">Activas</MenuItem>
                    <MenuItem value="cancelled">Canceladas</MenuItem>
                </Select>
            </FormControl>
            <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={onAddNew}
                disabled={loading}
                sx={{ mr: 1 }}
            >
                Nueva Suscripción
            </Button>
            <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                disabled={loading}
            >
                Actualizar
            </Button>
        </Box>
    );
};