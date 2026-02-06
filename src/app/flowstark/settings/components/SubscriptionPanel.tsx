// src/app/flowstark/settings/components/SubscriptionPanel.tsx
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSubscription } from '../hooks/useSubscription';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { useSubscriptionManagement } from '../hooks/useSubscriptionManagement';

function SubscriptionPanel() {
  const { subscription, loading, isPremium, isTrial, isCanceled } = useSubscription();
  const { createCheckout, isLoading: isCheckoutLoading, error } = useStripeCheckout();
  const {
    cancelSubscription,
    reactivateSubscription,
    isLoading: isManagementLoading,
    error: managementError
  } = useSubscriptionManagement();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleUpgrade = async () => {
    await createCheckout();
  };

  const handleCancelSubscription = async () => {
    const success = await cancelSubscription(false);
    if (success) {
      setCancelDialogOpen(false);
    }
  };

  const handleReactivateSubscription = async () => {
    await reactivateSubscription();
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
              <FuseSvgIcon size={30} sx={{ color: 'white' }}>
                {isPremium ? 'heroicons-solid:star' : 'heroicons-outline:star'}
              </FuseSvgIcon>
            </Avatar>
            <Box>
              <Typography variant="h5" gutterBottom sx={{ color: '#154241' }}>
                Tu Suscripción
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestiona tu plan y facturación
              </Typography>
            </Box>
          </Box>

          {/* Plan Badge */}
          <Chip
            label={isPremium ? 'Premium' : 'Gratuito'}
            size="medium"
            sx={{
              backgroundColor: isPremium ? '#154241' : '#E0E0E0',
              color: isPremium ? '#FFFFFF' : '#666',
              fontWeight: 'bold',
              px: 2
            }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Error Alert */}
        {(error || managementError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || managementError}
          </Alert>
        )}

        {/* Trial Alert */}
        {isTrial && subscription?.trialEnd && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Estás en período de prueba hasta el{' '}
            {subscription.trialEnd.toLocaleDateString('es-ES')}
          </Alert>
        )}

        {/* Canceled Alert */}
        {isCanceled && (subscription?.currentPeriodEnd || subscription?.trialEnd) && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Tu suscripción se cancelará el{' '}
            {(subscription.currentPeriodEnd || subscription.trialEnd)!.toLocaleDateString('es-ES')}
          </Alert>
        )}

        {/* Plan Details */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Plan Actual
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#154241' }}>
            {isPremium ? 'Premium' : 'Gratuito'}
          </Typography>
          {isPremium && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              19€/mes + IVA
            </Typography>
          )}
          {isPremium && (subscription?.currentPeriodEnd || subscription?.trialEnd) && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isCanceled ? 'Acceso Premium hasta' : 'Próxima facturación'}:{' '}
              <strong>{(subscription.currentPeriodEnd || subscription.trialEnd)!.toLocaleDateString('es-ES')}</strong>
            </Typography>
          )}
        </Box>

        {/* Limits */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Límites de tu plan
          </Typography>
          <Stack spacing={1} mt={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <FuseSvgIcon size={16} sx={{ color: '#154241' }}>
                {subscription?.limits.maxClients === -1 ? 'heroicons-solid:check' : 'heroicons-outline:users'}
              </FuseSvgIcon>
              <Typography variant="body2">
                {subscription?.limits.maxClients === -1 ? 'Clientes ilimitados' : `Hasta ${subscription?.limits.maxClients} clientes`}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <FuseSvgIcon size={16} sx={{ color: '#154241' }}>
                {subscription?.limits.maxServices === -1 ? 'heroicons-solid:check' : 'heroicons-outline:cube'}
              </FuseSvgIcon>
              <Typography variant="body2">
                {subscription?.limits.maxServices === -1 ? 'Servicios ilimitados' : `Hasta ${subscription?.limits.maxServices} servicios`}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <FuseSvgIcon size={16} sx={{ color: '#154241' }}>
                {subscription?.limits.maxSubscriptions === -1 ? 'heroicons-solid:check' : 'heroicons-outline:calendar'}
              </FuseSvgIcon>
              <Typography variant="body2">
                {subscription?.limits.maxSubscriptions === -1 ? 'Suscripciones ilimitadas' : `Hasta ${subscription?.limits.maxSubscriptions} suscripciones`}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Action Buttons */}
        {!isPremium && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleUpgrade}
            disabled={isCheckoutLoading}
            sx={{
              background: 'linear-gradient(135deg, #154241 0%, #0F302F 100%)',
              color: '#FFFFFF',
              fontWeight: 'bold',
              py: 1.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #0F302F 0%, #0C2625 100%)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {isCheckoutLoading ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
                Procesando...
              </Box>
            ) : (
              <Box display="flex" alignItems="center" gap={1}>
                <FuseSvgIcon size={20}>heroicons-solid:arrow-up</FuseSvgIcon>
                Mejorar a Premium
              </Box>
            )}
          </Button>
        )}

        {isPremium && !isCanceled && (
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={() => setCancelDialogOpen(true)}
            disabled={isManagementLoading}
            sx={{
              color: '#d32f2f',
              borderColor: '#d32f2f',
              fontWeight: 'bold',
              py: 1.5,
              '&:hover': {
                borderColor: '#b71c1c',
                backgroundColor: 'rgba(211, 47, 47, 0.04)'
              }
            }}
          >
            {isManagementLoading ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} sx={{ color: '#d32f2f' }} />
                Procesando...
              </Box>
            ) : (
              'Cancelar suscripción'
            )}
          </Button>
        )}

        {isPremium && isCanceled && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleReactivateSubscription}
            disabled={isManagementLoading}
            sx={{
              background: 'linear-gradient(135deg, #154241 0%, #0F302F 100%)',
              color: '#FFFFFF',
              fontWeight: 'bold',
              py: 1.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #0F302F 0%, #0C2625 100%)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {isManagementLoading ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
                Procesando...
              </Box>
            ) : (
              'Reactivar suscripción'
            )}
          </Button>
        )}

        {/* Benefits Preview for Free Users */}
        {!isPremium && (
          <Box mt={3} p={2} borderRadius={2} sx={{ backgroundColor: '#EBF4EC' }}>
            <Typography variant="body2" fontWeight="bold" sx={{ color: '#154241', mb: 1 }}>
              🎉 Con Premium obtienes:
            </Typography>
            <Typography variant="caption" sx={{ color: '#154241', display: 'block', lineHeight: 1.8 }}>
              ✓ Clientes, servicios y suscripciones ilimitadas<br />
              ✓ Dashboard con analytics avanzados<br />
              ✓ Exportación avanzada de datos<br />
              ✓ Soporte prioritario 24/7<br />
              ✓ 7 días de prueba gratuita
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#154241' }}>
          ¿Cancelar suscripción?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Tu suscripción se cancelará al final del período de facturación actual.
            Seguirás teniendo acceso a todas las funciones Premium hasta esa fecha.
          </Typography>
          {(subscription?.currentPeriodEnd || subscription?.trialEnd) && (
            <Alert severity="info">
              Mantendrás acceso Premium hasta el{' '}
              <strong>{(subscription.currentPeriodEnd || subscription.trialEnd)!.toLocaleDateString('es-ES')}</strong>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCancelDialogOpen(false)}
            disabled={isManagementLoading}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #154241 0%, #0F302F 100%)',
              color: '#FFFFFF',
              '&:hover': {
                background: 'linear-gradient(135deg, #0F302F 0%, #0C2625 100%)'
              }
            }}
          >
            Mantener suscripción
          </Button>
          <Button
            onClick={handleCancelSubscription}
            disabled={isManagementLoading}
            color="error"
            variant="outlined"
          >
            {isManagementLoading ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} color="error" />
                Cancelando...
              </Box>
            ) : (
              'Cancelar suscripción'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

export default SubscriptionPanel;
