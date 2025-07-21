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
import { formatPaymentDate } from '../../../../utils/paymentDateCalculator';

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

        // Si tiene endDate, verificar si ya ha caducado
        if (subscription.endDate) {
            const endDate = new Date(subscription.endDate);
            endDate.setHours(0, 0, 0, 0);

            // Si la fecha de fin es hoy o anterior, está caducada
            if (endDate <= today) {
                return 'expired';
            } else {
                // Si la fecha de fin es futura, está finalizando
                return 'ending';
            }
        }

        // Si no tiene endDate, está activa
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
            default:
                return <Chip label={status} size="small" />;
        }
    };

    // Función para formatear fechas de forma segura
    const formatDateSafe = (date: Date | string | null | undefined): string => {
        if (!date) return '-';

        try {
            const dateObj = date instanceof Date ? date : new Date(date);

            if (isNaN(dateObj.getTime())) return '-';
            
            return dateObj.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return '-';
        }
    };

    // Función para formatear el tipo de pago
    const formatPaymentType = (paymentType: string): string => {
        switch (paymentType) {
            case 'advance':
                return 'Anticipado';
            case 'arrears':
                return 'Vencido';
            default:
                return paymentType;
        }
    };

    // Función para formatear la frecuencia
    const formatFrequency = (frequency: string): string => {
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

    // Función para manejar el ordenamiento
    const handleRequestSort = (property: OrderBy) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Función para ordenar datos
    const sortedSubscriptions = useMemo(() => {
        return [...safeSubscriptions].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (orderBy) {
                case 'client':
                    aValue = a.clientInfo ? `${a.clientInfo.firstName} ${a.clientInfo.lastName}` : '';
                    bValue = b.clientInfo ? `${b.clientInfo.firstName} ${b.clientInfo.lastName}` : '';
                    break;
                case 'service':
                    aValue = a.serviceInfo?.name || '';
                    bValue = b.serviceInfo?.name || '';
                    break;
                case 'frequency':
                    aValue = a.serviceInfo?.frequency || '';
                    bValue = b.serviceInfo?.frequency || '';
                    break;
                case 'paymentDate':
                    aValue = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
                    bValue = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
                    break;
                case 'paymentType':
                    aValue = a.paymentType || '';
                    bValue = b.paymentType || '';
                    break;
                case 'status':
                    aValue = getSubscriptionStatus(a);
                    bValue = getSubscriptionStatus(b);
                    break;
                case 'finalPrice':
                    aValue = a.serviceInfo?.finalPrice || a.serviceInfo?.basePrice || 0;
                    bValue = b.serviceInfo?.finalPrice || b.serviceInfo?.basePrice || 0;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) {
                return order === 'asc' ? -1 : 1;
            }

            if (aValue > bValue) {
                return order === 'asc' ? 1 : -1;
            }

            return 0;
        });
    }, [safeSubscriptions, order, orderBy]);

    // Lógica para determinar qué acciones mostrar según el estado
    const getActions = (subscription: SubscriptionWithRelations) => {
        const status = getSubscriptionStatus(subscription);
        
        return {
            canEdit: status === 'active' || status === 'ending',
            canCancel: status === 'active' || status === 'ending',
            canDelete: status === 'expired'
        };
    };

    // Paginación de datos
    const paginatedSubscriptions = sortedSubscriptions.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    if (loading && safeSubscriptions.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            {/* Alerta informativa */}
            {safeSubscriptions.some(sub => !sub.paymentDate) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <WarningIcon sx={{ mr: 1 }} />
                    Algunas suscripciones no tienen fecha de cobro calculada.
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
                            <HeaderTableCell>
                                <TableSortLabel
                                    active={orderBy === 'finalPrice'}
                                    direction={orderBy === 'finalPrice' ? order : 'asc'}
                                    onClick={() => handleRequestSort('finalPrice')}
                                >
                                    Precio Final
                                </TableSortLabel>
                            </HeaderTableCell>
                            {/* Columna de acciones alineada a la derecha */}
                            <HeaderTableCell align="right">
                                Acciones
                            </HeaderTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedSubscriptions.length === 0 ? (
                            <TableRow>
                                <CompactTableCell colSpan={8} align="center">
                                    <Typography color="textSecondary">
                                        {loading ? 'Cargando...' : 'No hay suscripciones disponibles'}
                                    </Typography>
                                </CompactTableCell>
                            </TableRow>
                        ) : (
                            paginatedSubscriptions.map((subscription) => {
                                const actions = getActions(subscription);
                                
                                return (
                                    <StyledTableRow key={subscription.id}>
                                        {/* Cliente */}
                                        <CompactTableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {subscription.clientInfo
                                                        ? `${subscription.clientInfo.firstName} ${subscription.clientInfo.lastName}`
                                                        : 'Cliente no encontrado'
                                                    }
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {subscription.clientInfo?.email || ''}
                                                </Typography>
                                            </Box>
                                        </CompactTableCell>

                                        {/* Servicio */}
                                        <CompactTableCell>
                                            <Typography variant="body2">
                                                {subscription.serviceInfo?.name || 'Servicio no encontrado'}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Frecuencia */}
                                        <CompactTableCell>
                                            <Typography variant="body2">
                                                {subscription.serviceInfo?.frequency 
                                                    ? formatFrequency(subscription.serviceInfo.frequency)
                                                    : '-'
                                                }
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Fecha de Cobro */}
                                        <CompactTableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {subscription.paymentDate ? (
                                                    <>
                                                        <CheckCircleIcon color="success" fontSize="small" />
                                                        <Typography variant="body2">
                                                            {formatDateSafe(subscription.paymentDate)}
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ScheduleIcon color="warning" fontSize="small" />
                                                        <Typography variant="body2" color="warning.main">
                                                            Pendiente cálculo
                                                        </Typography>
                                                    </>
                                                )}
                                            </Box>
                                        </CompactTableCell>

                                        {/* Tipo de Pago */}
                                        <CompactTableCell>
                                            <Typography variant="body2">
                                                {formatPaymentType(subscription.paymentType)}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Estado */}
                                        <CompactTableCell>
                                            {getStatusChip(subscription)}
                                        </CompactTableCell>

                                        {/* Precio Final */}
                                        <CompactTableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                €{(subscription.serviceInfo?.finalPrice || subscription.serviceInfo?.basePrice || 0).toFixed(2)}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Acciones - Alineadas a la derecha */}
                                        <CompactTableCell align="right">
                                            <Box display="flex" gap={0.5} justifyContent="flex-end">
                                                {/* Editar - Disponible para activas y finalizando */}
                                                {actions.canEdit && (
                                                    <Tooltip title="Editar suscripción">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => onEdit(subscription)}
                                                            sx={{ color: 'grey.600' }} // Icono gris
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                {/* Cancelar - Disponible para activas y finalizando */}
                                                {actions.canCancel && (
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

                                                {/* Eliminar - Solo para caducadas */}
                                                {actions.canDelete && (
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
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Paginación */}
            <TablePagination
                rowsPerPageOptions={[25, 50, 100]}
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