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
type OrderBy = 'client' | 'service' | 'renewal' | 'paymentMethod' | 'status' | 'startDate' | 'endDate' | 'pvp';

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

    const getRenewalText = (renewal: string): string => {
        switch (renewal) {
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
                return renewal;
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
        
        // Precio final con retención (la retención se resta)
        const finalPrice = priceWithVat * (1 - retention / 100);
        
        return finalPrice;
    };

    const formatPrice = (price: number): string => {
        return price.toFixed(2);
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
            case 'card':
                return 'Tarjeta';
            case 'transfer':
                return 'Transferencia';
            default:
                return method;
        }
    };

    // Función para obtener el nombre completo del cliente
    const getClientDisplayName = (subscription: SubscriptionWithRelations): string => {
        if (!subscription.clientInfo) return 'Cliente no disponible';
        
        const { firstName, lastName, fiscalName } = subscription.clientInfo;
        
        // Si tiene fiscalName, es una empresa
        if (fiscalName) {
            return firstName || fiscalName;
        }
        
        // Si no, es un particular
        return `${firstName || ''} ${lastName || ''}`.trim();
    };

    // Función de comparación para el ordenamiento
    const descendingComparator = <T,>(a: T, b: T, orderBy: keyof T) => {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        }

        if (b[orderBy] > a[orderBy]) {
            return 1;
        }

        return 0;
    };

    const getComparator = <Key extends keyof any>(
        order: Order,
        orderBy: Key,
    ): ((a: Record<Key, number | string | Date>, b: Record<Key, number | string | Date>) => number) => {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    };

    // Función para obtener el valor de ordenamiento
    const getOrderValue = (subscription: SubscriptionWithRelations, orderBy: OrderBy): string | number | Date => {
        switch (orderBy) {
            case 'client':
                return getClientDisplayName(subscription).toLowerCase();
            case 'service':
                return (subscription.serviceInfo?.name || '').toLowerCase();
            case 'renewal':
                return getRenewalText(subscription.renewal).toLowerCase();
            case 'paymentMethod':
                return getPaymentMethodText(subscription.paymentMethod?.type || '').toLowerCase();
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
                        <SortableTableHead id="renewal" label="Frecuencia" width="90px" />
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
                                <Typography variant="body2" color="textSecondary">
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
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography
                                                variant="body2"
                                                fontWeight="medium"
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
                                                color="textSecondary"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title={subscription.clientInfo?.email}
                                            >
                                                {subscription.clientInfo?.email || '-'}
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

                                    {/* Frecuencia */}
                                    <CompactTableCell>
                                        <Typography variant="body2">
                                            {getRenewalText(subscription.renewal)}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Método de Pago */}
                                    <CompactTableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={getPaymentMethodText(subscription.paymentMethod?.type)}
                                        >
                                            {getPaymentMethodText(subscription.paymentMethod?.type)}
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

                                    {/* Fecha de Alta (antes "Fecha de Inicio") */}
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

                                    {/* Acciones - Solo editar y cancelar, sin pausar */}
                                    <CompactTableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                            {/* Solo se puede editar si está activa */}
                                            {subscription.status === 'active' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onEdit(subscription)}
                                                    disabled={loading}
                                                    title="Editar"
                                                    sx={{ 
                                                        color: 'text.secondary',
                                                        '&:hover': { backgroundColor: 'action.hover' }
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            )}

                                            {/* Solo se puede cancelar si está activa */}
                                            {subscription.status === 'active' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onCancel(subscription)}
                                                    disabled={loading}
                                                    title="Cancelar suscripción"
                                                    sx={{ 
                                                        color: 'text.secondary',
                                                        '&:hover': { backgroundColor: 'action.hover' }
                                                    }}
                                                >
                                                    <CancelIcon fontSize="small" />
                                                </IconButton>
                                            )}

                                            {/* Solo se puede eliminar si está cancelada */}
                                            {subscription.status === 'cancelled' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        subscription.id && onDelete(subscription.id)
                                                    }
                                                    disabled={loading}
                                                    title="Eliminar"
                                                    sx={{ 
                                                        color: 'text.secondary',
                                                        '&:hover': { backgroundColor: 'action.hover' }
                                                    }}
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