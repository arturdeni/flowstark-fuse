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
    Business as BusinessIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
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

    // Función para obtener el nombre completo
    const getDisplayName = (client: ClientWithSubscriptions): string => {
        const clientType = getClientType(client);
        
        if (clientType === 'empresa') {
            return client.firstName || client.fiscalName || '';
        } else {
            return `${client.firstName || ''} ${client.lastName || ''}`.trim();
        }
    };

    // Función para obtener el texto del método de pago
    const getPaymentMethodText = (paymentMethod: any): string => {
        if (!paymentMethod || !paymentMethod.type) return '-';
        
        const paymentMethods: Record<string, string> = {
            card: 'Tarjeta',
            transfer: 'Transferencia',
            cash: 'Efectivo',
            direct_debit: 'Domiciliación',
        };
        
        return paymentMethods[paymentMethod.type] || paymentMethod.type;
    };

    // Función para formatear fechas
    const formatDate = (date: Date | null | undefined): string => {
        if (!date) return '-';
        
        try {
            return new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }).format(date instanceof Date ? date : new Date(date));
        } catch {
            return '-';
        }
    };

    // Función para comparar valores en el ordenamiento
    const getComparator = <Key extends keyof any>(
        order: Order,
        orderBy: Key,
    ): ((a: Record<Key, number | string | Date>, b: Record<Key, number | string | Date>) => number) => {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    };

    const descendingComparator = <T,>(a: T, b: T, orderBy: keyof T) => {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        }

        if (b[orderBy] > a[orderBy]) {
            return 1;
        }

        return 0;
    };

    // Función para obtener el valor de ordenamiento
    const getOrderValue = (user: ClientWithSubscriptions, orderBy: OrderBy): string | number | Date => {
        switch (orderBy) {
            case 'name':
                return getDisplayName(user).toLowerCase();
            case 'email':
                return (user.email || '').toLowerCase();
            case 'phone':
                return (user.phone || '').toLowerCase();
            case 'paymentMethod':
                return getPaymentMethodText(user.paymentMethod).toLowerCase();
            case 'registeredDate':
                return user.registeredDate || new Date(0);
            case 'subscriptions':
                return user.subscriptionCount || 0;
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

    // Componente para cabeceras ordenables
    const SortableTableHead = ({
        id,
        label,
        numeric = false,
        width
    }: {
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
                        <SortableTableHead id="paymentMethod" label="Cobro" width="85px" />
                        <SortableTableHead id="registeredDate" label="Alta" width="70px" />
                        <SortableTableHead id="subscriptions" label="Suscripciones" width="65px" numeric />
                        <HeaderTableCell sx={{ width: '90px', textAlign: 'right' }}>Acciones</HeaderTableCell>
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
                                        {/* Nombre con icono de tipo de cliente */}
                                        <CompactTableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {/* Icono de tipo de cliente */}
                                                {clientType === 'empresa' ? (
                                                    <BusinessIcon 
                                                        sx={{ 
                                                            fontSize: '1rem', 
                                                            color: 'primary.main',
                                                            flexShrink: 0
                                                        }} 
                                                        title="Empresa"
                                                    />
                                                ) : (
                                                    <PersonIcon 
                                                        sx={{ 
                                                            fontSize: '1rem', 
                                                            color: 'text.secondary',
                                                            flexShrink: 0
                                                        }} 
                                                        title="Particular"
                                                    />
                                                )}
                                                
                                                {/* Información del cliente */}
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight="medium"
                                                        sx={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        title={displayName}
                                                    >
                                                        {displayName}
                                                    </Typography>
                                                    
                                                    {clientType === 'empresa' && user.fiscalName && user.fiscalName !== user.firstName && (
                                                        <Typography
                                                            variant="caption"
                                                            color="textSecondary"
                                                            sx={{
                                                                display: 'block',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                            title={user.fiscalName}
                                                        >
                                                            {user.fiscalName}
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
                                                {user.email}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Teléfono */}
                                        <CompactTableCell>
                                            <Typography variant="body2">
                                                {user.phone || '-'}
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
                                                title={paymentMethodText}
                                            >
                                                {paymentMethodText}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Fecha de registro */}
                                        <CompactTableCell>
                                            <Typography variant="body2">
                                                {registrationDate}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Suscripciones */}
                                        <CompactTableCell align="right">
                                            <Chip
                                                label={user.subscriptionCount || 0}
                                                size="small"
                                                variant="filled"
                                                color={user.subscriptionCount > 0 ? 'primary' : 'default'}
                                                sx={{ 
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    minWidth: '28px',
                                                    height: '24px',
                                                    borderRadius: '12px',
                                                    backgroundColor: user.subscriptionCount > 0 ? 'primary.main' : 'grey.400',
                                                    color: 'white',
                                                    '& .MuiChip-label': {
                                                        padding: '0 8px'
                                                    }
                                                }}
                                            />
                                        </CompactTableCell>

                                        {/* Acciones - Quitado el botón "Más opciones" */}
                                        <CompactTableCell align="right">
                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onEdit(user)}
                                                    title="Editar"
                                                    sx={{ 
                                                        padding: '4px',
                                                        color: 'text.secondary',
                                                        '&:hover': { backgroundColor: 'action.hover' }
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => user.id && onDelete(user.id)}
                                                    disabled={loading || user.subscriptionCount > 0}
                                                    title="Eliminar"
                                                    sx={{ 
                                                        padding: '4px',
                                                        color: 'error.main',
                                                        '&:hover': { backgroundColor: 'action.hover' },
                                                        '&:disabled': { color: 'action.disabled' }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
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
                rowsPerPageOptions={[25, 50, 100]}
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