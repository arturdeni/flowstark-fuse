// src/app/flowstark/dashboard/components/DashboardCharts.tsx
import React from 'react';
import {
    Grid,
    Card,
    CardHeader,
    CardContent,
    Box,
    Divider,
    IconButton,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
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
    // Datos para el gráfico de estado de suscripciones
    const statusData = [
        { name: 'Activas', value: metrics.activeSubscriptions, color: '#4CAF50' },
        { name: 'Pausadas', value: metrics.pausedSubscriptions, color: '#FF9800' },
        { name: 'Canceladas', value: metrics.cancelledSubscriptions, color: '#F44336' },
    ].filter(item => item.value > 0); // Solo mostrar estados que tengan valores

    // Datos para el gráfico de barras (nuevas vs canceladas)
    const subscriptionEvolutionData = monthlyData.map(month => ({
        month: month.month,
        nuevas: month.newSubscriptions,
        canceladas: month.cancelledSubscriptions,
    }));

    return (
        <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={6}>
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
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={monthlyData}
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
                                        dataKey="revenue"
                                        name="Ingresos"
                                        stroke="#0A74DA"
                                        activeDot={{ r: 8 }}
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} lg={6}>
                <Card elevation={1}>
                    <CardHeader
                        title="Suscripciones Activas"
                        subheader="Evolución mensual"
                        action={
                            <IconButton>
                                <MoreVertIcon />
                            </IconButton>
                        }
                    />
                    <Divider />
                    <CardContent>
                        <Box height={300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={monthlyData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) => [`${value}`, 'Suscripciones']}
                                        labelFormatter={(label) => `Mes: ${label}`}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="subscriptions"
                                        name="Suscripciones Activas"
                                        stroke="#82ca9d"
                                        activeDot={{ r: 8 }}
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={6}>
                <Card elevation={1} sx={{ height: '100%' }}>
                    <CardHeader
                        title="Estado de Suscripciones"
                        subheader="Distribución actual"
                        action={
                            <IconButton>
                                <MoreVertIcon />
                            </IconButton>
                        }
                    />
                    <Divider />
                    <CardContent>
                        <Box height={300} display="flex" justifyContent="center">
                            {statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
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
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`${value} suscripciones`, '']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    height="100%"
                                    color="text.secondary"
                                >
                                    No hay datos para mostrar
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={6}>
                <Card elevation={1}>
                    <CardHeader
                        title="Evolución de Suscripciones"
                        subheader="Nuevas vs Canceladas por mes"
                        action={
                            <IconButton>
                                <MoreVertIcon />
                            </IconButton>
                        }
                    />
                    <Divider />
                    <CardContent>
                        <Box height={300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={subscriptionEvolutionData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="nuevas" name="Nuevas" fill="#4CAF50" />
                                    <Bar dataKey="canceladas" name="Canceladas" fill="#F44336" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};