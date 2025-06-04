// src/app/flowstark/subscriptions/hooks/useSubscriptions.ts
import { useState, useEffect } from 'react';
import { subscriptionsService } from '../../../../services/subscriptionsService';
import { clientsService } from '../../../../services/clientsService';
import { servicesService } from '../../../../services/servicesService';
import { Subscription, Client, Service } from '../../../../types/models';

// Tipo extendido para incluir la información relacionada
export type SubscriptionWithRelations = Subscription & {
  clientInfo?: any;
  serviceInfo?: any;
};

export interface UseSubscriptionsReturn {
  // Estado
  subscriptions: SubscriptionWithRelations[];
  filteredSubscriptions: SubscriptionWithRelations[];
  clients: Client[];
  services: Service[];
  searchTerm: string;
  statusFilter: string;
  loading: boolean;
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };

  // Acciones
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  refreshData: () => Promise<void>;
  createSubscription: (
    subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateSubscription: (
    id: string,
    subscriptionData: Partial<Subscription>
  ) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  changeSubscriptionStatus: (
    id: string,
    status: 'active' | 'paused' | 'cancelled',
    endDate?: Date
  ) => Promise<void>;
  showSnackbar: (
    message: string,
    severity?: 'success' | 'error' | 'warning' | 'info'
  ) => void;
  closeSnackbar: () => void;
}

export const useSubscriptions = (): UseSubscriptionsReturn => {
  const [subscriptions, setSubscriptions] = useState<
    SubscriptionWithRelations[]
  >([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<
    SubscriptionWithRelations[]
  >([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Cargar suscripciones desde Firestore
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const subscriptionsData =
        await subscriptionsService.getAllSubscriptions();
      setSubscriptions(subscriptionsData);
      setFilteredSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      showSnackbar(
        'Error al cargar las suscripciones. Por favor, inténtalo de nuevo.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes desde Firestore
  const fetchClients = async () => {
    try {
      const clientsData = await clientsService.getAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Cargar servicios desde Firestore
  const fetchServices = async () => {
    try {
      const servicesData = await servicesService.getAllServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Cargar todos los datos
  const loadAllData = async () => {
    await Promise.all([fetchSubscriptions(), fetchClients(), fetchServices()]);
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadAllData();
  }, []);

  // Filtrado de suscripciones según término de búsqueda y filtro de estado
  useEffect(() => {
    let filtered = subscriptions;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (subscription) =>
          subscription.clientInfo?.firstName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          subscription.clientInfo?.lastName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          subscription.clientInfo?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          subscription.serviceInfo?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (subscription) => subscription.status === statusFilter
      );
    }

    setFilteredSubscriptions(filtered);
  }, [searchTerm, statusFilter, subscriptions]);

  // Función para refrescar los datos
  const refreshData = async () => {
    await loadAllData();
  };

  // Crear nueva suscripción
  const createSubscription = async (
    subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setLoading(true);
    try {
      await subscriptionsService.createSubscription(subscriptionData);
      showSnackbar('Suscripción creada correctamente', 'success');
      await refreshData();
    } catch (error) {
      console.error('Error creating subscription:', error);
      showSnackbar(
        `Error al crear la suscripción: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar suscripción existente
  const updateSubscription = async (
    id: string,
    subscriptionData: Partial<Subscription>
  ) => {
    setLoading(true);
    try {
      await subscriptionsService.updateSubscription(id, subscriptionData);
      showSnackbar('Suscripción actualizada correctamente', 'success');
      await refreshData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      showSnackbar(
        `Error al actualizar la suscripción: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de la suscripción
  const changeSubscriptionStatus = async (
    id: string,
    status: 'active' | 'paused' | 'cancelled',
    endDate?: Date
  ) => {
    setLoading(true);
    try {
      await subscriptionsService.changeSubscriptionStatus(id, status, endDate);
      showSnackbar(
        `Estado de la suscripción actualizado a ${getStatusText(status)}`,
        'success'
      );
      await refreshData();
    } catch (error) {
      console.error('Error changing subscription status:', error);
      showSnackbar(
        `Error al cambiar el estado de la suscripción: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar suscripción
  const deleteSubscription = async (id: string) => {
    setLoading(true);
    try {
      await subscriptionsService.deleteSubscription(id);
      showSnackbar('Suscripción eliminada correctamente', 'success');
      await refreshData();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      showSnackbar(
        `Error al eliminar la suscripción: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para obtener texto del estado
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'paused':
        return 'Pausada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Mostrar notificación
  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Cerrar notificación
  const closeSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  return {
    // Estado
    subscriptions,
    filteredSubscriptions,
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
    createSubscription,
    updateSubscription,
    deleteSubscription,
    changeSubscriptionStatus,
    showSnackbar,
    closeSnackbar,
  };
};
