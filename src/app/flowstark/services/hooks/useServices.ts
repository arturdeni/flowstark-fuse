// src/app/flowstark/services/hooks/useServices.ts
import { useState, useEffect } from 'react';
import { servicesService } from '../../../../services/servicesService';
import { Service } from '../../../../types/models';

export interface UseServicesReturn {
  // Estado
  services: Service[];
  filteredServices: Service[];
  searchTerm: string;
  loading: boolean;
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  };

  // Acciones
  setSearchTerm: (term: string) => void;
  refreshData: () => Promise<void>;
  createService: (
    serviceData: Omit<
      Service,
      'id' | 'active' | 'activeSubscriptions' | 'createdAt' | 'updatedAt'
    >
  ) => Promise<void>;
  updateService: (id: string, serviceData: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  showSnackbar: (
    message: string,
    severity?: 'success' | 'error' | 'warning' | 'info'
  ) => void;
  closeSnackbar: () => void;
}

export const useServices = (): UseServicesReturn => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Cargar servicios desde Firestore
  const fetchServices = async () => {
    setLoading(true);
    try {
      const servicesData = await servicesService.getAllServices();
      setServices(servicesData);
      setFilteredServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
      showSnackbar(
        'Error al cargar los servicios. Por favor, inténtalo de nuevo.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchServices();
  }, []);

  // Filtrado de servicios según término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchTerm, services]);

  // Función para refrescar los datos
  const refreshData = async () => {
    await fetchServices();
  };

  // Crear nuevo servicio
  const createService = async (
    serviceData: Omit<
      Service,
      'id' | 'active' | 'activeSubscriptions' | 'createdAt' | 'updatedAt'
    >
  ) => {
    setLoading(true);
    try {
      const newService = await servicesService.createService(serviceData);
      setServices([...services, newService]);
      showSnackbar('Servicio creado correctamente', 'success');
      await refreshData();
    } catch (error) {
      console.error('Error creating service:', error);
      showSnackbar(
        `Error al crear el servicio: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar servicio existente
  const updateService = async (id: string, serviceData: Partial<Service>) => {
    setLoading(true);
    try {
      const updatedService = await servicesService.updateService(
        id,
        serviceData
      );
      setServices(
        services.map((service) =>
          service.id === updatedService.id ? updatedService : service
        )
      );
      showSnackbar('Servicio actualizado correctamente', 'success');
      await refreshData();
    } catch (error) {
      console.error('Error updating service:', error);
      showSnackbar(
        `Error al actualizar el servicio: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar servicio
  const deleteService = async (id: string) => {
    setLoading(true);
    try {
      await servicesService.deleteService(id);
      setServices(services.filter((service) => service.id !== id));
      showSnackbar('Servicio eliminado correctamente', 'success');
      await refreshData();
    } catch (error) {
      console.error('Error deleting service:', error);
      showSnackbar(
        `Error al eliminar el servicio: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
      throw error;
    } finally {
      setLoading(false);
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
    services,
    filteredServices,
    searchTerm,
    loading,
    snackbar,

    // Acciones
    setSearchTerm,
    refreshData,
    createService,
    updateService,
    deleteService,
    showSnackbar,
    closeSnackbar,
  };
};
