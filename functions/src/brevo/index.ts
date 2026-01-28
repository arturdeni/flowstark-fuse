// functions/src/brevo/index.ts
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

// Definir secret para la API key de Brevo
const brevoApiKey = defineSecret("BREVO_API_KEY");

// Configuración de listas de Brevo
const BREVO_LISTS = {
  ALL_USERS: 6, // Todos los usuarios (comunicaciones genéricas)
  FREE_USERS: 9, // Usuarios gratuitos
  PREMIUM_USERS: 10, // Usuarios de pago
};

// URL base de la API de Brevo
const BREVO_API_URL = "https://api.brevo.com/v3";

// Interfaz para datos de usuario de Firestore
interface UserData {
  email?: string;
  name?: string;
  displayName?: string;
  subscription?: {
    plan?: "free" | "premium";
    status?: string;
  };
}

/**
 * Helper: Obtener las listas correspondientes según el plan del usuario
 */
function getListIds(plan?: string): number[] {
  const listIds = [BREVO_LISTS.ALL_USERS]; // Siempre en la lista general

  if (plan === "premium") {
    listIds.push(BREVO_LISTS.PREMIUM_USERS);
  } else {
    // Por defecto (free o sin plan definido) -> lista gratuita
    listIds.push(BREVO_LISTS.FREE_USERS);
  }

  return listIds;
}

/**
 * Helper: Crear o actualizar contacto en Brevo
 */
async function upsertBrevoContact(
  apiKey: string,
  email: string,
  attributes: Record<string, string>,
  listIds: number[],
  unlinkListIds: number[] = []
): Promise<void> {
  // Lazy load axios para evitar timeout durante inicialización
  const axios = (await import("axios")).default;

  try {
    // Crear/actualizar contacto
    await axios.post(
      `${BREVO_API_URL}/contacts`,
      {
        email,
        attributes,
        listIds,
        unlinkListIds,
        updateEnabled: true, // Actualiza si el contacto ya existe
      },
      {
        headers: {
          "api-key": apiKey,
          "accept": "application/json",
          "content-type": "application/json",
        },
      }
    );

    logger.info(`Contacto Brevo sincronizado: ${email}`, { listIds, unlinkListIds });
  } catch (error: any) {
    // Si el error es que el contacto ya existe y updateEnabled no funcionó,
    // intentamos actualizar las listas directamente
    if (error.response?.status === 400 && error.response?.data?.code === "duplicate_parameter") {
      logger.info(`Contacto ya existe, actualizando listas para: ${email}`);
      await updateContactLists(apiKey, email, listIds, unlinkListIds);
    } else {
      logger.error("Error sincronizando contacto en Brevo:", {
        email,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }
}

/**
 * Helper: Actualizar listas de un contacto existente
 */
async function updateContactLists(
  apiKey: string,
  email: string,
  listIds: number[],
  unlinkListIds: number[]
): Promise<void> {
  // Lazy load axios
  const axios = (await import("axios")).default;

  const headers = {
    "api-key": apiKey,
    "accept": "application/json",
    "content-type": "application/json",
  };

  // Añadir a nuevas listas
  for (const listId of listIds) {
    try {
      await axios.post(
        `${BREVO_API_URL}/contacts/lists/${listId}/contacts/add`,
        { emails: [email] },
        { headers }
      );
    } catch (error: any) {
      logger.warn(`Error añadiendo ${email} a lista ${listId}:`, error.response?.data);
    }
  }

  // Quitar de listas antiguas
  for (const listId of unlinkListIds) {
    try {
      await axios.post(
        `${BREVO_API_URL}/contacts/lists/${listId}/contacts/remove`,
        { emails: [email] },
        { headers }
      );
    } catch (error: any) {
      logger.warn(`Error quitando ${email} de lista ${listId}:`, error.response?.data);
    }
  }
}

/**
 * Cloud Function: Sincronizar nuevo usuario a Brevo
 * Se ejecuta cuando se crea un documento en la colección 'users'
 */
export const syncNewUserToBrevo = onDocumentCreated(
  {
    document: "users/{userId}",
    region: "europe-west1",
    secrets: [brevoApiKey],
  },
  async (event) => {
    const userData = event.data?.data() as UserData | undefined;

    if (!userData?.email) {
      logger.warn("Usuario sin email, no se puede sincronizar a Brevo", {
        userId: event.params.userId,
      });
      return;
    }

    const plan = userData.subscription?.plan || "free";
    const listIds = getListIds(plan);

    // Preparar atributos para Brevo
    const attributes: Record<string, string> = {
      FIRSTNAME: userData.name || userData.displayName || "",
      PLAN: plan,
    };

    try {
      await upsertBrevoContact(
        brevoApiKey.value(),
        userData.email,
        attributes,
        listIds
      );

      logger.info(`Nuevo usuario sincronizado a Brevo: ${userData.email}`, {
        userId: event.params.userId,
        plan,
        listIds,
      });
    } catch (error) {
      logger.error("Error en syncNewUserToBrevo:", error);
    }
  }
);

/**
 * Cloud Function: Actualizar contacto en Brevo cuando cambia el plan
 * Se ejecuta cuando se actualiza un documento en la colección 'users'
 */
export const syncUserPlanChangeToBrevo = onDocumentUpdated(
  {
    document: "users/{userId}",
    region: "europe-west1",
    secrets: [brevoApiKey],
  },
  async (event) => {
    const beforeData = event.data?.before.data() as UserData | undefined;
    const afterData = event.data?.after.data() as UserData | undefined;

    if (!afterData?.email) {
      logger.warn("Usuario sin email, no se puede sincronizar a Brevo", {
        userId: event.params.userId,
      });
      return;
    }

    const oldPlan = beforeData?.subscription?.plan || "free";
    const newPlan = afterData.subscription?.plan || "free";

    // Solo sincronizar si cambió el plan
    if (oldPlan === newPlan) {
      return;
    }

    logger.info(`Plan cambiado: ${oldPlan} -> ${newPlan}`, {
      userId: event.params.userId,
      email: afterData.email,
    });

    const newListIds = getListIds(newPlan);

    // Determinar de qué listas quitar al usuario
    let unlinkListIds: number[] = [];
    if (newPlan === "premium") {
      // Pasó a premium: quitar de lista gratuita
      unlinkListIds = [BREVO_LISTS.FREE_USERS];
    } else {
      // Pasó a free: quitar de lista premium
      unlinkListIds = [BREVO_LISTS.PREMIUM_USERS];
    }

    // Preparar atributos actualizados
    const attributes: Record<string, string> = {
      FIRSTNAME: afterData.name || afterData.displayName || "",
      PLAN: newPlan,
    };

    try {
      await upsertBrevoContact(
        brevoApiKey.value(),
        afterData.email,
        attributes,
        newListIds,
        unlinkListIds
      );

      logger.info(`Usuario actualizado en Brevo: ${afterData.email}`, {
        userId: event.params.userId,
        oldPlan,
        newPlan,
        newListIds,
        unlinkListIds,
      });
    } catch (error) {
      logger.error("Error en syncUserPlanChangeToBrevo:", error);
    }
  }
);
