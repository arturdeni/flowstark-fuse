// src/app/flowstark/dashboard/components/LoadingAndErrorStates.tsx
import React from 'react';
import {
    Box,
    CircularProgress,
    Typography,
    Alert,
    Button,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
} from '@mui/icons-material';

interface LoadingStateProps {
    message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
    message = 'Cargando datos del dashboard...',
}) => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={400}
            gap={2}
        >
            <CircularProgress size={60} />
            <Typography variant="h6" color="textSecondary">
                {message}
            </Typography>
        </Box>
    );
};

interface ErrorStateProps {
    error: string;
    onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    error,
    onRetry,
}) => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight={400}
            gap={2}
            px={2}
        >
            <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
                <Typography variant="h6" gutterBottom>
                    Error al cargar el dashboard
                </Typography>
                <Typography variant="body2" paragraph>
                    {error}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={onRetry}
                    sx={{ mt: 1 }}
                >
                    Intentar de nuevo
                </Button>
            </Alert>
        </Box>
    );
};