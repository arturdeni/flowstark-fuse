# Flowstark — Tareas pendientes detectadas

> Actualizado: 2026-03-16. Prioridad: Alta > Media > Baja.

---

## Alta prioridad

### 1. Restricción móvil completa
- **Estado**: MobileWarningModal añadido (commit `f838bf1`), pero solo es un aviso
- **Pendiente**: Bloquear interacción/navegación real en pantallas < breakpoint definido, o redirigir a una vista móvil simplificada
- **Archivos**: `src/app/flowstark/components/MobileWarningModal`

### 2. Gestión de errores en Firebase Functions (producción)
- **Estado**: Functions actualizadas a producción (`0fdb61d`)
- **Pendiente**: Revisar manejo de errores y logging (Cloud Logging) para Stripe webhooks y Brevo sync; añadir alertas de fallo
- **Archivos**: `functions/`

### 3. Validación de estado de suscripción en rutas protegidas
- **Estado**: Cancelación implementada en Settings
- **Pendiente**: Verificar que las rutas del dashboard bloqueen acceso si `subscriptionStatus === 'canceled'` o `past_due`; el guard de rutas actual puede no cubrir este caso
- **Archivos**: `src/app/flowstark/*/` routes, `src/@auth/`

---

## Media prioridad

### 4. Exports SEPA XML — tests de formato
- **Estado**: Migrado a pain.008.001.02 (`a6e6197`)
- **Pendiente**: Añadir tests unitarios de validación del XML generado contra el schema XSD oficial; verificar compatibilidad con bancos
- **Archivos**: utils SEPA (buscar `sepa` en src/utils/)

### 5. PaymentDateCalculator — edge cases
- **Estado**: Refactorizado a periodo natural (`58334c2`)
- **Pendiente**: Cubrir edge cases: meses de 28/29/30/31 días, suscripciones que empiezan el día 31, cambios de periodo a mitad de ciclo
- **Archivos**: `src/services/paymentDateService.ts`

### 6. Sincronización Brevo — manejo de duplicados
- **Estado**: Integración básica funcionando (`fc35a71`)
- **Pendiente**: Gestionar el caso de emails duplicados o cambios de email; añadir retry logic en la Function si Brevo falla
- **Archivos**: `functions/` (Brevo sync)

### 7. Tabla de tickets — rendimiento con volumen alto
- **Estado**: Ordenación por tipo añadida (`304b5e6`)
- **Pendiente**: Implementar paginación server-side o virtualización si el volumen de tickets crece; la carga actual es client-side
- **Archivos**: `src/app/flowstark/tickets/`

### 8. Subscription counter — consistencia
- **Estado**: `subscriptionCounterService.ts` existe
- **Pendiente**: Asegurar que el contador es transaccional (usar Firestore transactions) para evitar race conditions con múltiples actualizaciones simultáneas

---

## Baja prioridad / Mejoras

### 9. TypeScript strict mode
- **Estado**: `strict: false` en tsconfig
- **Pendiente**: Activar `strict: true` progresivamente por módulo; empezar por `services/` y `store/`

### 10. Eliminar dependencia duplicada moment/date-fns
- **Estado**: Ambas librerías coexisten (moment 2.30 + date-fns 4.1)
- **Pendiente**: Migrar usos de `moment` a `date-fns` para reducir bundle size (~70KB)
- **Archivos**: buscar `import moment` en src/

### 11. Variables de entorno AWS Cognito — limpieza
- **Estado**: Variables VITE_AWS_* definidas pero auth primaria es Firebase
- **Pendiente**: Si AWS Cognito no se usa en producción, eliminar las variables y la config para simplificar

### 12. RTK Query — cacheo y invalidación
- **Estado**: `apiService.ts` configurado, pero uso de RTK Query puede ser parcial
- **Pendiente**: Revisar qué servicios usan RTK Query vs llamadas directas a Firebase; consolidar en RTK Query donde tenga sentido

---

## Notas
- Stripe free trial eliminado en producción → verificar que el onboarding UX refleja esto (sin mensajes de "prueba gratuita")
- Firebase compat mode en Firestore → considerar migración a modular SDK para tree-shaking
