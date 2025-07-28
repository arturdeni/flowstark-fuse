// src/app/flowstark/tickets/hooks/useTickets.ts
import { useState, useEffect, useMemo } from 'react';
import { ticketsService } from '../../../../services/ticketsService';
import { subscriptionsService } from '../../../../services/subscriptionsService';
import { clientsService } from '../../../../services/clientsService';
import { servicesService } from '../../../../services/servicesService';
import { Ticket, TicketWithRelations, Subscription, Client, Service } from '../../../../types/models';

export interface UseTicketsReturn {
  // Estado
  tickets: TicketWithRelations[];
  filteredTickets: TicketWithRelations[];
  subscriptions: Subscription[];
  clients: Client[];
  services: Service[];
  searchTerm: string;
  statusFilter: 'all' | 'paid' | 'pending';
  loading: boolean;
  error: string | null;
  
  // Snackbar
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };

  // Acciones
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: 'all' | 'paid' | 'pending') => void;
  refreshData: () => Promise<void>;
  createTicket: (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTicket: (id: string, ticketData: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  markAsPending: (id: string) => Promise<void>;
  generateAutomaticTickets: () => Promise<void>;
  closeSnackbar: () => void;
}

export const useTickets = (): UseTicketsReturn => {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Función para mostrar snackbar
  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  // Función para cerrar snackbar
  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Función para enriquecer tickets con información relacionada
  const enrichTicketsWithRelations = (
    ticketsList: Ticket[],
    subscriptionsList: Subscription[],
    clientsList: Client[],
    servicesList: Service[]
  ): TicketWithRelations[] => {
    const subscriptionsMap = new Map(subscriptionsList.map(sub => [sub.id, sub]));
    const clientsMap = new Map(clientsList.map(client => [client.id, client]));
    const servicesMap = new Map(servicesList.map(service => [service.id, service]));

    return ticketsList.map(ticket => {
      const subscription = subscriptionsMap.get(ticket.subscriptionId);
      const client = subscription ? clientsMap.get(subscription.clientId) : undefined;
      const service = subscription ? servicesMap.get(subscription.serviceId) : undefined;

      return {
        ...ticket,
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

      const [ticketsData, subscriptionsData, clientsData, servicesData] = await Promise.all([
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
      filtered = filtered.filter(ticket => {
        const clientName = ticket.clientInfo 
          ? `${ticket.clientInfo.firstName} ${ticket.clientInfo.lastName}`.toLowerCase()
          : '';
        const serviceName = ticket.serviceInfo?.name?.toLowerCase() || '';
        const amount = ticket.amount.toString();
        
        return (
          clientName.includes(searchLower) ||
          serviceName.includes(searchLower) ||
          amount.includes(searchLower) ||
          ticket.description?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    return filtered;
  }, [tickets, searchTerm, statusFilter]);

  // Crear ticket
  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => {
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
  const updateTicket = async (id: string, ticketData: Partial<Ticket>) => {
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
  const markAsPaid = async (id: string) => {
    setLoading(true);
    try {
      await ticketsService.markAsPaid(id);
      await loadData();
      showSnackbar('Ticket marcado como pagado', 'success');
    } catch (error) {
      console.error('Error marking ticket as paid:', error);
      showSnackbar('Error al marcar el ticket como pagado', 'error');
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

  // Generar tickets automáticos
  const generateAutomaticTickets = async () => {
    setLoading(true);
    try {
      const result = await ticketsService.generateAutomaticTickets();
      await loadData();
      
      if (result.created > 0) {
        showSnackbar(
          `${result.created} tickets generados automáticamente`, 
          'success'
        );
      } else {
        showSnackbar('No hay nuevos tickets para generar', 'info');
      }

      if (result.errors.length > 0) {
        console.warn('Errores durante la generación automática:', result.errors);
      }
    } catch (error) {
      console.error('Error generating automatic tickets:', error);
      showSnackbar('Error al generar tickets automáticos', 'error');
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
    loading,
    error,
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
  };
};