// src/app/flowstark/services/Services.tsx
import React, { useState } from 'react';
import { Box, Snackbar, Alert, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { useServices } from './hooks/useServices';
import { Service } from '../../../types/models';
import {
  ServicesTable,
  ServiceForm,
  SearchAndActions,
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

const Services: React.FC = () => {
  // Estado local para UI
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const {
    // Estados
    filteredServices,
    searchTerm,
    loading,
    snackbar,

    // Funciones de datos
    refreshData,
    createService,
    updateService,
    deleteService,

    // Handlers
    handleSearchChange,
    handleChangePage,
    handleChangeRowsPerPage,

    // Snackbar
    closeSnackbar,
  } = useServices();

  // Manejadores de eventos de UI
  const handleOpenForm = (service: Service | null = null) => {
    setSelectedService(service);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedService(null);
  };

  const handleDeleteClick = (id: string) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (serviceToDelete) {
      try {
        await deleteService(serviceToDelete);
      } finally {
        setDeleteConfirmOpen(false);
        setServiceToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setServiceToDelete(null);
  };

  return (
    <Root
      header={
        <Box className="p-6">
          <Typography variant="h4" component="h1" gutterBottom>
            Servicios
          </Typography>
        </Box>
      }
      content={
        <Box className="p-6">
          {/* Barra de búsqueda y acciones */}
          <SearchAndActions
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onAddNew={() => handleOpenForm()}
            onRefresh={refreshData}
            loading={loading}
          />

          {/* Tabla de servicios */}
          <ServicesTable
            services={filteredServices}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            onEdit={handleOpenForm}
            onDelete={handleDeleteClick}
          />

          {/* Formulario para añadir/editar servicio */}
          <ServiceForm
            open={formOpen}
            selectedService={selectedService}
            loading={loading}
            onClose={handleCloseForm}
            onSave={createService}
            onUpdate={updateService}
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
};

export default Services;