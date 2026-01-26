// src/app/flowstark/tickets/hooks/useSepaRemesa.ts
import { useState, useMemo, useCallback } from 'react';
import { TicketWithRelations } from '../../../../types/models';
import { userProfileService } from '../../../../services/userProfileService';
import {
	validateTicketsForSepa,
	createCreditorFromProfile,
	downloadSepaXML
} from '../utils/sepaXmlGenerator';

interface UseSepaRemesaResult {
	// Estado
	loading: boolean;
	error: string | null;

	// Acciones
	generateRemesa: (ticketsToProcess: TicketWithRelations[]) => Promise<void>;
}

/**
 * Hook para gestionar la generación de remesas SEPA
 */
export const useSepaRemesa = (
	allTickets: TicketWithRelations[]
): UseSepaRemesaResult => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Calcular mapa de tickets pagados por cliente (para determinar FRST/RCUR)
	const clientPaidTicketsMap = useMemo(() => {
		const map = new Map<string, number>();

		for (const ticket of allTickets) {
			if (ticket.status === 'paid' && ticket.paymentMethod === 'direct_debit' && ticket.clientInfo?.id) {
				const clientId = ticket.clientInfo.id;
				map.set(clientId, (map.get(clientId) || 0) + 1);
			}
		}

		return map;
	}, [allTickets]);

	// Función para generar la remesa SEPA
	const generateRemesa = useCallback(async (ticketsToProcess: TicketWithRelations[]) => {
		if (ticketsToProcess.length === 0) {
			setError('No hay tickets válidos para generar la remesa');

			return;
		}

		// Filtrar solo los tickets válidos (con IBAN y mandato)
		const validTickets = ticketsToProcess.filter(
			ticket =>
				ticket.paymentMethod === 'direct_debit' &&
				ticket.status === 'pending' &&
				ticket.clientInfo?.iban &&
				ticket.clientInfo?.sepaMandate
		);

		if (validTickets.length === 0) {
			setError('Ninguno de los tickets seleccionados tiene los datos SEPA completos (IBAN y mandato)');

			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Obtener perfil del usuario (datos del acreedor)
			const profile = await userProfileService.getUserProfile();

			if (!profile) {
				throw new Error('No se pudo obtener el perfil del usuario');
			}

			// Crear datos del acreedor
			const creditor = createCreditorFromProfile(profile);

			if (!creditor) {
				throw new Error(
					'Faltan datos SEPA en tu perfil. Ve a Configuración y completa el IBAN y el Identificador de Acreedor SEPA.'
				);
			}

			// Validar todos los datos
			const validation = validateTicketsForSepa(validTickets, creditor);

			if (!validation.valid) {
				throw new Error(
					`Errores de validación:\n${validation.errors.join('\n')}`
				);
			}

			// Generar y descargar el XML
			downloadSepaXML(validTickets, creditor, clientPaidTicketsMap);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(errorMessage);
			console.error('Error generando remesa SEPA:', err);

			// Re-lanzar el error para que el componente padre pueda manejarlo
			throw err;
		} finally {
			setLoading(false);
		}
	}, [clientPaidTicketsMap]);

	return {
		loading,
		error,
		generateRemesa
	};
};
