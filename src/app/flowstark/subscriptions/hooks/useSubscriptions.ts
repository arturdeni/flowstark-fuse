// src/app/flowstark/subscriptions/hooks/useSubscriptions.ts
import { useState, useEffect } from 'react';
import { Subscription, Client, Service } from '../../../../types/models';
import { subscriptionsService } from '../../../../services/subscriptionsService';
import { clientsService } from '../../../../services/clientsService';
import { servicesService } from '../../../../services/servicesService';
import { calculatePaymentDate } from '../../../../utils/paymentDateCalculator';

// Tipo extendido para incluir información relacionada
export interface SubscriptionWithRelations extends Subscription {
  clientInfo?: Client;
  serviceInfo?: Service;
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

  // Estado para snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Función para mostrar mensajes
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
    } catch {
      return null;
    }
  };

  // Cargar datos iniciales
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar todos los datos en paralelo
      const [subscriptionsData, clientsData, servicesData] = await Promise.all([
        subscriptionsService.getAllSubscriptions(),
        clientsService.getAllClients(),
        servicesService.getAllServices()
      ]);

      // Procesar suscripciones con fechas seguras
      const processedSubscriptions = subscriptionsData.map(sub => {
        const startDate = safeParseDate(sub.startDate) || new Date();
        const endDate = safeParseDate(sub.endDate);
        const paymentDate = safeParseDate(sub.paymentDate);
        const createdAt = safeParseDate(sub.createdAt);
        const updatedAt = safeParseDate(sub.updatedAt);

        return {
          ...sub,
          startDate,
          endDate,
          paymentDate,
          createdAt,
          updatedAt,
        };
      });

      // Combinar con información de clientes y servicios
      const combinedSubscriptions = processedSubscriptions.map(subscription => {
        const clientInfo = clientsData.find(client => client.id === subscription.clientId);
        const serviceInfo = servicesData.find(service => service.id === subscription.serviceId);

        // Calcular fecha de pago si no existe
        let finalPaymentDate = subscription.paymentDate;

        if (!finalPaymentDate && serviceInfo) {
          const calculated = calculatePaymentDate(subscription, serviceInfo);

          if (calculated) {
            finalPaymentDate = calculated;
          }
        }

        return {
          ...subscription,
          paymentDate: finalPaymentDate,
          clientInfo,
          serviceInfo,
        } as SubscriptionWithRelations;
      });

      setSubscriptions(combinedSubscriptions);
      setClients(clientsData);
      setServices(servicesData);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
      showSnackbar('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
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
        return 'expired';
      } else if (endDate >= today) {
        return 'ending';
      }
    }

    return subscription.status === 'cancelled' ? 'cancelled' : 'active';
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

        return clientName.includes(searchLower) || serviceName.includes(searchLower);
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
  const createSubscription = async (subscriptionData: Omit<Subscription, 'id'>) => {
    setLoading(true);
    try {
      // Buscar el servicio para calcular la fecha de pago inicial
      const service = services.find(s => s.id === subscriptionData.serviceId);
      
      const finalData = { ...subscriptionData };
      
      if (service) {
        const paymentDate = calculatePaymentDate(finalData as Subscription, service);

        if (paymentDate) {
          finalData.paymentDate = paymentDate;
        }
      }

      await subscriptionsService.createSubscription(finalData);
      await loadData(); // Recargar todos los datos
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
      if (subscriptionData.startDate || subscriptionData.serviceId || subscriptionData.paymentType) {
        const subscription = subscriptions.find(s => s.id === id);
        const serviceId = subscriptionData.serviceId || subscription?.serviceId;
        const service = services.find(s => s.id === serviceId);

        if (service && subscription) {
          const fullSubscriptionData = {
            ...subscription,
            ...subscriptionData,
          } as Subscription;

          const paymentDate = calculatePaymentDate(fullSubscriptionData, service);

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

  // Cancelar suscripción
  const cancelSubscription = async (id: string) => {
    setLoading(true);
    try {
      await subscriptionsService.updateSubscription(id, {
        status: 'cancelled' as const,
        endDate: new Date(),
      });
      await loadData(); // Recargar todos los datos
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