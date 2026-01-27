// src/app/flowstark/tickets/hooks/useTickets.ts - VERSIÓN LIMPIA
import { useState, useEffect, useMemo } from 'react';
import { ticketsService } from '../../../../services/ticketsService';
import { subscriptionsService } from '../../../../services/subscriptionsService';
import { clientsService } from '../../../../services/clientsService';
import { servicesService } from '../../../../services/servicesService';
import {
  Ticket,
  Subscription,
  Client,
  Service,
  TicketWithRelations,
} from '../../../../types/models';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export const useTickets = () => {
  // Estados principales
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>(
    'all'
  );
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'card' | 'transfer' | 'cash' | 'direct_debit'>('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | null>(null);
  const [endDateFilter, setEndDateFilter] = useState<Date | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Función para mostrar snackbar
  const showSnackbar = (
    message: string,
    severity: SnackbarState['severity']
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // Cerrar snackbar
  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Enriquecer tickets con información relacionada
  const enrichTicketsWithRelations = (
    ticketsData: Ticket[],
    subscriptionsData: Subscription[],
    clientsData: Client[],
    servicesData: Service[]
  ): TicketWithRelations[] => {
    const subscriptionsMap = new Map(
      subscriptionsData.map((sub) => [sub.id, sub])
    );
    const clientsMap = new Map(
      clientsData.map((client) => [client.id, client])
    );
    const servicesMap = new Map(
      servicesData.map((service) => [service.id, service])
    );

    return ticketsData.map((ticket) => {
      const subscription = ticket.subscriptionId
        ? subscriptionsMap.get(ticket.subscriptionId)
        : undefined;
      // Para tickets manuales, usar clientId directo; para otros, obtener del subscription
      const client = ticket.clientId
        ? clientsMap.get(ticket.clientId)
        : subscription
          ? clientsMap.get(subscription.clientId)
          : undefined;
      const service = subscription
        ? servicesMap.get(subscription.serviceId)
        : undefined;

      // Si el ticket no tiene paymentMethod, obtenerlo del cliente
      const paymentMethod = ticket.paymentMethod || client?.paymentMethod?.type;

      return {
        ...ticket,
        paymentMethod,
        subscriptionInfo: subscription,
        clientInfo: client,
        serviceInfo: service,
      };
    });
  };

  // Cargar todos los datos
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ticketsData, subscriptionsData, clientsData, servicesData] =
        await Promise.all([
          ticketsService.getAllTickets(),
          subscriptionsService.getAllSubscriptions(),
          clientsService.getAllClients(),
          servicesService.getAllServices(),
        ]);

      setSubscriptions(subscriptionsData);
      setClients(clientsData);
      setServices(servicesData);

      const enrichedTickets = enrichTicketsWithRelations(
        ticketsData,
        subscriptionsData,
        clientsData,
        servicesData
      );

      setTickets(enrichedTickets);
    } catch (err) {
      console.error('Error loading tickets data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      showSnackbar('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // Función para refrescar datos
  const refreshData = async () => {
    await loadData();
  };

  // Filtrar tickets según término de búsqueda y estado
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((ticket) => {
        const clientName = ticket.clientInfo
          ? `${ticket.clientInfo.firstName} ${ticket.clientInfo.lastName}`.toLowerCase()
          : '';
        const serviceName = ticket.serviceInfo?.name?.toLowerCase() || '';
        const description = ticket.description?.toLowerCase() || '';
        const amount = ticket.amount.toString();

        return (
          clientName.includes(searchLower) ||
          serviceName.includes(searchLower) ||
          description.includes(searchLower) ||
          amount.includes(searchLower)
        );
      });
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    // Filtrar por método de pago
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter((ticket) => ticket.paymentMethod === paymentMethodFilter);
    }

    // Filtrar por fecha desde
    if (startDateFilter) {
      filtered = filtered.filter((ticket) => {
        const ticketDate = new Date(ticket.dueDate);
        return ticketDate >= startDateFilter;
      });
    }

    // Filtrar por fecha hasta
    if (endDateFilter) {
      filtered = filtered.filter((ticket) => {
        const ticketDate = new Date(ticket.dueDate);
        return ticketDate <= endDateFilter;
      });
    }

    return filtered;
  }, [tickets, searchTerm, statusFilter, paymentMethodFilter, startDateFilter, endDateFilter]);

  // Crear ticket
  const createTicket = async (
    ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setLoading(true);
    try {
      await ticketsService.createTicket(ticketData);
      await loadData();
      showSnackbar('Ticket creado exitosamente', 'success');
    } catch (error) {
      console.error('Error creating ticket:', error);
      showSnackbar('Error al crear el ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar ticket
  const updateTicket = async (
    id: string,
    ticketData: Partial<Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    setLoading(true);
    try {
      await ticketsService.updateTicket(id, ticketData);
      await loadData();
      showSnackbar('Ticket actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error updating ticket:', error);
      showSnackbar('Error al actualizar el ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar ticket
  const deleteTicket = async (id: string) => {
    setLoading(true);
    try {
      await ticketsService.deleteTicket(id);
      await loadData();
      showSnackbar('Ticket eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showSnackbar('Error al eliminar el ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Marcar como pagado
  const markAsPaid = async (id: string, paidDate?: Date) => {
    setLoading(true);
    try {
      await ticketsService.markAsPaid(id, paidDate);
      await loadData();
      showSnackbar('Ticket marcado como cobrado', 'success');
    } catch (error) {
      console.error('Error marking ticket as paid:', error);
      showSnackbar('Error al marcar el ticket como cobrado', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Marcar como pendiente
  const markAsPending = async (id: string) => {
    setLoading(true);
    try {
      await ticketsService.markAsPending(id);
      await loadData();
      showSnackbar('Ticket marcado como pendiente', 'success');
    } catch (error) {
      console.error('Error marking ticket as pending:', error);
      showSnackbar('Error al marcar el ticket como pendiente', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    // Estado
    tickets: filteredTickets,
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
    refreshData, // Este botón ahora solo actualiza la vista local con datos de Firebase
    createTicket,
    updateTicket,
    deleteTicket,
    markAsPaid,
    markAsPending,
    closeSnackbar,
  };
};
