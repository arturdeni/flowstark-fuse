// src/app/flowstark/tickets/hooks/useTicketSelection.ts
import { useState, useCallback, useMemo } from 'react';
import { TicketWithRelations } from '../../../../types/models';

export const useTicketSelection = (tickets: TicketWithRelations[]) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Alternar selección de un ticket individual
  const toggleTicketSelection = useCallback((ticketId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  }, []);

  // Seleccionar o deseleccionar todos los tickets visibles
  const toggleSelectAll = useCallback(() => {
    const allIds = tickets.map((t) => t.id!).filter(Boolean);
    const allSelected = allIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [tickets, selectedIds]);

  // Limpiar selección
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Verificar si un ticket está seleccionado
  const isSelected = useCallback(
    (ticketId: string) => selectedIds.has(ticketId),
    [selectedIds]
  );

  // Verificar si todos los tickets visibles están seleccionados
  const isAllSelected = useMemo(() => {
    if (tickets.length === 0) return false;
    const allIds = tickets.map((t) => t.id!).filter(Boolean);
    return allIds.every((id) => selectedIds.has(id));
  }, [tickets, selectedIds]);

  // Verificar si algunos (pero no todos) están seleccionados
  const isIndeterminate = useMemo(() => {
    if (tickets.length === 0) return false;
    const allIds = tickets.map((t) => t.id!).filter(Boolean);
    const selectedCount = allIds.filter((id) => selectedIds.has(id)).length;
    return selectedCount > 0 && selectedCount < allIds.length;
  }, [tickets, selectedIds]);

  // Obtener tickets seleccionados
  const selectedTickets = useMemo(() => {
    return tickets.filter((ticket) => ticket.id && selectedIds.has(ticket.id));
  }, [tickets, selectedIds]);

  return {
    selectedIds,
    selectedTickets,
    selectedCount: selectedIds.size,
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggleTicketSelection,
    toggleSelectAll,
    clearSelection,
  };
};
