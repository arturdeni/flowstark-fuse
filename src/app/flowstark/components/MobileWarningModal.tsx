import { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
} from '@mui/material';
import { LaptopMac as LaptopIcon } from '@mui/icons-material';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';

const STORAGE_KEY = 'mobileWarningDismissed';

function MobileWarningModal() {
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('sm'));
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (isMobile && !sessionStorage.getItem(STORAGE_KEY)) {
			setOpen(true);
		}
	}, [isMobile]);

	const handleClose = () => {
		sessionStorage.setItem(STORAGE_KEY, 'true');
		setOpen(false);
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="xs"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 3,
					mx: 2,
				},
			}}
		>
			<DialogTitle sx={{ textAlign: 'center', pt: 4, pb: 1 }}>
				<Box sx={{ mb: 2 }}>
					<LaptopIcon sx={{ fontSize: 56, color: '#154241' }} />
				</Box>
				<Typography variant="h6" fontWeight="bold">
					Experiencia optimizada para escritorio
				</Typography>
			</DialogTitle>
			<DialogContent sx={{ textAlign: 'center', px: 4 }}>
				<Typography variant="body1" color="text.secondary">
					Para una mejor experiencia, te recomendamos usar Flowstark desde un ordenador o tablet.
				</Typography>
			</DialogContent>
			<DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
				<Button
					variant="contained"
					onClick={handleClose}
					sx={{
						bgcolor: '#154241',
						color: '#fff',
						'&:hover': { bgcolor: '#1a5453' },
						borderRadius: 2,
						px: 4,
					}}
				>
					Entendido
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default MobileWarningModal;
