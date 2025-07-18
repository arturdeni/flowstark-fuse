// src/app/flowstark/subscriptions/hooks/useSubscriptions.ts
import { useState, useEffect } from 'react';
import { Subscription, Client, Service } from '../../../../types/models';
import { subscriptionsService } from '../../../../services/subscriptionsService';
import { clientsService } from '../../../../services/clientsService';
import { servicesService } from '../../../../services/servicesService';

// Tipo extendido para incluir información relacionada
export interface SubscriptionWithRelations extends Subscription {
  clientInfo?: Client;
  serviceInfo?: Service;
}

// Función para calcular fecha de cobro automáticamente
const calculatePaymentDate = (
  subscription: Subscription,
  service: Service
): Date | null => {
  if (!subscription.startDate || !service.frequency) return null;

  const startDate = new Date(subscription.startDate);
  const frequency = service.frequency;
  const paymentType = subscription.paymentType || 'advance';
  const renovation = service.renovation || 'first_day';

  const nextPaymentDate = new Date(startDate);

  // Calcular la próxima fecha de renovación basada en frecuencia
  switch (frequency) {
    case 'monthly':
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
      break;
    case 'four_monthly':
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 4);
      break;
    case 'biannual':
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6);
      break;
    case 'annual':
      nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
      break;
    default:
      return null;
  }

  // Ajustar según el día de renovación configurado
  if (renovation === 'first_day') {
    nextPaymentDate.setDate(1);
  } else if (renovation === 'last_day') {
    // Último día del mes
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1, 0);
  }

  // Si es pago vencido, agregar un período más
  if (paymentType === 'arrears') {
    switch (frequency) {
      case 'monthly':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
        break;
      case 'four_monthly':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 4);
        break;
      case 'biannual':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6);
        break;
      case 'annual':
        nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
        break;
    }
  }

  return nextPaymentDate;
};

// Función para actualizar automáticamente el estado de las suscripciones
const updateSubscriptionStatus = (
  subscription: Subscription
): Subscription['status'] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (subscription.endDate) {
    const endDate = new Date(subscription.endDate);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < today) {
      return 'expired'; // Fecha de fin ya pasó
    } else if (endDate >= today) {
      return 'ending'; // Fecha de fin es futura
    }
  }

  // Si no tiene endDate, mantener como activa (a menos que haya sido cancelada manualmente)
  return subscription.status === 'cancelled' ? 'expired' : 'active';
};

// Hook personalizado para manejar suscripciones
export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<
    SubscriptionWithRelations[]
  >([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<
    SubscriptionWithRelations[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'expired' | 'ending'
  >('all');

  // Estados para snackbar
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
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Función para cerrar snackbar
  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Función para obtener texto del estado
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'activa';
      case 'expired':
        return 'caducada';
      case 'ending':
        return 'finalizando';
      default:
        return status;
    }
  };

  // Cargar suscripciones desde Firestore
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      let subscriptionsData = await subscriptionsService.getAllSubscriptions();

      // Actualizar estados automáticamente
      subscriptionsData = subscriptionsData.map((subscription) => ({
        ...subscription,
        status: updateSubscriptionStatus(subscription),
      }));

      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      showSnackbar(
        'Error al cargar las suscripciones. Por favor, inténtalo de nuevo.',
        'error'
      );
    }
    setLoading(false);
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

  // Combinar datos de suscripciones con información de clientes y servicios
  const combineSubscriptionData = () => {
    const combinedData = subscriptions.map((subscription) => {
      const clientInfo = clients.find(
        (client) => client.id === subscription.clientId
      );
      const serviceInfo = services.find(
        (service) => service.id === subscription.serviceId
      );

      // Calcular fecha de cobro si hay servicio
      let paymentDate = subscription.paymentDate;

      if (serviceInfo && !paymentDate) {
        paymentDate = calculatePaymentDate(subscription, serviceInfo);
      }

      return {
        ...subscription,
        paymentDate,
        clientInfo,
        serviceInfo,
      };
    });

    setSubscriptions(combinedData);
  };

  // Efecto para combinar datos cuando cambian clientes o servicios
  useEffect(() => {
    if (subscriptions.length > 0 && clients.length > 0 && services.length > 0) {
      combineSubscriptionData();
    }
  }, [clients, services]);

  // Filtrar suscripciones basado en búsqueda y estado
  useEffect(() => {
    let filtered = subscriptions;

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((subscription) => {
        const currentStatus = updateSubscriptionStatus(subscription);
        return currentStatus === statusFilter;
      });
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((subscription) => {
        const client = subscription.clientInfo;
        const service = subscription.serviceInfo;

        const clientName = client
          ? `${client.firstName} ${client.lastName}`.toLowerCase()
          : '';
        const clientEmail = client?.email?.toLowerCase() || '';
        const serviceName = service?.name?.toLowerCase() || '';

        return (
          clientName.includes(searchLower) ||
          clientEmail.includes(searchLower) ||
          serviceName.includes(searchLower)
        );
      });
    }

    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, statusFilter]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchClients(),
        fetchServices(),
        fetchSubscriptions(),
      ]);
    };

    loadInitialData();
  }, []);

  // Crear nueva suscripción
  const createSubscription = async (
    subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setLoading(true);
    try {
      // Encontrar el servicio para calcular paymentDate
      const service = services.find((s) => s.id === subscriptionData.serviceId);
      const finalSubscriptionData = { ...subscriptionData };

      if (service) {
        const paymentDate = calculatePaymentDate(subscriptionData, service);
        finalSubscriptionData.paymentDate = paymentDate;
      }

      // Asegurar que el status inicial sea 'active'
      finalSubscriptionData.status = 'active';

      await subscriptionsService.createSubscription(finalSubscriptionData);
      await refreshData();
      showSnackbar('Suscripción creada exitosamente', 'success');
    } catch (error) {
      console.error('Error creating subscription:', error);
      showSnackbar('Error al crear la suscripción', 'error');
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
      // Si se actualizan datos que afectan paymentDate, recalcular
      if (
        subscriptionData.startDate ||
        subscriptionData.serviceId ||
        subscriptionData.paymentType
      ) {
        const serviceId =
          subscriptionData.serviceId ||
          subscriptions.find((s) => s.id === id)?.serviceId;
        const service = services.find((s) => s.id === serviceId);

        if (service) {
          const fullSubscriptionData = {
            ...subscriptions.find((s) => s.id === id),
            ...subscriptionData,
          } as Subscription;

          const paymentDate = calculatePaymentDate(
            fullSubscriptionData,
            service
          );
          subscriptionData.paymentDate = paymentDate;
        }
      }

      await subscriptionsService.updateSubscription(id, subscriptionData);
      await refreshData();
      showSnackbar('Suscripción actualizada exitosamente', 'success');
    } catch (error) {
      console.error('Error updating subscription:', error);
      showSnackbar('Error al actualizar la suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar suscripción (cambiar estado a expired)
  const cancelSubscription = async (id: string) => {
    setLoading(true);
    try {
      await subscriptionsService.updateSubscription(id, {
        status: 'expired',
        endDate: new Date(), // Establecer fecha de fin a hoy
      });
      await refreshData();
      showSnackbar('Suscripción cancelada exitosamente', 'success');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      showSnackbar('Error al cancelar la suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar suscripción
  const deleteSubscription = async (id: string) => {
    setLoading(true);
    try {
      await subscriptionsService.deleteSubscription(id);
      await refreshData();
      showSnackbar('Suscripción eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      showSnackbar('Error al eliminar la suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Refrescar todos los datos
  const refreshData = async () => {
    await Promise.all([fetchClients(), fetchServices(), fetchSubscriptions()]);
  };

  // En useSubscriptions.ts, al final del hook, en el return:
  return {
    // Estado
    subscriptions: filteredSubscriptions,
    clients,
    services,
    loading,
    searchTerm,
    statusFilter, // ✅ Debe estar aquí
    snackbar,

    // Acciones
    setSearchTerm, // ✅ Debe estar aquí
    setStatusFilter, // ✅ Debe estar aquí - ESTO ES CLAVE
    createSubscription,
    updateSubscription,
    cancelSubscription,
    deleteSubscription,
    refreshData,
    showSnackbar,
    closeSnackbar,
    getStatusText,
  };
};
