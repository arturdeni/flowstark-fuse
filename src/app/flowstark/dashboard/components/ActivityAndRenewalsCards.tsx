// src/app/flowstark/dashboard/components/ActivityAndRenewalsCards.tsx
import React from 'react';
import {
    Grid,
    Card,
    CardHeader,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Box,
    Typography,
    Divider,
    Button,
    Chip,
} from '@mui/material';
import {
    Person as PersonIcon,
    Autorenew as AutorenewIcon,
    Cancel as CancelIcon,
    AttachMoney as MoneyIcon,
    CalendarToday as CalendarTodayIcon,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { RecentActivity, UpcomingRenewal } from '../hooks/useDashboard';

interface ActivityAndRenewalsCardsProps {
    recentActivity: RecentActivity[];
    upcomingRenewals: UpcomingRenewal[];
}

export const ActivityAndRenewalsCards: React.FC<ActivityAndRenewalsCardsProps> = ({
    recentActivity,
    upcomingRenewals,
}) => {
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
            case 'new_client':
                return (
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <PersonAddIcon />
                    </Avatar>
                );
            default:
                return (
                    <Avatar>
                        <PersonIcon />
                    </Avatar>
                );
        }
    };

    const getActivityText = (activity: RecentActivity) => {
        switch (activity.type) {
            case 'new_subscription':
                return `Nueva suscripción: ${activity.clientName} se ha suscrito a ${activity.serviceName}`;
            case 'renewal':
                return `Renovación: ${activity.clientName} ha renovado ${activity.serviceName}`;
            case 'cancellation':
                return `Cancelación: ${activity.clientName} ha cancelado ${activity.serviceName}`;
            case 'payment':
                return `Pago recibido: ${activity.clientName} ha pagado por ${activity.serviceName}`;
            case 'new_client':
                return `Nuevo cliente: ${activity.clientName} se ha registrado`;
            default:
                return `Actividad: ${activity.clientName}`;
        }
    };

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatRelativeDate = (date: Date): string => {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';

        if (diffDays === 1) return 'Ayer';

        if (diffDays <= 7) return `Hace ${diffDays} días`;

        return formatDate(date);
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Card elevation={1}>
                    <CardHeader
                        title="Actividad Reciente"
                        action={
                            <Button size="small" color="primary">
                                Ver todo
                            </Button>
                        }
                    />
                    <Divider />
                    <CardContent sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {recentActivity.length > 0 ? (
                            <List sx={{ bgcolor: 'background.paper' }}>
                                {recentActivity.map((activity) => (
                                    <React.Fragment key={activity.id}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemAvatar>
                                                {renderActivityIcon(activity.type)}
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={getActivityText(activity)}
                                                secondary={
                                                    <React.Fragment>
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color="text.primary"
                                                        >
                                                            {formatRelativeDate(activity.date)}
                                                        </Typography>
                                                        {activity.amount && ` - ${activity.amount.toFixed(2)} €`}
                                                    </React.Fragment>
                                                }
                                            />
                                        </ListItem>
                                        <Divider variant="inset" component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                height={200}
                                color="text.secondary"
                            >
                                <Typography variant="body2">
                                    No hay actividad reciente
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={6}>
                <Card elevation={1}>
                    <CardHeader
                        title="Próximas Renovaciones"
                        action={
                            <Button size="small" color="primary">
                                Ver calendario
                            </Button>
                        }
                    />
                    <Divider />
                    <CardContent sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {upcomingRenewals.length > 0 ? (
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
                                                primary={`${renewal.clientName} - ${renewal.serviceName}`}
                                                secondary={
                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color="text.primary"
                                                        >
                                                            {formatDate(renewal.date)} - {renewal.amount.toFixed(2)} €
                                                        </Typography>
                                                        <Chip
                                                            label="Pendiente"
                                                            color="warning"
                                                            size="small"
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        <Divider variant="inset" component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                height={200}
                                color="text.secondary"
                            >
                                <Typography variant="body2">
                                    No hay renovaciones pendientes
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};