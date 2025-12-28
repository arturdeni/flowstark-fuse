// src/app/flowstark/services/components/ImportServicesModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { generateTemplateExcel, parseAndValidateExcel, ImportValidationError } from '../utils/excelUtils';
import { Service } from '../../../../types/models';

interface ImportServicesModalProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onImport: (services: Partial<Service>[]) => Promise<void>;
}

export const ImportServicesModal: React.FC<ImportServicesModalProps> = ({
  open,
  loading,
  onClose,
  onImport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>([]);
  const [parsedServices, setParsedServices] = useState<Partial<Service>[]>([]);
  const [isValidated, setIsValidated] = useState(false);

  const handleDownloadTemplate = () => {
    generateTemplateExcel();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un archivo Excel
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setValidationErrors([
        {
          row: 0,
          field: 'archivo',
          message: 'Por favor, seleccione un archivo Excel válido (.xlsx o .xls)',
        },
      ]);
      setIsValidated(false);
      return;
    }

    setSelectedFile(file);
    setValidationErrors([]);
    setIsValidated(false);
    setParsedServices([]);

    // Validar automáticamente el archivo
    try {
      const result = await parseAndValidateExcel(file);

      if (result.valid) {
        setParsedServices(result.services);
        setIsValidated(true);
        setValidationErrors([]);
      } else {
        setValidationErrors(result.errors);
        setIsValidated(false);
        setParsedServices([]);
      }
    } catch (error) {
      setValidationErrors([
        {
          row: 0,
          field: 'archivo',
          message: error instanceof Error ? error.message : 'Error al procesar el archivo',
        },
      ]);
      setIsValidated(false);
    }
  };

  const handleImport = async () => {
    if (!isValidated || parsedServices.length === 0) return;

    try {
      await onImport(parsedServices);
      handleCloseModal();
    } catch (error) {
      console.error('Error importing services:', error);
    }
  };

  const handleCloseModal = () => {
    setSelectedFile(null);
    setValidationErrors([]);
    setParsedServices([]);
    setIsValidated(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCloseModal} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Importar Servicios desde Excel
        </Typography>
      </DialogTitle>

      <DialogContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Instrucciones */}
        <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Instrucciones para importar servicios:
          </Typography>
          <List dense>
            <ListItem sx={{ py: 0 }}>
              <ListItemText
                primary="1. Descarga la plantilla Excel haciendo clic en el botón de abajo"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemText
                primary="2. Completa los datos de tus servicios en el archivo (todos los campos con * son obligatorios)"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemText
                primary="3. Guarda el archivo y súbelo usando el botón de selección"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ py: 0 }}>
              <ListItemText
                primary="4. Verifica que no haya errores y confirma la importación"
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          </List>
        </Alert>

        {/* Botón de descarga de plantilla */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Descargar Plantilla Excel
          </Button>
        </Box>

        {/* Selector de archivo */}
        <Paper variant="outlined" sx={{ p: 3, mb: 2, textAlign: 'center' }}>
          <input
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="excel-file-input"
            type="file"
            onChange={handleFileChange}
            disabled={loading}
          />
          <label htmlFor="excel-file-input">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadIcon />}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Seleccionar Archivo Excel
            </Button>
          </label>

          {selectedFile && (
            <Typography variant="body2" color="text.secondary">
              Archivo seleccionado: {selectedFile.name}
            </Typography>
          )}
        </Paper>

        {/* Resultados de validación */}
        {isValidated && parsedServices.length > 0 && (
          <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Archivo validado correctamente
            </Typography>
            <Typography variant="body2">
              Se importarán {parsedServices.length} servicio{parsedServices.length !== 1 ? 's' : ''}
            </Typography>
          </Alert>
        )}

        {/* Errores de validación */}
        {validationErrors.length > 0 && (
          <Alert severity="error" icon={<ErrorIcon />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Se encontraron {validationErrors.length} error{validationErrors.length !== 1 ? 'es' : ''} en el archivo:
            </Typography>
            <List dense>
              {validationErrors.slice(0, 10).map((error, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <ErrorIcon color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Fila ${error.row}, Campo "${error.field}": ${error.message}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
              {validationErrors.length > 10 && (
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={`... y ${validationErrors.length - 10} errores más`}
                    primaryTypographyProps={{ variant: 'body2', fontStyle: 'italic' }}
                  />
                </ListItem>
              )}
            </List>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCloseModal} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          color="primary"
          disabled={!isValidated || parsedServices.length === 0 || loading}
          sx={{
            '&:hover': {
              backgroundColor: '#2C645E'
            }
          }}
        >
          Importar {parsedServices.length > 0 ? `${parsedServices.length} Servicio${parsedServices.length !== 1 ? 's' : ''}` : 'Servicios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
