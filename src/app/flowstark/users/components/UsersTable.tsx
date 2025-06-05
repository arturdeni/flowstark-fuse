// src/app/flowstark/users/components/UsersTable.tsx
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
    Typography,
    Box,
    CircularProgress,
    Chip,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Client } from '../../../../types/models';
import { ClientWithSubscriptions } from '../hooks/useUsers';

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
type OrderBy = 'name' | 'email' | 'phone' | 'paymentMethod' | 'registeredDate' | 'subscriptions';

interface UsersTableProps {
    users: ClientWithSubscriptions[];
    loading: boolean;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (user: ClientWithSubscriptions) => void;
    onDelete: (id: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
    users,
    loading,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    onEdit,
    onDelete,
}) => {
    // Estado para el ordenamiento
    const [order, setOrder] = useState<Order>('asc');
    const [orderBy, setOrderBy] = useState<OrderBy>('name');

    // Función para determinar si es empresa o particular
    const getClientType = (client: ClientWithSubscriptions): 'empresa' | 'particular' => {
        return (client.fiscalName || client.taxId) ? 'empresa' : 'particular';
    };

    // Función para obtener el nombre a mostrar
    const getDisplayName = (client: ClientWithSubscriptions): string => {
        const clientType = getClientType(client);

        if (clientType === 'empresa') {
            return client.firstName || '';
        } else {
            return `${client.firstName || ''} ${client.lastName || ''}`.trim();
        }
    };

    // Función para obtener el método de pago formateado
    const getPaymentMethodText = (paymentMethod: { type: string; details: Record<string, any> } | undefined): string => {
        if (!paymentMethod || !paymentMethod.type) return '-';

        switch (paymentMethod.type) {
            case 'card':
                return 'Tarjeta';
            case 'transfer':
                return 'Transfer.';
            case 'cash':
                return 'Efectivo';
            case 'direct_debit':
                return 'Domicil.';
            default:
                return paymentMethod.type;
        }
    };

    // Función para formatear la fecha
    const formatDate = (date: Date | undefined): string => {
        if (!date) return '-';

        try {
            return new Date(date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
            });
        } catch (error) {
            return '-';
        }
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
    const getOrderValue = (user: ClientWithSubscriptions, orderBy: OrderBy): string | number | Date => {
        switch (orderBy) {
            case 'name':
                return getDisplayName(user).toLowerCase();
            case 'email':
                return (user.email || '').toLowerCase();
            case 'phone':
                return user.phone || '';
            case 'paymentMethod':
                return getPaymentMethodText(user.paymentMethod).toLowerCase();
            case 'registeredDate':
                return user.registeredDate ? new Date(user.registeredDate) : new Date(0);
            case 'subscriptions':
                return user.subscriptionCount;
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

    // Ordenar los usuarios
    const sortedUsers = useMemo(() => {
        const comparator = getComparator(order, orderBy);
        const usersWithOrderValue = users.map(user => ({
            ...user,
            orderValue: getOrderValue(user, orderBy)
        }));

        return usersWithOrderValue.sort((a, b) => comparator(
            { [orderBy]: a.orderValue },
            { [orderBy]: b.orderValue }
        ));
    }, [users, order, orderBy]);

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

    if (loading && users.length === 0) {
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
                aria-label="tabla de clientes"
                sx={{
                    tableLayout: 'fixed',
                    width: '100%'
                }}
            >
                <TableHead>
                    <TableRow>
                        <SortableTableHead id="name" label="Nombre" width="130px" />
                        <SortableTableHead id="email" label="Email" width="160px" />
                        <SortableTableHead id="phone" label="Teléfono" width="130px" />
                        <SortableTableHead id="paymentMethod" label="Pago" width="85px" />
                        <SortableTableHead id="registeredDate" label="Alta" width="70px" />
                        <SortableTableHead id="subscriptions" label="Suscripciones" width="65px" numeric />
                        <HeaderTableCell sx={{ width: '120px', textAlign: 'right' }}>Acciones</HeaderTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedUsers.length === 0 ? (
                        <TableRow>
                            <CompactTableCell colSpan={7} align="center">
                                No se encontraron clientes
                            </CompactTableCell>
                        </TableRow>
                    ) : (
                        sortedUsers
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((user) => {
                                const clientType = getClientType(user);
                                const displayName = getDisplayName(user);
                                const paymentMethodText = getPaymentMethodText(user.paymentMethod);
                                const registrationDate = formatDate(user.registeredDate);

                                return (
                                    <StyledTableRow key={user.id}>
                                        {/* Nombre con chip de empresa y DNI/CIF */}
                                        <CompactTableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight="medium"
                                                            sx={{
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                lineHeight: 1.2,
                                                                flex: 1
                                                            }}
                                                            title={displayName}
                                                        >
                                                            {displayName}
                                                        </Typography>
                                                        {clientType === 'empresa' && (
                                                            <Chip
                                                                icon={<BusinessIcon />}
                                                                label="Empresa"
                                                                color="primary"
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{
                                                                    fontSize: '0.7rem',
                                                                    height: '20px',
                                                                    '& .MuiChip-icon': {
                                                                        fontSize: '0.8rem'
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                    {/* DNI/CIF */}
                                                    {clientType === 'particular' && user.idNumber && (
                                                        <Typography
                                                            variant="caption"
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: '0.7rem',
                                                                lineHeight: 1
                                                            }}
                                                        >
                                                            DNI: {user.idNumber}
                                                        </Typography>
                                                    )}
                                                    {clientType === 'empresa' && user.taxId && (
                                                        <Typography
                                                            variant="caption"
                                                            color="textSecondary"
                                                            sx={{
                                                                fontSize: '0.7rem',
                                                                lineHeight: 1
                                                            }}
                                                        >
                                                            CIF: {user.taxId}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </CompactTableCell>

                                        {/* Email */}
                                        <CompactTableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title={user.email}
                                            >
                                                {user.email || '-'}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Teléfono */}
                                        <CompactTableCell>
                                            <Typography variant="body2">
                                                {user.phone || '-'}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Método de pago */}
                                        <CompactTableCell>
                                            <Chip
                                                label={paymentMethodText}
                                                size="small"
                                                variant="outlined"
                                                color="default"
                                                sx={{ fontSize: '0.7rem' }}
                                            />
                                        </CompactTableCell>

                                        {/* Fecha de alta */}
                                        <CompactTableCell>
                                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                                                {registrationDate}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Suscripciones activas */}
                                        <CompactTableCell align="center">
                                            <Chip
                                                label={user.subscriptionCount}
                                                size="small"
                                                variant="outlined"
                                                color="default"
                                                sx={{
                                                    minWidth: '28px',
                                                    fontSize: '0.7rem'
                                                }}
                                            />
                                        </CompactTableCell>

                                        {/* Acciones */}
                                        <CompactTableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onEdit(user)}
                                                    disabled={loading}
                                                    title="Editar"
                                                    sx={{ padding: '4px' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => user.id && onDelete(user.id)}
                                                    disabled={loading || user.subscriptionCount > 0}
                                                    title="Eliminar"
                                                    sx={{ padding: '4px' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    title="Más opciones"
                                                    sx={{ padding: '4px' }}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </CompactTableCell>
                                    </StyledTableRow>
                                );
                            })
                    )}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={users.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} de ${count}`
                }
            />
        </TableContainer>
    );
};