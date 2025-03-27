import { lazy } from "react";
import { FuseRouteItemType } from "@fuse/utils/FuseUtils";

const Subscriptions = lazy(() => import("./Subscriptions"));

/**
 * The Subscriptions management route.
 */
const SubscriptionsRoute: FuseRouteItemType = {
  path: "flowstark/subscriptions",
  element: <Subscriptions />,
};

export default SubscriptionsRoute;
