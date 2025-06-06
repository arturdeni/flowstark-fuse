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
type OrderBy = 'name' | 'description' | 'basePrice' | 'vat' | 'frequency' | 'renovation' | 'activeSubscriptions';

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

    const getRenovationText = (renovation: string) => {
        switch (renovation) {
            case 'first_day':
                return 'Primer día';
            case 'last_day':
                return 'Último día';
            default:
                return renovation;
        }
    };

    const formatPrice = (price: number | undefined): string => {
        return typeof price === 'number' ? price.toFixed(2) : '0.00';
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
            case 'frequency':
                return getFrequencyText(service.frequency).toLowerCase();
            case 'renovation':
                return getRenovationText(service.renovation).toLowerCase();
            case 'activeSubscriptions':
                return service.activeSubscriptions || 0;
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
                        <SortableTableHead id="description" label="Descripción" width="180px" />
                        <SortableTableHead id="basePrice" label="Precio" width="90px" numeric />
                        <SortableTableHead id="vat" label="IVA" width="60px" numeric />
                        <SortableTableHead id="frequency" label="Frecuencia" width="100px" />
                        <SortableTableHead id="renovation" label="Renovación" width="100px" />
                        <SortableTableHead id="activeSubscriptions" label="Suscripciones" width="100px" numeric />
                        <HeaderTableCell sx={{ width: '120px', textAlign: 'right' }}>Acciones</HeaderTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedServices.length === 0 ? (
                        <TableRow>
                            <CompactTableCell colSpan={8} align="center">
                                No se encontraron servicios
                            </CompactTableCell>
                        </TableRow>
                    ) : (
                        sortedServices
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((service) => (
                                <StyledTableRow key={service.id}>
                                    {/* Nombre */}
                                    <CompactTableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight="medium"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                lineHeight: 1.2
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
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                            title={service.description}
                                        >
                                            {service.description}
                                        </Typography>
                                    </CompactTableCell>

                                    {/* Precio */}
                                    <CompactTableCell align="right">
                                        <Typography variant="body2" fontWeight="medium">
                                            {formatPrice(service.basePrice)} €
                                        </Typography>
                                    </CompactTableCell>

                                    {/* IVA */}
                                    <CompactTableCell align="right">
                                        <Typography variant="body2">
                                            {service.vat}%
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

                                    {/* Renovación */}
                                    <CompactTableCell>
                                        <Chip
                                            label={getRenovationText(service.renovation)}
                                            size="small"
                                            variant="outlined"
                                            color="default"
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    </CompactTableCell>

                                    {/* Suscripciones activas */}
                                    <CompactTableCell align="center">
                                        <Chip
                                            label={service.activeSubscriptions || 0}
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
                                                onClick={() => onEdit(service)}
                                                disabled={loading}
                                                title="Editar"
                                                sx={{ padding: '4px' }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => service.id && onDelete(service.id)}
                                                disabled={loading || (service.activeSubscriptions && service.activeSubscriptions > 0)}
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
                            ))
                    )}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={services.length}
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