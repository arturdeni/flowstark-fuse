// src/app/flowstark/dashboard/components/DashboardCharts.tsx
import React from 'react';
import {
    Grid,
    Card,
    CardHeader,
    CardContent,
    Box,
    Divider,
    Typography,
} from '@mui/material';
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { MonthlyData, DashboardMetrics } from '../hooks/useDashboard';

interface DashboardChartsProps {
    monthlyData: MonthlyData[];
    metrics: DashboardMetrics;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
    monthlyData,
    metrics,
}) => {
    // Datos para el gráfico de estado de suscripciones (sin pausadas)
    const statusData = [
        { name: 'Activas', value: metrics.activeSubscriptions, color: '#4CAF50' },
        { name: 'Canceladas', value: metrics.cancelledSubscriptions, color: '#F44336' },
    ].filter(item => item.value > 0);

    // Datos para el gráfico de evolución de suscripciones
    const subscriptionEvolutionData = monthlyData.map(month => ({
        month: month.month,
        nuevas: month.newSubscriptions,
        canceladas: month.cancelledSubscriptions,
        activas: month.activeSubscriptions,
    }));

    // Datos para el gráfico de ingresos
    const revenueData = monthlyData.map(month => ({
        month: month.month,
        ingresos: month.revenue,
    }));

    // Función para formatear moneda
    const formatCurrency = (value: number) => {
        return `${value.toFixed(0)}€`;
    };

    // Función para formatear tooltips
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <Box sx={{ 
                    bgcolor: 'background.paper', 
                    p: 1, 
                    border: 1, 
                    borderColor: 'divider',
                    borderRadius: 1,
                    boxShadow: 2
                }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {label}
                    </Typography>
                    {payload.map((entry: any, index: number) => (
                        <Typography key={index} variant="body2" sx={{ color: entry.color }}>
                            {entry.name}: {entry.name.includes('ingresos') ? formatCurrency(entry.value) : entry.value}
                        </Typography>
                    ))}
                </Box>
            );
        }

        return null;
    };

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Gráfico de estado de suscripciones */}
            <Grid item xs={12} md={6}>
                <Card>
                    <CardHeader 
                        title="Estado de Suscripciones" 
                        titleTypographyProps={{ variant: 'h6' }}
                    />
                    <Divider />
                    <CardContent>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value, percent }) => 
                                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                                        }
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Gráfico de evolución de ingresos */}
            <Grid item xs={12} md={6}>
                <Card>
                    <CardHeader 
                        title="Evolución de Ingresos Mensuales" 
                        titleTypographyProps={{ variant: 'h6' }}
                    />
                    <Divider />
                    <CardContent>
                        <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={formatCurrency} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="ingresos" 
                                        stroke="#2196F3" 
                                        fill="#2196F3" 
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Gráfico de evolución de suscripciones */}
            <Grid item xs={12} md={8}>
                <Card>
                    <CardHeader 
                        title="Evolución de Suscripciones" 
                        titleTypographyProps={{ variant: 'h6' }}
                    />
                    <Divider />
                    <CardContent>
                        <Box sx={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={subscriptionEvolutionData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="activas" 
                                        stroke="#4CAF50" 
                                        strokeWidth={3}
                                        name="Suscripciones Activas"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="nuevas" 
                                        stroke="#2196F3" 
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="Nuevas Suscripciones"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="canceladas" 
                                        stroke="#F44336" 
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="Cancelaciones"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Gráfico de comparación mensual (barras) */}
            <Grid item xs={12} md={4}>
                <Card>
                    <CardHeader 
                        title="Nuevas vs Canceladas" 
                        titleTypographyProps={{ variant: 'h6' }}
                    />
                    <Divider />
                    <CardContent>
                        <Box sx={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subscriptionEvolutionData.slice(-6)}> {/* Últimos 6 meses */}
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar 
                                        dataKey="nuevas" 
                                        fill="#4CAF50" 
                                        name="Nuevas"
                                        radius={[2, 2, 0, 0]}
                                    />
                                    <Bar 
                                        dataKey="canceladas" 
                                        fill="#F44336" 
                                        name="Canceladas"
                                        radius={[2, 2, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};