import { FuseNavItemType } from "@fuse/core/FuseNavigation/types/FuseNavItemType";

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: FuseNavItemType[] = [
  {
    id: "flowstark.dashboard",
    title: "Dashboard",
    type: "item",
    icon: "heroicons-outline:chart-pie",
    url: "dashboard",
  },
  {
    id: "flowstark.users",
    title: "Clientes",
    type: "item",
    icon: "heroicons-outline:users",
    url: "users",
  },
  {
    id: "flowstark.services",
    title: "Servicios",
    type: "item",
    icon: "heroicons-outline:cube",
    url: "services",
  },
  {
    id: "flowstark.subscriptions",
    title: "Suscripciones",
    type: "item",
    icon: "heroicons-outline:calendar",
    url: "subscriptions",
  },
];

export default navigationConfig;
