// src/app/flowstark/tickets/Tickets.tsx
import React, { useState } from 'react';
import {
  Typography,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';

import { useTickets } from './hooks/useTickets';
import {
  TicketSearchAndActions,
  TicketsTable,
  TicketForm,
  DeleteConfirmDialog,
  TicketDetailModal,
  PaymentDateDialog,
} from './components';
import { TicketWithRelations } from '../../../types/models';

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

function Tickets() {
  // Estado local para UI
  const [selectedTicket, setSelectedTicket] = useState<TicketWithRelations | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [paymentDateModalOpen, setPaymentDateModalOpen] = useState(false);
  const [ticketToPay, setTicketToPay] = useState<string | null>(null);

  // Estado para el modal de detalles
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [ticketToView, setTicketToView] = useState<TicketWithRelations | null>(null);

  const {
    // Estados
    tickets: filteredTickets,
    subscriptions,
    clients,
    services,
    searchTerm,
    statusFilter,
    loading,
    snackbar,

    // Acciones
    setSearchTerm,
    setStatusFilter,
    refreshData,
    createTicket,
    updateTicket,
    deleteTicket,
    markAsPaid,
    markAsPending,
    generateAutomaticTickets,
    closeSnackbar,
  } = useTickets();

  // Calcular estadísticas
  const ticketStats = React.useMemo(() => {
    const total = filteredTickets.length;
    const paid = filteredTickets.filter(ticket => ticket.status === 'paid').length;
    const pending = filteredTickets.filter(ticket => ticket.status === 'pending').length;

    return { total, paid, pending };
  }, [filteredTickets]);

  // Handlers para el formulario
  const handleOpenForm = (ticket?: TicketWithRelations) => {
    setSelectedTicket(ticket || null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedTicket(null);
  };

  // Handlers para el modal de detalles
  const handleViewDetail = (ticket: TicketWithRelations) => {
    setTicketToView(ticket);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setTicketToView(null);
  };

  // Handlers para eliminación
  const handleDeleteClick = (ticketId: string) => {
    setTicketToDelete(ticketId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (ticketToDelete) {
      await deleteTicket(ticketToDelete);
      setDeleteConfirmOpen(false);
      setTicketToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setTicketToDelete(null);
  };

  // Handlers para paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMarkAsPaidClick = (ticketId: string) => {
    setTicketToPay(ticketId);
    setPaymentDateModalOpen(true);
  };

  const handleConfirmPayment = async (paidDate: Date) => {
    if (ticketToPay) {
      await markAsPaid(ticketToPay, paidDate);
      setPaymentDateModalOpen(false);
      setTicketToPay(null);
    }
  };

  const handleCancelPayment = () => {
    setPaymentDateModalOpen(false);
    setTicketToPay(null);
  };

  // Obtener información del ticket a eliminar
  const ticketToDeleteInfo = React.useMemo(() => {
    if (!ticketToDelete) return undefined;

    const ticket = filteredTickets.find(t => t.id === ticketToDelete);

    if (!ticket) return undefined;

    return {
      clientName: ticket.clientInfo
        ? `${ticket.clientInfo.firstName} ${ticket.clientInfo.lastName}`
        : undefined,
      serviceName: ticket.serviceInfo?.name,
      amount: ticket.amount,
      dueDate: ticket.dueDate,
    };
  }, [ticketToDelete, filteredTickets]);

  return (
    <Root
      header={
        <Box sx={{ py: 2 }}>
          <Typography
            component="h1"
            variant="h4"
            className="font-medium tracking-tight"
            color="text.primary"
          >
            Tickets
          </Typography>
          <Typography
            variant="body1"
            className="mt-1"
            color="text.secondary"
          >
            Gestiona los tickets y recibos de las suscripciones
          </Typography>
        </Box>
      }
      content={
        <Box className="w-full h-full flex flex-col p-6">
          {/* Barra de búsqueda y acciones */}
          <TicketSearchAndActions
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            ticketCount={ticketStats.total}
            paidCount={ticketStats.paid}
            pendingCount={ticketStats.pending}
            loading={loading}
            onSearchChange={setSearchTerm}
            onStatusFilterChange={setStatusFilter}
            onAddTicket={() => handleOpenForm()}
            onGenerateAutomatic={generateAutomaticTickets}
            onRefresh={refreshData}
          />

          {/* Tabla de tickets */}
          <TicketsTable
            tickets={filteredTickets}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            onEdit={handleOpenForm}
            onDelete={handleDeleteClick}
            onViewDetail={handleViewDetail}
            onMarkAsPaid={handleMarkAsPaidClick}
            onMarkAsPending={markAsPending}
          />

          {/* Formulario para añadir/editar ticket */}
          <TicketForm
            open={formOpen}
            selectedTicket={selectedTicket}
            subscriptions={subscriptions}
            clients={clients}
            services={services}
            loading={loading}
            onClose={handleCloseForm}
            onSave={createTicket}
            onUpdate={updateTicket}
          />

          {/* Modal para ver detalles del ticket */}
          <TicketDetailModal
            open={detailModalOpen}
            ticket={ticketToView}
            onClose={handleCloseDetailModal}
            onEdit={handleOpenForm}
            onMarkAsPaid={handleMarkAsPaidClick}
            onMarkAsPending={markAsPending}
          />

          {/* Diálogo de confirmación para eliminar */}
          <DeleteConfirmDialog
            open={deleteConfirmOpen}
            loading={loading}
            ticketInfo={ticketToDeleteInfo}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />

          <PaymentDateDialog
            open={paymentDateModalOpen}
            loading={loading}
            onConfirm={handleConfirmPayment}
            onCancel={handleCancelPayment}
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

export default Tickets;