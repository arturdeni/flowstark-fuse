import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

// Nota: asegúrate de que la extensión coincida con el archivo real
const Dashboard = lazy(() => import('./Dashboard'));

const DashboardRoute: FuseRouteItemType = {
  path: 'dashboard',
  element: <Dashboard />,
};

export default DashboardRoute;
