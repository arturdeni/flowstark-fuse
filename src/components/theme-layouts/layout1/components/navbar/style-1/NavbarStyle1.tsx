// src/components/theme-layouts/layout1/components/navbar/style-1/NavbarStyle1.tsx
import { styled } from '@mui/material/styles';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
	navbarCloseMobile,
	resetNavbar,
	selectFuseNavbar
} from 'src/components/theme-layouts/components/navbar/navbarSlice';
import { Theme } from '@mui/system/createTheme';
import { useEffect } from 'react';
import useFuseLayoutSettings from '@fuse/core/FuseLayout/useFuseLayoutSettings';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import NavbarStyle1Content from './NavbarStyle1Content';
import { Layout1ConfigDefaultsType } from '@/components/theme-layouts/layout1/Layout1Config';

const navbarWidth = 280;

type StyledNavBarProps = {
	theme?: Theme;
	open?: boolean;
	position?: string;
	className?: string;
	anchor?: string;
};

const StyledNavBar = styled('div')<StyledNavBarProps>(({ theme }) => ({
	minWidth: navbarWidth,
	width: navbarWidth,
	maxWidth: navbarWidth,
	maxHeight: '100%',
	// En móvil, hacer la navbar más pequeña pero siempre visible
	[theme.breakpoints.down('lg')]: {
		minWidth: 80,
		width: 80,
		maxWidth: 80
	},
	variants: [
		{
			props: {
				position: 'left'
			},
			style: {
				borderRight: `1px solid ${theme.palette.divider}`
			}
		},
		{
			props: {
				position: 'right'
			},
			style: {
				borderLeft: `1px solid ${theme.palette.divider}`
			}
		},
		{
			props: ({ open }) => !open,
			style: {
				transition: theme.transitions.create(['width', 'min-width'], {
					easing: theme.transitions.easing.sharp,
					duration: theme.transitions.duration.leavingScreen
				}),
				[theme.breakpoints.up('lg')]: {
					marginLeft: -navbarWidth
				},
				// En móvil, nunca ocultar completamente
				[theme.breakpoints.down('lg')]: {
					marginLeft: 0
				}
			}
		},
		{
			props: ({ open }) => open,
			style: {
				transition: theme.transitions.create(['width', 'min-width'], {
					easing: theme.transitions.easing.easeOut,
					duration: theme.transitions.duration.enteringScreen
				})
			}
		}
	]
}));

const StyledNavBarMobile = styled(SwipeableDrawer)<StyledNavBarProps>(() => ({
	'& > .MuiDrawer-paper': {
		minWidth: navbarWidth,
		width: navbarWidth,
		maxWidth: navbarWidth,
		maxHeight: '100%'
	}
}));

/**
 * The navbar style 1.
 */
function NavbarStyle1() {
	const dispatch = useAppDispatch();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const settings = useFuseLayoutSettings();
	const config = settings.config as Layout1ConfigDefaultsType;

	const navbar = useAppSelector(selectFuseNavbar);

	useEffect(() => {
		return () => {
			dispatch(resetNavbar());
		};
	}, [dispatch]);

	return (
		<>
			{/* SIEMPRE mostrar la navbar, tanto en desktop como móvil */}
			<StyledNavBar
				className="sticky top-0 z-20 h-screen flex-auto shrink-0 flex-col overflow-hidden shadow-sm"
				open={isMobile ? true : navbar.open} // En móvil, siempre "abierta" (visible)
				position={config.navbar.position}
			>
				<NavbarStyle1Content />
			</StyledNavBar>

			{/* Mantener drawer móvil solo para casos especiales */}
			{false && isMobile && (
				<StyledNavBarMobile
					classes={{
						paper: 'flex-col flex-auto h-full'
					}}
					anchor={config.navbar.position as 'left' | 'top' | 'right' | 'bottom'}
					variant="temporary"
					open={navbar.mobileOpen}
					onClose={() => dispatch(navbarCloseMobile())}
					onOpen={() => {}}
					disableSwipeToOpen
					ModalProps={{
						keepMounted: true // Better open performance on mobile.
					}}
				>
					<NavbarStyle1Content />
				</StyledNavBarMobile>
			)}
		</>
	);
}

export default NavbarStyle1;
