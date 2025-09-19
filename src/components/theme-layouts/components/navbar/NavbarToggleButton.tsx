// src/components/theme-layouts/components/navbar/NavbarToggleButton.tsx
import IconButton from '@mui/material/IconButton';
import { useAppDispatch } from 'src/store/hooks';
import _ from 'lodash';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import clsx from 'clsx';
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
	const {
		className = '',
		children = (
			<FuseSvgIcon
				size={20}
				color="action"
			>
				heroicons-outline:bars-3
			</FuseSvgIcon>
		),
		...rest
	} = props;

	const dispatch = useAppDispatch();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { config } = useFuseLayoutSettings();
	const { setSettings } = useFuseSettings();
	const navbar = useAppSelector(selectFuseNavbar);

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
			className={clsx('border border-divider', className)}
		>
			{children}
		</IconButton>
	);
}

export default NavbarToggleButton;
