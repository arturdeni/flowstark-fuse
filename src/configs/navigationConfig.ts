import i18n from "@i18n";
import { FuseNavItemType } from "@fuse/core/FuseNavigation/types/FuseNavItemType";
import ar from "./navigation-i18n/ar";
import en from "./navigation-i18n/en";
import tr from "./navigation-i18n/tr";

i18n.addResourceBundle("en", "navigation", en);
i18n.addResourceBundle("tr", "navigation", tr);
i18n.addResourceBundle("ar", "navigation", ar);

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: FuseNavItemType[] = [
  {
    id: "flowstark-component",
    title: "Flowstark",
    type: "collapse",
    icon: "heroicons-outline:chart-bar",
    children: [
      {
        id: "flowstark.dashboard",
        title: "Dashboard",
        type: "item",
        icon: "heroicons-outline:chart-pie",
        url: "flowstark/dashboard",
      },
      {
        id: "flowstark.users",
        title: "Usuarios",
        type: "item",
        icon: "heroicons-outline:users",
        url: "flowstark/users",
      },
      {
        id: "flowstark.services",
        title: "Servicios",
        type: "item",
        icon: "heroicons-outline:cube",
        url: "flowstark/services",
      },
      {
        id: "flowstark.subscriptions",
        title: "Subscripciones",
        type: "item",
        icon: "heroicons-outline:calendar",
        url: "flowstark/subscriptions",
      },
    ],
  },
];

export default navigationConfig;
