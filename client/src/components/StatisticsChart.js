import { Box, Badge, Heading } from "@chakra-ui/react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend,
} from "recharts";

const BAR_COLORS = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c", "#d0ed57"];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <Box bg="white" p={3} borderRadius="md" boxShadow="md">
                <Box fontWeight="bold">{label}</Box>
                <Box color={payload[0].color || "#8884d8"}>Count: {payload[0].value}</Box>
            </Box>
        );
    }
    return null;
};

export default function StatisticsChart({ title, data, dataKey, barLabel, badgeColorScheme }) {
    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
        <Box flex={1} bg="white" borderRadius="xl" p={6} boxShadow="md" overflow="hidden">
            <Heading size="md" mb={4} color="#2D3748">{title}</Heading>
            <Badge mb={4} colorScheme={badgeColorScheme}>Total: {total}</Badge>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey={dataKey} angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" />
                    <Bar dataKey="count" name={barLabel} radius={[5, 5, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
}
