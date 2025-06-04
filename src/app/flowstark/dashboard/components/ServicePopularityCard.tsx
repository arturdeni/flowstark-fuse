// src/app/flowstark/dashboard/components/ServicePopularityCard.tsx
import React from 'react';
import {
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
    IconButton,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { ServicePopularity } from '../hooks/useDashboard';

interface ServicePopularityCardProps {
    services: ServicePopularity[];
}

export const ServicePopularityCard: React.FC<ServicePopularityCardProps> = ({
    services,
}) => {
    const getAvatarColor = (index: number) => {
        const colors = ['primary.main', 'secondary.main', 'success.main', 'warning.main', 'error.main'];
        return colors[index % colors.length];
    };

    return (
        <Card elevation={1}>
            <CardHeader
                title="Servicios Más Populares"
                subheader="Por número de suscriptores"
                action={
                    <IconButton>
                        <MoreVertIcon />
                    </IconButton>
                }
            />
            <Divider />
            <CardContent>
                {services.length > 0 ? (
                    <List>
                        {services.map((service, index) => (
                            <React.Fragment key={service.id}>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: getAvatarColor(index) }}>
                                            {service.name.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="body1">{service.name}</Typography>
                                                <Typography variant="body1" fontWeight="bold">
                                                    {service.subscribers} subs.
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="body2">
                                                    {service.percentage}% del total
                                                </Typography>
                                                <Typography variant="body2">
                                                    {service.revenue.toFixed(2)} € / mes
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < services.length - 1 && (
                                    <Divider variant="inset" component="li" />
                                )}
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
                            No hay servicios con suscripciones activas
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};