// src/app/flowstark/users/hooks/useUsers.ts
import { useState, useEffect } from 'react';
import { clientsService } from '../../../../services/clientsService';
import { Client } from '../../../../types/models';

export interface UseUsersReturn {
  // Estado
  users: Client[];
  filteredUsers: Client[];
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
  getSubscriptionCount: (client: Client) => number;
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<Client[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  // Cargar usuarios desde Firestore
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const clientsData = await clientsService.getAllClients();
      setUsers(clientsData);
      setFilteredUsers(clientsData);
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

  // Cargar datos iniciales
  useEffect(() => {
    fetchUsers();
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
    await fetchUsers();
  };

  // Crear nuevo usuario
  const createUser = async (
    userData: Omit<Client, 'id' | 'registeredDate' | 'active' | 'createdAt' | 'updatedAt'>
  ) => {
    setLoading(true);
    try {
      const newClient = await clientsService.createClient(userData);
      setUsers([...users, newClient]);
      showSnackbar('Cliente creado correctamente', 'success');
      await refreshData();
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
      const updatedClient = await clientsService.updateClient(id, userData);
      setUsers(users.map(user =>
        user.id === updatedClient.id ? updatedClient : user
      ));
      showSnackbar('Cliente actualizado correctamente', 'success');
      await refreshData();
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
      setUsers(users.filter(user => user.id !== id));
      showSnackbar('Cliente eliminado correctamente', 'success');
      await refreshData();
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

  // Calcular el número de suscripciones para cada cliente
  // Por ahora devolvemos 0, pero esto podría expandirse para hacer una consulta real
  const getSubscriptionCount = (client: Client): number => {
    // Aquí podrías implementar una lógica para obtener el recuento de suscripciones
    // Por ejemplo, hacer una consulta a Firestore o mantener un contador en el cliente
    return 0;
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
    getSubscriptionCount,
  };
};