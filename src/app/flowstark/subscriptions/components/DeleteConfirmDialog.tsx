// src/app/flowstark/subscriptions/components/DeleteConfirmDialog.tsx
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
} from '@mui/material';

interface DeleteConfirmDialogProps {
    open: boolean;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    open,
    loading,
    onConfirm,
    onCancel,
}) => {
    return (
        <Dialog open={open} onClose={onCancel}>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogContent>
                <Typography>
                    ¿Estás seguro de que deseas eliminar esta suscripción? Esta acción no se puede deshacer.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    color="error"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Eliminando...' : 'Eliminar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};