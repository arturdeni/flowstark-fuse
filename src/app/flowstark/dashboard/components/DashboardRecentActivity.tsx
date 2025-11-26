// src/app/flowstark/dashboard/components/DashboardRecentActivity.tsx
import React from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Typography,
    Chip,
    Box,
    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Cancel as CancelIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { RecentActivity, UpcomingRenewal } from '../hooks/useDashboard';

interface DashboardRecentActivityProps {
    recentActivity: RecentActivity[];
    upcomingRenewals: UpcomingRenewal[];
    loading: boolean;
}

export const DashboardRecentActivity: React.FC<DashboardRecentActivityProps> = ({
    recentActivity,
    upcomingRenewals,
    loading,
}) => {
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'new_subscription':
                return <AddIcon />;
            case 'cancellation':
                return <CancelIcon />;
            case 'new_client':
                return <PersonIcon />;
            case 'renewal':
                return <RefreshIcon />;
            default:
                return <AddIcon />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'new_subscription':
                return 'success';
            case 'cancellation':
                return 'error';
            case 'new_client':
                return 'primary';
            case 'renewal':
                return 'info';
            default:
                return 'default';
        }
    };

    const getActivityText = (activity: RecentActivity) => {
        switch (activity.type) {
            case 'new_subscription':
                return `Nueva suscripción de ${activity.clientName} para ${activity.serviceName}`;
            case 'cancellation':
                return `${activity.clientName} canceló la suscripción de ${activity.serviceName}`;
            case 'new_client':
                return `Nuevo cliente registrado: ${activity.clientName}`;
            case 'renewal':
                return `Renovación de ${activity.clientName} para ${activity.serviceName}`;
            default:
                return `Actividad de ${activity.clientName}`;
        }
    };

    const formatDate = (date: Date): string => {
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            return 'Hace unos minutos';
        } else if (diffInHours < 24) {
            return `Hace ${Math.floor(diffInHours)} horas`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays === 1) {
                return 'Ayer';
            } else if (diffInDays < 7) {
                return `Hace ${diffInDays} días`;
            } else {
                return date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                });
            }
        }
    };

    const formatUpcomingDate = (date: Date): string => {
        const now = new Date();
        const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) {
            return 'Hoy';
        } else if (diffInDays === 1) {
            return 'Mañana';
        } else if (diffInDays < 7) {
            return `En ${diffInDays} días`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit'
            });
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
            {/* Actividad Reciente */}
            <Card
                sx={{
                    flex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                }}
            >
                <CardHeader
                    title="Actividad Reciente"
                    titleTypographyProps={{ variant: 'h6' }}
                />
                <Divider />
                <CardContent sx={{ p: 0, maxHeight: 400, overflowY: 'auto' }}>
                    {loading ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="textSecondary">Cargando actividad...</Typography>
                        </Box>
                    ) : recentActivity.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="textSecondary">No hay actividad reciente</Typography>
                        </Box>
                    ) : (
                        <List sx={{ py: 0 }}>
                            {recentActivity.map((activity, index) => (
                                <React.Fragment key={activity.id}>
                                    <ListItem sx={{ py: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar 
                                                sx={{ 
                                                    bgcolor: `${getActivityColor(activity.type)}.main`,
                                                    width: 40,
                                                    height: 40
                                                }}
                                            >
                                                {getActivityIcon(activity.type)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                    {getActivityText(activity)}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="textSecondary">
                                                    {formatDate(activity.date)}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                    {index < recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>

            {/* Próximas Renovaciones */}
            <Card
                sx={{
                    flex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                }}
            >
                <CardHeader
                    title="Próximas Renovaciones"
                    titleTypographyProps={{ variant: 'h6' }}
                />
                <Divider />
                <CardContent sx={{ p: 0, maxHeight: 400, overflowY: 'auto' }}>
                    {loading ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="textSecondary">Cargando renovaciones...</Typography>
                        </Box>
                    ) : upcomingRenewals.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography color="textSecondary">No hay renovaciones próximas</Typography>
                        </Box>
                    ) : (
                        <List sx={{ py: 0 }}>
                            {upcomingRenewals.slice(0, 10).map((renewal, index) => (
                                <React.Fragment key={renewal.id}>
                                    <ListItem sx={{ py: 2 }}>
                                        <ListItemAvatar>
                                            <Avatar 
                                                sx={{ 
                                                    bgcolor: 'warning.main',
                                                    width: 40,
                                                    height: 40
                                                }}
                                            >
                                                <RefreshIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                        {renewal.clientName}
                                                    </Typography>
                                                    <Chip 
                                                        label={`€${renewal.amount.toFixed(2)}`}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {renewal.serviceName}
                                                    </Typography>
                                                    <br />
                                                    <Typography variant="caption" color="textSecondary">
                                                        {formatUpcomingDate(renewal.date)}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < upcomingRenewals.slice(0, 10).length - 1 && 
                                        <Divider variant="inset" component="li" />
                                    }
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};