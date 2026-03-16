# Flowstark Fuse — Claude Context

## Stack
- **React** 19 + **Vite** 6 + **TypeScript** 5.4 (strict: false)
- **UI**: MUI 6, Tailwind CSS 4, styled-components 6
- **State**: Redux Toolkit 2.4 + RTK Query, React Hook Form 7 + Zod
- **Routing**: React Router 7 (file-based `*Route.tsx` auto-discovery)
- **Backend**: Firebase 10 (Auth, Firestore compat, Functions) + AWS Amplify 6 + Stripe
- **Tables**: Material React Table + Recharts
- **Exports**: xlsx, html2pdf, crypto-js, SEPA XML (pain.008.001.02)
- **Email**: Brevo (synced via Firebase Functions)

## Arquitectura

```
src/
├── @auth/              Auth layer (Firebase / AWS Cognito / JWT — pluggable)
├── @fuse/              Fuse UI framework core (layouts, nav, hooks, utils)
├── app/
│   ├── (public)/       Rutas públicas: sign-in, sign-up, sign-out, 401, 404
│   └── flowstark/      Módulo principal de negocio
│       ├── components/ (MobileWarningModal)
│       ├── dashboard/
│       ├── services/   (gestión de servicios CRUD)
│       ├── settings/   (panel de configuración + suscripción)
│       ├── subscriptions/
│       ├── tickets/
│       └── users/
├── configs/            firebaseConfig, routesConfig (glob *Route.tsx), navigationConfig
├── services/           Firebase/Firestore + lógica de negocio por dominio
├── store/              Redux store, rootReducer, RTK Query apiService, withSlices/withReducer
├── utils/              apiFetch, helpers
└── types/
```

## Patrones clave
- **Rutas**: auto-descubiertas via `import.meta.glob('/src/app/**/*Route.tsx')` en `routesConfig.tsx`
- **Redux slices**: cargados lazy con `withSlices()` / `withReducer()`
- **Firebase**: inicialización singleton con validación de env vars en `initializeFirebase.tsx`
- **Env vars**: siempre `import.meta.env.VITE_*` (nunca hardcodear keys)

## Módulos de negocio activos
| Módulo | Ruta | Estado |
|---|---|---|
| Dashboard | `/dashboard` | Activo |
| Servicios | `/services` | Activo |
| Suscripciones | `/subscriptions` | Activo — integrado con Stripe |
| Tickets | `/tickets` | Activo — tickets manuales + automáticos |
| Usuarios | `/users` | Activo |
| Settings | `/settings` | Activo — cancelación de suscripción |

## Firebase Functions relevantes
- Integración Stripe (checkout, webhooks, cancelación)
- Sincronización Brevo (listas de email al crear/actualizar usuario)
- Free trial eliminado en último sprint

## Cambios recientes (últimos commits)
1. `f838bf1` MobileWarningModal al abrir en móvil
2. `58334c2` PaymentDateCalculator refactorizado a periodo natural
3. `fe540d3` Cancelación de suscripción desde Settings
4. `9ca35d4` Stripe: eliminar semana de free trial
5. `0fdb61d` Functions Stripe actualizadas a datos de producción
6. `fc35a71` Brevo + Firebase Functions: sincronización de listas de email
7. `a6e6197` Cambio de formato SEPA XML a pain.008.001.02
8. `304b5e6` Corrección tickets manuales + ordenar por TIPO en tabla

## Convenciones obligatorias
- No romper los layouts de Fuse (`FuseLayout`, `FuseNavigation`, etc.)
- Tailwind para layout/spacing; MUI para componentes interactivos
- `useAppDispatch` / `useAppSelector` (nunca `useDispatch`/`useSelector` directos)
- Cleanup en `useEffect`, `useMemo` para derivaciones costosas
- Lazy loading en rutas nuevas (`React.lazy`)
- Nunca exponer API keys; usar `.env` con prefijo `VITE_`
