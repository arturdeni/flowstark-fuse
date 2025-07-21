// src/services/paymentDateService.ts
import { Subscription } from '../types/models';
import { subscriptionsService } from './subscriptionsService';
import { servicesService } from './servicesService';
import {
	calculatePaymentDate,
	getSubscriptionsNeedingRecalculation,
	recalculatePaymentDates
} from '../utils/paymentDateCalculator';

export interface PaymentDateUpdateResult {
	updated: number;
	failed: number;
	errors: { subscriptionId: string; error: string }[];
}

class PaymentDateService {
	private updateInProgress = false;

	/**
	 * Ejecuta una actualización automática de fechas de pago para todas las suscripciones
	 */
	async autoUpdatePaymentDates(): Promise<PaymentDateUpdateResult> {
		if (this.updateInProgress) {
			console.log('Actualización de fechas de pago ya en progreso, saltando...');
			return { updated: 0, failed: 0, errors: [] };
		}

		this.updateInProgress = true;
		console.log('Iniciando actualización automática de fechas de pago...');

		try {
			// Obtener todas las suscripciones y servicios
			const [subscriptions, services] = await Promise.all([
				subscriptionsService.getAllSubscriptions(),
				servicesService.getAllServices()
			]);

			// Filtrar suscripciones que necesitan actualización
			const subscriptionsNeedingUpdate = getSubscriptionsNeedingRecalculation(subscriptions, services);

			if (subscriptionsNeedingUpdate.length === 0) {
				console.log('No hay suscripciones que necesiten actualización de fecha de pago');
				return { updated: 0, failed: 0, errors: [] };
			}

			console.log(`Encontradas ${subscriptionsNeedingUpdate.length} suscripciones que necesitan actualización`);

			// Recalcular fechas
			const recalculationResults = recalculatePaymentDates(subscriptionsNeedingUpdate, services);

			// Actualizar en Firestore
			const updateResults = await this.updateSubscriptionsInBatch(recalculationResults);

			console.log(`Actualización completa: ${updateResults.updated} exitosas, ${updateResults.failed} fallidas`);

			return updateResults;
		} catch (error) {
			console.error('Error en actualización automática de fechas de pago:', error);
			return {
				updated: 0,
				failed: 1,
				errors: [{ subscriptionId: 'all', error: error instanceof Error ? error.message : 'Error desconocido' }]
			};
		} finally {
			this.updateInProgress = false;
		}
	}

	/**
	 * Actualiza una suscripción específica con nueva fecha de pago
	 */
	async updateSingleSubscriptionPaymentDate(
		subscriptionId: string,
		serviceId: string
	): Promise<{ success: boolean; newPaymentDate?: Date; error?: string }> {
		try {
			// Obtener la suscripción y el servicio
			const [subscription, service] = await Promise.all([
				subscriptionsService.getSubscriptionById(subscriptionId),
				servicesService.getServiceById(serviceId)
			]);

			if (!service) {
				return { success: false, error: 'Servicio no encontrado' };
			}

			// Calcular nueva fecha de pago
			const calculation = calculatePaymentDate(subscription, service);

			if (!calculation) {
				return { success: false, error: 'No se pudo calcular fecha de pago' };
			}

			// Actualizar en Firestore
			await subscriptionsService.updateSubscription(subscriptionId, {
				paymentDate: calculation.nextPaymentDate
			});

			return {
				success: true,
				newPaymentDate: calculation.nextPaymentDate
			};
		} catch (error) {
			console.error(`Error actualizando fecha de pago para suscripción ${subscriptionId}:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Error desconocido'
			};
		}
	}

	/**
	 * Actualiza múltiples suscripciones en lote
	 */
	private async updateSubscriptionsInBatch(
		recalculationResults: { subscription: Subscription; newPaymentDate: Date | null }[]
	): Promise<PaymentDateUpdateResult> {
		const result: PaymentDateUpdateResult = { updated: 0, failed: 0, errors: [] };

		// Filtrar solo las que tienen nueva fecha y ID válido
		const validUpdates = recalculationResults.filter((result) => result.newPaymentDate && result.subscription.id);

		// Procesar actualizaciones en paralelo (pero limitado)
		const updatePromises = validUpdates.map(async (updateData) => {
			try {
				await subscriptionsService.updateSubscription(updateData.subscription.id!, {
					paymentDate: updateData.newPaymentDate!
				});

				result.updated++;
				console.log(`✅ Fecha de pago actualizada para suscripción ${updateData.subscription.id}`);
			} catch (error) {
				result.failed++;
				const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
				result.errors.push({
					subscriptionId: updateData.subscription.id!,
					error: errorMessage
				});
				console.error(`❌ Error actualizando suscripción ${updateData.subscription.id}:`, error);
			}
		});

		// Esperar a que todas las actualizaciones terminen
		await Promise.allSettled(updatePromises);

		return result;
	}

	/**
	 * Verifica si una suscripción específica necesita actualización de fecha de pago
	 */
	async checkSubscriptionNeedsUpdate(subscriptionId: string): Promise<boolean> {
		try {
			const subscription = await subscriptionsService.getSubscriptionById(subscriptionId);

			if (!subscription.paymentDate) return true;

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const paymentDate = new Date(subscription.paymentDate);
			paymentDate.setHours(0, 0, 0, 0);

			return paymentDate <= today;
		} catch (error) {
			console.error(`Error verificando si suscripción ${subscriptionId} necesita actualización:`, error);
			return false;
		}
	}

	/**
	 * Obtiene estadísticas sobre el estado de las fechas de pago
	 */
	async getPaymentDateStats(): Promise<{
		total: number;
		withValidDates: number;
		needingUpdate: number;
		overdue: number;
	}> {
		try {
			const [subscriptions, services] = await Promise.all([
				subscriptionsService.getAllSubscriptions(),
				servicesService.getAllServices()
			]);

			const activeSubscriptions = subscriptions.filter(
				(sub) => sub.status !== 'cancelled' && sub.status !== 'expired'
			);

			const withValidDates = activeSubscriptions.filter((sub) => sub.paymentDate).length;
			const needingUpdate = getSubscriptionsNeedingRecalculation(activeSubscriptions, services).length;

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const overdue = activeSubscriptions.filter((sub) => {
				if (!sub.paymentDate) return false;

				const paymentDate = new Date(sub.paymentDate);
				paymentDate.setHours(0, 0, 0, 0);
				return paymentDate < today;
			}).length;

			return {
				total: activeSubscriptions.length,
				withValidDates,
				needingUpdate,
				overdue
			};
		} catch (error) {
			console.error('Error obteniendo estadísticas de fechas de pago:', error);
			return { total: 0, withValidDates: 0, needingUpdate: 0, overdue: 0 };
		}
	}

	/**
	 * Programa la ejecución automática de actualización de fechas
	 * Debe ser llamado desde un useEffect o similar en el componente principal
	 */
	scheduleAutoUpdate(intervalMinutes = 60): () => void {
		console.log(`Programando actualización automática cada ${intervalMinutes} minutos`);

		// Ejecutar inmediatamente
		this.autoUpdatePaymentDates();

		// Programar ejecuciones periódicas
		const intervalId = setInterval(
			() => {
				this.autoUpdatePaymentDates();
			},
			intervalMinutes * 60 * 1000
		);

		// Retornar función de limpieza
		return () => {
			console.log('Cancelando actualización automática programada');
			clearInterval(intervalId);
		};
	}
}

// Exportar instancia singleton
export const paymentDateService = new PaymentDateService();
