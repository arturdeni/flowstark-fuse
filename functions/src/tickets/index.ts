// functions/src/tickets/index.ts - VERSIÓN ORGANIZADA
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Inicializar Firebase Admin solo si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Interfaces para TypeScript
interface Subscription {
  id: string;
  serviceId: string;
  paymentDate: admin.firestore.Timestamp;
  paymentType: "advance" | "arrears";
  status: string;
  [key: string]: any;
}

interface Service {
  id: string;
  name: string;
  basePrice: number;
  finalPrice?: number;
  frequency: "monthly" | "quarterly" | "four_monthly" | "biannual" | "annual";
  [key: string]: any;
}

interface ServicePeriod {
  start: Date;
  end: Date;
  description: string;
}

// Enums para tipos de pago y frecuencia
enum PaymentType {
  ADVANCE = "advance",
  ARREARS = "arrears",
}

enum ServiceFrequency {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  FOUR_MONTHLY = "four_monthly",
  BIANNUAL = "biannual",
  ANNUAL = "annual",
}

/**
 * Función simple de prueba para verificar que el deployment funciona
 */
export const testFunction = onCall(
  {
    region: "europe-west1",
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (request) => {
    return {
      message: "Test function works!",
      timestamp: new Date().toISOString(),
      version: "2.0 - Con períodos de servicio",
    };
  }
);

/**
 * Cloud Function que se ejecuta diariamente para generar tickets automáticamente
 */
export const generateAutomaticTickets = onSchedule(
  {
    schedule: "0 9 * * *",
    timeZone: "Europe/Madrid",
    memory: "512MiB",
    timeoutSeconds: 300,
    region: "europe-west1",
  },
  async (event) => {
    console.log(
      "🚀 Iniciando generación automática de tickets con períodos de servicio..."
    );

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log(
        `📅 Procesando suscripciones con paymentDate: ${today.toISOString()}`
      );

      // Obtener todos los usuarios
      const usersSnapshot = await db.collection("users").get();

      let totalGenerated = 0;
      let totalErrors = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        console.log(`👤 Procesando usuario: ${userId}`);

        try {
          const result = await generateTicketsForUser(userId, today, tomorrow);
          totalGenerated += result.generated;
          totalErrors += result.errors;

          console.log(
            `✅ Usuario ${userId}: ${result.generated} tickets generados, ${result.errors} errores`
          );
        } catch (error) {
          console.error(`❌ Error procesando usuario ${userId}:`, error);
          totalErrors++;
        }
      }

      console.log(
        `🎉 Generación completada: ${totalGenerated} tickets generados, ${totalErrors} errores`
      );
    } catch (error) {
      console.error("💥 Error general en generación automática:", error);
      throw new Error("Error en la generación automática de tickets");
    }
  }
);

/**
 * Genera tickets para un usuario específico
 */
async function generateTicketsForUser(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  let generated = 0;
  let errors = 0;

  try {
    // Obtener suscripciones activas con paymentDate en el rango de hoy
    const subscriptionsRef = db
      .collection("users")
      .doc(userId)
      .collection("subscriptions");
    const subscriptionsSnapshot = await subscriptionsRef
      .where("status", "==", "active")
      .where("paymentDate", ">=", admin.firestore.Timestamp.fromDate(startDate))
      .where("paymentDate", "<", admin.firestore.Timestamp.fromDate(endDate))
      .get();

    if (subscriptionsSnapshot.empty) {
      console.log(
        `ℹ️ No hay suscripciones con vencimiento hoy para usuario ${userId}`
      );
      return { generated, errors };
    }

    // Obtener servicios para calcular precios y períodos
    const servicesSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("services")
      .get();
    const servicesMap = new Map<string, Service>();
    servicesSnapshot.docs.forEach((doc) => {
      servicesMap.set(doc.id, { id: doc.id, ...doc.data() } as Service);
    });

    // Obtener tickets existentes para evitar duplicados
    const ticketsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("tickets")
      .get();
    const existingTickets = ticketsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Procesar cada suscripción
    for (const subscriptionDoc of subscriptionsSnapshot.docs) {
      try {
        const subscription = {
          id: subscriptionDoc.id,
          ...subscriptionDoc.data(),
        } as Subscription;
        const service = servicesMap.get(subscription.serviceId);

        if (!service) {
          console.error(
            `❌ Servicio ${subscription.serviceId} no encontrado para suscripción ${subscription.id}`
          );
          errors++;
          continue;
        }

        // Verificar si ya existe un ticket automático para esta fecha
        const paymentDate = subscription.paymentDate.toDate();
        const existingTicket = existingTickets.find((ticket: any) => {
          if (!ticket.subscriptionId || ticket.isManual) return false;
          const ticketDate = ticket.dueDate?.toDate();
          return (
            ticket.subscriptionId === subscription.id &&
            ticketDate &&
            isSameDate(ticketDate, paymentDate)
          );
        });

        if (existingTicket) {
          console.log(
            `ℹ️ Ya existe ticket para suscripción ${subscription.id} en fecha ${paymentDate.toISOString()}`
          );
          continue;
        }

        // ✅ CALCULAR PERÍODO DE SERVICIO
        const servicePeriod = calculateServicePeriod(
          paymentDate,
          subscription.paymentType as PaymentType,
          service.frequency as ServiceFrequency,
          service.name
        );

        // Crear nuevo ticket automático con período de servicio
        const ticketData = {
          subscriptionId: subscription.id,
          dueDate: subscription.paymentDate,
          amount: service.finalPrice || service.basePrice || 0,
          status: "pending",
          generatedDate: admin.firestore.Timestamp.now(),
          isManual: false,
          description: servicePeriod.description,
          // ✅ NUEVOS CAMPOS: Período de servicio
          serviceStart: admin.firestore.Timestamp.fromDate(servicePeriod.start),
          serviceEnd: admin.firestore.Timestamp.fromDate(servicePeriod.end),
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        };

        // Guardar en Firebase
        await db
          .collection("users")
          .doc(userId)
          .collection("tickets")
          .add(ticketData);

        console.log(
          `✅ Ticket generado para suscripción ${subscription.id}: ${service.name} - €${ticketData.amount}`
        );
        console.log(
          `   📅 Período: ${formatDate(servicePeriod.start)} - ${formatDate(servicePeriod.end)}`
        );
        generated++;
      } catch (error) {
        console.error(
          `❌ Error procesando suscripción ${subscriptionDoc.id}:`,
          error
        );
        errors++;
      }
    }
  } catch (error) {
    console.error(`💥 Error general para usuario ${userId}:`, error);
    errors++;
  }

  return { generated, errors };
}

/**
 * Cloud Function HTTP para generar tickets manualmente
 */
export const generateTicketsManual = onCall(
  {
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 300,
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("Usuario no autenticado");
    }

    const userId = request.auth.uid;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const result = await generateTicketsForUser(userId, today, tomorrow);
      return {
        success: true,
        generated: result.generated,
        errors: result.errors,
        message: `${result.generated} tickets generados con períodos de servicio, ${result.errors} errores`,
      };
    } catch (error) {
      console.error("Error en generación manual:", error);
      throw new Error("Error generando tickets");
    }
  }
);

// ===== UTILIDADES PARA CÁLCULO DE PERÍODOS DE SERVICIO =====

/**
 * Calcula el período de servicio que cubre un ticket
 */
function calculateServicePeriod(
  paymentDate: Date,
  paymentType: PaymentType,
  frequency: ServiceFrequency,
  serviceName: string
): ServicePeriod {
  const periodMonths = getMonthsForFrequency(frequency);
  const frequencyText = getFrequencyText(frequency);

  if (paymentType === PaymentType.ADVANCE) {
    return calculateAdvancePeriod(
      paymentDate,
      periodMonths,
      frequencyText,
      serviceName
    );
  } else {
    return calculateArrearsPeriod(
      paymentDate,
      periodMonths,
      frequencyText,
      serviceName
    );
  }
}

/**
 * Calcula período para pago anticipado
 * El ticket generado el día X cubre desde X hasta X + período
 */
function calculateAdvancePeriod(
  paymentDate: Date,
  periodMonths: number,
  frequencyText: string,
  serviceName: string
): ServicePeriod {
  const start = new Date(paymentDate);
  const end = new Date(paymentDate);

  if (periodMonths === 1) {
    // Para mensual: del primer día del mes siguiente al último día de ese mes
    start.setDate(1); // Primer día del mes de pago
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); // Último día del mes siguiente
  } else {
    // Para otros períodos: desde la fecha de pago + período completo
    end.setMonth(end.getMonth() + periodMonths);
    end.setDate(end.getDate() - 1); // Un día antes para no solapar
  }

  const description = `${serviceName} - ${frequencyText} anticipado (${formatDateRange(start, end)})`;
  return { start, end, description };
}

/**
 * Calcula período para pago vencido
 * El ticket generado el último día del mes cubre el período anterior
 */
function calculateArrearsPeriod(
  paymentDate: Date,
  periodMonths: number,
  frequencyText: string,
  serviceName: string
): ServicePeriod {
  const end = new Date(paymentDate);
  const start = new Date(paymentDate);

  if (periodMonths === 1) {
    // Para mensual vencido: del primer día del mes actual al último día
    start.setDate(1); // Primer día del mes de pago
    // end ya es el último día del mes (paymentDate)
  } else {
    // Para otros períodos: retroceder el período completo
    start.setMonth(start.getMonth() - periodMonths);
    start.setDate(start.getDate() + 1); // Un día después para no solapar
  }

  const description = `${serviceName} - ${frequencyText} vencido (${formatDateRange(start, end)})`;
  return { start, end, description };
}

/**
 * Convierte la frecuencia en número de meses
 */
function getMonthsForFrequency(frequency: ServiceFrequency): number {
  switch (frequency) {
    case ServiceFrequency.MONTHLY:
      return 1;
    case ServiceFrequency.QUARTERLY:
      return 3;
    case ServiceFrequency.FOUR_MONTHLY:
      return 4;
    case ServiceFrequency.BIANNUAL:
      return 6;
    case ServiceFrequency.ANNUAL:
      return 12;
    default:
      console.warn(`Frecuencia no reconocida: ${frequency}, usando 1 mes`);
      return 1;
  }
}

/**
 * Obtiene el texto legible de la frecuencia
 */
function getFrequencyText(frequency: ServiceFrequency): string {
  switch (frequency) {
    case ServiceFrequency.MONTHLY:
      return "Mensual";
    case ServiceFrequency.QUARTERLY:
      return "Trimestral";
    case ServiceFrequency.FOUR_MONTHLY:
      return "Cuatrimestral";
    case ServiceFrequency.BIANNUAL:
      return "Semestral";
    case ServiceFrequency.ANNUAL:
      return "Anual";
    default:
      return frequency;
  }
}

/**
 * Formatea un rango de fechas para mostrar en la descripción
 */
function formatDateRange(start: Date, end: Date): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Formatea una fecha individual
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Función auxiliar para comparar fechas (solo día, mes, año)
 */
function isSameDate(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
