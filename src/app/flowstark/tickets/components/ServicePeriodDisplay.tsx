// src/app/flowstark/tickets/components/ServicePeriodDisplay.tsx

import React from 'react';
import {
    Box,
    Chip,
    Typography,
    Tooltip,
    Stack
} from '@mui/material';
import {
    DateRange as DateRangeIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { Ticket, PaymentType } from '../../../../types/models';

interface ServicePeriodDisplayProps {
    ticket: Ticket;
    compact?: boolean;
    showTooltip?: boolean;
}

export const ServicePeriodDisplay: React.FC<ServicePeriodDisplayProps> = ({
    ticket,
    compact = false,
    showTooltip = true
}) => {
    // Formatear fechas para mostrar
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Formatear rango de fechas
    const formatDateRange = (start: Date, end: Date): string => {
        return `${formatDate(start)} - ${formatDate(end)}`;
    };

    // Determinar si el período está activo, pasado o futuro
    const getPeriodStatus = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(ticket.serviceStart);
        const end = new Date(ticket.serviceEnd);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (today < start) {
            return 'future'; // Período futuro
        } else if (today > end) {
            return 'past'; // Período pasado
        } else {
            return 'current'; // Período actual
        }
    };

    // Determinar el tipo de pago desde la descripción (temporal hasta que tengamos el campo directo)
    const getPaymentTypeFromDescription = (): 'advance' | 'arrears' | 'unknown' => {
        if (ticket.description?.includes('anticipado')) {
            return 'advance';
        } else if (ticket.description?.includes('vencido')) {
            return 'arrears';
        }

        return 'unknown';
    };

    // Calcular duración del período en días
    const getPeriodDuration = (): number => {
        const start = new Date(ticket.serviceStart);
        const end = new Date(ticket.serviceEnd);
        const diffTime = end.getTime() - start.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
    };

    const periodStatus = getPeriodStatus();
    const paymentType = getPaymentTypeFromDescription();
    const duration = getPeriodDuration();

    // Componente principal sin tooltip
    const PeriodContent = (
        <Stack
            direction={compact ? 'column' : 'row'}
            spacing={1}
            alignItems={compact ? 'flex-start' : 'center'}
        >
            {/* Icono y rango de fechas */}
            <Box display="flex" alignItems="center" gap={0.5}>
                <DateRangeIcon
                    sx={{
                        fontSize: compact ? 16 : 20,
                        color: periodStatus === 'current' ? 'success.main' :
                            periodStatus === 'future' ? 'warning.main' : 'text.secondary'
                    }}
                />
                <Typography
                    variant={compact ? 'caption' : 'body2'}
                    sx={{ fontWeight: 500 }}
                >
                    {formatDateRange(ticket.serviceStart, ticket.serviceEnd)}
                </Typography>
            </Box>

            {/* Chips de estado */}
            {!compact && (
                <Stack direction="row" spacing={0.5}>
                    {/* Chip de estado del período */}
                    <Chip
                        size="small"
                        variant="outlined"
                        label={
                            periodStatus === 'current' ? 'Activo' :
                                periodStatus === 'future' ? 'Próximo' : 'Completado'
                        }
                        color={
                            periodStatus === 'current' ? 'success' :
                                periodStatus === 'future' ? 'warning' : 'default'
                        }
                        icon={
                            periodStatus === 'current' ? <CheckCircleIcon /> :
                                periodStatus === 'future' ? <ScheduleIcon /> : undefined
                        }
                    />

                    {/* Chip de tipo de pago */}
                    {paymentType !== 'unknown' && (
                        <Chip
                            size="small"
                            variant="outlined"
                            label={paymentType === 'advance' ? 'Anticipado' : 'Vencido'}
                            color={paymentType === 'advance' ? 'primary' : 'secondary'}
                        />
                    )}
                </Stack>
            )}

            {/* Información compacta */}
            {compact && (
                <Typography variant="caption" color="text.secondary">
                    {duration} días • {
                        paymentType === 'advance' ? 'Anticipado' :
                            paymentType === 'arrears' ? 'Vencido' : 'Sin tipo'
                    }
                </Typography>
            )}
        </Stack>
    );

    // Si no se requiere tooltip, devolver contenido directo
    if (!showTooltip) {
        return <Box>{PeriodContent}</Box>;
    }

    // Contenido del tooltip
    const tooltipContent = (
        <Box>
            <Typography variant="subtitle2" gutterBottom>
                Período de Servicio
            </Typography>
            <Typography variant="body2" gutterBottom>
                <strong>Inicio:</strong> {formatDate(ticket.serviceStart)}
            </Typography>
            <Typography variant="body2" gutterBottom>
                <strong>Fin:</strong> {formatDate(ticket.serviceEnd)}
            </Typography>
            <Typography variant="body2" gutterBottom>
                <strong>Duración:</strong> {duration} días
            </Typography>
            <Typography variant="body2" gutterBottom>
                <strong>Estado:</strong> {
                    periodStatus === 'current' ? 'Período activo' :
                        periodStatus === 'future' ? 'Período futuro' : 'Período completado'
                }
            </Typography>
            {paymentType !== 'unknown' && (
                <Typography variant="body2">
                    <strong>Tipo:</strong> {
                        paymentType === 'advance' ? 'Pago anticipado' : 'Pago vencido'
                    }
                </Typography>
            )}
        </Box>
    );

    return (
        <Tooltip
            title={tooltipContent}
            arrow
            placement="top"
        >
            <Box sx={{ cursor: 'help' }}>
                {PeriodContent}
            </Box>
        </Tooltip>
    );
};

// ✅ Hook personalizado para trabajar con períodos de servicio
export const useServicePeriod = (ticket: Ticket) => {
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getPeriodStatus = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(ticket.serviceStart);
        const end = new Date(ticket.serviceEnd);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (today < start) return 'future';

        if (today > end) return 'past';

        return 'current';
    };

    const getDurationInDays = (): number => {
        const start = new Date(ticket.serviceStart);
        const end = new Date(ticket.serviceEnd);
        const diffTime = end.getTime() - start.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const isOverlapping = (otherStart: Date, otherEnd: Date): boolean => {
        const start = ticket.serviceStart;
        const end = ticket.serviceEnd;
        return start <= otherEnd && end >= otherStart;
    };

    const getMonthsCovered = (): string[] => {
        const months: string[] = [];
        const current = new Date(ticket.serviceStart);
        const end = new Date(ticket.serviceEnd);

        while (current <= end) {
            const monthYear = current.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric'
            });

            if (!months.includes(monthYear)) {
                months.push(monthYear);
            }

            current.setMonth(current.getMonth() + 1);
        }

        return months;
    };

    return {
        formatDate,
        periodStatus: getPeriodStatus(),
        durationInDays: getDurationInDays(),
        isOverlapping,
        monthsCovered: getMonthsCovered(),
        isActive: getPeriodStatus() === 'current',
        isFuture: getPeriodStatus() === 'future',
        isPast: getPeriodStatus() === 'past'
    };
};