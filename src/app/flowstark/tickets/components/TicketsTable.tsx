// src/app/flowstark/tickets/components/TicketsTable.tsx
import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Box,
    IconButton,
    Chip,
    Typography,
    CircularProgress,
    TableSortLabel,
    Tooltip,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Payment as PaymentIcon,
    Schedule as ScheduleIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { TicketWithRelations } from '../../../../types/models';

// Componentes estilizados
const HeaderTableCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: theme.palette.grey[50],
    fontWeight: 600,
    fontSize: '0.875rem',
    color: theme.palette.text.primary,
    padding: theme.spacing(1.5),
    borderBottom: `2px solid ${theme.palette.divider}`,
}));

const CompactTableCell = styled(TableCell)(({ theme }) => ({
    padding: theme.spacing(1, 1.5),
    fontSize: '0.875rem',
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StatusChip = styled(Chip)<{ status: 'paid' | 'pending' }>(({ theme, status }) => ({
    fontSize: '0.75rem',
    height: 24,
    fontWeight: 500,
    ...(status === 'paid' && {
        backgroundColor: '#E8F5E9',
        color: '#2C645E',
    }),
    ...(status === 'pending' && {
        backgroundColor: '#FFF3E0',
        color: '#E65100',
    }),
}));

// Tipos para ordenamiento
type Order = 'asc' | 'desc';
type OrderBy = 'dueDate' | 'amount' | 'status' | 'client' | 'service';

interface TicketsTableProps {
    tickets: TicketWithRelations[];
    loading: boolean;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (ticket: TicketWithRelations) => void;
    onDelete: (ticketId: string) => void;
    onViewDetail: (ticket: TicketWithRelations) => void;
    onMarkAsPaid: (ticketId: string) => void;
    onMarkAsPending: (ticketId: string) => void;
}

export const TicketsTable: React.FC<TicketsTableProps> = ({
    tickets,
    loading,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    onEdit,
    onDelete,
    onViewDetail,
    onMarkAsPaid,
    onMarkAsPending,
}) => {
    const [order, setOrder] = useState<Order>('desc');
    const [orderBy, setOrderBy] = useState<OrderBy>('dueDate');

    // Función para manejar el ordenamiento
    const handleRequestSort = (property: OrderBy) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Función para formatear fechas
    const formatDate = (date: Date | undefined) => {
        if (!date) return 'N/A';

        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    };

    // Función para formatear moneda
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(amount);
    };

    // Función para obtener el nombre completo del cliente
    const getClientName = (ticket: TicketWithRelations) => {
        if (!ticket.clientInfo) return 'Cliente no encontrado';

        return `${ticket.clientInfo.firstName} ${ticket.clientInfo.lastName}`;
    };

    // Función para obtener el nombre del servicio
    const getServiceName = (ticket: TicketWithRelations) => {
        return ticket.serviceInfo?.name || 'Servicio no encontrado';
    };

    // Función para obtener el texto del método de pago
    const getPaymentMethodText = (paymentMethod?: string): string => {
        if (!paymentMethod) return '-';

        const paymentMethods: Record<string, string> = {
            card: 'Tarjeta',
            transfer: 'Transferencia',
            cash: 'Efectivo',
            direct_debit: 'Domiciliación',
        };

        return paymentMethods[paymentMethod] || paymentMethod;
    };

    // Función para determinar si una fecha está vencida
    const isOverdue = (dueDate: Date, status: string) => {
        return status === 'pending' && new Date() > dueDate;
    };

    // Ordenar tickets
    const sortedTickets = React.useMemo(() => {
        return [...tickets].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (orderBy) {
                case 'dueDate':
                    aValue = a.dueDate ? a.dueDate.getTime() : 0;
                    bValue = b.dueDate ? b.dueDate.getTime() : 0;
                    break;
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'client':
                    aValue = getClientName(a);
                    bValue = getClientName(b);
                    break;
                case 'service':
                    aValue = getServiceName(a);
                    bValue = getServiceName(b);
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
    }, [tickets, order, orderBy]);

    // Paginación de datos
    const paginatedTickets = sortedTickets.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    if (loading && tickets.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small" aria-label="tabla de tickets">
                    <TableHead>
                        <TableRow>
                            <HeaderTableCell>
                                <TableSortLabel
                                    active={orderBy === 'dueDate'}
                                    direction={orderBy === 'dueDate' ? order : 'asc'}
                                    onClick={() => handleRequestSort('dueDate')}
                                >
                                    Fecha de Vencimiento
                                </TableSortLabel>
                            </HeaderTableCell>
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
                                    active={orderBy === 'amount'}
                                    direction={orderBy === 'amount' ? order : 'asc'}
                                    onClick={() => handleRequestSort('amount')}
                                >
                                    Precio
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
                            <HeaderTableCell>Tipo</HeaderTableCell>
                            <HeaderTableCell align="right">Acciones</HeaderTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedTickets.length === 0 ? (
                            <TableRow>
                                <CompactTableCell colSpan={7} align="center">
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                        No se encontraron tickets
                                    </Typography>
                                </CompactTableCell>
                            </TableRow>
                        ) : (
                            paginatedTickets.map((ticket) => {
                                const clientName = getClientName(ticket);
                                const serviceName = getServiceName(ticket);
                                const overdue = isOverdue(ticket.dueDate, ticket.status);

                                return (
                                    <TableRow
                                        key={ticket.id}
                                        hover
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            },
                                            ...(overdue && {
                                                backgroundColor: 'error.light',
                                                '&:hover': {
                                                    backgroundColor: 'error.main',
                                                },
                                            }),
                                        }}
                                    >
                                        {/* Fecha de Vencimiento */}
                                        <CompactTableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {formatDate(ticket.dueDate)}
                                                </Typography>
                                                {overdue && (
                                                    <Typography variant="caption" color="error">
                                                        Vencido
                                                    </Typography>
                                                )}
                                            </Box>
                                        </CompactTableCell>

                                        {/* Cliente */}
                                        <CompactTableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {clientName}
                                            </Typography>
                                            {ticket.clientInfo && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {ticket.clientInfo.email}
                                                </Typography>
                                            )}
                                        </CompactTableCell>

                                        {/* Servicio */}
                                        <CompactTableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {serviceName}
                                            </Typography>
                                            {ticket.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {ticket.description}
                                                </Typography>
                                            )}
                                        </CompactTableCell>

                                        {/* Precio */}
                                        <CompactTableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {formatCurrency(ticket.amount)}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Estado */}
                                        <CompactTableCell>
                                            <StatusChip
                                                label={ticket.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                                status={ticket.status}
                                                size="small"
                                            />
                                            {ticket.paidDate && ticket.status === 'paid' && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Pagado: {formatDate(ticket.paidDate)}
                                                </Typography>
                                            )}
                                        </CompactTableCell>

                                        {/* Tipo */}
                                        <CompactTableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {getPaymentMethodText(ticket.paymentMethod)}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Acciones */}
                                        <CompactTableCell align="right">
                                            <Box display="flex" gap={0.5} justifyContent="flex-end">
                                                {/* Botón Ver Detalle */}
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onViewDetail(ticket);
                                                    }}
                                                    title="Ver detalle"
                                                    sx={{
                                                        color: 'grey.600',
                                                        '&:hover': {
                                                            backgroundColor: 'action.hover',
                                                            color: 'grey.700'
                                                        }
                                                    }}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>

                                                {/* Botón cambiar estado */}
                                                {ticket.status === 'pending' ? (
                                                    <Tooltip title="Marcar como pagado">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onMarkAsPaid(ticket.id!);
                                                            }}
                                                            sx={{
                                                                color: 'success.main',
                                                                '&:hover': {
                                                                    backgroundColor: 'success.light',
                                                                }
                                                            }}
                                                        >
                                                            <PaymentIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip title="Marcar como pendiente">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onMarkAsPending(ticket.id!);
                                                            }}
                                                            sx={{
                                                                color: 'warning.main',
                                                                '&:hover': {
                                                                    backgroundColor: 'warning.light',
                                                                }
                                                            }}
                                                        >
                                                            <ScheduleIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}

                                                {/* Botón Editar */}
                                                <Tooltip title="Editar ticket">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(ticket);
                                                        }}
                                                        sx={{
                                                            color: 'primary.main',
                                                            '&:hover': {
                                                                backgroundColor: 'primary.light',
                                                            }
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                {/* Botón Eliminar */}
                                                <Tooltip title="Eliminar ticket">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(ticket.id!);
                                                        }}
                                                        sx={{
                                                            color: 'error.main',
                                                            '&:hover': {
                                                                backgroundColor: 'error.light',
                                                            }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </CompactTableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Paginación */}
            <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={sortedTickets.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
                sx={{
                    borderTop: 1,
                    borderColor: 'divider',
                    backgroundColor: 'grey.50',
                }}
            />
        </>
    );
};