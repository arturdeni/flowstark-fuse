// src/app/flowstark/subscriptions/components/SubscriptionsTable.tsx
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    IconButton,
    Chip,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Pause as PauseIcon,
    PlayArrow as PlayArrowIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { SubscriptionWithRelations } from '../hooks/useSubscriptions';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:hover': {
        backgroundColor: theme.palette.action.selected,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

interface SubscriptionsTableProps {
    subscriptions: SubscriptionWithRelations[];
    loading: boolean;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (subscription: SubscriptionWithRelations) => void;
    onChangeStatus: (id: string, status: 'active' | 'paused' | 'cancelled') => void;
    onDelete: (id: string) => void;
}

export const SubscriptionsTable: React.FC<SubscriptionsTableProps> = ({
    subscriptions,
    loading,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    onEdit,
    onChangeStatus,
    onDelete,
}) => {
    const getStatusChip = (status: 'active' | 'paused' | 'cancelled') => {
        switch (status) {
            case 'active':
                return <Chip label="Activa" color="success" size="small" />;
            case 'paused':
                return <Chip label="Pausada" color="warning" size="small" />;
            case 'cancelled':
                return <Chip label="Cancelada" color="error" size="small" />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return '-';

        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getRenewalText = (renewal: string): string => {
        switch (renewal) {
            case 'monthly':
                return 'Mensual';
            case 'quarterly':
                return 'Trimestral';
            case 'biannual':
                return 'Semestral';
            case 'annual':
                return 'Anual';
            default:
                return renewal;
        }
    };

    const getPaymentMethodText = (method: string): string => {
        switch (method) {
            case 'credit_card':
                return 'Tarjeta de Crédito';
            case 'paypal':
                return 'PayPal';
            case 'bank_transfer':
                return 'Transferencia Bancaria';
            case 'cash':
                return 'Efectivo';
            case 'direct_debit':
                return 'Domiciliación';
            default:
                return method;
        }
    };

    if (loading && subscriptions.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de suscripciones">
                <TableHead>
                    <TableRow>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Servicio</TableCell>
                        <TableCell>Frecuencia</TableCell>
                        <TableCell>Método de Pago</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Inicio</TableCell>
                        <TableCell>Fin</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {subscriptions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} align="center">
                                No se encontraron suscripciones
                            </TableCell>
                        </TableRow>
                    ) : (
                        subscriptions
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((subscription) => (
                                <StyledTableRow key={subscription.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                {subscription.clientInfo?.firstName}{' '}
                                                {subscription.clientInfo?.lastName}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {subscription.clientInfo?.email}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{subscription.serviceInfo?.name}</TableCell>
                                    <TableCell>{getRenewalText(subscription.renewal)}</TableCell>
                                    <TableCell>
                                        {getPaymentMethodText(subscription.paymentMethod?.type)}
                                    </TableCell>
                                    <TableCell>{getStatusChip(subscription.status)}</TableCell>
                                    <TableCell>{formatDate(subscription.startDate)}</TableCell>
                                    <TableCell>{formatDate(subscription.endDate)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => onEdit(subscription)}
                                            disabled={loading}
                                            title="Editar"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>

                                        {subscription.status === 'active' && (
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    onChangeStatus(subscription.id!, 'paused')
                                                }
                                                disabled={loading}
                                                title="Pausar"
                                            >
                                                <PauseIcon fontSize="small" />
                                            </IconButton>
                                        )}

                                        {subscription.status === 'paused' && (
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    onChangeStatus(subscription.id!, 'active')
                                                }
                                                disabled={loading}
                                                title="Activar"
                                            >
                                                <PlayArrowIcon fontSize="small" />
                                            </IconButton>
                                        )}

                                        {(subscription.status === 'active' ||
                                            subscription.status === 'paused') && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        onChangeStatus(subscription.id!, 'cancelled')
                                                    }
                                                    disabled={loading}
                                                    title="Cancelar"
                                                >
                                                    <CancelIcon fontSize="small" />
                                                </IconButton>
                                            )}

                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                subscription.id && onDelete(subscription.id)
                                            }
                                            disabled={
                                                loading || subscription.status === 'active'
                                            }
                                            title="Eliminar"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </StyledTableRow>
                            ))
                    )}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={subscriptions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
        </TableContainer>
    );
};