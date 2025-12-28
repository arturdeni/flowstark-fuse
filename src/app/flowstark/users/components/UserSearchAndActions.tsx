// src/app/flowstark/users/components/UserSearchAndActions.tsx
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
    CloudUpload as ImportIcon,
} from '@mui/icons-material';

interface UserSearchAndActionsProps {
    searchTerm: string;
    loading: boolean;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddNew: () => void;
    onImport: () => void;
}

export const UserSearchAndActions: React.FC<UserSearchAndActionsProps> = ({
    searchTerm,
    loading,
    onSearchChange,
    onAddNew,
    onImport,
}) => {
    return (
        <Box sx={{ display: 'flex', mb: 3 }}>
            <TextField
                variant="outlined"
                placeholder="Buscar clientes..."
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
                sx={{
                    mr: 1,
                    '&:hover': {
                        backgroundColor: '#2C645E'
                    }
                }}
            >
                Nuevo Cliente
            </Button>
            <Button
                variant="outlined"
                color="primary"
                startIcon={<ImportIcon />}
                onClick={onImport}
                disabled={loading}
            >
                Importar
            </Button>
        </Box>
    );
};