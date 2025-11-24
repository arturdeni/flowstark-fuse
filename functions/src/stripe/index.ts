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

// Configuración de planes (actualizar con tus Price IDs reales)
const STRIPE_CONFIG = {
  PRICES: {
    FREE: "price_1S960mPIRf1r6f8yrA1yI9V4", // ID de precio para plan gratuito (puede ser null o un plan muy básico)
    PREMIUM: "price_1S961xPIRf1r6f8yY2AcgSgF", // ID de precio para plan premium
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
          trial_period_days: 7, // 7 días de prueba gratuita
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
  },
  async (request, response) => {
    const sig = request.headers["stripe-signature"] as string;
    const webhookSecret = stripeWebhookSecret.value();
    const stripe = getStripe();

    let event: Stripe.Event;

    try {
      // Verificar firma del webhook
      event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
    } catch (err) {
      console.error("Error verificando webhook:", err);
      response.status(400).send(`Webhook signature verification failed`);
      return;
    }

    console.log("Webhook recibido:", event.type);

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
  const firebaseUserId = subscription.metadata.firebaseUserId;

  if (!firebaseUserId) {
    console.error("Usuario Firebase no encontrado en metadata");
    return;
  }

  const plan =
    subscription.status === "active" || subscription.status === "trialing"
      ? "premium"
      : "free";
  const limits = PLAN_LIMITS[plan];

  await db
    .collection("users")
    .doc(firebaseUserId)
    .update({
      "subscription.plan": plan,
      "subscription.status": subscription.status,
      "subscription.stripeSubscriptionId": subscription.id,
      "subscription.currentPeriodEnd": new Date(
        (subscription as any).current_period_end * 1000
      ),
      "subscription.cancelAtPeriodEnd": (subscription as any)
        .cancel_at_period_end,
      "subscription.trialEnd": (subscription as any).trial_end
        ? new Date((subscription as any).trial_end * 1000)
        : null,
      "subscription.limits": limits,
      "subscription.updatedAt": new Date(),
    });

  console.log(
    `Suscripción actualizada para usuario ${firebaseUserId}: ${plan}`
  );
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
      } else {
        await stripe.subscriptions.update(
          userData.subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          }
        );
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
