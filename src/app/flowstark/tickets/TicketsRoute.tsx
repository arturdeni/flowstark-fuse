// src/app/flowstark/tickets/TicketsRoute.tsx
import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const Tickets = lazy(() => import('./Tickets'));

/**
 * The Tickets management route.
 */
const TicketsRoute: FuseRouteItemType = {
  path: 'tickets',
  element: <Tickets />,
};

export default TicketsRoute;