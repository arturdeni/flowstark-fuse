// src/app/flowstark/settings/components/SubscriptionPanel.tsx
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
  Avatar
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSubscription } from '../hooks/useSubscription';
import { useStripeCheckout } from '../hooks/useStripeCheckout';

function SubscriptionPanel() {
  const { subscription, loading, isPremium, isTrial, isCanceled } = useSubscription();
  const { createCheckout, isLoading: isCheckoutLoading, error } = useStripeCheckout();

  const handleUpgrade = async () => {
    await createCheckout();
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
            <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.light' }}>
              <FuseSvgIcon size={30} sx={{ color: 'primary.main' }}>
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
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
        {isCanceled && subscription?.currentPeriodEnd && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Tu suscripción se cancelará el{' '}
            {subscription.currentPeriodEnd.toLocaleDateString('es-ES')}
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

        {isPremium && (
          <Box>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Para gestionar tu suscripción, contacta con soporte
            </Typography>
          </Box>
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
    </Card>
  );
}

export default SubscriptionPanel;
