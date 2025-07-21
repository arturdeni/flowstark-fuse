// src/app/flowstark/subscriptions/hooks/useSubscriptions.ts
import { useState, useEffect, useCallback } from 'react';
import { Subscription, Client, Service } from '../../../../types/models';
import { subscriptionsService } from '../../../../services/subscriptionsService';
import { clientsService } from '../../../../services/clientsService';
import { servicesService } from '../../../../services/servicesService';
import { 
  calculatePaymentDate, 
  getSubscriptionsNeedingRecalculation,
  recalculatePaymentDates,
  PaymentDateCalculation
} from '../../../../utils/paymentDateCalculator';

// Tipo extendido para incluir información relacionada
export interface SubscriptionWithRelations extends Subscription {
  clientInfo?: Client;
  serviceInfo?: Service;
  paymentCalculation?: PaymentDateCalculation | null;
}

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'ending'>('all');
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionWithRelations[]>([]);

  // Función para mostrar mensajes (mock - reemplazar con tu sistema de notificaciones)
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`${severity.toUpperCase()}: ${message}`);
    // Aquí integrarías tu sistema de notificaciones real
  };

  // Función para cargar datos iniciales
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchSubscriptions(),
        fetchClients(),
        fetchServices()
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Error al cargar los datos. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar suscripciones desde Firestore
  const fetchSubscriptions = async () => {
    try {
      const subscriptionsData = await subscriptionsService.getAllSubscriptions();
      
      // Procesar cada suscripción para asegurar fechas válidas
      const processedSubscriptions = subscriptionsData.map(sub => ({
        ...sub,
        startDate: sub.startDate instanceof Date ? sub.startDate : new Date(sub.startDate),
        endDate: sub.endDate ? (sub.endDate instanceof Date ? sub.endDate : new Date(sub.endDate)) : null,
        paymentDate: sub.paymentDate ? (sub.paymentDate instanceof Date ? sub.paymentDate : new Date(sub.paymentDate)) : undefined,
        createdAt: sub.createdAt ? (sub.createdAt instanceof Date ? sub.createdAt : new Date(sub.createdAt)) : undefined,
        updatedAt: sub.updatedAt ? (sub.updatedAt instanceof Date ? sub.updatedAt : new Date(sub.updatedAt)) : undefined,
      }));

      setSubscriptions(processedSubscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  };

  // Cargar clientes desde Firestore
  const fetchClients = async () => {
    try {
      const clientsData = await clientsService.getAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  };

  // Cargar servicios desde Firestore
  const fetchServices = async () => {
    try {
      const servicesData = await servicesService.getAllServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  };

  // Función para actualizar automáticamente el estado de las suscripciones
  const updateSubscriptionStatus = (subscription: Subscription): Subscription['status'] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (subscription.endDate) {
      const endDate = new Date(subscription.endDate);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) {
        return 'expired'; // Fecha de fin ya pasó
      } else if (endDate >= today) {
        return 'ending'; // Fecha de fin es futura pero próxima
      }
    }

    // Si no tiene endDate, mantener como activa (a menos que haya sido cancelada manualmente)
    return subscription.status === 'cancelled' ? 'cancelled' : 'active';
  };

  // Combinar datos de suscripciones con información de clientes y servicios
  const combineSubscriptionData = useCallback(() => {
    if (subscriptions.length === 0) return;

    const combinedData = subscriptions.map((subscription) => {
      const clientInfo = clients.find(client => client.id === subscription.clientId);
      const serviceInfo = services.find(service => service.id === subscription.serviceId);

      // Calcular información de pago actualizada
      let paymentCalculation: PaymentDateCalculation | null = null;
      let updatedPaymentDate = subscription.paymentDate;

      if (serviceInfo) {
        paymentCalculation = calculatePaymentDate(subscription, serviceInfo);
        
        // Si necesita recálculo o no tiene fecha de pago, usar la nueva calculada
        if (paymentCalculation && (paymentCalculation.shouldRecalculate || !subscription.paymentDate)) {
          updatedPaymentDate = paymentCalculation.nextPaymentDate;
        }
      }

      // Actualizar estado de la suscripción
      const currentStatus = updateSubscriptionStatus(subscription);

      return {
        ...subscription,
        status: currentStatus,
        paymentDate: updatedPaymentDate,
        clientInfo,
        serviceInfo,
        paymentCalculation,
      } as SubscriptionWithRelations;
    });

    setSubscriptions(combinedData);
  }, [subscriptions, clients, services]);

  // Efecto para combinar datos cuando cambian clientes o servicios
  useEffect(() => {
    if (clients.length > 0 && services.length > 0) {
      combineSubscriptionData();
    }
  }, [clients, services, combineSubscriptionData]);

  // Función para recalcular automáticamente fechas de pago vencidas
  const autoRecalculatePaymentDates = useCallback(async () => {
    if (subscriptions.length === 0 || services.length === 0) return;

    const subscriptionsNeedingUpdate = getSubscriptionsNeedingRecalculation(subscriptions, services);
    
    if (subscriptionsNeedingUpdate.length === 0) return;

    console.log(`Recalculando fechas de pago para ${subscriptionsNeedingUpdate.length} suscripciones...`);

    try {
      const recalculationResults = recalculatePaymentDates(subscriptionsNeedingUpdate, services);
      
      // Actualizar en Firestore las suscripciones que necesitan nuevas fechas
      const updatePromises = recalculationResults
        .filter(result => result.newPaymentDate && result.subscription.id)
        .map(result => 
          subscriptionsService.updateSubscription(result.subscription.id!, {
            paymentDate: result.newPaymentDate!
          })
        );

      await Promise.all(updatePromises);
      
      if (updatePromises.length > 0) {
        showSnackbar(`Se actualizaron ${updatePromises.length} fechas de pago automáticamente`, 'info');
        await refreshData(); // Recargar datos después de las actualizaciones
      }
    } catch (error) {
      console.error('Error en recálculo automático:', error);
      showSnackbar('Error al actualizar fechas de pago automáticamente', 'error');
    }
  }, [subscriptions, services, refreshData]);

  // Ejecutar recálculo automático cada vez que se cargan los datos
  useEffect(() => {
    if (subscriptions.length > 0 && services.length > 0) {
      autoRecalculatePaymentDates();
    }
  }, [autoRecalculatePaymentDates]);

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
          ? `${client.firstName} ${client.lastName} ${client.email}`.toLowerCase()
          : '';
        
        const serviceName = service ? service.name.toLowerCase() : '';

        return clientName.includes(searchLower) || serviceName.includes(searchLower);
      });
    }

    setFilteredSubscriptions(filtered);
  }, [subscriptions, searchTerm, statusFilter]);

  // Crear nueva suscripción
  const createSubscription = async (subscriptionData: Omit<Subscription, 'id'>) => {
    setLoading(true);
    try {
      // Buscar el servicio para calcular la fecha de pago inicial
      const service = services.find(s => s.id === subscriptionData.serviceId);
      
      if (service) {
        const paymentCalculation = calculatePaymentDate(subscriptionData as Subscription, service);

        if (paymentCalculation) {
          subscriptionData.paymentDate = paymentCalculation.nextPaymentDate;
        }
      }

      await subscriptionsService.createSubscription(subscriptionData);
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
  const updateSubscription = async (id: string, subscriptionData: Partial<Subscription>) => {
    setLoading(true);
    try {
      // Si se actualizan datos que afectan paymentDate, recalcular
      if (
        subscriptionData.startDate ||
        subscriptionData.serviceId ||
        subscriptionData.paymentType
      ) {
        const serviceId = subscriptionData.serviceId || subscriptions.find(s => s.id === id)?.serviceId;
        const service = services.find(s => s.id === serviceId);

        if (service) {
          const fullSubscriptionData = {
            ...subscriptions.find(s => s.id === id),
            ...subscriptionData,
          } as Subscription;

          const paymentCalculation = calculatePaymentDate(fullSubscriptionData, service);

          if (paymentCalculation) {
            subscriptionData.paymentDate = paymentCalculation.nextPaymentDate;
          }
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

  // Cancelar suscripción
  const cancelSubscription = async (id: string) => {
    setLoading(true);
    try {
      await subscriptionsService.updateSubscription(id, {
        status: 'cancelled' as const,
        endDate: new Date(),
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

  // Función para forzar recálculo manual de todas las fechas de pago
  const recalculateAllPaymentDates = async () => {
    if (subscriptions.length === 0 || services.length === 0) {
      showSnackbar('No hay datos suficientes para recalcular', 'warning');
      return;
    }

    setLoading(true);
    try {
      const results = recalculatePaymentDates(subscriptions, services);
      
      const updatePromises = results
        .filter(result => result.newPaymentDate && result.subscription.id)
        .map(result => 
          subscriptionsService.updateSubscription(result.subscription.id!, {
            paymentDate: result.newPaymentDate!
          })
        );

      await Promise.all(updatePromises);
      await refreshData();
      
      showSnackbar(`Se recalcularon ${updatePromises.length} fechas de pago`, 'success');
    } catch (error) {
      console.error('Error recalculating all payment dates:', error);
      showSnackbar('Error al recalcular fechas de pago', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    refreshData();
  }, [refreshData]);

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
    
    // Acciones
    refreshData,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    deleteSubscription,
    recalculateAllPaymentDates,
  };
};