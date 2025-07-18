// src/app/flowstark/services/components/ServicesTable.tsx
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
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Service } from '../../../../types/models';

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

// Estilos personalizados para las celdas (mismo estilo que usuarios)
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
type OrderBy = 'name' | 'description' | 'basePrice' | 'vat' | 'retention' | 'finalPrice' | 'frequency' | 'activeSubscriptions';

interface ServicesTableProps {
    services: Service[];
    loading: boolean;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (service: Service) => void;
    onDelete: (id: string) => void;
}

export const ServicesTable: React.FC<ServicesTableProps> = ({
    services,
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

    const getFrequencyText = (frequency: string) => {
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

    const formatPrice = (price: number | undefined): string => {
        return typeof price === 'number' ? price.toFixed(2) : '0.00';
    };

    // Función para calcular el Precio Final
    const calculatePVP = (service: Service): number => {
        const basePrice = service.basePrice || 0;
        const vat = service.vat || 0;
        const retention = service.retention || 0;

        // Precio con IVA
        const priceWithVat = basePrice * (1 + vat / 100);

        // Precio final con retención (la retención se resta)
        const finalPrice = priceWithVat * (1 - retention / 100);

        return finalPrice;
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
    ): ((a: Record<Key, number | string>, b: Record<Key, number | string>) => number) => {
        return order === 'desc'
            ? (a, b) => descendingComparator(a, b, orderBy)
            : (a, b) => -descendingComparator(a, b, orderBy);
    };

    // Función para obtener el valor de ordenamiento
    const getOrderValue = (service: Service, orderBy: OrderBy): string | number => {
        switch (orderBy) {
            case 'name':
                return (service.name || '').toLowerCase();
            case 'description':
                return (service.description || '').toLowerCase();
            case 'basePrice':
                return service.basePrice || 0;
            case 'vat':
                return service.vat || 0;
            case 'retention':
                return service.retention || 0;
            case 'finalPrice':
                return service.finalPrice || calculatePVP(service);
            case 'frequency':
                return getFrequencyText(service.frequency).toLowerCase();
            case 'activeSubscriptions':
                return (service as any).activeSubscriptions || 0;
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

    // Ordenar los servicios
    const sortedServices = useMemo(() => {
        const comparator = getComparator(order, orderBy);
        const servicesWithOrderValue = services.map(service => ({
            ...service,
            orderValue: getOrderValue(service, orderBy)
        }));

        return servicesWithOrderValue.sort((a, b) => comparator(
            { [orderBy]: a.orderValue },
            { [orderBy]: b.orderValue }
        ));
    }, [services, order, orderBy]);

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

    if (loading && services.length === 0) {
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
                aria-label="tabla de servicios"
                sx={{
                    tableLayout: 'fixed',
                    width: '100%'
                }}
            >
                <TableHead>
                    <TableRow>
                        <SortableTableHead id="name" label="Nombre" width="180px" />
                        <SortableTableHead id="description" label="Descripción" width="200px" />
                        <SortableTableHead id="basePrice" label="Precio Base" width="90px" numeric />
                        <SortableTableHead id="vat" label="IVA" width="60px" numeric />
                        <SortableTableHead id="retention" label="Retención" width="80px" numeric />
                        <SortableTableHead id="finalPrice" label="Precio Final" width="90px" numeric />
                        <SortableTableHead id="frequency" label="Frecuencia" width="120px" />
                        <SortableTableHead id="activeSubscriptions" label="Suscripciones" width="100px" numeric />
                        <HeaderTableCell sx={{ width: '120px', textAlign: 'right' }}>Acciones</HeaderTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedServices.length === 0 ? (
                        <TableRow>
                            <CompactTableCell colSpan={9} align="center">
                                <Typography variant="body2" color="textSecondary">
                                    No hay servicios disponibles
                                </Typography>
                            </CompactTableCell>
                        </TableRow>
                    ) : (
                        sortedServices
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((service) => (
                                <StyledTableRow
                                    key={service.id}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    {/* Nombre */}
                                    <CompactTableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight="medium"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={service.name}
                                        >
                                            {service.name}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Descripción */}
                                    <CompactTableCell>
                                        <Typography
                                            variant="body2"
                                            color="textSecondary"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={service.description}
                                        >
                                            {service.description || '-'}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Precio Base */}
                                    <CompactTableCell align="right">
                                        <Typography variant="body2" fontWeight="bold">
                                            {formatPrice(service.finalPrice || calculatePVP(service))} €
                                        </Typography>
                                    </CompactTableCell>

                                    {/* IVA */}
                                    <CompactTableCell align="right">
                                        <Typography variant="body2">
                                            {service.vat || 0}%
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Retención */}
                                    <CompactTableCell align="right">
                                        <Typography variant="body2">
                                            {service.retention || 0}%
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Precio Final */}
                                    <CompactTableCell align="right">
                                        <Typography variant="body2" fontWeight="bold">
                                            {formatPrice(calculatePVP(service))} €
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Frecuencia */}
                                    <CompactTableCell>
                                        <Chip
                                            label={getFrequencyText(service.frequency)}
                                            size="small"
                                            variant="outlined"
                                            color="default"
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    </CompactTableCell>

                                    {/* Suscripciones activas */}
                                    <CompactTableCell align="right">
                                        <Chip
                                            label={(service as any).activeSubscriptions || 0}
                                            size="small"
                                            variant="filled"
                                            color={(service as any).activeSubscriptions > 0 ? 'primary' : 'default'}
                                            sx={{
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                minWidth: '28px',
                                                height: '24px',
                                                borderRadius: '12px',
                                                backgroundColor: (service as any).activeSubscriptions > 0 ? 'primary.main' : 'grey.400',
                                                color: 'white',
                                                '& .MuiChip-label': {
                                                    padding: '0 8px'
                                                }
                                            }}
                                        />
                                    </CompactTableCell>

                                    {/* Acciones */}
                                    <CompactTableCell align="right">
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(service);
                                                }}
                                                sx={{
                                                    color: 'text.secondary',
                                                    '&:hover': { backgroundColor: 'action.hover' }
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(service.id!);
                                                }}
                                                sx={{
                                                    color: 'error.main',
                                                    '&:hover': { backgroundColor: 'action.hover' }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
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
                count={services.length}
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