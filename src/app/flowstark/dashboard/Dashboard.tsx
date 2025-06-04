// src/app/flowstark/dashboard/Dashboard.tsx
import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';

import { useDashboard } from './hooks/useDashboard';
import {
  DashboardSummaryCards,
  DashboardCharts,
  ServicePopularityCard,
  ActivityAndRenewalsCards,
  LoadingState,
  ErrorState,
} from './components';

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider,
  },
  '& .FusePageSimple-content': {},
  '& .FusePageSimple-sidebarHeader': {},
  '& .FusePageSimple-sidebarContent': {},
}));

function Dashboard() {
  // Hook personalizado con toda la lógica del dashboard
  const {
    metrics,
    monthlyData,
    servicePopularity,
    recentActivity,
    upcomingRenewals,
    loading,
    error,
    refreshData,
  } = useDashboard();

  // Mostrar estado de error
  if (error && !loading) {
    return (
      <Root
        header={
          <div className="p-6">
            <Typography variant="h4" component="h1" fontWeight="bold">
              Dashboard
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Bienvenido a Flowstark - Gestión de suscripciones
            </Typography>
          </div>
        }
        content={
          <div className="p-6">
            <ErrorState error={error} onRetry={refreshData} />
          </div>
        }
      />
    );
  }

  // Mostrar estado de carga inicial
  if (loading && metrics.totalSubscriptions === 0) {
    return (
      <Root
        header={
          <div className="p-6">
            <Typography variant="h4" component="h1" fontWeight="bold">
              Dashboard
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Bienvenido a Flowstark - Gestión de suscripciones
            </Typography>
          </div>
        }
        content={
          <div className="p-6">
            <LoadingState />
          </div>
        }
      />
    );
  }

  return (
    <Root
      header={
        <div className="p-6">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Dashboard
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Bienvenido a Flowstark - Gestión de suscripciones
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshData}
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </Box>
        </div>
      }
      content={
        <div className="p-6">
          {/* Tarjetas de resumen */}
          <DashboardSummaryCards metrics={metrics} />

          {/* Gráficos principales */}
          <DashboardCharts monthlyData={monthlyData} metrics={metrics} />

          {/* Servicios más populares y actividad reciente */}
          <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
            <Box sx={{ flex: 1 }}>
              <ServicePopularityCard services={servicePopularity} />
            </Box>
          </Box>

          {/* Actividad reciente y renovaciones próximas */}
          <ActivityAndRenewalsCards
            recentActivity={recentActivity}
            upcomingRenewals={upcomingRenewals}
          />

          {/* Indicador de carga durante actualizaciones */}
          {loading && (
            <Box
              position="fixed"
              bottom={16}
              right={16}
              bgcolor="background.paper"
              borderRadius={1}
              p={2}
              boxShadow={3}
              display="flex"
              alignItems="center"
              gap={1}
            >
              <RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} />
              <Typography variant="body2">Actualizando datos...</Typography>
            </Box>
          )}
        </div>
      }
    />
  );
}

export default Dashboard;