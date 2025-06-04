// src/app/flowstark/dashboard/hooks/useDashboard.ts
import { useState, useEffect } from 'react';
import { subscriptionsService } from '../../../../services/subscriptionsService';
import { clientsService } from '../../../../services/clientsService';
import { servicesService } from '../../../../services/servicesService';
import { Subscription, Client, Service } from '../../../../types/models';

// Tipos para las métricas del dashboard
export interface DashboardMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  totalClients: number;
  activeClients: number;
  totalServices: number;
  activeServices: number;
  monthlyRevenue: number;
  averageSubscriptionValue: number;
  pendingRenewals: number;
}

export interface MonthlyData {
  month: string;
  subscriptions: number;
  revenue: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
}

export interface ServicePopularity {
  id: string;
  name: string;
  subscribers: number;
  percentage: number;
  revenue: number;
  category: string;
}

export interface RecentActivity {
  id: string;
  type: 'new_subscription' | 'renewal' | 'cancellation' | 'payment' | 'new_client';
  clientName: string;
  serviceName?: string;
  date: Date;
  amount?: number;
}

export interface UpcomingRenewal {
  id: string;
  clientName: string;
  serviceName: string;
  date: Date;
  amount: number;
  subscriptionId: string;
}

export interface UseDashboardReturn {
  // Estado
  metrics: DashboardMetrics;
  monthlyData: MonthlyData[];
  servicePopularity: ServicePopularity[];
  recentActivity: RecentActivity[];
  upcomingRenewals: UpcomingRenewal[];
  loading: boolean;
  error: string | null;

  // Acciones
  refreshData: () => Promise<void>;
}

export const useDashboard = (): UseDashboardReturn => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    pausedSubscriptions: 0,
    cancelledSubscriptions: 0,
    totalClients: 0,
    activeClients: 0,
    totalServices: 0,
    activeServices: 0,
    monthlyRevenue: 0,
    averageSubscriptionValue: 0,
    pendingRenewals: 0,
  });

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [servicePopularity, setServicePopularity] = useState<ServicePopularity[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para calcular las métricas principales
  const calculateMetrics = (
    subscriptions: Subscription[],
    clients: Client[],
    services: Service[]
  ): DashboardMetrics => {
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const pausedSubscriptions = subscriptions.filter(s => s.status === 'paused');
    const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled');
    const activeClients = clients.filter(c => c.active !== false);
    const activeServices = services.filter(s => s.active !== false);

    // Calcular ingresos mensuales basado en suscripciones activas
    const monthlyRevenue = activeSubscriptions.reduce((total, subscription) => {
      const service = services.find(s => s.id === subscription.serviceId);

      if (service) {
        // Convertir a ingresos mensuales según la frecuencia
        let monthlyAmount = service.basePrice;
        switch (subscription.renewal) {
          case 'quarterly':
            monthlyAmount = service.basePrice / 3;
            break;
          case 'biannual':
            monthlyAmount = service.basePrice / 6;
            break;
          case 'annual':
            monthlyAmount = service.basePrice / 12;
            break;
          default:
            monthlyAmount = service.basePrice;
        }
        return total + monthlyAmount;
      }

      return total;
    }, 0);

    // Calcular valor promedio de suscripción
    const averageSubscriptionValue = activeSubscriptions.length > 0 
      ? monthlyRevenue / activeSubscriptions.length 
      : 0;

    // Calcular renovaciones pendientes del próximo mes
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const pendingRenewals = activeSubscriptions.filter(subscription => {
      const nextPayment = calculateNextPaymentDate(subscription);
      return nextPayment && nextPayment <= nextMonth;
    }).length;

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      pausedSubscriptions: pausedSubscriptions.length,
      cancelledSubscriptions: cancelledSubscriptions.length,
      totalClients: clients.length,
      activeClients: activeClients.length,
      totalServices: services.length,
      activeServices: activeServices.length,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      averageSubscriptionValue: Math.round(averageSubscriptionValue * 100) / 100,
      pendingRenewals,
    };
  };

  // Función para calcular la próxima fecha de pago
  const calculateNextPaymentDate = (subscription: Subscription): Date | null => {
    if (!subscription.paymentDate || subscription.status !== 'active') return null;

    const lastPayment = new Date(subscription.paymentDate);
    const nextPayment = new Date(lastPayment);

    switch (subscription.renewal) {
      case 'monthly':
        nextPayment.setMonth(nextPayment.getMonth() + 1);
        break;
      case 'quarterly':
        nextPayment.setMonth(nextPayment.getMonth() + 3);
        break;
      case 'biannual':
        nextPayment.setMonth(nextPayment.getMonth() + 6);
        break;
      case 'annual':
        nextPayment.setFullYear(nextPayment.getFullYear() + 1);
        break;
    }

    return nextPayment;
  };

  // Función para generar datos mensuales de los últimos 6 meses
  const generateMonthlyData = (subscriptions: Subscription[], services: Service[]): MonthlyData[] => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
      
      // Filtrar suscripciones activas en ese mes
      const monthSubscriptions = subscriptions.filter(s => {
        const startDate = new Date(s.startDate);
        const endDate = s.endDate ? new Date(s.endDate) : new Date();
        return startDate <= date && endDate >= date && s.status === 'active';
      });

      // Calcular ingresos del mes
      const revenue = monthSubscriptions.reduce((total, subscription) => {
        const service = services.find(s => s.id === subscription.serviceId);

        if (service) {
          let monthlyAmount = service.basePrice;
          switch (subscription.renewal) {
            case 'quarterly':
              monthlyAmount = service.basePrice / 3;
              break;
            case 'biannual':
              monthlyAmount = service.basePrice / 6;
              break;
            case 'annual':
              monthlyAmount = service.basePrice / 12;
              break;
          }
          return total + monthlyAmount;
        }

        return total;
      }, 0);

      // Contar nuevas suscripciones del mes
      const newSubscriptions = subscriptions.filter(s => {
        const startDate = new Date(s.startDate);
        return startDate.getMonth() === date.getMonth() && 
               startDate.getFullYear() === date.getFullYear();
      }).length;

      // Contar cancelaciones del mes
      const cancelledSubscriptions = subscriptions.filter(s => {
        if (!s.endDate) return false;

        const endDate = new Date(s.endDate);
        return endDate.getMonth() === date.getMonth() && 
               endDate.getFullYear() === date.getFullYear() &&
               s.status === 'cancelled';
      }).length;

      months.push({
        month: monthName,
        subscriptions: monthSubscriptions.length,
        revenue: Math.round(revenue * 100) / 100,
        newSubscriptions,
        cancelledSubscriptions,
      });
    }

    return months;
  };

  // Función para calcular popularidad de servicios
  const calculateServicePopularity = (
    subscriptions: Subscription[],
    services: Service[]
  ): ServicePopularity[] => {
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    
    const serviceStats = services.map(service => {
      const serviceSubscriptions = activeSubscriptions.filter(s => s.serviceId === service.id);
      const subscribers = serviceSubscriptions.length;
      const percentage = activeSubscriptions.length > 0 
        ? Math.round((subscribers / activeSubscriptions.length) * 100) 
        : 0;
      
      // Calcular ingresos mensuales del servicio
      const revenue = serviceSubscriptions.reduce((total, subscription) => {
        let monthlyAmount = service.basePrice;
        switch (subscription.renewal) {
          case 'quarterly':
            monthlyAmount = service.basePrice / 3;
            break;
          case 'biannual':
            monthlyAmount = service.basePrice / 6;
            break;
          case 'annual':
            monthlyAmount = service.basePrice / 12;
            break;
        }
        return total + monthlyAmount;
      }, 0);

      return {
        id: service.id!,
        name: service.name,
        subscribers,
        percentage,
        revenue: Math.round(revenue * 100) / 100,
        category: service.category,
      };
    });

    return serviceStats
      .filter(s => s.subscribers > 0)
      .sort((a, b) => b.subscribers - a.subscribers)
      .slice(0, 5); // Top 5 servicios
  };

  // Función para generar actividad reciente
  const generateRecentActivity = (
    subscriptions: Subscription[],
    clients: Client[]
  ): RecentActivity[] => {
    const activities: RecentActivity[] = [];

    // Actividad de suscripciones (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    subscriptions.forEach(subscription => {
      const client = clients.find(c => c.id === subscription.clientId);

      if (!client) return;

      const clientName = `${client.firstName} ${client.lastName}`;

      // Nueva suscripción
      if (new Date(subscription.startDate) >= thirtyDaysAgo) {
        activities.push({
          id: `sub-${subscription.id}`,
          type: 'new_subscription',
          clientName,
          serviceName: subscription.serviceInfo?.name || 'Servicio',
          date: new Date(subscription.startDate),
        });
      }

      // Cancelación
      if (subscription.endDate && new Date(subscription.endDate) >= thirtyDaysAgo && subscription.status === 'cancelled') {
        activities.push({
          id: `cancel-${subscription.id}`,
          type: 'cancellation',
          clientName,
          serviceName: subscription.serviceInfo?.name || 'Servicio',
          date: new Date(subscription.endDate),
        });
      }
    });

    // Actividad de nuevos clientes
    clients.forEach(client => {
      if (client.registeredDate && new Date(client.registeredDate) >= thirtyDaysAgo) {
        activities.push({
          id: `client-${client.id}`,
          type: 'new_client',
          clientName: `${client.firstName} ${client.lastName}`,
          date: new Date(client.registeredDate),
        });
      }
    });

    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10); // Últimas 10 actividades
  };

  // Función para calcular próximas renovaciones
  const calculateUpcomingRenewals = (
    subscriptions: Subscription[],
    clients: Client[],
    services: Service[]
  ): UpcomingRenewal[] => {
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const renewals: UpcomingRenewal[] = [];

    activeSubscriptions.forEach(subscription => {
      const nextPayment = calculateNextPaymentDate(subscription);

      if (!nextPayment || nextPayment > nextMonth) return;

      const client = clients.find(c => c.id === subscription.clientId);
      const service = services.find(s => s.id === subscription.serviceId);

      if (client && service) {
        renewals.push({
          id: `renewal-${subscription.id}`,
          clientName: `${client.firstName} ${client.lastName}`,
          serviceName: service.name,
          date: nextPayment,
          amount: service.basePrice,
          subscriptionId: subscription.id!,
        });
      }
    });

    return renewals
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 10); // Próximas 10 renovaciones
  };

  // Cargar todos los datos del dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [subscriptionsData, clientsData, servicesData] = await Promise.all([
        subscriptionsService.getAllSubscriptions(),
        clientsService.getAllClients(),
        servicesService.getAllServices(),
      ]);

      // Calcular métricas
      const calculatedMetrics = calculateMetrics(subscriptionsData, clientsData, servicesData);
      setMetrics(calculatedMetrics);

      // Generar datos mensuales
      const monthlyStats = generateMonthlyData(subscriptionsData, servicesData);
      setMonthlyData(monthlyStats);

      // Calcular popularidad de servicios
      const serviceStats = calculateServicePopularity(subscriptionsData, servicesData);
      setServicePopularity(serviceStats);

      // Generar actividad reciente
      const recentActivities = generateRecentActivity(subscriptionsData, clientsData);
      setRecentActivity(recentActivities);

      // Calcular próximas renovaciones
      const renewals = calculateUpcomingRenewals(subscriptionsData, clientsData, servicesData);
      setUpcomingRenewals(renewals);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al inicializar
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Función para refrescar datos
  const refreshData = async () => {
    await loadDashboardData();
  };

  return {
    metrics,
    monthlyData,
    servicePopularity,
    recentActivity,
    upcomingRenewals,
    loading,
    error,
    refreshData,
  };
};