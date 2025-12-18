// src/app/flowstark/tickets/Tickets.tsx - VERSIÓN LIMPIA
import React, { useState, useMemo } from 'react';
import { Box, Snackbar, Alert, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { useTickets } from './hooks/useTickets';
import { TicketWithRelations } from '../../../types/models';
import {
  TicketsTable,
  TicketForm,
  TicketSearchAndActions,
  TicketFilters,
  TicketDetailModal,
  DeleteConfirmDialog,
  PaymentDateDialog,
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

const Tickets: React.FC = () => {
  // Estados locales para UI
  const [selectedTicket, setSelectedTicket] = useState<TicketWithRelations | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [ticketToView, setTicketToView] = useState<TicketWithRelations | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [paymentDateDialogOpen, setPaymentDateDialogOpen] = useState(false);
  const [ticketToMarkPaid, setTicketToMarkPaid] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Hook principal
  const {
    // Estados
    filteredTickets,
    subscriptions,
    clients,
    services,
    searchTerm,
    statusFilter,
    paymentMethodFilter,
    startDateFilter,
    endDateFilter,
    loading,
    error,
    snackbar,

    // Acciones
    setSearchTerm,
    setStatusFilter,
    setPaymentMethodFilter,
    setStartDateFilter,
    setEndDateFilter,
    refreshData, // Ahora solo actualiza la vista local
    createTicket,
    updateTicket,
    deleteTicket,
    markAsPaid,
    markAsPending,
    closeSnackbar,
  } = useTickets();

  // Estadísticas de tickets
  const ticketStats = useMemo(() => {
    const total = filteredTickets.length;
    const paid = filteredTickets.filter(t => t.status === 'paid').length;
    const pending = filteredTickets.filter(t => t.status === 'pending').length;

    return { total, paid, pending };
  }, [filteredTickets]);

  // Handlers para formulario
  const handleOpenForm = (ticket?: TicketWithRelations) => {
    setSelectedTicket(ticket || null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedTicket(null);
    setFormOpen(false);
  };

  // Handlers para modal de detalles
  const handleViewDetail = (ticket: TicketWithRelations) => {
    setTicketToView(ticket);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setTicketToView(null);
    setDetailModalOpen(false);
  };

  // Handlers para eliminación
  const handleDeleteClick = (ticketId: string) => {
    setTicketToDelete(ticketId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (ticketToDelete) {
      await deleteTicket(ticketToDelete);
      setTicketToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setTicketToDelete(null);
    setDeleteConfirmOpen(false);
  };

  // Handlers para marcar como pagado
  const handleMarkAsPaidClick = (ticketId: string) => {
    setTicketToMarkPaid(ticketId);
    setPaymentDateDialogOpen(true);
  };

  const handleConfirmMarkAsPaid = async (paidDate: Date) => {
    if (ticketToMarkPaid) {
      await markAsPaid(ticketToMarkPaid, paidDate);
      setTicketToMarkPaid(null);
      setPaymentDateDialogOpen(false);
    }
  };

  const handleCancelMarkAsPaid = () => {
    setTicketToMarkPaid(null);
    setPaymentDateDialogOpen(false);
  };

  // Handlers para paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Datos para el modal de confirmación de eliminación
  const deleteConfirmData = useMemo(() => {
    if (!ticketToDelete) return null;

    const ticket = filteredTickets.find(t => t.id === ticketToDelete);

    if (!ticket) return null;

    return {
      id: ticket.id!,
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
        <Box className="p-6">
          <Typography
            component="h1"
            variant="h4"
            className="font-medium tracking-tight"
            sx={{ color: '#154241' }}          >
            Tickets
          </Typography>
          <Typography
            variant="body1"
            className="mt-1"
            color="text.secondary"
          >
            Gestiona los tickets y recibos de las suscripciones.
            Los tickets se generan automáticamente cuando las suscripciones llegan a su fecha de cobro.
          </Typography>
        </Box>
      }
      content={
        <Box className="w-full h-full flex flex-col p-6">
          {/* Barra de búsqueda y acciones */}
          <TicketSearchAndActions
            searchTerm={searchTerm}
            ticketCount={ticketStats.total}
            paidCount={ticketStats.paid}
            pendingCount={ticketStats.pending}
            loading={loading}
            tickets={filteredTickets}
            onSearchChange={setSearchTerm}
            onAddTicket={() => handleOpenForm()}
            onRefresh={refreshData} // Solo actualiza la vista local
          />

          {/* Filtros avanzados */}
          <TicketFilters
            statusFilter={statusFilter}
            paymentMethodFilter={paymentMethodFilter}
            startDateFilter={startDateFilter}
            endDateFilter={endDateFilter}
            onStatusFilterChange={setStatusFilter}
            onPaymentMethodFilterChange={setPaymentMethodFilter}
            onStartDateChange={setStartDateFilter}
            onEndDateChange={setEndDateFilter}
          />

          {/* Información adicional con estadísticas */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {ticketStats.total === 0
                ? 'No se encontraron tickets'
                : `Mostrando ${ticketStats.total} ticket${ticketStats.total !== 1 ? 's' : ''}`
              }
            </Typography>

            {ticketStats.total > 0 && (
              <>
                <Typography variant="body2" sx={{ color: '#2C645E', fontWeight: 500 }}>
                  {ticketStats.paid} pagados
                </Typography>
                <Typography variant="body2" sx={{ color: '#E65100', fontWeight: 500 }}>
                  {ticketStats.pending} pendientes
                </Typography>
              </>
            )}
          </Box>

          {/* Mensaje informativo sobre la generación automática */}
          {ticketStats.total === 0 && !loading && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: 'info.light',
                borderRadius: 1,
                border: 1,
                borderColor: 'info.main'
              }}
            >
              <Typography variant="body2" color="info.dark">
                💡 Los tickets se generan automáticamente cuando las suscripciones llegan a su fecha de cobro (paymentDate).
                Si no ves tickets aquí, verifica que tus suscripciones tengan fechas de pago configuradas.
              </Typography>
            </Box>
          )}

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
          />

          {/* Diálogo de confirmación para eliminar */}
          <DeleteConfirmDialog
            open={deleteConfirmOpen}
            data={deleteConfirmData}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            loading={loading}
          />

          {/* Diálogo para marcar como pagado */}
          <PaymentDateDialog
            open={paymentDateDialogOpen}
            onConfirm={handleConfirmMarkAsPaid}
            onCancel={handleCancelMarkAsPaid}
            loading={loading}
          />

          {/* Snackbar para notificaciones */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={closeSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={closeSnackbar}
              severity={snackbar.severity}
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

export default Tickets;