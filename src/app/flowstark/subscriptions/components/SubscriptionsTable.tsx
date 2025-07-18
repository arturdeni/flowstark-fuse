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
    const getSubscriptionStatus = (subscription: SubscriptionWithRelations): 'active' | 'expired' | 'ending' => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (subscription.endDate) {
            const endDate = new Date(subscription.endDate);
            endDate.setHours(0, 0, 0, 0);

            if (endDate < today) {
                return 'expired';
            } else if (endDate >= today) {
                return 'ending';
            }
        }

        return subscription.status === 'cancelled' ? 'expired' : 'active';
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
            default:
                return <Chip label={status} size="small" />;
        }
    };

    // Función para formatear fechas
    const formatDate = (date: Date | null): string => {
        if (!date) return '-';

        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
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
        const retention = service.retention || 0;

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
        return status !== 'active';
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

    // Calcular suscripciones ordenadas y paginadas
    const sortedSubscriptions = useMemo(() => {
        const sorted = [...safeSubscriptions].sort(getComparator(order, orderBy));
        return sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [safeSubscriptions, order, orderBy, page, rowsPerPage]);

    // Componente para headers ordenables
    const SortableTableHead = ({
        id,
        label,
        numeric = false
    }: {
        id: OrderBy;
        label: string;
        numeric?: boolean;
    }) => (
        <HeaderTableCell align={numeric ? 'right' : 'left'}>
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

    if (loading && safeSubscriptions.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" aria-label="tabla de suscripciones">
                <TableHead>
                    <TableRow>
                        <SortableTableHead id="client" label="Cliente" />
                        <SortableTableHead id="service" label="Servicio" />
                        <SortableTableHead id="frequency" label="Frecuencia" />
                        <SortableTableHead id="paymentDate" label="Fecha de Cobro" />
                        <SortableTableHead id="paymentType" label="Tipo de Pago" />
                        <SortableTableHead id="status" label="Estado" />
                        <SortableTableHead id="finalPrice" label="Precio Final" numeric />
                        <HeaderTableCell>Acciones</HeaderTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {safeSubscriptions.length === 0 ? (
                        <TableRow>
                            <CompactTableCell colSpan={8} align="center">
                                <Typography variant="body2" color="text.secondary">
                                    No hay suscripciones para mostrar
                                </Typography>
                            </CompactTableCell>
                        </TableRow>
                    ) : (
                        sortedSubscriptions.map((subscription) => {
                            const showDeleteButton = canDelete(subscription);
                            const subscriptionStatus = getSubscriptionStatus(subscription);

                            return (
                                <StyledTableRow key={subscription.id}>
                                    {/* Cliente */}
                                    <CompactTableCell>
                                        <Typography variant="body2">
                                            {getClientDisplayName(subscription)}
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
                                            size="small"
                                            variant="outlined"
                                            color="default"
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    </CompactTableCell>

                                    {/* Fecha de Cobro */}
                                    <CompactTableCell>
                                        <Typography variant="body2">
                                            {formatDate(subscription.paymentDate)}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Tipo de Pago */}
                                    <CompactTableCell>
                                        <Chip
                                            label={getPaymentTypeText(subscription.paymentType || 'advance')}
                                            size="small"
                                            variant="outlined"
                                            color={subscription.paymentType === 'advance' ? 'primary' : 'secondary'}
                                            sx={{ fontSize: '0.7rem' }}
                                        />
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
                                    <CompactTableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => onEdit(subscription)}
                                                title="Editar suscripción"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>

                                            {subscriptionStatus === 'active' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onCancel(subscription)}
                                                    title="Cancelar suscripción"
                                                >
                                                    <CancelIcon fontSize="small" />
                                                </IconButton>
                                            )}

                                            {showDeleteButton && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onDelete(subscription.id!)}
                                                    title="Eliminar suscripción"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </CompactTableCell>
                                </StyledTableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            {/* Paginación */}
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={safeSubscriptions.length}
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