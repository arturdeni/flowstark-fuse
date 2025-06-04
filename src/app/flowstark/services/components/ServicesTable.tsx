// src/app/flowstark/services/components/ServicesTable.tsx
import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
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
    Check as CheckIcon,
    Close as CloseIcon,
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

interface ServicesTableProps {
    services: Service[];
    loading: boolean;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (service: Service) => void;
    onToggleActive: (id: string) => void;
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
    onToggleActive,
    onDelete,
}) => {
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

    if (loading && services.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de servicios">
                <TableHead>
                    <TableRow>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Precio</TableCell>
                        <TableCell>IVA</TableCell>
                        <TableCell>Facturación</TableCell>
                        <TableCell>Categoría</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Subscripciones</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {services.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} align="center">
                                No se encontraron servicios
                            </TableCell>
                        </TableRow>
                    ) : (
                        services
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((service) => (
                                <StyledTableRow key={service.id}>
                                    <TableCell component="th" scope="row">
                                        {service.name}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{
                                            maxWidth: 200,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {service.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{formatPrice(service.basePrice)} €</TableCell>
                                    <TableCell>{service.vat}%</TableCell>
                                    <TableCell>
                                        {getFrequencyText(service.frequency)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={service.category} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        {service.active !== false ? (
                                            <Chip
                                                icon={<CheckIcon />}
                                                label="Activo"
                                                color="success"
                                                size="small"
                                                variant="outlined"
                                            />
                                        ) : (
                                            <Chip
                                                icon={<CloseIcon />}
                                                label="Inactivo"
                                                color="error"
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>{service.activeSubscriptions || 0}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => onEdit(service)}
                                            disabled={loading}
                                            title="Editar"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => service.id && onToggleActive(service.id)}
                                            disabled={loading}
                                            title={service.active ? 'Desactivar' : 'Activar'}
                                        >
                                            {service.active ? (
                                                <CloseIcon fontSize="small" />
                                            ) : (
                                                <CheckIcon fontSize="small" />
                                            )}
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => service.id && onDelete(service.id)}
                                            disabled={loading || (service.activeSubscriptions && service.activeSubscriptions > 0)}
                                            title="Eliminar"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
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