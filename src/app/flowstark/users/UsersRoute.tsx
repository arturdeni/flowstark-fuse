import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const Users = lazy(() => import('./Users'));

/**
 * The Users management route.
 */
const UsersRoute: FuseRouteItemType = {
  path: 'users',
  element: <Users />,
};

export default UsersRoute;
