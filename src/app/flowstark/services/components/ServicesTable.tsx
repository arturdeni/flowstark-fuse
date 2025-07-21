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
    Visibility as VisibilityIcon,
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
    onViewDetail: (service: Service) => void; // Nueva prop
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
    onViewDetail, // Nueva prop
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
        return typeof price === 'number' ?
            `${price.toFixed(2)}€` :
            'No definido';
    };

    const formatPercentage = (percentage: number | undefined): string => {
        return typeof percentage === 'number' ?
            `${percentage.toFixed(2)}%` :
            'No definido';
    };

    // Función para manejar el ordenamiento
    const handleRequestSort = (property: OrderBy) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Función auxiliar para obtener valores comparables
    const getOrderValue = (service: Service, orderBy: OrderBy): any => {
        switch (orderBy) {
            case 'name':
                return service.name?.toLowerCase() || '';
            case 'description':
                return service.description?.toLowerCase() || '';
            case 'basePrice':
                return service.basePrice || 0;
            case 'vat':
                return service.vat || 0;
            case 'retention':
                return service.retention || 0;
            case 'finalPrice':
                return service.finalPrice || 0;
            case 'frequency':
                return service.frequency || '';
            case 'activeSubscriptions':
                return (service as any).activeSubscriptions || 0;
            default:
                return '';
        }
    };

    // Función de comparación
    const getComparator = (order: Order, orderBy: OrderBy) => {
        return order === 'desc'
            ? (a: Record<string, any>, b: Record<string, any>) => descendingComparator(a, b, orderBy)
            : (a: Record<string, any>, b: Record<string, any>) => -descendingComparator(a, b, orderBy);
    };

    const descendingComparator = (a: Record<string, any>, b: Record<string, any>, orderBy: string) => {
        if (b[orderBy] < a[orderBy]) {
            return -1;
        }

        if (b[orderBy] > a[orderBy]) {
            return 1;
        }

        return 0;
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
            >
                {label}
            </TableSortLabel>
        </HeaderTableCell>
    );

    // Paginación
    const paginatedServices = sortedServices.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 1 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <SortableTableHead id="name" label="Nombre" width="20%" />
                        <SortableTableHead id="description" label="Descripción" width="25%" />
                        <SortableTableHead id="basePrice" label="Precio Base" numeric width="12%" />
                        <SortableTableHead id="vat" label="IVA" numeric width="8%" />
                        <SortableTableHead id="retention" label="Retención" numeric width="10%" />
                        <SortableTableHead id="finalPrice" label="Precio Final" numeric width="12%" />
                        <SortableTableHead id="frequency" label="Frecuencia" width="10%" />
                        <HeaderTableCell align="center" sx={{ width: '8%' }}>
                            Suscr.
                        </HeaderTableCell>
                        <HeaderTableCell align="right" sx={{ width: '15%' }}>
                            Acciones
                        </HeaderTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedServices.length === 0 ? (
                        <TableRow>
                            <CompactTableCell colSpan={9} align="center">
                                <Typography color="textSecondary">
                                    No hay servicios disponibles
                                </Typography>
                            </CompactTableCell>
                        </TableRow>
                    ) : (
                        paginatedServices.map((service) => (
                            <StyledTableRow key={service.id}>
                                {/* Nombre */}
                                <CompactTableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                        {service.name}
                                    </Typography>
                                </CompactTableCell>

                                {/* Descripción */}
                                <CompactTableCell>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            maxWidth: '200px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title={service.description || 'Sin descripción'}
                                    >
                                        {service.description || 'Sin descripción'}
                                    </Typography>
                                </CompactTableCell>

                                {/* Precio Base */}
                                <CompactTableCell align="right">
                                    <Typography variant="body2">
                                        {formatPrice(service.basePrice)}
                                    </Typography>
                                </CompactTableCell>

                                {/* IVA */}
                                <CompactTableCell align="right">
                                    <Typography variant="body2">
                                        {formatPercentage(service.vat)}
                                    </Typography>
                                </CompactTableCell>

                                {/* Retención */}
                                <CompactTableCell align="right">
                                    <Typography variant="body2">
                                        {formatPercentage(service.retention)}
                                    </Typography>
                                </CompactTableCell>

                                {/* Precio Final */}
                                <CompactTableCell align="right">
                                    <Typography variant="body2" fontWeight={500} color="primary.main">
                                        {formatPrice(service.finalPrice)}
                                    </Typography>
                                </CompactTableCell>

                                {/* Frecuencia */}
                                <CompactTableCell>
                                    <Typography variant="body2">
                                        {getFrequencyText(service.frequency)}
                                    </Typography>
                                </CompactTableCell>

                                {/* Suscripciones Activas */}
                                <CompactTableCell align="center">
                                    <Chip
                                        label={(service as any).activeSubscriptions || 0}
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
                                        {/* Botón Ver Detalle - NUEVO */}
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewDetail(service);
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

                                        {/* Botón Editar */}
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(service);
                                            }}
                                            title="Editar"
                                            sx={{
                                                color: 'text.secondary',
                                                '&:hover': { backgroundColor: 'action.hover' }
                                            }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>

                                        {/* Botón Eliminar */}
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(service.id!);
                                            }}
                                            title="Eliminar"
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