// src/app/flowstark/users/hooks/useUsers.ts
import { useState, useEffect } from 'react';
import { clientsService } from '../../../../services/clientsService';
import { subscriptionsService } from '../../../../services/subscriptionsService';
import { Client, Subscription } from '../../../../types/models';

// Tipo extendido para cliente con contador de suscripciones
export type ClientWithSubscriptions = Client & {
  subscriptionCount: number;
};

export interface UseUsersReturn {
  // Estado
  users: ClientWithSubscriptions[];
  filteredUsers: ClientWithSubscriptions[];
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
  createUser: (
    userData: Omit<Client, 'id' | 'registeredDate' | 'active' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateUser: (id: string, userData: Partial<Client>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  showSnackbar: (
    message: string,
    severity?: 'success' | 'error' | 'warning' | 'info'
  ) => void;
  closeSnackbar: () => void;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<ClientWithSubscriptions[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ClientWithSubscriptions[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Función para calcular el conteo de suscripciones para un cliente
  const calculateSubscriptionCount = (clientId: string, subscriptionsList: Subscription[]): number => {
    if (!clientId || !subscriptionsList.length) {
      return 0;
    }

    return subscriptionsList.filter(
      subscription => 
        subscription.clientId === clientId && 
        subscription.status === 'active'
    ).length;
  };

  // Función para procesar usuarios con conteo de suscripciones
  const processUsersWithSubscriptions = (clientsList: Client[], subscriptionsList: Subscription[]): ClientWithSubscriptions[] => {
    return clientsList.map(client => ({
      ...client,
      subscriptionCount: calculateSubscriptionCount(client.id || '', subscriptionsList)
    }));
  };

  // Cargar usuarios desde Firestore
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const clientsData = await clientsService.getAllClients();
      const processedUsers = processUsersWithSubscriptions(clientsData, subscriptions);
      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showSnackbar(
        'Error al cargar los clientes. Por favor, inténtalo de nuevo.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Cargar suscripciones desde Firestore
  const fetchSubscriptions = async () => {
    try {
      const subscriptionsData = await subscriptionsService.getAllSubscriptions();
      setSubscriptions(subscriptionsData);
      return subscriptionsData;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  };

  // Función para actualizar usuarios con nuevos datos de suscripciones
  const updateUsersWithSubscriptions = async (clientsList?: Client[]) => {
    try {
      const [clientsData, subscriptionsData] = await Promise.all([
        clientsList ? Promise.resolve(clientsList) : clientsService.getAllClients(),
        subscriptionsService.getAllSubscriptions()
      ]);
      
      setSubscriptions(subscriptionsData);
      const processedUsers = processUsersWithSubscriptions(clientsData, subscriptionsData);
      setUsers(processedUsers);
      setFilteredUsers(processedUsers);
    } catch (error) {
      console.error('Error updating users with subscriptions:', error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await updateUsersWithSubscriptions();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filtrado de usuarios según término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone?.includes(searchTerm)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  // Función para refrescar los datos
  const refreshData = async () => {
    await updateUsersWithSubscriptions();
  };

  // Crear nuevo usuario
  const createUser = async (
    userData: Omit<Client, 'id' | 'registeredDate' | 'active' | 'createdAt' | 'updatedAt'>
  ) => {
    setLoading(true);
    try {
      const newClient = await clientsService.createClient(userData);
      showSnackbar('Cliente creado correctamente', 'success');
      await updateUsersWithSubscriptions();
    } catch (error) {
      console.error('Error creating client:', error);
      showSnackbar(
        `Error al crear el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar usuario existente
  const updateUser = async (id: string, userData: Partial<Client>) => {
    setLoading(true);
    try {
      await clientsService.updateClient(id, userData);
      showSnackbar('Cliente actualizado correctamente', 'success');
      await updateUsersWithSubscriptions();
    } catch (error) {
      console.error('Error updating client:', error);
      showSnackbar(
        `Error al actualizar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'error'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar usuario
  const deleteUser = async (id: string) => {
    setLoading(true);
    try {
      await clientsService.deleteClient(id);
      showSnackbar('Cliente eliminado correctamente', 'success');
      await updateUsersWithSubscriptions();
    } catch (error) {
      console.error('Error deleting client:', error);
      showSnackbar(
        `Error al eliminar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
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
    users,
    filteredUsers,
    searchTerm,
    loading,
    snackbar,

    // Acciones
    setSearchTerm,
    refreshData,
    createUser,
    updateUser,
    deleteUser,
    showSnackbar,
    closeSnackbar,
  };
};