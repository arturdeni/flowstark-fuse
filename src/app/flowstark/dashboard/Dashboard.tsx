// src/app/flowstark/dashboard/Dashboard.tsx
import React from 'react';
import {
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import FusePageSimple from '@fuse/core/FusePageSimple';

import { useDashboard } from './hooks/useDashboard';
import { DashboardMetricsCards } from './components/DashboardMetricsCards';
import { DashboardCharts } from './components/DashboardCharts';
import { DashboardRecentActivity } from './components/DashboardRecentActivity';
import { DashboardServicePopularity } from './components/DashboardServicePopularity';

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

  const handleRefresh = async () => {
    await refreshData();
  };

  return (
    <Root
      header={
        <Box className="p-6">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Dashboard
            </Typography>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      }
      content={
        <Box className="p-6">
          <Fade in={!loading} timeout={500}>
            <Box>
              {/* Tarjetas de métricas principales */}
              <DashboardMetricsCards
                metrics={metrics}
                loading={loading}
              />

              {/* Gráficos principales */}
              <DashboardCharts
                monthlyData={monthlyData}
                metrics={metrics}
              />

              {/* Popularidad de servicios */}
              <Box sx={{ mb: 4 }}>
                <DashboardServicePopularity
                  servicePopularity={servicePopularity}
                  loading={loading}
                />
              </Box>

              {/* Actividad reciente y próximas renovaciones */}
              <DashboardRecentActivity
                recentActivity={recentActivity}
                upcomingRenewals={upcomingRenewals}
                loading={loading}
              />
            </Box>
          </Fade>

          {/* Indicador de carga inicial */}
          {loading && metrics.totalSubscriptions === 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 400
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  Cargando datos del dashboard...
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      }
    />
  );
}

export default Dashboard;