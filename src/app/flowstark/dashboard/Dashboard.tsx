import React, { useState, useEffect } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import { styled } from '@mui/material/styles';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Box,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Button,
  IconButton,
  Chip
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Autorenew as AutorenewIcon,
  MoreVert as MoreVertIcon,
  Cancel as CancelIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Root = styled(FusePageSimple)(({ theme }) => ({
  '& .FusePageSimple-header': {
    backgroundColor: theme.palette.background.paper,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: theme.palette.divider
  },
  '& .FusePageSimple-content': {},
  '& .FusePageSimple-sidebarHeader': {},
  '& .FusePageSimple-sidebarContent': {}
}));

// Tipos de datos
interface SubscriptionData {
  month: string;
  active: number;
  cancelled: number;
  new: number;
}

interface RevenueData {
  month: string;
  amount: number;
  previous: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface ServiceData {
  name: string;
  subscribers: number;
  percentage: number;
  revenue: number;
}

interface RecentActivity {
  id: number;
  type: 'new_subscription' | 'renewal' | 'cancellation' | 'payment';
  client: string;
  service: string;
  date: string;
  amount?: number;
}

interface UpcomingRenewal {
  id: number;
  client: string;
  service: string;
  date: string;
  amount: number;
}

function Dashboard() {
  // Datos simulados para el dashboard
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>([]);
  const [summary, setSummary] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    pendingRenewals: 0,
    averageSubscriptionValue: 0
  });

  useEffect(() => {
    // En la implementación real, estos datos vendrían de Firebase
    // Datos de subscripciones por mes
    const subs: SubscriptionData[] = [
      { month: 'Ene', active: 120, cancelled: 5, new: 25 },
      { month: 'Feb', active: 140, cancelled: 8, new: 28 },
      { month: 'Mar', active: 160, cancelled: 10, new: 30 },
      { month: 'Abr', active: 180, cancelled: 7, new: 27 },
      { month: 'May', active: 200, cancelled: 12, new: 32 },
      { month: 'Jun', active: 220, cancelled: 9, new: 29 }
    ];
    setSubscriptionData(subs);

    // Datos de ingresos por mes
    const revenue: RevenueData[] = [
      { month: 'Ene', amount: 3500, previous: 3200 },
      { month: 'Feb', amount: 4200, previous: 3500 },
      { month: 'Mar', amount: 4800, previous: 4200 },
      { month: 'Abr', amount: 5100, previous: 4800 },
      { month: 'May', amount: 5700, previous: 5100 },
      { month: 'Jun', amount: 6300, previous: 5700 }
    ];
    setRevenueData(revenue);

    // Datos de estado de subscripciones
    const status: StatusData[] = [
      { name: 'Activas', value: 220, color: '#4CAF50' },
      { name: 'Pausadas', value: 45, color: '#FF9800' },
      { name: 'Canceladas', value: 35, color: '#F44336' }
    ];
    setStatusData(status);

    // Datos de servicios más populares
    const services: ServiceData[] = [
      { name: 'Plan Premium', subscribers: 85, percentage: 28, revenue: 2550 },
      { name: 'Plan Básico', subscribers: 120, percentage: 40, revenue: 1800 },
      { name: 'Plan Estándar', subscribers: 60, percentage: 20, revenue: 1500 },
      { name: 'Plan Anual', subscribers: 35, percentage: 12, revenue: 1050 }
    ];
    setServiceData(services);

    // Datos de actividad reciente
    const activity: RecentActivity[] = [
      {
        id: 1,
        type: 'new_subscription',
        client: 'Ana García',
        service: 'Plan Premium',
        date: '27/03/2025',
        amount: 29.99
      },
      {
        id: 2,
        type: 'renewal',
        client: 'Carlos López',
        service: 'Plan Básico',
        date: '26/03/2025',
        amount: 9.99
      },
      {
        id: 3,
        type: 'cancellation',
        client: 'María Rodríguez',
        service: 'Plan Estándar',
        date: '25/03/2025'
      },
      {
        id: 4,
        type: 'payment',
        client: 'Juan Martínez',
        service: 'Plan Premium',
        date: '24/03/2025',
        amount: 29.99
      },
      {
        id: 5,
        type: 'new_subscription',
        client: 'Laura Sánchez',
        service: 'Plan Estándar',
        date: '23/03/2025',
        amount: 19.99
      }
    ];
    setRecentActivity(activity);

    // Datos de próximas renovaciones
    const renewals: UpcomingRenewal[] = [
      {
        id: 1,
        client: 'Miguel Fernández',
        service: 'Plan Premium',
        date: '02/04/2025',
        amount: 29.99
      },
      {
        id: 2,
        client: 'Lucía Martín',
        service: 'Plan Estándar',
        date: '03/04/2025',
        amount: 19.99
      },
      {
        id: 3,
        client: 'Pablo Jiménez',
        service: 'Plan Básico',
        date: '05/04/2025',
        amount: 9.99
      },
      {
        id: 4,
        client: 'Sofía Ruiz',
        service: 'Plan Anual',
        date: '07/04/2025',
        amount: 299.99
      }
    ];
    setUpcomingRenewals(renewals);

    // Datos de resumen
    setSummary({
      totalSubscriptions: 300,
      activeSubscriptions: 220,
      monthlyRevenue: 6300,
      pendingRenewals: 42,
      averageSubscriptionValue: 28.64
    });
  }, []);

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case 'new_subscription':
        return (
          <Avatar sx={{ bgcolor: 'success.main' }}>
            <PersonIcon />
          </Avatar>
        );
      case 'renewal':
        return (
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <AutorenewIcon />
          </Avatar>
        );
      case 'cancellation':
        return (
          <Avatar sx={{ bgcolor: 'error.main' }}>
            <CancelIcon />
          </Avatar>
        );
      case 'payment':
        return (
          <Avatar sx={{ bgcolor: 'info.main' }}>
            <MoneyIcon />
          </Avatar>
        );
      default:
        return (
          <Avatar>
            <NotificationsIcon />
          </Avatar>
        );
    }
  };

  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'new_subscription':
        return `Nueva subscripción: ${activity.client} se ha suscrito a ${activity.service}`;
      case 'renewal':
        return `Renovación: ${activity.client} ha renovado ${activity.service}`;
      case 'cancellation':
        return `Cancelación: ${activity.client} ha cancelado ${activity.service}`;
      case 'payment':
        return `Pago recibido: ${activity.client} ha pagado por ${activity.service}`;
      default:
        return `Actividad: ${activity.client}`;
    }
  };

  return (
    <Root
      header={
        <div className="p-6">
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
          >
            Dashboard
          </Typography>
          <Typography
            variant="subtitle1"
            color="textSecondary"
          >
            Bienvenido a Flowstark - Gestión de suscripciones
          </Typography>
        </div>
      }
      content={
        <div className="p-6">
          {/* Tarjetas de resumen */}
          <Grid
            container
            spacing={3}
            sx={{ mb: 4 }}
          >
            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography
                      variant="h6"
                      component="div"
                    >
                      Subscripciones
                    </Typography>
                  </Box>
                  <Typography variant="h4">{summary.totalSubscriptions}</Typography>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                  >
                    {summary.activeSubscriptions} activas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                      <AutorenewIcon />
                    </Avatar>
                    <Typography
                      variant="h6"
                      component="div"
                    >
                      Renovaciones
                    </Typography>
                  </Box>
                  <Typography variant="h4">{summary.pendingRenewals}</Typography>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                  >
                    Pendientes este mes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <MoneyIcon />
                    </Avatar>
                    <Typography
                      variant="h6"
                      component="div"
                    >
                      Ingresos
                    </Typography>
                  </Box>
                  <Typography variant="h4">{summary.monthlyRevenue} €</Typography>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                  >
                    Facturación mensual
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
            >
              <Card elevation={1}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <InventoryIcon />
                    </Avatar>
                    <Typography
                      variant="h6"
                      component="div"
                    >
                      Valor Medio
                    </Typography>
                  </Box>
                  <Typography variant="h4">{summary.averageSubscriptionValue} €</Typography>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                  >
                    Por subscripción
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos principales */}
          <Grid
            container
            spacing={3}
            sx={{ mb: 4 }}
          >
            <Grid
              item
              xs={12}
              lg={8}
            >
              <Card elevation={1}>
                <CardHeader
                  title="Ingresos Mensuales"
                  subheader="Evolución de los últimos 6 meses"
                  action={
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent>
                  <Box height={300}>
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart
                        data={revenueData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`${value} €`, 'Ingresos']}
                          labelFormatter={(label) => `Mes: ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="Ingresos"
                          stroke="#0A74DA"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="previous"
                          name="Periodo anterior"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid
              item
              xs={12}
              lg={4}
            >
              <Card
                elevation={1}
                sx={{ height: '100%' }}
              >
                <CardHeader
                  title="Estado de Subscripciones"
                  subheader="Distribución actual"
                  action={
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent>
                  <Box
                    height={300}
                    display="flex"
                    justifyContent="center"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} subscripciones`, '']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Evolución de subscripciones y servicios más populares */}
          <Grid
            container
            spacing={3}
            sx={{ mb: 4 }}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <Card elevation={1}>
                <CardHeader
                  title="Evolución de Subscripciones"
                  subheader="Últimos 6 meses"
                  action={
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent>
                  <Box height={300}>
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={subscriptionData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="new"
                          name="Nuevas"
                          fill="#4CAF50"
                        />
                        <Bar
                          dataKey="cancelled"
                          name="Canceladas"
                          fill="#F44336"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <Card elevation={1}>
                <CardHeader
                  title="Servicios Más Populares"
                  subheader="Por número de subscriptores"
                  action={
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent>
                  <List>
                    {serviceData.map((service, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor:
                                  index === 0
                                    ? 'primary.main'
                                    : index === 1
                                      ? 'secondary.main'
                                      : index === 2
                                        ? 'success.main'
                                        : 'warning.main'
                              }}
                            >
                              {service.name.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography variant="body1">{service.name}</Typography>
                                <Typography
                                  variant="body1"
                                  fontWeight="bold"
                                >
                                  {service.subscribers} subs.
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography variant="body2">
                                  {service.percentage}% del total
                                </Typography>
                                <Typography variant="body2">
                                  {service.revenue} € / mes
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < serviceData.length - 1 && (
                          <Divider
                            variant="inset"
                            component="li"
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Actividad reciente y renovaciones próximas */}
          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <Card elevation={1}>
                <CardHeader
                  title="Actividad Reciente"
                  action={
                    <Button
                      size="small"
                      color="primary"
                    >
                      Ver todo
                    </Button>
                  }
                />
                <Divider />
                <List sx={{ bgcolor: 'background.paper' }}>
                  {recentActivity.map((activity) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>{renderActivityIcon(activity.type)}</ListItemAvatar>
                        <ListItemText
                          primary={getActivityText(activity)}
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {activity.date}
                              </Typography>
                              {activity.amount && ` - ${activity.amount} €`}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider
                        variant="inset"
                        component="li"
                      />
                    </React.Fragment>
                  ))}
                </List>
              </Card>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <Card elevation={1}>
                <CardHeader
                  title="Próximas Renovaciones"
                  action={
                    <Button
                      size="small"
                      color="primary"
                    >
                      Ver calendario
                    </Button>
                  }
                />
                <Divider />
                <List sx={{ bgcolor: 'background.paper' }}>
                  {upcomingRenewals.map((renewal) => (
                    <React.Fragment key={renewal.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'info.main' }}>
                            <CalendarTodayIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${renewal.client} - ${renewal.service}`}
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {renewal.date}
                              </Typography>
                              {` - ${renewal.amount} €`}
                            </React.Fragment>
                          }
                        />
                        <Chip
                          label="Pendiente"
                          color="warning"
                          size="small"
                          sx={{ alignSelf: 'center' }}
                        />
                      </ListItem>
                      <Divider
                        variant="inset"
                        component="li"
                      />
                    </React.Fragment>
                  ))}
                </List>
              </Card>
            </Grid>
          </Grid>
        </div>
      }
    />
  );
}

export default Dashboard;
