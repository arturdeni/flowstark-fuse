// src/app/flowstark/subscriptions/Subscriptions.tsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
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
    subscriptions: filteredSubscriptions,
    clients,
    services,
    loading,
    searchTerm,
    statusFilter,
    snackbar,
    setSearchTerm,
    setStatusFilter,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    deleteSubscription,
    refreshData,
    closeSnackbar,
  } = useSubscriptions();

  // Handlers para búsqueda y filtros
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleStatusFilterChange = (status: 'all' | 'active' | 'expired' | 'ending') => {
    setStatusFilter(status);
  };

  // Handlers para paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handlers para formulario
  const handleOpenForm = (subscription: SubscriptionWithRelations | null = null) => {
    setSelectedSubscription(subscription);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedSubscription(null);
  };

  // Handlers para cancelar suscripciones
  const handleCancelClick = (subscription: SubscriptionWithRelations) => {
    setSubscriptionToCancel(subscription);
    setCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async (endDate: Date) => {
    if (subscriptionToCancel && subscriptionToCancel.id) {
      try {
        await cancelSubscription(subscriptionToCancel.id, endDate);
      } finally {
        setCancelConfirmOpen(false);
        setSubscriptionToCancel(null);
      }
    }
  };

  const handleCancelCancel = () => {
    setCancelConfirmOpen(false);
    setSubscriptionToCancel(null);
  };

  // Handlers para eliminar suscripciones
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
          <SubscriptionSummaryCards subscriptions={filteredSubscriptions} />

          {/* Barra de búsqueda, filtros y acciones */}
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
            onCancel={handleCancelClick}
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
            clientName={subscriptionToCancel?.clientInfo ?
              `${subscriptionToCancel.clientInfo.firstName} ${subscriptionToCancel.clientInfo.lastName}` :
              undefined
            }
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