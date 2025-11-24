// src/components/theme-layouts/components/navbar/NavbarToggleButton.tsx
import IconButton from '@mui/material/IconButton';
import { useAppDispatch } from 'src/store/hooks';
import _ from 'lodash';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { IconButtonProps } from '@mui/material/IconButton/IconButton';
import useFuseLayoutSettings from '@fuse/core/FuseLayout/useFuseLayoutSettings';
import useFuseSettings from '@fuse/core/FuseSettings/hooks/useFuseSettings';
import { navbarToggle, navbarOpenFolded, navbarCloseFolded } from './navbarSlice';
import { useAppSelector } from 'src/store/hooks';
import { selectFuseNavbar } from './navbarSlice';

export type NavbarToggleButtonProps = IconButtonProps;

/**
 * The navbar toggle button.
 */
function NavbarToggleButton(props: NavbarToggleButtonProps) {
	const { className = '', children, ...rest } = props;

	const dispatch = useAppDispatch();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { config } = useFuseLayoutSettings();
	const { setSettings } = useFuseSettings();
	const navbar = useAppSelector(selectFuseNavbar);

	// Determinar si el menú está abierto según el contexto
	let isMenuOpen = false;

	if (isMobile) {
		if (
			config?.navbar?.style === 'style-2' ||
			config?.navbar?.style === 'style-3' ||
			config?.navbar?.style === 'style-3-dense'
		) {
			isMenuOpen = navbar.foldedOpen;
		} else {
			isMenuOpen = navbar.open;
		}
	} else {
		// En desktop, el menú está "cerrado/plegado" cuando folded es true
		if (config?.navbar?.style === 'style-2') {
			isMenuOpen = !config?.navbar?.folded;
		} else {
			isMenuOpen = navbar.open;
		}
	}

	// Icono por defecto basado en el estado del menú
	const defaultIcon = children || (
		<FuseSvgIcon
			size={20}
			color="action"
		>
			{isMenuOpen ? 'heroicons-outline:x-mark' : 'heroicons-outline:bars-3'}
		</FuseSvgIcon>
	);

	const handleClick = () => {
		if (isMobile) {
			// En móvil, manejar según el estilo de navbar
			if (
				config?.navbar?.style === 'style-2' ||
				config?.navbar?.style === 'style-3' ||
				config?.navbar?.style === 'style-3-dense'
			) {
				// Para estilos plegables, alternar entre plegado/desplegado
				if (navbar.foldedOpen) {
					dispatch(navbarCloseFolded());
				} else {
					dispatch(navbarOpenFolded());
				}
			} else {
				// Para style-1, usar toggle normal
				dispatch(navbarToggle());
			}
		} else {
			// En desktop, comportamiento normal
			if (config?.navbar?.style === 'style-2') {
				setSettings(_.set({}, 'layout.config.navbar.folded', !config?.navbar?.folded));
			} else {
				dispatch(navbarToggle());
			}
		}
	};

	return (
		<IconButton
			onClick={handleClick}
			{...rest}
			className={className}
		>
			{defaultIcon}
		</IconButton>
	);
}

export default NavbarToggleButton;
