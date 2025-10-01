import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const Settings = lazy(() => import('./Settings'));

/**
 * The Settings route.
 */
const SettingsRoute: FuseRouteItemType = {
  path: 'settings',
  element: <Settings />,
};

export default SettingsRoute;
