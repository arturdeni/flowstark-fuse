// src/app/flowstark/services/hooks/useServices.ts
import { useState, useEffect } from 'react';
import { Service } from '../../../../types/models';
import { servicesService } from '../../../../services/servicesService';
import { subscriptionCounterService } from '../../../../services/subscriptionCounterService';

export type SnackbarSeverity = 'error' | 'warning' | 'info' | 'success';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

export const useServices = () => {
  // Estados
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Formulario
  const [formOpen, setFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Confirmación de eliminación
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  // Función para mostrar snackbar
  const showSnackbar = (message: string, severity: SnackbarSeverity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Función para cerrar snackbar
  const closeSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Función para obtener todos los servicios
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

  // Función para refrescar los datos (incluye recálculo de contadores)
  const refreshData = async () => {
    setLoading(true);
    try {
      // Primero recalcular contadores
      await subscriptionCounterService.updateAllServiceSubscriptionCounts();
      // Luego obtener los datos actualizados
      await fetchServices();
    } catch (error) {
      console.error('Error al refrescar datos:', error);
      showSnackbar('Error al refrescar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para recalcular contadores de suscripciones
  const recalculateSubscriptionCounts = async () => {
    setLoading(true);
    try {
      await subscriptionCounterService.updateAllServiceSubscriptionCounts();
      // Refrescar los datos después de recalcular
      await refreshData();
      showSnackbar('Contadores de suscripciones actualizados correctamente', 'success');
    } catch (error) {
      console.error('Error recalculando contadores:', error);
      showSnackbar(
        `Error al recalcular contadores: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
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

  // Handlers para paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handlers para búsqueda
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(0); // Reset página al buscar
  };

  // Handlers para formulario
  const handleOpenForm = (service?: Service) => {
    setSelectedService(service || null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedService(null);
  };

  // Handlers para eliminación
  const handleDeleteClick = (id: string) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (serviceToDelete) {
      await deleteService(serviceToDelete);
      setServiceToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setServiceToDelete(null);
    setDeleteConfirmOpen(false);
  };

  return {
    // Estados
    services,
    filteredServices,
    loading,
    searchTerm,
    snackbar,
    page,
    rowsPerPage,
    formOpen,
    selectedService,
    deleteConfirmOpen,

    // Funciones de datos
    refreshData,
    createService,
    updateService,
    deleteService,
    // recalculateSubscriptionCounts - ELIMINADO (ya no se necesita por separado)

    // Handlers
    handleChangePage,
    handleChangeRowsPerPage,
    handleSearchChange,
    handleOpenForm,
    handleCloseForm,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,

    // Snackbar
    showSnackbar,
    closeSnackbar,
  };
};