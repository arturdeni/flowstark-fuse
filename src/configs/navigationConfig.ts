// ACTUALIZAR: src/configs/navigationConfig.ts

import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'flowstark.dashboard',
		title: 'Dashboard',
		type: 'item',
		icon: 'heroicons-outline:chart-pie',
		url: 'dashboard'
	},
	{
		id: 'flowstark.users',
		title: 'Clientes',
		type: 'item',
		icon: 'heroicons-outline:users',
		url: 'users'
	},
	{
		id: 'flowstark.services',
		title: 'Servicios',
		type: 'item',
		icon: 'heroicons-outline:cube',
		url: 'services'
	},
	{
		id: 'flowstark.subscriptions',
		title: 'Suscripciones',
		type: 'item',
		icon: 'heroicons-outline:calendar',
		url: 'subscriptions'
	},
	{
		id: 'flowstark.tickets',
		title: 'Tickets',
		type: 'item',
		icon: 'heroicons-outline:receipt-percent',
		url: 'tickets'
	},
	{
		id: 'flowstark.settings',
		title: 'Configuración',
		type: 'item',
		icon: 'heroicons-outline:cog',
		url: 'settings'
	}
];

export default navigationConfig;
