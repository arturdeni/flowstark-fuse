// src/app/flowstark/subscriptions/components/SubscriptionsTable.tsx
import React, { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
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

// Estilos personalizados para las celdas (consistente con otras tablas)
const CompactTableCell = styled(TableCell)(({ theme }) => ({
    padding: '8px 12px',
    fontSize: '0.875rem',
}));

const HeaderTableCell = styled(TableCell)(({ theme }) => ({
    padding: '12px 12px',
    fontSize: '0.875rem',
    fontWeight: 600,
    backgroundColor: theme.palette.grey[50],
}));

// Tipos para el ordenamiento
type Order = 'asc' | 'desc';
type OrderBy = 'client' | 'service' | 'frequency' | 'paymentMethod' | 'status' | 'startDate' | 'endDate' | 'pvp';

interface SubscriptionsTableProps {
    subscriptions: SubscriptionWithRelations[];
    loading: boolean;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (subscription: SubscriptionWithRelations) => void;
    onCancel: (subscription: SubscriptionWithRelations) => void;
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
    onCancel,
    onDelete,
}) => {
    // Estado para el ordenamiento
    const [order, setOrder] = useState<Order>('asc');
    const [orderBy, setOrderBy] = useState<OrderBy>('client');

    const getStatusChip = (status: 'active' | 'cancelled') => {
        switch (status) {
            case 'active':
                return <Chip label="Activa" color="success" size="small" />;
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

    // Obtener la frecuencia desde el servicio
    const getFrequencyText = (subscription: SubscriptionWithRelations): string => {
        const frequency = subscription.serviceInfo?.frequency;
        
        if (!frequency) return '-';
        
        switch (frequency) {
            case 'monthly':
                return 'Mensual';
            case 'quarterly':
                return 'Trimestral';
            case 'four_monthly':
                return 'Cuatrimestral';
            case 'biannual':
                return 'Semestral';
            case 'annual':
                return 'Anual';
            default:
                return frequency;
        }
    };

    // Obtener el método de pago desde el cliente
    const getPaymentMethodText = (subscription: SubscriptionWithRelations): string => {
        const paymentMethodType = subscription.clientInfo?.paymentMethod?.type;
        
        if (!paymentMethodType) return '-';
        
        switch (paymentMethodType) {
            case 'card':
                return 'Tarjeta';
            case 'transfer':
                return 'Transferencia';
            case 'cash':
                return 'Efectivo';
            case 'direct_debit':
                return 'Domiciliación';
            default:
                return paymentMethodType;
        }
    };

    // Función para calcular el PVP de la suscripción
    const calculateSubscriptionPVP = (subscription: SubscriptionWithRelations): number => {
        const service = subscription.serviceInfo;

        if (!service) return 0;
        
        const basePrice = service.basePrice || 0;
        const vat = service.vat || 0;
        const retention = service.retention || 0;
        
        // Precio con IVA
        const priceWithVat = basePrice * (1 + vat / 100);
        
        // Precio final con retención (si aplica)
        const finalPrice = priceWithVat * (1 - retention / 100);
        
        return finalPrice;
    };

    // Función para formatear precios
    const formatPrice = (price: number): string => {
        return price.toFixed(2);
    };

    // Función para obtener el nombre del cliente
    const getClientDisplayName = (subscription: SubscriptionWithRelations): string => {
        const client = subscription.clientInfo;

        if (!client) return 'Cliente no encontrado';
        
        return `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email || 'Sin nombre';
    };

    // Función de comparación para ordenamiento
    const descendingComparator = (a: any, b: any, orderBy: OrderBy) => {
        const aValue = getOrderValue(a, orderBy);
        const bValue = getOrderValue(b, orderBy);

        if (bValue < aValue) {
            return -1;
        }

        if (bValue > aValue) {
            return 1;
        }

        return 0;
    };

    const getComparator = (order: Order, orderBy: OrderBy) => {
        return order === 'desc'
            ? (a: any, b: any) => descendingComparator(a, b, orderBy)
            : (a: any, b: any) => -descendingComparator(a, b, orderBy);
    };

    // Función para obtener el valor de ordenamiento
    const getOrderValue = (subscription: SubscriptionWithRelations, orderBy: OrderBy): string | number | Date => {
        switch (orderBy) {
            case 'client':
                return getClientDisplayName(subscription).toLowerCase();
            case 'service':
                return (subscription.serviceInfo?.name || '').toLowerCase();
            case 'frequency':
                return getFrequencyText(subscription).toLowerCase();
            case 'paymentMethod':
                return getPaymentMethodText(subscription).toLowerCase();
            case 'status':
                return subscription.status;
            case 'startDate':
                return subscription.startDate || new Date(0);
            case 'endDate':
                return subscription.endDate || new Date(0);
            case 'pvp':
                return calculateSubscriptionPVP(subscription);
            default:
                return '';
        }
    };

    // Función para manejar el click en el header para ordenar
    const handleRequestSort = (property: OrderBy) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Ordenar las suscripciones
    const sortedSubscriptions = useMemo(() => {
        const comparator = getComparator(order, orderBy);
        const subscriptionsWithOrderValue = subscriptions.map(subscription => ({
            ...subscription,
            orderValue: getOrderValue(subscription, orderBy)
        }));

        return subscriptionsWithOrderValue.sort((a, b) => comparator(
            { [orderBy]: a.orderValue },
            { [orderBy]: b.orderValue }
        ));
    }, [subscriptions, order, orderBy]);

    // Componente para el header ordenable
    const SortableTableHead = ({ id, label, numeric = false, width }: {
        id: OrderBy;
        label: string;
        numeric?: boolean;
        width?: string;
    }) => (
        <HeaderTableCell align={numeric ? 'right' : 'left'} sx={{ width }}>
            <TableSortLabel
                active={orderBy === id}
                direction={orderBy === id ? order : 'asc'}
                onClick={() => handleRequestSort(id)}
                sx={{
                    '& .MuiTableSortLabel-icon': {
                        fontSize: '1rem',
                    },
                }}
            >
                {label}
            </TableSortLabel>
        </HeaderTableCell>
    );

    if (loading && subscriptions.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <TableContainer
            component={Paper}
            sx={{
                width: '100%',
                overflowX: 'auto',
                '& .MuiTable-root': {
                    minWidth: 'auto'
                }
            }}
        >
            <Table
                size="small"
                aria-label="tabla de suscripciones"
                sx={{
                    tableLayout: 'fixed',
                    width: '100%'
                }}
            >
                <TableHead>
                    <TableRow>
                        <SortableTableHead id="client" label="Cliente" width="160px" />
                        <SortableTableHead id="service" label="Servicio" width="140px" />
                        <SortableTableHead id="frequency" label="Frecuencia" width="90px" />
                        <SortableTableHead id="paymentMethod" label="Método de Pago" width="110px" />
                        <SortableTableHead id="pvp" label="PVP" width="80px" numeric />
                        <SortableTableHead id="status" label="Estado" width="80px" />
                        <SortableTableHead id="startDate" label="Fecha de Alta" width="90px" />
                        <SortableTableHead id="endDate" label="Fin" width="80px" />
                        <HeaderTableCell sx={{ width: '120px', textAlign: 'right' }}>Acciones</HeaderTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedSubscriptions.length === 0 ? (
                        <TableRow>
                            <CompactTableCell colSpan={9} align="center">
                                <Typography variant="body2" color="text.secondary">
                                    No se encontraron suscripciones
                                </Typography>
                            </CompactTableCell>
                        </TableRow>
                    ) : (
                        sortedSubscriptions
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((subscription) => (
                                <StyledTableRow key={subscription.id}>
                                    {/* Cliente */}
                                    <CompactTableCell>
                                        <Box>
                                            <Typography 
                                                variant="body2" 
                                                fontWeight="bold"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title={getClientDisplayName(subscription)}
                                            >
                                                {getClientDisplayName(subscription)}
                                            </Typography>
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title={subscription.clientInfo?.email}
                                            >
                                                {subscription.clientInfo?.email}
                                            </Typography>
                                        </Box>
                                    </CompactTableCell>

                                    {/* Servicio */}
                                    <CompactTableCell>
                                        <Typography 
                                            variant="body2"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={subscription.serviceInfo?.name}
                                        >
                                            {subscription.serviceInfo?.name || '-'}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Frecuencia (desde el servicio) */}
                                    <CompactTableCell>
                                        <Typography 
                                            variant="body2"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={getFrequencyText(subscription)}
                                        >
                                            {getFrequencyText(subscription)}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Método de Pago (desde el cliente) */}
                                    <CompactTableCell>
                                        <Typography 
                                            variant="body2"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={getPaymentMethodText(subscription)}
                                        >
                                            {getPaymentMethodText(subscription)}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* PVP */}
                                    <CompactTableCell align="right">
                                        <Typography variant="body2" fontWeight="bold">
                                            {formatPrice(calculateSubscriptionPVP(subscription))} €
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Estado */}
                                    <CompactTableCell>
                                        {getStatusChip(subscription.status)}
                                    </CompactTableCell>

                                    {/* Fecha de Alta */}
                                    <CompactTableCell>
                                        <Typography variant="body2">
                                            {formatDate(subscription.startDate)}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Fecha de Fin */}
                                    <CompactTableCell>
                                        <Typography variant="body2">
                                            {formatDate(subscription.endDate)}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Acciones */}
                                    <CompactTableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                            {/* Mostrar acciones según el estado */}
                                            {subscription.status === 'active' ? (
                                                <>
                                                    {/* Editar (solo si está activa) */}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onEdit(subscription)}
                                                        title="Editar suscripción"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>

                                                    {/* Cancelar (solo si está activa) */}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onCancel(subscription)}
                                                        title="Cancelar suscripción"
                                                        color="warning"
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>

                                                    {/* Eliminar */}
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onDelete(subscription.id!)}
                                                        title="Eliminar suscripción"
                                                        color="error"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </>
                                            ) : (
                                                /* Solo eliminar para suscripciones canceladas */
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onDelete(subscription.id!)}
                                                    title="Eliminar suscripción"
                                                    color="error"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </CompactTableCell>
                                </StyledTableRow>
                            ))
                    )}
                </TableBody>
            </Table>

            {/* Paginación */}
            <TablePagination
                rowsPerPageOptions={[25, 50, 100]}
                component="div"
                count={subscriptions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
            />
        </TableContainer>
    );
};