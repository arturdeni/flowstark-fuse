import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const Services = lazy(() => import('./Services'));

/**
 * The Services route.
 */
const ServicesRoute: FuseRouteItemType = {
  path: 'services',
  element: <Services />,
};

export default ServicesRoute;
