// src/app/flowstark/subscriptions/components/SubscriptionSearchAndActions.tsx
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
    IconButton,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SubscriptionSearchAndActionsProps {
    searchTerm: string;
    statusFilter: 'all' | 'active' | 'expired' | 'ending';
    loading: boolean;
    onSearchChange: (term: string) => void;
    onStatusFilterChange: (status: 'all' | 'active' | 'expired' | 'ending') => void;
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
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(event.target.value);
    };

    const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
        onStatusFilterChange(event.target.value as 'all' | 'active' | 'expired' | 'ending');
    };

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                gap: 2, 
                alignItems: 'center', 
                mb: 3,
                flexWrap: 'wrap'
            }}
        >
            {/* Campo de búsqueda */}
            <TextField
                placeholder="Buscar suscripciones..."
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
                sx={{ flexGrow: 1, minWidth: 200 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            {/* Filtro de estado */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="status-filter-label">Estado</InputLabel>
                <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label="Estado"
                    onChange={handleStatusFilterChange}
                >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="active">Activas</MenuItem>
                    <MenuItem value="ending">Finaliza</MenuItem>
                    <MenuItem value="expired">Caducadas</MenuItem>
                </Select>
            </FormControl>

            {/* Botón de actualizar */}
            <IconButton
                onClick={onRefresh}
                disabled={loading}
                title="Actualizar datos"
                size="small"
            >
                <RefreshIcon />
            </IconButton>

            {/* Botón de nueva suscripción */}
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddNew}
                disabled={loading}
                size="small"
            >
                Nueva Suscripción
            </Button>
        </Box>
    );
};