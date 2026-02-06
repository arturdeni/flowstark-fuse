// functions/src/stripe/index.ts
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";

// Inicializar Firebase Admin solo si no está inicializado
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

// Definir secrets para las claves de Stripe
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Función helper para obtener instancia de Stripe
const getStripe = () => {
  return new Stripe(stripeSecretKey.value(), {
    apiVersion: "2025-08-27.basil",
  });
};

// ============================================================================
// CONFIGURACIÓN DE STRIPE - PRODUCCIÓN
// ============================================================================
const STRIPE_CONFIG = {
  PRICES: {
    FREE: null,
    PREMIUM: "price_1Sur9yAMZYDRnwT9eD1mDzi5",
  },
};

// Límites por plan
const PLAN_LIMITS = {
  free: {
    maxClients: 50,
    maxServices: 30,
    maxSubscriptions: 30,
  },
  premium: {
    maxClients: -1, // Ilimitado
    maxServices: -1, // Ilimitado
    maxSubscriptions: -1, // Ilimitado
  },
};

/**
 * Cloud Function: Crear cliente en Stripe cuando se registra un usuario
 */
export const createStripeCustomer = onCall(
  {
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 60,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    // Verificar autenticación
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuario no autenticado");
    }

    const userId = request.auth.uid;
    const { email, name } = request.data;
    const stripe = getStripe();

    try {
      // Verificar si ya existe un customer
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (userData?.subscription?.stripeCustomerId) {
        return {
          success: true,
          customerId: userData.subscription.stripeCustomerId,
          message: "Cliente ya existe",
        };
      }

      // Crear cliente en Stripe
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          firebaseUserId: userId,
          source: "flowstark_app",
        },
      });

      // Actualizar documento de usuario con datos de suscripción
      await db
        .collection("users")
        .doc(userId)
        .update({
          subscription: {
            plan: "free",
            status: "active",
            stripeCustomerId: customer.id,
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEnd: null,
            limits: PLAN_LIMITS.free,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

      return {
        success: true,
        customerId: customer.id,
        message: "Cliente creado exitosamente",
      };
    } catch (error) {
      console.error("Error creando cliente Stripe:", error);
      throw new HttpsError("internal", "Error creando cliente en Stripe");
    }
  }
);

/**
 * Cloud Function: Crear sesión de checkout para suscripción premium
 */
export const createCheckoutSession = onCall(
  {
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 60,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuario no autenticado");
    }

    const userId = request.auth.uid;
    const { returnUrl } = request.data;
    const stripe = getStripe();

    try {
      // Obtener datos del usuario
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.subscription?.stripeCustomerId) {
        throw new HttpsError(
          "failed-precondition",
          "Usuario sin cliente Stripe"
        );
      }

      // Verificar si ya tiene suscripción premium activa
      if (
        userData.subscription.plan === "premium" &&
        userData.subscription.status === "active"
      ) {
        throw new HttpsError(
          "already-exists",
          "Ya tienes una suscripción premium activa"
        );
      }

      // Crear sesión de checkout
      const session = await stripe.checkout.sessions.create({
        customer: userData.subscription.stripeCustomerId,
        line_items: [
          {
            price: STRIPE_CONFIG.PRICES.PREMIUM,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}?canceled=true`,
        automatic_tax: { enabled: true },
        tax_id_collection: { enabled: true },
        customer_update: {
          address: "auto",
          name: "auto",
        },
        subscription_data: {
          metadata: {
            firebaseUserId: userId,
          },
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      console.error("Error creando checkout session:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Error creando sesión de checkout");
    }
  }
);

/**
 * Cloud Function: Manejar webhooks de Stripe
 */
export const handleStripeWebhook = onRequest(
  {
    region: "europe-west1",
    memory: "1GiB",
    timeoutSeconds: 300,
    secrets: [stripeSecretKey, stripeWebhookSecret],
    cors: false,
  },
  async (request, response) => {
    const sig = request.headers["stripe-signature"] as string;
    const webhookSecret = stripeWebhookSecret.value();
    const stripe = getStripe();

    let event: Stripe.Event;

    try {
      // Verificar firma del webhook (CRÍTICO para seguridad en producción)
      // Firebase Functions v2 proporciona rawBody automáticamente
      const rawBody = (request as any).rawBody;

      if (!rawBody) {
        console.error("rawBody no disponible");
        response.status(400).send("rawBody not available");
        return;
      }

      if (!sig) {
        console.error("stripe-signature header missing");
        response.status(400).send("Missing stripe-signature header");
        return;
      }

      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      console.log("Webhook verificado correctamente:", event.type);
    } catch (err: any) {
      console.error("Error verificando webhook:", err.message);
      response.status(400).send(`Webhook signature verification failed: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await handleSubscriptionUpdate(
            event.data.object as Stripe.Subscription
          );
          break;

        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          );
          break;

        case "invoice.payment_succeeded":
          await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case "invoice.payment_failed":
          await handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case "checkout.session.completed":
          await handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session
          );
          break;

        default:
          console.log(`Evento no manejado: ${event.type}`);
      }

      response.status(200).send("Webhook procesado exitosamente");
    } catch (error) {
      console.error("Error procesando webhook:", error);
      response.status(500).send("Error procesando webhook");
    }
  }
);

/**
 * Manejar actualización de suscripción
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    console.log("=== handleSubscriptionUpdate START ===");
    console.log("Subscription ID:", subscription.id);
    console.log("Customer ID:", subscription.customer);
    console.log("Metadata:", JSON.stringify(subscription.metadata));

    // Intentar obtener el userId de metadata primero
    let firebaseUserId = subscription.metadata?.firebaseUserId;

    // Si no está en metadata, buscar por stripeCustomerId
    if (!firebaseUserId) {
      console.log("Usuario no encontrado en metadata, buscando por customerId...");
      const customerId = subscription.customer as string;
      console.log("Buscando usuario con customerId:", customerId);

      const usersQuery = await db
        .collection("users")
        .where("subscription.stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

      console.log("Query ejecutada. Resultados:", usersQuery.size);

      if (usersQuery.empty) {
        console.error("Usuario no encontrado para customer:", customerId);
        return;
      }

      firebaseUserId = usersQuery.docs[0].id;
      console.log(`Usuario encontrado: ${firebaseUserId}`);
    }

    console.log("Actualizando usuario:", firebaseUserId);

    const plan =
      subscription.status === "active" || subscription.status === "trialing"
        ? "premium"
        : "free";
    const limits = PLAN_LIMITS[plan];

    console.log("Plan determinado:", plan);
    console.log("Límites:", JSON.stringify(limits));

    // Preparar datos de actualización con validación de timestamps
    const updateData: any = {
      "subscription.plan": plan,
      "subscription.status": subscription.status,
      "subscription.stripeSubscriptionId": subscription.id,
      "subscription.cancelAtPeriodEnd": (subscription as any).cancel_at_period_end || false,
      "subscription.limits": limits,
      "subscription.updatedAt": new Date(),
    };

    // Solo agregar currentPeriodEnd si existe y es válido
    if ((subscription as any).current_period_end) {
      updateData["subscription.currentPeriodEnd"] = new Date(
        (subscription as any).current_period_end * 1000
      );
    }

    // Solo agregar trialEnd si existe y es válido
    if ((subscription as any).trial_end) {
      updateData["subscription.trialEnd"] = new Date(
        (subscription as any).trial_end * 1000
      );
    } else {
      updateData["subscription.trialEnd"] = null;
    }

    await db
      .collection("users")
      .doc(firebaseUserId)
      .update(updateData);

    console.log(
      `Suscripción actualizada para usuario ${firebaseUserId}: ${plan}`
    );
    console.log("=== handleSubscriptionUpdate END SUCCESS ===");
  } catch (error) {
    console.error("=== handleSubscriptionUpdate ERROR ===");
    console.error("Error details:", error);
    throw error;
  }
}

/**
 * Manejar cancelación de suscripción
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const firebaseUserId = subscription.metadata.firebaseUserId;

  if (!firebaseUserId) {
    console.error("Usuario Firebase no encontrado en metadata");
    return;
  }

  await db.collection("users").doc(firebaseUserId).update({
    "subscription.plan": "free",
    "subscription.status": "canceled",
    "subscription.stripeSubscriptionId": null,
    "subscription.currentPeriodEnd": null,
    "subscription.cancelAtPeriodEnd": false,
    "subscription.trialEnd": null,
    "subscription.limits": PLAN_LIMITS.free,
    "subscription.updatedAt": new Date(),
  });

  console.log(`Suscripción cancelada para usuario ${firebaseUserId}`);
}

/**
 * Manejar pago exitoso
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Buscar usuario por customerId
  const usersQuery = await db
    .collection("users")
    .where("subscription.stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (usersQuery.empty) {
    console.error("Usuario no encontrado para customer:", customerId);
    return;
  }

  const userDoc = usersQuery.docs[0];
  const userId = userDoc.id;

  // Registrar pago en historial
  await db
    .collection("users")
    .doc(userId)
    .update({
      "subscription.lastPayment": {
        date: new Date(invoice.created * 1000),
        amount: invoice.amount_paid / 100, // Convertir de centavos a euros
        status: "paid",
        invoiceId: invoice.id,
      },
      "subscription.updatedAt": new Date(),
    });

  console.log(`Pago exitoso registrado para usuario ${userId}`);
}

/**
 * Manejar pago fallido
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Buscar usuario por customerId
  const usersQuery = await db
    .collection("users")
    .where("subscription.stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (usersQuery.empty) {
    console.error("Usuario no encontrado para customer:", customerId);
    return;
  }

  const userDoc = usersQuery.docs[0];
  const userId = userDoc.id;

  // Registrar fallo de pago
  await db
    .collection("users")
    .doc(userId)
    .update({
      "subscription.lastPayment": {
        date: new Date(invoice.created * 1000),
        amount: invoice.amount_due / 100,
        status: "failed",
        invoiceId: invoice.id,
      },
      "subscription.status": "past_due",
      "subscription.updatedAt": new Date(),
    });

  console.log(`Pago fallido registrado para usuario ${userId}`);
}

/**
 * Manejar checkout completado
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("Checkout session completada:", session.id);

  // El evento subscription.created se encargará de actualizar el estado
  // Este evento es principalmente para logging y analytics
}

/**
 * Cloud Function: Cancelar suscripción
 */
export const cancelSubscription = onCall(
  {
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 60,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuario no autenticado");
    }

    const userId = request.auth.uid;
    const { immediately = false } = request.data;
    const stripe = getStripe();

    try {
      // Obtener datos del usuario
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.subscription?.stripeSubscriptionId) {
        throw new HttpsError(
          "failed-precondition",
          "No hay suscripción activa para cancelar"
        );
      }

      // Cancelar en Stripe
      if (immediately) {
        await stripe.subscriptions.cancel(
          userData.subscription.stripeSubscriptionId
        );

        // Actualizar Firestore directamente para feedback inmediato (best-effort, el webhook también lo cubre)
        try {
          await db.collection("users").doc(userId).update({
            "subscription.plan": "free",
            "subscription.status": "canceled",
            "subscription.cancelAtPeriodEnd": false,
            "subscription.currentPeriodEnd": null,
            "subscription.limits": PLAN_LIMITS.free,
            "subscription.updatedAt": new Date(),
          });
        } catch (firestoreError) {
          console.error("Error actualizando Firestore (el webhook lo sincronizará):", firestoreError);
        }
      } else {
        const updatedSubscription = await stripe.subscriptions.update(
          userData.subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          }
        );

        // Actualizar Firestore directamente para feedback inmediato (best-effort, el webhook también lo cubre)
        try {
          const periodEnd = (updatedSubscription as any).current_period_end;

          const updateData: any = {
            "subscription.cancelAtPeriodEnd": true,
            "subscription.updatedAt": new Date(),
          };

          if (periodEnd) {
            updateData["subscription.currentPeriodEnd"] = new Date(periodEnd * 1000);
          }

          await db.collection("users").doc(userId).update(updateData);
        } catch (firestoreError) {
          console.error("Error actualizando Firestore (el webhook lo sincronizará):", firestoreError);
        }
      }

      return {
        success: true,
        message: immediately
          ? "Suscripción cancelada inmediatamente"
          : "Suscripción se cancelará al final del período",
      };
    } catch (error) {
      console.error("Error cancelando suscripción:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Error cancelando suscripción");
    }
  }
);

/**
 * Cloud Function: Reactivar suscripción cancelada
 */
export const reactivateSubscription = onCall(
  {
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 60,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Usuario no autenticado");
    }

    const userId = request.auth.uid;
    const stripe = getStripe();

    try {
      // Obtener datos del usuario
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.subscription?.stripeSubscriptionId) {
        throw new HttpsError(
          "failed-precondition",
          "No hay suscripción para reactivar"
        );
      }

      if (!userData.subscription.cancelAtPeriodEnd) {
        throw new HttpsError(
          "failed-precondition",
          "La suscripción no está programada para cancelación"
        );
      }

      // Reactivar en Stripe
      await stripe.subscriptions.update(
        userData.subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        }
      );

      // Actualizar Firestore directamente para feedback inmediato (best-effort, el webhook también lo cubre)
      try {
        await db.collection("users").doc(userId).update({
          "subscription.cancelAtPeriodEnd": false,
          "subscription.updatedAt": new Date(),
        });
      } catch (firestoreError) {
        console.error("Error actualizando Firestore (el webhook lo sincronizará):", firestoreError);
      }

      return {
        success: true,
        message: "Suscripción reactivada exitosamente",
      };
    } catch (error) {
      console.error("Error reactivando suscripción:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Error reactivando suscripción");
    }
  }
);
