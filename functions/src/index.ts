// functions/src/index.ts

// Exportar funciones de tickets (organizadas en su módulo)
export {
  generateAutomaticTickets,
  generateTicketsManual,
  testFunction,
} from "./tickets";

// Exportar nuevas funciones de Stripe
export {
  createStripeCustomer,
  createCheckoutSession,
  handleStripeWebhook,
  cancelSubscription,
  reactivateSubscription,
} from "./stripe";
