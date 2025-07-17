// src/app/flowstark/dashboard/hooks/useDashboard.ts
import { useState, useEffect } from 'react';
import { subscriptionsService } from '../../../../services/subscriptionsService';
import { clientsService } from '../../../../services/clientsService';
import { servicesService } from '../../../../services/servicesService';
import { Subscription, Client, Service } from '../../../../types/models';

export interface DashboardMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  totalClients: number;
  activeClients: number;
  totalServices: number;
  activeServices: number;
  monthlyRevenue: number;
  averageSubscriptionValue: number;
  pendingRenewals: number;
  growthRate: number; // Nuevo: tasa de crecimiento mensual
}

export interface MonthlyData {
  month: string;
  subscriptions: number;
  revenue: number;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  activeSubscriptions: number;
}

export interface ServicePopularity {
  name: string;
  subscriptions: number;
  revenue: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'new_subscription' | 'cancellation' | 'new_client' | 'renewal';
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
    cancelledSubscriptions: 0,
    totalClients: 0,
    activeClients: 0,
    totalServices: 0,
    activeServices: 0,
    monthlyRevenue: 0,
    averageSubscriptionValue: 0,
    pendingRenewals: 0,
    growthRate: 0,
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
    const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled');
    const activeClients = clients.filter(c => c.active !== false);
    const activeServices = services.filter(s => (s as any).active !== false);

    // Calcular ingresos mensuales basado en suscripciones activas
    const monthlyRevenue = activeSubscriptions.reduce((total, subscription) => {
      const service = services.find(s => s.id === subscription.serviceId);

      if (service) {
        // Calcular PVP del servicio
        const basePrice = service.basePrice || 0;
        const vat = service.vat || 0;
        const retention = (service as any).retention || 0;
        
        // Precio con IVA
        const priceWithVat = basePrice * (1 + vat / 100);
        // Precio final con retención
        const finalPrice = priceWithVat * (1 - retention / 100);

        // Convertir a ingresos mensuales según la frecuencia
        let monthlyAmount = finalPrice;
        switch (subscription.renewal) {
          case 'quarterly':
            monthlyAmount = finalPrice / 3;
            break;
          case 'biannual':
            monthlyAmount = finalPrice / 6;
            break;
          case 'annual':
            monthlyAmount = finalPrice / 12;
            break;
          case 'four_monthly':
            monthlyAmount = finalPrice / 4;
            break;
          default:
            monthlyAmount = finalPrice;
        }
        return total + monthlyAmount;
      }

      return total;
    }, 0);

    // Calcular valor promedio de suscripción
    const averageSubscriptionValue = activeSubscriptions.length > 0 
      ? monthlyRevenue / activeSubscriptions.length 
      : 0;

    // Calcular próximas renovaciones (próximos 30 días)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const pendingRenewals = activeSubscriptions.filter(subscription => {
      const nextPayment = calculateNextPaymentDate(subscription);
      return nextPayment && nextPayment <= thirtyDaysFromNow;
    }).length;

    // Calcular tasa de crecimiento (últimos 3 meses)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentSubscriptions = subscriptions.filter(s => 
      s.createdAt && new Date(s.createdAt) >= threeMonthsAgo
    );
    const recentCancellations = subscriptions.filter(s => 
      s.status === 'cancelled' && s.endDate && new Date(s.endDate) >= threeMonthsAgo
    );
    
    const growthRate = recentSubscriptions.length > 0 
      ? ((recentSubscriptions.length - recentCancellations.length) / recentSubscriptions.length) * 100
      : 0;

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      cancelledSubscriptions: cancelledSubscriptions.length,
      totalClients: clients.length,
      activeClients: activeClients.length,
      totalServices: services.length,
      activeServices: activeServices.length,
      monthlyRevenue,
      averageSubscriptionValue,
      pendingRenewals,
      growthRate,
    };
  };

  // Función para calcular la próxima fecha de pago
  const calculateNextPaymentDate = (subscription: Subscription): Date | null => {
    if (!subscription.paymentDate) return null;

    const lastPayment = new Date(subscription.paymentDate);
    const nextPayment = new Date(lastPayment);

    switch (subscription.renewal) {
      case 'monthly':
        nextPayment.setMonth(nextPayment.getMonth() + 1);
        break;
      case 'quarterly':
        nextPayment.setMonth(nextPayment.getMonth() + 3);
        break;
      case 'four_monthly':
        nextPayment.setMonth(nextPayment.getMonth() + 4);
        break;
      case 'biannual':
        nextPayment.setMonth(nextPayment.getMonth() + 6);
        break;
      case 'annual':
        nextPayment.setFullYear(nextPayment.getFullYear() + 1);
        break;
      default:
        return null;
    }

    return nextPayment;
  };

  // Función para calcular datos mensuales de los últimos 12 meses
  const calculateMonthlyData = (
    subscriptions: Subscription[],
    services: Service[]
  ): MonthlyData[] => {
    const months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = monthDate.toLocaleDateString('es-ES', { 
        month: 'short',
        year: '2-digit'
      });

      // Suscripciones creadas en este mes
      const newSubscriptions = subscriptions.filter(s => 
        s.createdAt && 
        new Date(s.createdAt) >= monthDate && 
        new Date(s.createdAt) < nextMonth
      ).length;

      // Suscripciones canceladas en este mes
      const cancelledSubscriptions = subscriptions.filter(s => 
        s.status === 'cancelled' &&
        s.endDate && 
        new Date(s.endDate) >= monthDate && 
        new Date(s.endDate) < nextMonth
      ).length;

      // Suscripciones activas al final del mes
      const activeSubscriptions = subscriptions.filter(s => {
        const createdBefore = !s.createdAt || new Date(s.createdAt) < nextMonth;
        const notCancelledOrCancelledAfter = s.status !== 'cancelled' || 
          (s.endDate && new Date(s.endDate) >= nextMonth);
        return createdBefore && notCancelledOrCancelledAfter;
      }).length;

      // Calcular ingresos del mes
      const monthRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((total, subscription) => {
          const service = services.find(srv => srv.id === subscription.serviceId);

          if (service) {
            // Calcular PVP
            const basePrice = service.basePrice || 0;
            const vat = service.vat || 0;
            const retention = (service as any).retention || 0;
            
            const priceWithVat = basePrice * (1 + vat / 100);
            const finalPrice = priceWithVat * (1 - retention / 100);

            // Solo contar si la suscripción estaba activa en este mes
            const wasActiveInMonth = subscription.createdAt && 
              new Date(subscription.createdAt) < nextMonth &&
              (subscription.status !== 'cancelled' || 
               !subscription.endDate || 
               new Date(subscription.endDate) >= monthDate);

            if (wasActiveInMonth) {
              // Convertir a ingresos mensuales
              switch (subscription.renewal) {
                case 'quarterly': return total + (finalPrice / 3);
                case 'four_monthly': return total + (finalPrice / 4);
                case 'biannual': return total + (finalPrice / 6);
                case 'annual': return total + (finalPrice / 12);
                default: return total + finalPrice;
              }
            }
          }

          return total;
        }, 0);

      months.push({
        month: monthName,
        subscriptions: activeSubscriptions,
        revenue: monthRevenue,
        newSubscriptions,
        cancelledSubscriptions,
        activeSubscriptions,
      });
    }

    return months;
  };

  // Función para calcular popularidad de servicios
  const calculateServicePopularity = (
    subscriptions: Subscription[],
    services: Service[]
  ): ServicePopularity[] => {
    const serviceStats = services.map(service => {
      const serviceSubscriptions = subscriptions.filter(s => 
        s.serviceId === service.id && s.status === 'active'
      );

      // Calcular PVP del servicio
      const basePrice = service.basePrice || 0;
      const vat = service.vat || 0;
      const retention = (service as any).retention || 0;
      
      const priceWithVat = basePrice * (1 + vat / 100);
      const finalPrice = priceWithVat * (1 - retention / 100);

      const revenue = serviceSubscriptions.reduce((total, subscription) => {
        switch (subscription.renewal) {
          case 'quarterly': return total + (finalPrice / 3);
          case 'four_monthly': return total + (finalPrice / 4);
          case 'biannual': return total + (finalPrice / 6);
          case 'annual': return total + (finalPrice / 12);
          default: return total + finalPrice;
        }
      }, 0);

      return {
        name: service.name,
        subscriptions: serviceSubscriptions.length,
        revenue,
        percentage: 0, // Se calculará después
      };
    });

    const totalSubscriptions = serviceStats.reduce((sum, s) => sum + s.subscriptions, 0);
    
    return serviceStats
      .map(stat => ({
        ...stat,
        percentage: totalSubscriptions > 0 ? (stat.subscriptions / totalSubscriptions) * 100 : 0
      }))
      .sort((a, b) => b.subscriptions - a.subscriptions)
      .slice(0, 5); // Top 5 servicios
  };

  // Función para calcular actividad reciente
  const calculateRecentActivity = (
    subscriptions: Subscription[],
    clients: Client[]
  ): RecentActivity[] => {
    const activities: RecentActivity[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Actividad de suscripciones
    subscriptions.forEach(subscription => {
      const client = clients.find(c => c.id === subscription.clientId);
      const clientName = client ? 
        `${client.firstName} ${client.lastName}`.trim() || client.fiscalName || 'Cliente' 
        : 'Cliente';

      // Nuevas suscripciones
      if (subscription.createdAt && new Date(subscription.createdAt) >= thirtyDaysAgo) {
        activities.push({
          id: `new-${subscription.id}`,
          type: 'new_subscription',
          clientName,
          serviceName: (subscription as any).serviceInfo?.name || 'Servicio',
          date: new Date(subscription.createdAt),
        });
      }

      // Cancelaciones
      if (subscription.endDate && new Date(subscription.endDate) >= thirtyDaysAgo && subscription.status === 'cancelled') {
        activities.push({
          id: `cancel-${subscription.id}`,
          type: 'cancellation',
          clientName,
          serviceName: (subscription as any).serviceInfo?.name || 'Servicio',
          date: new Date(subscription.endDate),
        });
      }
    });

    // Actividad de nuevos clientes
    clients.forEach(client => {
      if (client.registeredDate && new Date(client.registeredDate) >= thirtyDaysAgo) {
        const clientName = `${client.firstName} ${client.lastName}`.trim() || client.fiscalName || 'Cliente';
        activities.push({
          id: `client-${client.id}`,
          type: 'new_client',
          clientName,
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
        // Calcular PVP del servicio
        const basePrice = service.basePrice || 0;
        const vat = service.vat || 0;
        const retention = (service as any).retention || 0;
        
        const priceWithVat = basePrice * (1 + vat / 100);
        const finalPrice = priceWithVat * (1 - retention / 100);

        const clientName = `${client.firstName} ${client.lastName}`.trim() || client.fiscalName || 'Cliente';

        renewals.push({
          id: `renewal-${subscription.id}`,
          clientName,
          serviceName: service.name,
          date: nextPayment,
          amount: finalPrice,
          subscriptionId: subscription.id!,
        });
      }
    });

    return renewals.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Función principal para cargar todos los datos
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [subscriptions, clients, services] = await Promise.all([
        subscriptionsService.getAllSubscriptions(),
        clientsService.getAllClients(),
        servicesService.getAllServices(),
      ]);

      const calculatedMetrics = calculateMetrics(subscriptions, clients, services);
      const calculatedMonthlyData = calculateMonthlyData(subscriptions, services);
      const calculatedServicePopularity = calculateServicePopularity(subscriptions, services);
      const calculatedRecentActivity = calculateRecentActivity(subscriptions, clients);
      const calculatedUpcomingRenewals = calculateUpcomingRenewals(subscriptions, clients, services);

      setMetrics(calculatedMetrics);
      setMonthlyData(calculatedMonthlyData);
      setServicePopularity(calculatedServicePopularity);
      setRecentActivity(calculatedRecentActivity);
      setUpcomingRenewals(calculatedUpcomingRenewals);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    metrics,
    monthlyData,
    servicePopularity,
    recentActivity,
    upcomingRenewals,
    loading,
    error,
    refreshData: fetchDashboardData,
  };
};