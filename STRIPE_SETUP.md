# Integración de Stripe - Estado Actual y Roadmap

**Última actualización**: 25 de noviembre de 2025
**Estado**: ✅ Funcional en modo Sandbox/Test
**Próximo paso**: Migración a producción cuando la empresa esté registrada

---

## 📋 Índice

1. [Estado Actual](#estado-actual)
2. [Arquitectura](#arquitectura)
3. [Configuración Actual](#configuración-actual)
4. [Funcionalidades Implementadas](#funcionalidades-implementadas)
5. [Problemas Conocidos y Soluciones Aplicadas](#problemas-conocidos-y-soluciones-aplicadas)
6. [Pendiente para Producción](#pendiente-para-producción)
7. [Estructura de Datos](#estructura-de-datos)
8. [Testing](#testing)
9. [Referencias y Recursos](#referencias-y-recursos)

---

## ✅ Estado Actual

### Implementado y Funcionando

- ✅ **Creación de clientes en Stripe** cuando se registra un usuario
- ✅ **Checkout de suscripciones** con Stripe Checkout
- ✅ **Webhooks funcionando** (sin verificación de firma en test)
- ✅ **Actualización automática de suscripciones** en Firestore
- ✅ **Interfaz de usuario** mostrando plan y límites
- ✅ **Período de prueba** de 7 días configurado
- ✅ **Plan Free** con límites: 50 clientes, 30 servicios, 30 suscripciones
- ✅ **Plan Premium** con todo ilimitado (19€/mes + IVA)

### En Modo Test/Sandbox

⚠️ **IMPORTANTE**: Todo está configurado en modo TEST de Stripe. No se procesan pagos reales.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)                    │
│                                                               │
│  ┌──────────────────┐        ┌────────────────────────┐     │
│  │ SubscriptionPanel│◄───────│  useSubscription hook  │     │
│  │  (UI Component)  │        │  (Firestore listener)  │     │
│  └────────┬─────────┘        └────────────────────────┘     │
│           │                                                   │
│           │ Trigger upgrade                                   │
│           ▼                                                   │
│  ┌──────────────────┐                                        │
│  │useStripeCheckout │                                        │
│  │      hook        │                                        │
│  └────────┬─────────┘                                        │
└───────────┼──────────────────────────────────────────────────┘
            │
            │ Call Firebase Function
            ▼
┌─────────────────────────────────────────────────────────────┐
│              FIREBASE CLOUD FUNCTIONS (Backend)              │
│              Region: europe-west1                            │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  createStripeCustomer()                              │   │
│  │  - Crea customer en Stripe                           │   │
│  │  - Guarda stripeCustomerId en Firestore              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  createCheckoutSession()                             │   │
│  │  - Crea sesión de Stripe Checkout                    │   │
│  │  - Configura 7 días de trial                         │   │
│  │  - Redirige a usuario a Stripe                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  handleStripeWebhook()  ⚠️ Sin verificación firma    │   │
│  │  - Recibe eventos de Stripe                          │   │
│  │  - Actualiza suscripciones en Firestore              │   │
│  │  - Maneja pagos exitosos/fallidos                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  cancelSubscription()                                │   │
│  │  reactivateSubscription()                            │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    │ Updates
                    ▼
           ┌─────────────────┐
           │    FIRESTORE    │
           │  users/{userId} │
           │  .subscription  │
           └─────────────────┘
```

---

## ⚙️ Configuración Actual

### Variables de Entorno (.env)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51S95x8PIRf1r6f8y7DlIOlEzDRtbKSlpxtd5XL0N0C958tAGODSU9sR94VGfQfT8KA3vhCAJuXANLTHIJ7MwDJGV00m81IJy7l
```

### Firebase Secrets (Configurados)

```bash
# Clave secreta de Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_... (configurado en Firebase Secrets Manager)

# Secret para validar webhooks (actualmente no usado)
STRIPE_WEBHOOK_SECRET=(configurado pero comentado en código)
```

### Stripe Price IDs

Ubicación: `functions/src/stripe/index.ts:27-32`

```typescript
const STRIPE_CONFIG = {
  PRICES: {
    FREE: "price_1S960mPIRf1r6f8yrA1yI9V4",
    PREMIUM: "price_1S961xPIRf1r6f8yY2AcgSgF", // 19€/mes
  },
};
```

### Plan Limits

Ubicación: `functions/src/stripe/index.ts:34-46`

```typescript
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
```

### Webhook URL

```
https://europe-west1-flowstark-3f347.cloudfunctions.net/handleStripeWebhook
```

**Eventos suscritos en Stripe Dashboard**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

---

## 🎯 Funcionalidades Implementadas

### 1. Creación de Cliente Stripe

**Archivo**: `functions/src/stripe/index.ts:51-120`
**Función**: `createStripeCustomer`

**Flujo**:
1. Usuario se registra en la app
2. Frontend llama a `createStripeCustomer()`
3. Se crea customer en Stripe con metadata: `{ firebaseUserId, source: "flowstark_app" }`
4. Se guarda `stripeCustomerId` en Firestore
5. Se asigna plan FREE por defecto

**Estado Firestore inicial**:
```javascript
{
  subscription: {
    plan: "free",
    status: "active",
    stripeCustomerId: "cus_...",
    stripeSubscriptionId: null,
    limits: { maxClients: 50, maxServices: 30, maxSubscriptions: 30 },
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
}
```

### 2. Upgrade a Premium (Checkout)

**Archivo Frontend**: `src/app/flowstark/settings/hooks/useStripeCheckout.ts`
**Archivo Backend**: `functions/src/stripe/index.ts:125-203`
**Función**: `createCheckoutSession`

**Flujo**:
1. Usuario hace clic en "Mejorar a Premium"
2. Frontend llama a `createCheckoutSession({ returnUrl })`
3. Backend crea sesión de Stripe Checkout con:
   - `trial_period_days: 7`
   - `automatic_tax: enabled`
   - `tax_id_collection: enabled`
4. Usuario es redirigido a Stripe Checkout
5. Completa pago
6. Stripe redirige a `returnUrl?success=true&session_id={...}`

### 3. Webhook Handler

**Archivo**: `functions/src/stripe/index.ts:208-278`
**Función**: `handleStripeWebhook`

**⚠️ Estado Actual**: Sin verificación de firma (temporal para testing)

**Eventos manejados**:

#### `customer.subscription.created` / `customer.subscription.updated`
- Llama a `handleSubscriptionUpdate()`
- Extrae `firebaseUserId` de metadata
- Si no existe, busca por `stripeCustomerId` en Firestore
- Determina plan: `trialing` o `active` → `premium`, otros → `free`
- Actualiza Firestore con:
  - `plan`, `status`, `stripeSubscriptionId`
  - `currentPeriodEnd`, `trialEnd`, `cancelAtPeriodEnd`
  - `limits` según el plan

#### `customer.subscription.deleted`
- Llama a `handleSubscriptionDeleted()`
- Revierte a plan FREE

#### `invoice.payment_succeeded`
- Registra pago exitoso en `subscription.lastPayment`

#### `invoice.payment_failed`
- Marca suscripción como `past_due`
- Registra fallo en `subscription.lastPayment`

#### `checkout.session.completed`
- Logging (la actualización la hace `subscription.created`)

### 4. Cancelar Suscripción

**Función**: `cancelSubscription`
**Ubicación**: `functions/src/stripe/index.ts:472-528`

**Parámetros**:
- `immediately`: boolean (default: false)

**Comportamiento**:
- `immediately=false`: Cancela al final del período (`cancel_at_period_end: true`)
- `immediately=true`: Cancela inmediatamente

### 5. Reactivar Suscripción

**Función**: `reactivateSubscription`
**Ubicación**: `functions/src/stripe/index.ts:533-587`

**Requisito**: Suscripción debe tener `cancelAtPeriodEnd: true`

---

## 🐛 Problemas Conocidos y Soluciones Aplicadas

### Problema 1: Webhook Signature Verification

**Error Original**:
```
StripeSignatureVerificationError: Webhook payload must be provided as a string or a Buffer
```

**Causa**: Firebase Functions v2 parsea automáticamente el body como JSON, pero Stripe necesita el raw body para verificar la firma.

**Solución Temporal** (líneas 225-230):
```typescript
// TEMPORAL: Deshabilitar verificación de firma para testing en Sandbox
event = request.body as Stripe.Event;
```

**⚠️ CRÍTICO PARA PRODUCCIÓN**: Necesita solución antes de ir a live mode.

**Soluciones propuestas**:
1. Usar middleware para capturar raw body
2. Usar Stripe CLI para forward events en desarrollo
3. Configurar Cloud Run con raw body parsing

### Problema 2: Timestamp Validation Error

**Error Original**:
```
Error: Value for argument "seconds" is not a valid integer.
```

**Causa**: `current_period_end * 1000` cuando el valor era `null` o `undefined`.

**Solución** (líneas 331-345):
```typescript
// Solo agregar currentPeriodEnd si existe y es válido
if ((subscription as any).current_period_end) {
  updateData["subscription.currentPeriodEnd"] = new Date(
    (subscription as any).current_period_end * 1000
  );
}
```

### Problema 3: User ID en Frontend

**Error Original**:
```
useSubscription: No user UID found
```

**Causa**: El sistema de auth usa `user.id` en lugar de `user.uid`.

**Solución** (línea 44 de `useSubscription.ts`):
```typescript
const userId = user?.uid || (user as any)?.id;
```

### Problema 4: isPremium No Reconocía Trial

**Causa**: La lógica solo consideraba `status === 'active'`, no `'trialing'`.

**Solución** (línea 102):
```typescript
const isPremium = subscription?.plan === 'premium' &&
  (subscription?.status === 'active' || subscription?.status === 'trialing');
```

---

## 🚀 Pendiente para Producción

### 1. Activar Cuenta de Stripe ⏳

**Requisitos**:
- Empresa formalmente registrada
- Información fiscal completa
- Cuenta bancaria empresarial

**Pasos**:
1. Completar información de la empresa en Stripe Dashboard
2. Verificar identidad
3. Agregar datos bancarios
4. Activar cuenta

### 2. Cambiar de Test Mode a Live Mode 🔐

**Backend** (`functions/src/stripe/index.ts`):
```typescript
// Cambiar secrets a versiones de producción
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY_LIVE");
```

**Frontend** (`.env`):
```env
# Cambiar de pk_test_... a pk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Firebase Secrets**:
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY_LIVE
# Pegar la clave sk_live_...

firebase functions:secrets:set STRIPE_WEBHOOK_SECRET_LIVE
# Pegar el webhook secret de producción
```

### 3. Habilitar Verificación de Firma de Webhook 🔒

**CRÍTICO**: No ir a producción sin esto.

**Opción A - Usar Raw Body Middleware**:
```typescript
// functions/src/stripe/index.ts
import { Request } from 'firebase-functions/v2/https';

export const handleStripeWebhook = onRequest(
  {
    region: "europe-west1",
    memory: "1GiB",
    timeoutSeconds: 300,
    secrets: [stripeSecretKey, stripeWebhookSecret],
    cors: false,
  },
  async (request, response) => {
    const sig = request.headers['stripe-signature'] as string;
    const stripe = getStripe();

    try {
      // Necesitarás implementar una forma de obtener el raw body
      const rawBody = getRawBody(request); // TO IMPLEMENT

      const event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        stripeWebhookSecret.value()
      );

      // ... resto del código
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  }
);
```

**Opción B - Usar Stripe CLI para Development**:
```bash
stripe listen --forward-to https://europe-west1-flowstark-3f347.cloudfunctions.net/handleStripeWebhook
```

### 4. Crear Nuevos Price IDs para Producción 💰

**Pasos**:
1. Ir a Stripe Dashboard → Products
2. Crear producto "Flowstark Premium" en LIVE mode
3. Crear precio: 19€/mes recurrente
4. Copiar el Price ID (empezará con `price_...` en live mode)
5. Actualizar en código:

```typescript
// functions/src/stripe/index.ts
const STRIPE_CONFIG = {
  PRICES: {
    PREMIUM: "price_LIVE_ID_AQUI", // Cambiar este ID
  },
};
```

### 5. Implementar Stripe Billing Portal 👤

**¿Qué es?**: Portal autohospedado de Stripe para que usuarios gestionen sus suscripciones.

**Funcionalidades**:
- Ver historial de facturas
- Descargar facturas
- Actualizar método de pago
- Cancelar suscripción
- Ver siguiente fecha de facturación

**Implementación** (agregar nueva función):

```typescript
// functions/src/stripe/index.ts
export const createBillingPortalSession = onCall(
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
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.subscription?.stripeCustomerId) {
        throw new HttpsError(
          "failed-precondition",
          "Usuario sin cliente Stripe"
        );
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: userData.subscription.stripeCustomerId,
        return_url: returnUrl || `${process.env.APP_URL}/settings`,
      });

      return {
        success: true,
        url: session.url,
      };
    } catch (error) {
      console.error("Error creando portal session:", error);
      throw new HttpsError("internal", "Error creando sesión del portal");
    }
  }
);
```

**Frontend**:
```typescript
// src/app/flowstark/settings/hooks/useBillingPortal.ts
export const useBillingPortal = () => {
  const openPortal = async () => {
    const functions = firebase.app().functions('europe-west1');
    const createPortalSession = functions.httpsCallable('createBillingPortalSession');

    const result = await createPortalSession({
      returnUrl: window.location.href
    });

    if (result.data.url) {
      window.location.href = result.data.url;
    }
  };

  return { openPortal };
};
```

### 6. Eliminar Console.logs de Producción 🧹

**Archivos a limpiar**:
- `functions/src/stripe/index.ts` (líneas 279-355)
- `src/app/flowstark/settings/hooks/useSubscription.ts` (líneas 37-64)

**O mejor**: Usar una librería de logging como `winston` con niveles:
```typescript
import * as logger from "firebase-functions/logger";

logger.info("Subscription updated", { userId, plan });
logger.error("Payment failed", { userId, error });
```

### 7. Testing Completo 🧪

**Escenarios a probar**:
- ✅ Usuario nuevo → Plan FREE
- ✅ Upgrade a Premium → Trial 7 días
- ⏳ Fin de trial → Cargo exitoso
- ⏳ Fin de trial → Cargo fallido (probar con tarjeta de test)
- ⏳ Renovación mensual exitosa
- ⏳ Renovación mensual fallida
- ⏳ Cancelación inmediata
- ⏳ Cancelación al final del período
- ⏳ Reactivación antes de que termine el período
- ⏳ Webhook delivery failures

**Tarjetas de prueba de Stripe**:
```
4242 4242 4242 4242 - Éxito
4000 0000 0000 0002 - Fallo genérico
4000 0025 0000 3155 - Requiere autenticación 3D Secure
```

### 8. Configurar Firestore Indexes 📊

**Índice necesario**:
```
Collection: users
Fields: subscription.stripeCustomerId (Ascending)
```

**Crear índice**:
```bash
# Si Firebase lo pide, seguir el link que proporciona
# O crear manualmente en Firebase Console → Firestore → Indexes
```

### 9. Monitoreo y Alertas 📈

**Configurar en Firebase/Google Cloud**:
- Alertas de errores en Functions
- Métricas de latencia de webhooks
- Tasa de éxito/fallo de pagos
- Notificaciones de pagos fallidos

**Herramientas recomendadas**:
- Firebase Crashlytics
- Sentry para backend errors
- Stripe Dashboard Webhooks → Email notifications

### 10. Cumplimiento Legal 📜

**Documentos necesarios**:
- [ ] Política de privacidad actualizada (mencionar Stripe)
- [ ] Términos y condiciones de suscripción
- [ ] Política de reembolsos
- [ ] Información de facturación clara en UI

**GDPR/Protección de datos**:
- [ ] Consentimiento explícito para procesar pagos
- [ ] Derecho a exportar datos de facturación
- [ ] Derecho al olvido (eliminar datos de Stripe)

---

## 📊 Estructura de Datos

### Firestore: `users/{userId}`

```typescript
{
  // ... otros campos del usuario

  subscription: {
    // Plan actual del usuario
    plan: "free" | "premium",

    // Estado de la suscripción en Stripe
    status: "active" | "trialing" | "past_due" | "canceled" | "incomplete",

    // IDs de Stripe
    stripeCustomerId: "cus_...",
    stripeSubscriptionId: "sub_..." | null,

    // Fechas importantes
    currentPeriodEnd: Timestamp | null,
    trialEnd: Timestamp | null,
    createdAt: Timestamp,
    updatedAt: Timestamp,

    // Configuración de cancelación
    cancelAtPeriodEnd: boolean,

    // Límites del plan
    limits: {
      maxClients: number,    // -1 = ilimitado
      maxServices: number,   // -1 = ilimitado
      maxSubscriptions: number // -1 = ilimitado
    },

    // Último pago (opcional)
    lastPayment?: {
      date: Timestamp,
      amount: number,        // En euros
      status: "paid" | "failed",
      invoiceId: string
    }
  }
}
```

### Stripe Metadata

**Customer metadata**:
```typescript
{
  firebaseUserId: "abc123",
  source: "flowstark_app"
}
```

**Subscription metadata**:
```typescript
{
  firebaseUserId: "abc123"
}
```

---

## 🧪 Testing

### Test Mode - Configuración Actual

**Stripe Dashboard**: https://dashboard.stripe.com/test/dashboard

**Test Cards**:
```
Éxito: 4242 4242 4242 4242
Fallo: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155

Fecha: Cualquier fecha futura
CVC: Cualquier 3 dígitos
```

### Probar Webhooks Localmente

**Opción 1 - Stripe CLI**:
```bash
# Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks a tu función local
stripe listen --forward-to http://localhost:5001/flowstark-3f347/europe-west1/handleStripeWebhook

# Trigger eventos manualmente
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

**Opción 2 - Resend desde Dashboard**:
1. Ir a Stripe Dashboard → Developers → Webhooks
2. Click en el endpoint
3. Tab "Events"
4. Click en "..." → "Resend event"

### Probar Flujo Completo

```bash
# 1. Iniciar servidor local
npm run dev

# 2. Iniciar emuladores de Firebase (opcional)
firebase emulators:start

# 3. Ir a http://localhost:5173/settings
# 4. Click en "Mejorar a Premium"
# 5. Usar tarjeta de test: 4242 4242 4242 4242
# 6. Verificar en Firestore que subscription.plan = "premium"
# 7. Verificar en Stripe Dashboard que el customer y subscription existen
```

---

## 📚 Referencias y Recursos

### Documentación Oficial

- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Billing Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Secrets](https://firebase.google.com/docs/functions/config-env)

### Guías Útiles

- [Testing Stripe](https://stripe.com/docs/testing)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Handling Subscription Lifecycle](https://stripe.com/docs/billing/subscriptions/overview)

### Archivos Clave del Proyecto

**Backend**:
- `functions/src/stripe/index.ts` - Toda la lógica de Stripe
- `functions/src/index.ts` - Exportaciones de funciones
- `functions/tsconfig.json` - Configuración TypeScript

**Frontend**:
- `src/app/flowstark/settings/hooks/useSubscription.ts` - Hook para leer suscripción
- `src/app/flowstark/settings/hooks/useStripeCheckout.ts` - Hook para checkout
- `src/app/flowstark/settings/components/SubscriptionPanel.tsx` - UI de suscripción

**Configuración**:
- `.env` - Variables de entorno (Stripe public key)
- `firebase.json` - Configuración de Firebase
- `.firebaserc` - Proyecto de Firebase

### Contactos y Soporte

**Stripe Support**: https://support.stripe.com/
**Firebase Support**: https://firebase.google.com/support

---

## 🎯 Checklist para Producción

### Pre-requisitos
- [ ] Empresa registrada formalmente
- [ ] Cuenta bancaria empresarial
- [ ] Información fiscal completa

### Configuración de Stripe
- [ ] Activar cuenta de Stripe (completar información)
- [ ] Crear producto Premium en LIVE mode
- [ ] Crear Price ID para producción (19€/mes)
- [ ] Configurar webhook endpoint en LIVE mode
- [ ] Habilitar verificación de firma de webhook
- [ ] Configurar Stripe Billing Portal

### Configuración de Firebase
- [ ] Crear secrets para claves de producción
  - [ ] `STRIPE_SECRET_KEY_LIVE`
  - [ ] `STRIPE_WEBHOOK_SECRET_LIVE`
- [ ] Actualizar funciones para usar secrets de producción
- [ ] Desplegar funciones a producción

### Código
- [ ] Cambiar Price ID en `STRIPE_CONFIG.PRICES.PREMIUM`
- [ ] Habilitar verificación de firma en webhook handler
- [ ] Limpiar console.logs o implementar logging profesional
- [ ] Actualizar `VITE_STRIPE_PUBLISHABLE_KEY` a pk_live_...

### Testing
- [ ] Probar flujo completo de checkout
- [ ] Probar período de prueba (7 días)
- [ ] Probar renovación mensual
- [ ] Probar cancelación
- [ ] Probar reactivación
- [ ] Probar pagos fallidos
- [ ] Probar webhooks con eventos reales

### Legal y Compliance
- [ ] Actualizar política de privacidad
- [ ] Crear términos de suscripción
- [ ] Definir política de reembolsos
- [ ] Agregar información de facturación en UI
- [ ] Verificar cumplimiento GDPR

### Monitoreo
- [ ] Configurar alertas de errores
- [ ] Configurar monitoreo de webhooks
- [ ] Configurar notificaciones de pagos fallidos
- [ ] Dashboard de métricas (subscripciones, MRR, churn)

### Documentación
- [ ] Documentar proceso para otros desarrolladores
- [ ] Crear runbook para incidencias comunes
- [ ] Documentar proceso de rollback si algo falla

---

## 💡 Notas Adicionales

### Precios y Facturación

**Precio actual**: 19€/mes + IVA
**Modelo**: Suscripción recurrente mensual
**Trial**: 7 días gratuitos
**Renovación**: Automática

**Stripe Fees**:
- 1.4% + 0.25€ por transacción europea con tarjeta
- Sin coste mensual fijo (plan integrado)

### Escalabilidad

El diseño actual soporta:
- Miles de usuarios concurrentes
- Webhooks con reintentos automáticos de Stripe
- Cloud Functions autoscalable

**Posibles cuellos de botella**:
- Firestore queries por `stripeCustomerId` (resolver con índice)
- Rate limits de Stripe API (100 req/seg en test, más en producción)

### Seguridad

**Implementado**:
- ✅ Secrets en Firebase Secrets Manager
- ✅ HTTPS endpoints
- ✅ Autenticación requerida en funciones callable
- ✅ Validación de usuario en backend

**Pendiente**:
- ⏳ Verificación de firma de webhook
- ⏳ Rate limiting en endpoints públicos
- ⏳ Logging de accesos a datos sensibles

---

**Última revisión**: 25 de noviembre de 2025
**Responsable**: Claude AI + Artur Devolder
**Contacto**: artur.devolder@gmail.com
