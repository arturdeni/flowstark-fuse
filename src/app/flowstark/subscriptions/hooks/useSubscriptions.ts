// src/app/flowstark/subscriptions/hooks/useSubscriptions.ts
import { useState, useEffect } from 'react';
import { Subscription, Client, Service } from '../../../../types/models';
import { subscriptionsService } from '../../../../services/subscriptionsService';
import { clientsService } from '../../../../services/clientsService';
import { servicesService } from '../../../../services/servicesService';
import { calculatePaymentDate } from '../../../../utils/paymentDateCalculator';
import { automaticTicketService } from '../../../../services/automaticTicketService';

// Tipo extendido para incluir información relacionada
export interface SubscriptionWithRelations extends Subscription {
  clientInfo?: Client;
  serviceInfo?: Service;
}

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<
    SubscriptionWithRelations[]
  >([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'expired' | 'ending'
  >('all');
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<
    SubscriptionWithRelations[]
  >([]);

  // Estado para snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Función para mostrar mensajes
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

  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Función para validar y convertir fechas de forma segura
  const safeParseDate = (date: any): Date | null => {
    if (!date) return null;

    try {
      if (date instanceof Date) {
        return isNaN(date.getTime()) ? null : date;
      }

      // Si es un timestamp de Firestore
      if (date.toDate && typeof date.toDate === 'function') {
        const parsed = date.toDate();
        return isNaN(parsed.getTime()) ? null : parsed;
      }

      // Si es una string o número
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  // Función para actualizar el estado de una suscripción basado en fechas
  const updateSubscriptionStatus = (
    subscription: SubscriptionWithRelations
  ): 'active' | 'expired' | 'ending' => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Si tiene endDate, verificar si ya ha caducado
    if (subscription.endDate) {
      const endDate = safeParseDate(subscription.endDate);

      if (endDate) {
        endDate.setHours(0, 0, 0, 0);

        // Si la fecha de fin es hoy o anterior, está caducada
        if (endDate <= today) {
          return 'expired';
        } else {
          // Si la fecha de fin es futura, está finalizando
          return 'ending';
        }
      }
    }

    // Si no tiene endDate, está activa
    return 'active';
  };

  // Cargar todos los datos
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [subscriptionsData, clientsData, servicesData] = await Promise.all([
        subscriptionsService.getAllSubscriptions(),
        clientsService.getAllClients(),
        servicesService.getAllServices(),
      ]);

      // Procesar suscripciones con información relacionada
      const subscriptionsWithRelations: SubscriptionWithRelations[] =
        subscriptionsData.map((subscription) => {
          const clientInfo = clientsData.find(
            (client) => client.id === subscription.clientId
          );
          const serviceInfo = servicesData.find(
            (service) => service.id === subscription.serviceId
          );

          return {
            ...subscription,
            clientInfo,
            serviceInfo,
            // Convertir fechas de forma segura
            startDate: safeParseDate(subscription.startDate) || new Date(),
            endDate: safeParseDate(subscription.endDate),
            paymentDate: safeParseDate(subscription.paymentDate),
          };
        });

      setSubscriptions(subscriptionsWithRelations);
      setClients(clientsData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
      showSnackbar('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar suscripciones
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
          ? `${client.firstName || ''} ${client.lastName || ''} ${client.email || ''}`.toLowerCase()
          : '';

        const serviceName = service ? service.name.toLowerCase() : '';

        return (
          clientName.includes(searchLower) || serviceName.includes(searchLower)
        );
      });
    }

    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, statusFilter]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // Función pública para refrescar datos
  const refreshData = () => {
    loadData();
  };

  // Crear nueva suscripción
  const createSubscription = async (
    subscriptionData: Omit<Subscription, 'id'>
  ) => {
    setLoading(true);
    try {
      // Buscar el servicio para calcular la fecha de pago inicial
      const service = services.find((s) => s.id === subscriptionData.serviceId);

      const finalData = { ...subscriptionData };

      if (service) {
        const paymentDate = calculatePaymentDate(
          finalData as Subscription,
          service
        );

        if (paymentDate) {
          finalData.paymentDate = paymentDate;
        }
      }

      // 1. Crear la suscripción
      const newSubscription =
        await subscriptionsService.createSubscription(finalData);

      // 2. ✅ GENERAR TICKET PROPORCIONAL SOLO PARA PAGOS ANTICIPADOS
      // Los pagos vencidos esperan a que la Cloud Function los genere en la fecha de vencimiento
      if (newSubscription.id && finalData.paymentType === 'advance') {
        try {
          await automaticTicketService.processNewSubscriptionForProportionalTicket(
            newSubscription.id
          );
          console.log(
            '✅ Ticket proporcional generado para pago anticipado'
          );
        } catch (ticketError) {
          console.error('⚠️ Error creando ticket proporcional:', ticketError);
          showSnackbar(
            'Suscripción creada, pero hubo un problema generando el ticket proporcional',
            'warning'
          );
        }
      }

      await loadData(); // Recargar todos los datos
      showSnackbar('Suscripción creada exitosamente', 'success');
    } catch (error) {
      console.error('Error creating subscription:', error);
      showSnackbar('Error al crear la suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para procesar todas las suscripciones existentes y crear tickets proporcionales faltantes
   * Útil para migración o corrección de datos
   */
  const processAllSubscriptionsForProportionalTickets = async () => {
    setLoading(true);
    try {
      const result =
        await automaticTicketService.processAllSubscriptionsForMissingProportionalTickets();

      if (result.created > 0) {
        showSnackbar(
          `Se crearon ${result.created} tickets proporcionales de ${result.processed} suscripciones procesadas`,
          'success'
        );
      } else {
        showSnackbar(
          'No se encontraron tickets proporcionales faltantes',
          'info'
        );
      }

      if (result.errors.length > 0) {
        console.error('Errores durante el procesamiento:', result.errors);
        showSnackbar(
          `Se completó con ${result.errors.length} errores. Ver consola para detalles.`,
          'warning'
        );
      }

      await loadData(); // Recargar datos después de crear tickets
    } catch (error) {
      console.error('Error processing proportional tickets:', error);
      showSnackbar('Error procesando tickets proporcionales', 'error');
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
        const subscription = subscriptions.find((s) => s.id === id);
        const serviceId = subscriptionData.serviceId || subscription?.serviceId;
        const service = services.find((s) => s.id === serviceId);

        if (service && subscription) {
          const fullSubscriptionData = {
            ...subscription,
            ...subscriptionData,
          } as Subscription;

          const paymentDate = calculatePaymentDate(
            fullSubscriptionData,
            service
          );

          if (paymentDate) {
            subscriptionData.paymentDate = paymentDate;
          }
        }
      }

      await subscriptionsService.updateSubscription(id, subscriptionData);
      await loadData(); // Recargar todos los datos
      showSnackbar('Suscripción actualizada exitosamente', 'success');
    } catch (error) {
      console.error('Error updating subscription:', error);
      showSnackbar('Error al actualizar la suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar suscripción (cambiar a ending con endDate personalizada)
  const cancelSubscription = async (id: string, endDate: Date) => {
    setLoading(true);
    try {
      await subscriptionsService.updateSubscription(id, {
        status: 'ending' as const,
        endDate: endDate,
      });
      await loadData(); // Recargar todos los datos
      showSnackbar(
        'Suscripción marcada para finalizar exitosamente',
        'success'
      );
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      showSnackbar('Error al finalizar la suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar suscripción
  const deleteSubscription = async (id: string) => {
    setLoading(true);
    try {
      await subscriptionsService.deleteSubscription(id);
      await loadData(); // Recargar todos los datos
      showSnackbar('Suscripción eliminada exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      showSnackbar('Error al eliminar la suscripción', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    // Datos
    subscriptions: filteredSubscriptions,
    clients,
    services,
    loading,
    error,

    // Filtros
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,

    // Snackbar
    snackbar,
    closeSnackbar,

    // Acciones
    refreshData,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    deleteSubscription,
  };
};
