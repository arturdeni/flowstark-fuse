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
    Tooltip,
    Alert,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Cancel as CancelIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { SubscriptionWithRelations } from '../hooks/useSubscriptions';
import { formatPaymentDate, getPaymentStatus } from '../../../../utils/paymentDateCalculator';

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

// Estilos personalizados para las celdas
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
type OrderBy = 'client' | 'service' | 'frequency' | 'paymentDate' | 'paymentType' | 'status' | 'finalPrice';

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
    // ✅ Verificación de seguridad para evitar errores de iteración
    const safeSubscriptions = subscriptions || [];

    // Estado para el ordenamiento
    const [order, setOrder] = useState<Order>('asc');
    const [orderBy, setOrderBy] = useState<OrderBy>('client');

    // Función para calcular el estado dinámico de la suscripción
    const getSubscriptionStatus = (subscription: SubscriptionWithRelations): 'active' | 'expired' | 'ending' | 'cancelled' => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Si está explícitamente cancelada
        if (subscription.status === 'cancelled') {
            return 'cancelled';
        }

        if (subscription.endDate) {
            const endDate = new Date(subscription.endDate);
            endDate.setHours(0, 0, 0, 0);

            if (endDate < today) {
                return 'expired';
            } else if (endDate >= today) {
                return 'ending';
            }
        }

        return 'active';
    };

    // Función para mostrar el chip de estado
    const getStatusChip = (subscription: SubscriptionWithRelations) => {
        const status = getSubscriptionStatus(subscription);

        switch (status) {
            case 'active':
                return <Chip label="Activa" color="success" size="small" />;
            case 'expired':
                return <Chip label="Caducada" color="error" size="small" />;
            case 'ending':
                return <Chip label="Finaliza" color="warning" size="small" />;
            case 'cancelled':
                return <Chip label="Cancelada" color="default" size="small" />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    // Función para formatear fechas de forma segura
    const formatDateSafe = (date: Date | string | null | undefined): string => {
        if (!date) return '-';

        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            
            // Verificar si la fecha es válida
            if (isNaN(dateObj.getTime())) {
                console.warn('Fecha inválida detectada:', date);
                return 'Fecha inválida';
            }

            return formatPaymentDate(dateObj);
        } catch (error) {
            console.error('Error formateando fecha:', error, date);
            return 'Error en fecha';
        }
    };

    // Función para formatear precios
    const formatPrice = (price: number): string => {
        return price.toFixed(2);
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

    // Función para obtener texto del tipo de pago
    const getPaymentTypeText = (paymentType: 'advance' | 'arrears'): string => {
        switch (paymentType) {
            case 'advance':
                return 'Anticipado';
            case 'arrears':
                return 'Vencido';
            default:
                return paymentType;
        }
    };

    // Función para calcular el precio final de la suscripción
    const calculateSubscriptionFinalPrice = (subscription: SubscriptionWithRelations): number => {
        const service = subscription.serviceInfo;

        if (!service) return 0;

        // Usar finalPrice si existe, sino calcular
        if (service.finalPrice) {
            return service.finalPrice;
        }

        const basePrice = service.basePrice || 0;
        const vat = service.vat || 0;
        const retention = (service as any).retention || 0;

        // Precio con IVA
        const priceWithVat = basePrice * (1 + vat / 100);

        // Precio final con retención
        const finalPrice = priceWithVat * (1 - retention / 100);

        return finalPrice;
    };

    // Función para obtener el nombre del cliente
    const getClientDisplayName = (subscription: SubscriptionWithRelations): string => {
        const client = subscription.clientInfo;

        if (!client) return 'Cliente no encontrado';

        return `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.email || 'Sin nombre';
    };

    // Función para verificar si se puede eliminar
    const canDelete = (subscription: SubscriptionWithRelations): boolean => {
        const status = getSubscriptionStatus(subscription);
        // No se puede eliminar si está en estado "ending" (finalizando)
        return status !== 'ending';
    };

    // Función para mostrar el estado de pago con icono y color
    const getPaymentDateDisplay = (subscription: SubscriptionWithRelations) => {
        const paymentStatus = getPaymentStatus(subscription, subscription.paymentCalculation);
        const formattedDate = formatDateSafe(subscription.paymentDate);

        if (formattedDate === '-' || formattedDate.includes('inválida') || formattedDate.includes('Error')) {
            return (
                <Box display="flex" alignItems="center" gap={1}>
                    <WarningIcon color="error" fontSize="small" />
                    <Typography variant="body2" color="error">
                        Sin fecha válida
                    </Typography>
                </Box>
            );
        }

        const getIcon = () => {
            switch (paymentStatus.status) {
                case 'overdue':
                    return <WarningIcon color="error" fontSize="small" />;
                case 'due':
                    return <ScheduleIcon color="warning" fontSize="small" />;
                case 'upcoming':
                    return <CheckCircleIcon color="success" fontSize="small" />;
                default:
                    return <ScheduleIcon color="disabled" fontSize="small" />;
            }
        };

        return (
            <Tooltip title={paymentStatus.text}>
                <Box display="flex" alignItems="center" gap={1}>
                    {getIcon()}
                    <Typography 
                        variant="body2" 
                        color={
                            paymentStatus.status === 'overdue' ? 'error' :
                            paymentStatus.status === 'due' ? 'warning.main' : 'text.primary'
                        }
                    >
                        {formattedDate}
                    </Typography>
                </Box>
            </Tooltip>
        );
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
            case 'paymentDate':
                return subscription.paymentDate || new Date(0);
            case 'paymentType':
                return getPaymentTypeText(subscription.paymentType || 'advance').toLowerCase();
            case 'status':
                return getSubscriptionStatus(subscription);
            case 'finalPrice':
                return calculateSubscriptionFinalPrice(subscription);
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

    // Ordenar y paginar datos
    const sortedSubscriptions = useMemo(() => {
        return [...safeSubscriptions].sort(getComparator(order, orderBy));
    }, [safeSubscriptions, order, orderBy]);

    const paginatedSubscriptions = useMemo(() => {
        return sortedSubscriptions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [sortedSubscriptions, page, rowsPerPage]);

    // Verificar si hay fechas de pago inválidas
    const hasInvalidDates = safeSubscriptions.some(sub => {
        const formatted = formatDateSafe(sub.paymentDate);
        return formatted.includes('inválida') || formatted.includes('Error') || formatted === '-';
    });

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            {hasInvalidDates && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Se han detectado algunas fechas de pago inválidas. 
                    Las fechas se recalcularán automáticamente en la próxima actualización.
                </Alert>
            )}
            
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small" aria-label="tabla de suscripciones">
                    <TableHead>
                        <TableRow>
                            <HeaderTableCell>
                                <TableSortLabel
                                    active={orderBy === 'client'}
                                    direction={orderBy === 'client' ? order : 'asc'}
                                    onClick={() => handleRequestSort('client')}
                                >
                                    Cliente
                                </TableSortLabel>
                            </HeaderTableCell>
                            <HeaderTableCell>
                                <TableSortLabel
                                    active={orderBy === 'service'}
                                    direction={orderBy === 'service' ? order : 'asc'}
                                    onClick={() => handleRequestSort('service')}
                                >
                                    Servicio
                                </TableSortLabel>
                            </HeaderTableCell>
                            <HeaderTableCell>
                                <TableSortLabel
                                    active={orderBy === 'frequency'}
                                    direction={orderBy === 'frequency' ? order : 'asc'}
                                    onClick={() => handleRequestSort('frequency')}
                                >
                                    Frecuencia
                                </TableSortLabel>
                            </HeaderTableCell>
                            <HeaderTableCell>
                                <TableSortLabel
                                    active={orderBy === 'paymentDate'}
                                    direction={orderBy === 'paymentDate' ? order : 'asc'}
                                    onClick={() => handleRequestSort('paymentDate')}
                                >
                                    Fecha de Cobro
                                </TableSortLabel>
                            </HeaderTableCell>
                            <HeaderTableCell>
                                <TableSortLabel
                                    active={orderBy === 'paymentType'}
                                    direction={orderBy === 'paymentType' ? order : 'asc'}
                                    onClick={() => handleRequestSort('paymentType')}
                                >
                                    Tipo de Pago
                                </TableSortLabel>
                            </HeaderTableCell>
                            <HeaderTableCell>
                                <TableSortLabel
                                    active={orderBy === 'status'}
                                    direction={orderBy === 'status' ? order : 'asc'}
                                    onClick={() => handleRequestSort('status')}
                                >
                                    Estado
                                </TableSortLabel>
                            </HeaderTableCell>
                            <HeaderTableCell align="right">
                                <TableSortLabel
                                    active={orderBy === 'finalPrice'}
                                    direction={orderBy === 'finalPrice' ? order : 'asc'}
                                    onClick={() => handleRequestSort('finalPrice')}
                                >
                                    Precio Final
                                </TableSortLabel>
                            </HeaderTableCell>
                            <HeaderTableCell align="center">Acciones</HeaderTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedSubscriptions.length === 0 ? (
                            <TableRow>
                                <CompactTableCell colSpan={8} align="center">
                                    <Typography variant="body2" color="text.secondary" py={4}>
                                        No se encontraron suscripciones
                                    </Typography>
                                </CompactTableCell>
                            </TableRow>
                        ) : (
                            paginatedSubscriptions.map((subscription) => (
                                <StyledTableRow key={subscription.id}>
                                    {/* Cliente */}
                                    <CompactTableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {getClientDisplayName(subscription)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {subscription.clientInfo?.email}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Servicio */}
                                    <CompactTableCell>
                                        <Typography variant="body2">
                                            {subscription.serviceInfo?.name || 'Servicio no encontrado'}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Frecuencia */}
                                    <CompactTableCell>
                                        <Chip
                                            label={getFrequencyText(subscription)}
                                            variant="outlined"
                                            color="default"
                                            size="small"
                                        />
                                    </CompactTableCell>

                                    {/* Fecha de Cobro */}
                                    <CompactTableCell>
                                        {getPaymentDateDisplay(subscription)}
                                    </CompactTableCell>

                                    {/* Tipo de Pago */}
                                    <CompactTableCell>
                                        <Typography variant="body2" color="text.primary">
                                            {getPaymentTypeText(subscription.paymentType || 'advance')}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Estado */}
                                    <CompactTableCell>
                                        {getStatusChip(subscription)}
                                    </CompactTableCell>

                                    {/* Precio Final */}
                                    <CompactTableCell align="right">
                                        <Typography variant="body2" fontWeight="bold">
                                            {formatPrice(calculateSubscriptionFinalPrice(subscription))} €
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Acciones */}
                                    <CompactTableCell align="center">
                                        <Box display="flex" gap={0.5} justifyContent="center">
                                            <Tooltip title="Editar suscripción">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onEdit(subscription)}
                                                    color="primary"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            {getSubscriptionStatus(subscription) === 'active' && (
                                                <Tooltip title="Cancelar suscripción">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onCancel(subscription)}
                                                        color="warning"
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {canDelete(subscription) && (
                                                <Tooltip title="Eliminar suscripción">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => subscription.id && onDelete(subscription.id)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </CompactTableCell>
                                </StyledTableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Paginación */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={sortedSubscriptions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
            />
        </>
    );
};