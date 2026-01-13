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
  clientId: string;
  startDate: admin.firestore.Timestamp;
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

    // Obtener clientes para obtener el método de pago
    const clientsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("clients")
      .get();
    const clientsMap = new Map<string, any>();
    clientsSnapshot.docs.forEach((doc) => {
      clientsMap.set(doc.id, { id: doc.id, ...doc.data() });
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

        // ✅ DETECTAR SI ES EL PRIMER TICKET (necesita cálculo proporcional)
        const isFirstTicket = await checkIfFirstTicket(
          userId,
          subscription.id,
          existingTickets
        );

        // ✅ VERIFICAR SI REALMENTE NECESITA CÁLCULO PROPORCIONAL
        // Si startDate == paymentDate, NO es proporcional (es el ticket del período completo)
        const startDate = subscription.startDate.toDate();
        const needsProportional = isFirstTicket && !isSameDate(startDate, paymentDate);

        console.log(`🔍 Verificación de ticket proporcional:`, {
          subscriptionId: subscription.id,
          serviceName: service.name,
          isFirstTicket,
          startDate: startDate.toISOString(),
          paymentDate: paymentDate.toISOString(),
          needsProportional
        });

        // ✅ CALCULAR PERÍODO DE SERVICIO (proporcional o completo)
        const servicePeriod = needsProportional
          ? calculateProportionalPeriod(
              startDate,
              paymentDate,
              subscription.paymentType as PaymentType,
              service.frequency as ServiceFrequency,
              service.name
            )
          : calculateServicePeriod(
              paymentDate,
              subscription.paymentType as PaymentType,
              service.frequency as ServiceFrequency,
              service.name
            );

        // ✅ CALCULAR PRECIO (proporcional o completo)
        const ticketAmount = needsProportional
          ? calculateProportionalPrice(
              startDate,
              paymentDate,
              service.finalPrice || service.basePrice || 0,
              service.frequency as ServiceFrequency
            )
          : service.finalPrice || service.basePrice || 0;

        // Obtener el método de pago del cliente
        const client = clientsMap.get(subscription.clientId);
        const paymentMethod = client?.paymentMethod?.type || undefined;

        // Crear nuevo ticket automático con período de servicio
        const ticketData = {
          subscriptionId: subscription.id,
          dueDate: subscription.paymentDate,
          amount: ticketAmount,
          status: "pending",
          generatedDate: admin.firestore.Timestamp.now(),
          isManual: false,
          description: servicePeriod.description,
          // ✅ NUEVOS CAMPOS: Período de servicio
          serviceStart: admin.firestore.Timestamp.fromDate(servicePeriod.start),
          serviceEnd: admin.firestore.Timestamp.fromDate(servicePeriod.end),
          // ✅ NUEVO CAMPO: Método de pago del cliente
          paymentMethod,
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

        // ✅ ACTUALIZAR paymentDate de la suscripción al próximo pago
        const nextPaymentDate = needsProportional
          ? calculateNextPaymentDateAfterProportional(
              startDate,
              service.frequency as ServiceFrequency,
              subscription.paymentType as PaymentType
            )
          : calculateNextPaymentDate(
              paymentDate,
              getMonthsForFrequency(service.frequency as ServiceFrequency),
              subscription.paymentType as PaymentType
            );

        await db
          .collection("users")
          .doc(userId)
          .collection("subscriptions")
          .doc(subscription.id)
          .update({
            paymentDate: admin.firestore.Timestamp.fromDate(nextPaymentDate),
            updatedAt: admin.firestore.Timestamp.now(),
          });

        console.log(
          `✅ PaymentDate actualizado a: ${formatDate(nextPaymentDate)}`
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

  // Para todos los períodos (incluyendo mensual):
  // El período va desde paymentDate hasta paymentDate + período - 1 día
  // Ejemplo: pago el 10/01 → período del 10/01 al 09/02 (para mensual)
  end.setMonth(end.getMonth() + periodMonths);
  end.setDate(end.getDate() - 1); // Un día antes del próximo pago

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

/**
 * Verifica si este es el primer ticket de una suscripción
 */
async function checkIfFirstTicket(
  userId: string,
  subscriptionId: string,
  existingTickets: any[]
): Promise<boolean> {
  // Buscar si ya existe algún ticket (manual o automático) para esta suscripción
  const hasExistingTickets = existingTickets.some(
    (ticket: any) => ticket.subscriptionId === subscriptionId
  );

  return !hasExistingTickets;
}

/**
 * Calcula el período proporcional para el primer ticket
 * Maneja correctamente todos los tipos de períodos (mensual, trimestral, cuatrimestral, semestral, anual)
 */
function calculateProportionalPeriod(
  startDate: Date,
  paymentDate: Date,
  paymentType: PaymentType,
  frequency: ServiceFrequency,
  serviceName: string
): ServicePeriod {
  const frequencyText = getFrequencyText(frequency);

  // Para pagos anticipados, el período proporcional va desde startDate hasta el final del período ACTUAL
  if (paymentType === PaymentType.ADVANCE) {
    const start = new Date(startDate);

    // Calcular el final del período ACTUAL basándose en la frecuencia
    const end = calculateEndOfCurrentPeriod(startDate, frequency);

    const daysUsed = calculateDaysBetween(start, end);
    const description = `${serviceName} - ${frequencyText} anticipado PROPORCIONAL (${formatDateRange(start, end)}) - ${daysUsed} días`;

    console.log(`📊 Período proporcional calculado:`, {
      serviceName,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      paymentDate: paymentDate.toISOString(),
      daysUsed,
      frequency
    });

    return { start, end, description };
  } else {
    // Para pagos vencidos en el primer ticket
    // El ticket cubre desde startDate hasta paymentDate
    const start = new Date(startDate);
    const end = new Date(paymentDate);

    const daysUsed = calculateDaysBetween(start, end);
    const description = `${serviceName} - ${frequencyText} vencido PROPORCIONAL (${formatDateRange(start, end)}) - ${daysUsed} días`;

    console.log(`📊 Período proporcional vencido calculado:`, {
      serviceName,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      daysUsed,
      frequency
    });

    return { start, end, description };
  }
}

/**
 * Calcula el final del período actual basándose en la fecha de inicio y la frecuencia
 * Ejemplos:
 * - Mensual: 13 enero → 31 enero
 * - Trimestral: 13 enero → 31 marzo
 * - Trimestral: 21 mayo → 30 junio
 * - Anual: 10 febrero → 31 diciembre
 */
function calculateEndOfCurrentPeriod(
  startDate: Date,
  frequency: ServiceFrequency
): Date {
  const end = new Date(startDate);

  switch (frequency) {
    case ServiceFrequency.MONTHLY:
      // Final del mes actual
      end.setMonth(end.getMonth() + 1, 0); // Último día del mes
      break;

    case ServiceFrequency.QUARTERLY:
      // Final del trimestre actual
      const quarterMonth = Math.floor(end.getMonth() / 3) * 3; // 0, 3, 6, 9
      const endQuarterMonth = quarterMonth + 2; // 2, 5, 8, 11
      end.setMonth(endQuarterMonth + 1, 0); // Último día del último mes del trimestre
      break;

    case ServiceFrequency.FOUR_MONTHLY:
      // Final del cuatrimestre actual
      const fourMonthPeriod = Math.floor(end.getMonth() / 4) * 4; // 0, 4, 8
      const endFourMonthPeriod = fourMonthPeriod + 3; // 3, 7, 11
      end.setMonth(endFourMonthPeriod + 1, 0); // Último día del último mes del cuatrimestre
      break;

    case ServiceFrequency.BIANNUAL:
      // Final del semestre actual
      const semester = Math.floor(end.getMonth() / 6) * 6; // 0 o 6
      const endSemester = semester + 5; // 5 o 11
      end.setMonth(endSemester + 1, 0); // Último día del último mes del semestre
      break;

    case ServiceFrequency.ANNUAL:
      // Final del año actual (31 de diciembre)
      end.setMonth(11, 31); // Diciembre 31
      break;

    default:
      // Fallback: final del mes actual
      end.setMonth(end.getMonth() + 1, 0);
  }

  return end;
}

/**
 * Calcula el precio proporcional basado en los días utilizados
 * Calcula los días REALES del período completo basándose en la fecha de referencia
 */
function calculateProportionalPrice(
  startDate: Date,
  paymentDate: Date,
  fullPrice: number,
  frequency: ServiceFrequency
): number {
  // Calcular el final del período ACTUAL
  const end = calculateEndOfCurrentPeriod(startDate, frequency);

  // Calcular días utilizados (inclusivo)
  const daysUsed = calculateDaysBetween(startDate, end);

  // Calcular días totales del período COMPLETO basándose en startDate
  const totalDays = getTotalDaysForFrequency(frequency, startDate);

  // Calcular precio proporcional
  const proportionalPrice = (fullPrice * daysUsed) / totalDays;

  console.log(`💰 Cálculo de precio proporcional:`, {
    startDate: startDate.toISOString(),
    endDate: end.toISOString(),
    paymentDate: paymentDate.toISOString(),
    daysUsed,
    totalDays,
    fullPrice,
    proportionalPrice: Math.round(proportionalPrice * 100) / 100,
    frequency
  });

  return Math.round(proportionalPrice * 100) / 100; // Redondear a 2 decimales
}

/**
 * Calcula los días entre dos fechas (INCLUSIVO)
 * Ejemplo: del 5 al 31 de enero = 27 días (5, 6, 7, ..., 31)
 */
function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDifference = Math.ceil(timeDiff / (1000 * 3600 * 24));
  // Sumar 1 para contar inclusivamente (ambos días cuentan)
  return daysDifference + 1;
}

/**
 * Obtiene el número total de días según la frecuencia
 * Calcula los días REALES del período específico basándose en la fecha de referencia
 */
function getTotalDaysForFrequency(frequency: ServiceFrequency, referenceDate: Date): number {
  // Calcular días reales del período basándose en la fecha de inicio
  const startDate = new Date(referenceDate);
  startDate.setHours(0, 0, 0, 0);

  // Calcular fecha de fin del período sumando la frecuencia
  const endDate = new Date(startDate);

  switch (frequency) {
    case ServiceFrequency.MONTHLY:
      // Para mensual: último día del mismo mes
      endDate.setMonth(endDate.getMonth() + 1, 0);
      break;
    case ServiceFrequency.QUARTERLY:
      // Para trimestral: 3 meses después, último día del mes
      endDate.setMonth(endDate.getMonth() + 3, 0);
      break;
    case ServiceFrequency.FOUR_MONTHLY:
      // Para cuatrimestral: 4 meses después, último día del mes
      endDate.setMonth(endDate.getMonth() + 4, 0);
      break;
    case ServiceFrequency.BIANNUAL:
      // Para semestral: 6 meses después, último día del mes
      endDate.setMonth(endDate.getMonth() + 6, 0);
      break;
    case ServiceFrequency.ANNUAL:
      // Para anual: 1 año después, último día del mes
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setMonth(endDate.getMonth(), 0); // Último día del mes
      break;
    default:
      return 30; // Fallback
  }

  // Calcular días entre startDate (día 1 del mes) y endDate (último día del período)
  // Para calcular el total de días del período completo
  const periodStartDate = new Date(startDate);
  periodStartDate.setDate(1); // Primer día del mes de inicio

  const diffTime = endDate.getTime() - periodStartDate.getTime();
  const totalDays = Math.ceil(diffTime / (1000 * 3600 * 24)) + 1; // +1 para incluir ambos días

  return totalDays;
}

/**
 * Calcula la próxima fecha de pago después de un ticket proporcional
 * Para pagos anticipados: primer día del siguiente período
 * Para pagos vencidos: último día del siguiente período
 * Ejemplos:
 * - Anticipado Mensual: si el período actual termina el 31 enero → próximo pago: 1 febrero
 * - Anticipado Trimestral: si el período actual termina el 31 marzo → próximo pago: 1 abril
 * - Vencido Mensual: si el período actual termina el 31 enero → próximo pago: 28/29 febrero
 * - Vencido Trimestral: si el período actual termina el 31 marzo → próximo pago: 30 junio
 */
function calculateNextPaymentDateAfterProportional(
  startDate: Date,
  frequency: ServiceFrequency,
  paymentType: PaymentType = PaymentType.ADVANCE
): Date {
  // Calcular el final del período actual
  const endOfPeriod = calculateEndOfCurrentPeriod(startDate, frequency);

  // La próxima fecha de pago es el día siguiente al final del período
  const nextPaymentDate = new Date(endOfPeriod);
  nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);

  // ✅ PARA PAGOS VENCIDOS: Ajustar al último día del período siguiente
  if (paymentType === PaymentType.ARREARS) {
    const periodMonths = getMonthsForFrequency(frequency);
    // Sumar el período y ajustar al último día del mes
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + periodMonths, 0);
  }

  return nextPaymentDate;
}

/**
 * Calcula la próxima fecha de pago sumando los meses del período
 * Para pagos vencidos, SIEMPRE calcula el último día del período
 */
function calculateNextPaymentDate(
  currentPaymentDate: Date,
  periodMonths: number,
  paymentType: PaymentType = PaymentType.ADVANCE
): Date {
  const nextDate = new Date(currentPaymentDate);

  // ✅ PARA PAGOS VENCIDOS: SIEMPRE último día del período
  if (paymentType === PaymentType.ARREARS) {
    // Sumar el período y establecer el último día del mes resultante
    nextDate.setMonth(nextDate.getMonth() + periodMonths, 0);
    return nextDate;
  }

  // ✅ PARA PAGOS ANTICIPADOS: Mantener el mismo día del mes
  nextDate.setMonth(nextDate.getMonth() + periodMonths);
  return nextDate;
}
