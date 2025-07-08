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
    Person as PersonIcon,
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
        let aVal: any;
        let bVal: any;

        if (orderBy === 'name') {
            aVal = getDisplayName(a as any).toLowerCase();
            bVal = getDisplayName(b as any).toLowerCase();
        } else if (orderBy === 'paymentMethod') {
            aVal = getPaymentMethodText((a as any).paymentMethod);
            bVal = getPaymentMethodText((b as any).paymentMethod);
        } else if (orderBy === 'subscriptions') {
            aVal = (a as any).subscriptionCount || 0;
            bVal = (b as any).subscriptionCount || 0;
        } else {
            aVal = a[orderBy];
            bVal = b[orderBy];
        }

        if (bVal < aVal) {
            return -1;
        }

        if (bVal > aVal) {
            return 1;
        }

        return 0;
    };

    // Función estable para ordenar
    const stableSort = <T,>(array: readonly T[], comparator: (a: T, b: T) => number) => {
        const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
        stabilizedThis.sort((a, b) => {
            const order = comparator(a[0], b[0]);

            if (order !== 0) {
                return order;
            }

            return a[1] - b[1];
        });
        return stabilizedThis.map((el) => el[0]);
    };

    // Memoización de datos ordenados
    const sortedUsers = useMemo(() => {
        return stableSort(users, getComparator(order, orderBy));
    }, [users, order, orderBy]);

    // Manejar el ordenamiento
    const handleRequestSort = (property: OrderBy) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

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
                                                            whiteSpace: 'nowrap',
                                                            lineHeight: 1.2,
                                                        }}
                                                        title={displayName}
                                                    >
                                                        {displayName}
                                                    </Typography>
                                                    
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
                                            <Typography variant="body2">
                                                {paymentMethodText}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Fecha de registro */}
                                        <CompactTableCell>
                                            <Typography variant="body2">
                                                {registrationDate}
                                            </Typography>
                                        </CompactTableCell>

                                        {/* Número de suscripciones */}
                                        <CompactTableCell align="right">
                                            <Chip
                                                label={user.subscriptionCount || 0}
                                                color={user.subscriptionCount > 0 ? 'primary' : 'default'}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    height: '20px',
                                                    minWidth: '28px'
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