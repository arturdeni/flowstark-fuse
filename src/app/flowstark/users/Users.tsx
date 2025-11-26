// src/app/flowstark/users/Users.tsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';

import { useUsers } from './hooks/useUsers';
import { Client } from '../../../types/models';
import {
  UserSearchAndActions,
  UsersTable,
  UserForm,
  DeleteConfirmDialog,
} from './components';

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider,
  },
  '& .FusePageSimple-content': {},
  '& .FusePageSimple-sidebarHeader': {},
  '& .FusePageSimple-sidebarContent': {},
}));

function Users() {
  // Estado local para UI
  const [selectedUser, setSelectedUser] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Hook personalizado con toda la lógica de usuarios
  const {
    filteredUsers,
    searchTerm,
    loading,
    snackbar,
    setSearchTerm,
    refreshData,
    createUser,
    updateUser,
    deleteUser,
    closeSnackbar,
  } = useUsers();

  // Manejadores de eventos de UI
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenForm = (user: Client | null = null) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete);
      } finally {
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  return (
    <Root
      header={
        <Box className="p-6">
          <Typography variant="h4" component="h1" className="font-medium tracking-tight">
            Clientes
          </Typography>
        </Box>
      }
      content={
        <Box className="p-6">
          {/* Barra de búsqueda y acciones */}
          <UserSearchAndActions
            searchTerm={searchTerm}
            loading={loading}
            onSearchChange={handleSearchChange}
            onAddNew={() => handleOpenForm()}
            onRefresh={refreshData}
          />

          {/* Tabla de usuarios */}
          <UsersTable
            users={filteredUsers}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            onEdit={handleOpenForm}
            onDelete={handleDeleteClick}
          />

          {/* Formulario para añadir/editar usuario */}
          <UserForm
            open={formOpen}
            selectedUser={selectedUser}
            loading={loading}
            onClose={handleCloseForm}
            onSave={createUser}
            onUpdate={updateUser}
          />

          {/* Diálogo de confirmación para eliminar */}
          <DeleteConfirmDialog
            open={deleteConfirmOpen}
            loading={loading}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />

          {/* Snackbar para notificaciones */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={closeSnackbar}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
          >
            <Alert
              onClose={closeSnackbar}
              severity={snackbar.severity}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      }
    />
  );
}

export default Users;