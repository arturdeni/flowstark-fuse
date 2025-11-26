// src/app/flowstark/services/components/SearchAndActions.tsx
import React from 'react';
import {
  Box,
  TextField,
  Button,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SearchAndActionsProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddNew: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const SearchAndActions: React.FC<SearchAndActionsProps> = ({
  searchTerm,
  onSearchChange,
  onAddNew,
  onRefresh,
  loading = false,
}) => {
  return (
    <Box sx={{ display: 'flex', mb: 3 }}>
      <TextField
        variant="outlined"
        placeholder="Buscar servicios..."
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
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={onAddNew}
        disabled={loading}
        sx={{ mr: 1,
          '&:hover': {
							backgroundColor: '#2C645E'
						}
         }}
      >
        Nuevo Servicio
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