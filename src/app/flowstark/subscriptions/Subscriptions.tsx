// src/app/flowstark/subscriptions/Subscriptions.tsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';

import { useSubscriptions, SubscriptionWithRelations } from './hooks/useSubscriptions';
import {
  SubscriptionSummaryCards,
  SubscriptionSearchAndActions,
  SubscriptionsTable,
  SubscriptionForm,
  DeleteConfirmDialog,
  CancelSubscriptionDialog,
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

function Subscriptions() {
  // Estado local para UI
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithRelations | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<SubscriptionWithRelations | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Hook personalizado con toda la lógica de suscripciones
  const {
    subscriptions,
    filteredSubscriptions,
    clients,
    services,
    searchTerm,
    statusFilter,
    loading,
    snackbar,
    setSearchTerm,
    setStatusFilter,
    refreshData,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    changeSubscriptionStatus,
    closeSnackbar,
  } = useSubscriptions();

  // Manejadores de eventos de UI
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value as string);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenForm = (subscription: SubscriptionWithRelations | null = null) => {
    setSelectedSubscription(subscription);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedSubscription(null);
  };

  // Manejador para cancelar suscripciones
  const handleCancelClick = (subscription: SubscriptionWithRelations) => {
    setSubscriptionToCancel(subscription);
    setCancelConfirmOpen(true);
  };

  // Confirmar cancelación con fecha de finalización
  const handleConfirmCancel = async (endDate: Date) => {
    if (subscriptionToCancel) {
      try {
        await changeSubscriptionStatus(subscriptionToCancel.id!, 'cancelled', endDate);
      } finally {
        setCancelConfirmOpen(false);
        setSubscriptionToCancel(null);
      }
    }
  };

  // Cancelar el diálogo de cancelación
  const handleCancelCancel = () => {
    setCancelConfirmOpen(false);
    setSubscriptionToCancel(null);
  };

  const handleDeleteClick = (id: string) => {
    setSubscriptionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (subscriptionToDelete) {
      try {
        await deleteSubscription(subscriptionToDelete);
      } finally {
        setDeleteConfirmOpen(false);
        setSubscriptionToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSubscriptionToDelete(null);
  };

  return (
    <Root
      header={
        <Box className="p-6">
          <Typography variant="h4" component="h1" gutterBottom>
            Suscripciones
          </Typography>
        </Box>
      }
      content={
        <Box className="p-6">
          {/* Tarjetas de resumen */}
          <SubscriptionSummaryCards subscriptions={subscriptions} />

          {/* Barra de búsqueda, filtro y acciones */}
          <SubscriptionSearchAndActions
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            loading={loading}
            onSearchChange={handleSearchChange}
            onStatusFilterChange={handleStatusFilterChange}
            onAddNew={() => handleOpenForm()}
            onRefresh={refreshData}
          />

          {/* Tabla de suscripciones */}
          <SubscriptionsTable
            subscriptions={filteredSubscriptions}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            onEdit={handleOpenForm}
            onCancel={handleCancelClick} // 👈 Nuevo manejador
            onDelete={handleDeleteClick}
          />

          {/* Formulario para añadir/editar suscripción */}
          <SubscriptionForm
            open={formOpen}
            selectedSubscription={selectedSubscription}
            clients={clients}
            services={services}
            loading={loading}
            onClose={handleCloseForm}
            onSave={createSubscription}
            onUpdate={updateSubscription}
          />

          {/* Diálogo de confirmación para eliminar */}
          <DeleteConfirmDialog
            open={deleteConfirmOpen}
            loading={loading}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />

          {/* Diálogo de confirmación para cancelar suscripciones */}
          <CancelSubscriptionDialog
            open={cancelConfirmOpen}
            loading={loading}
            subscriptionName={subscriptionToCancel?.serviceInfo?.name}
            onConfirm={handleConfirmCancel}
            onCancel={handleCancelCancel}
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
}

export default Subscriptions;