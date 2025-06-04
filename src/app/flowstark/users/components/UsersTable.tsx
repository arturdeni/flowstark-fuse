// src/app/flowstark/users/components/UsersTable.tsx
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
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Client } from '../../../../types/models';

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

interface UsersTableProps {
    users: Client[];
    loading: boolean;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onEdit: (user: Client) => void;
    onDelete: (id: string) => void;
    getSubscriptionCount: (client: Client) => number;
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
    getSubscriptionCount,
}) => {
    if (loading && users.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de clientes">
                <TableHead>
                    <TableRow>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Teléfono</TableCell>
                        <TableCell>Ciudad</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Subscripciones</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} align="center">
                                No se encontraron clientes
                            </TableCell>
                        </TableRow>
                    ) : (
                        users
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((user) => (
                                <StyledTableRow key={user.id}>
                                    <TableCell component="th" scope="row">
                                        {user.firstName} {user.lastName}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phone}</TableCell>
                                    <TableCell>{user.city}</TableCell>
                                    <TableCell>
                                        {user.active !== false ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CheckCircleIcon
                                                    color="success"
                                                    fontSize="small"
                                                    sx={{ mr: 0.5 }}
                                                />
                                                <Typography variant="body2">Activo</Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <CancelIcon
                                                    color="error"
                                                    fontSize="small"
                                                    sx={{ mr: 0.5 }}
                                                />
                                                <Typography variant="body2">Inactivo</Typography>
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell>{getSubscriptionCount(user)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => onEdit(user)}
                                            disabled={loading}
                                            title="Editar"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => user.id && onDelete(user.id)}
                                            disabled={loading || getSubscriptionCount(user) > 0}
                                            title="Eliminar"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" title="Más opciones">
                                            <MoreVertIcon fontSize="small" />
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