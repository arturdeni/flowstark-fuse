// src/app/flowstark/tickets/components/InvoicePreviewModal.tsx
import React, { useRef, useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	IconButton,
} from '@mui/material';
import {
	Close as CloseIcon,
	GetApp as DownloadIcon,
	Description as InvoiceIcon,
} from '@mui/icons-material';
import html2pdf from 'html2pdf.js';
import { Invoice } from '../../../../types/models';
import { InvoicePDFContent } from './InvoicePDFContent';

interface InvoicePreviewModalProps {
	open: boolean;
	invoice: Invoice | null;
	onClose: () => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
	open,
	invoice,
	onClose,
}) => {
	const pdfContentRef = useRef<HTMLDivElement>(null);
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

	if (!invoice) return null;

	const handleDownloadPDF = async () => {
		if (!pdfContentRef.current) return;

		setIsGeneratingPdf(true);

		try {
			const opt = {
				margin: 0.5,
				filename: `factura-${invoice.invoiceNumber}.pdf`,
				image: { type: 'jpeg' as const, quality: 0.98 },
				html2canvas: { scale: 2 },
				jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const },
			};

			await html2pdf().set(opt).from(pdfContentRef.current).save();
		} catch (error) {
			console.error('Error generating invoice PDF:', error);
		} finally {
			setIsGeneratingPdf(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: { borderRadius: 2, bgcolor: '#fafafa' },
			}}
		>
			<DialogTitle sx={{ pb: 1, bgcolor: 'white' }}>
				<Box display="flex" alignItems="center" justifyContent="space-between">
					<Box display="flex" alignItems="center" gap={1}>
						<InvoiceIcon color="primary" />
						<Typography variant="h6">
							Factura {invoice.invoiceNumber}
						</Typography>
					</Box>
					<IconButton onClick={onClose} size="small">
						<CloseIcon />
					</IconButton>
				</Box>
			</DialogTitle>

			<DialogContent sx={{ bgcolor: '#fafafa' }}>
				<div ref={pdfContentRef}>
					<InvoicePDFContent invoice={invoice} />
				</div>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
				<Button
					startIcon={<DownloadIcon />}
					variant="outlined"
					color="primary"
					onClick={handleDownloadPDF}
					disabled={isGeneratingPdf}
				>
					{isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
				</Button>
				<Button onClick={onClose} variant="contained">
					Cerrar
				</Button>
			</DialogActions>
		</Dialog>
	);
};
