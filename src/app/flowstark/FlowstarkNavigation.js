// src/app/flowstark/FlowstarkNavigation.js
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';

const FlowstarkNavigation: FuseNavItemType[] = [
  {
    id: 'flowstark',
    title: 'Flowstark',
    type: 'collapse',
    icon: 'heroicons-outline:template',
    children: [
      {
        id: 'flowstark.dashboard',
        title: 'Dashboard',
        type: 'item',
        icon: 'heroicons-outline:chart-pie',
        url: 'flowstark/dashboard'
      },
      {
        id: 'flowstark.users',
        title: 'Gestión de Usuarios',
        type: 'item',
        icon: 'heroicons-outline:users',
        url: 'flowstark/users'
      },
      {
        id: 'flowstark.services',
        title: 'Gestión de Servicios',
        type: 'item',
        icon: 'heroicons-outline:cube',
        url: 'flowstark/services'
      },
      {
        id: 'flowstark.subscriptions',
        title: 'Gestión de Subscripciones',
        type: 'item',
        icon: 'heroicons-outline:calendar',
        url: 'flowstark/subscriptions'
      }
    ]
  }
];

export default FlowstarkNavigation;