import { Box, Flex, Text, Badge, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    Sector,
} from "recharts";

import { LETTERING_ONTOLOGIES } from "./constants";
import MapView from "./MapView";

const API_URL = process.env.REACT_APP_API_URL;

export default function Dashboard({
    data,
    view,
    selectedMunicipality,
    feature,
    subFeature,
}) {
    const [activePieIndex, setActivePieIndex] = useState(0);
    const [typefaceData, setTypefaceData] = useState([]);
    const [letteringData, setLetteringData] = useState([]);
    const [messageFunctionData, setMessageFunctionData] = useState([]);
    const [placementData, setPlacementData] = useState([]);
    const [covidData, setCovidData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Color schemes for the charts
    const barColors = [
        "#8884d8",
        "#83a6ed",
        "#8dd1e1",
        "#82ca9d",
        "#a4de6c",
        "#d0ed57",
    ];
    const pieColors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

    // Fetch all stats when municipality changes
    useEffect(() => {
        const fetchStats = async () => {
            if (!selectedMunicipality) return;

            setIsLoading(true);
            try {
                const baseUrl = API_URL;
                const muniParam =
                    selectedMunicipality === "All Municipalities"
                        ? ""
                        : `/${selectedMunicipality}`;

                // Fetch typeface stats
                const typefaceResponse = await fetch(
                    `${baseUrl}/api/stats/typeface${muniParam}`
                );
                if (!typefaceResponse.ok) {
                    throw new Error(
                        `HTTP error! status: ${typefaceResponse.status}`
                    );
                }
                const typefaceStats = await typefaceResponse.json();
                setTypefaceData(
                    typefaceStats.map((item) => ({
                        typeface: item._id,
                        count: item.count,
                    }))
                );

                // Fetch lettering ontology stats
                const letteringResponse = await fetch(
                    `${baseUrl}/api/stats/lettering-ontology${muniParam}`
                );
                if (!letteringResponse.ok) {
                    throw new Error(
                        `HTTP error! status: ${letteringResponse.status}`
                    );
                }
                const letteringStats = await letteringResponse.json();

                // Process lettering stats to combine non-standard ontologies into "Other"
                const processedLetteringStats = letteringStats.reduce(
                    (acc, item) => {
                        const ontology = item._id;
                        if (LETTERING_ONTOLOGIES.includes(ontology)) {
                            acc.push({
                                ontology: ontology,
                                count: item.count,
                            });
                        } else {
                            // Find or create "Other" category
                            const otherIndex = acc.findIndex(
                                (x) => x.ontology === "Other"
                            );
                            if (otherIndex === -1) {
                                acc.push({
                                    ontology: "Other",
                                    count: item.count,
                                });
                            } else {
                                acc[otherIndex].count += item.count;
                            }
                        }
                        return acc;
                    },
                    []
                );

                setLetteringData(processedLetteringStats);

                // Fetch message function stats
                const messageFunctionResponse = await fetch(
                    `${baseUrl}/api/stats/message-function${muniParam}`
                );
                if (!messageFunctionResponse.ok) {
                    throw new Error(
                        `HTTP error! status: ${messageFunctionResponse.status}`
                    );
                }
                const messageFunctionStats =
                    await messageFunctionResponse.json();
                setMessageFunctionData(
                    messageFunctionStats.map((item) => ({
                        function: item._id,
                        count: item.count,
                    }))
                );

                // Fetch placement stats
                const placementResponse = await fetch(
                    `${baseUrl}/api/stats/placement${muniParam}`
                );
                if (!placementResponse.ok) {
                    throw new Error(
                        `HTTP error! status: ${placementResponse.status}`
                    );
                }
                const placementStats = await placementResponse.json();
                setPlacementData(
                    placementStats.map((item) => ({
                        placement: item._id,
                        count: item.count,
                    }))
                );

                // Fetch COVID stats
                const covidResponse = await fetch(
                    `${baseUrl}/api/stats/covid${muniParam}`
                );
                if (!covidResponse.ok) {
                    throw new Error(
                        `HTTP error! status: ${covidResponse.status}`
                    );
                }
                const covidStats = await covidResponse.json();
                setCovidData(
                    covidStats.map((item) => ({
                        category: item._id
                            ? "COVID Related"
                            : "Not COVID Related",
                        count: item.count,
                    }))
                );
            } catch (error) {
                console.error("Error fetching stats:", error);
                // Set empty arrays for all data in case of error
                setTypefaceData([]);
                setLetteringData([]);
                setMessageFunctionData([]);
                setPlacementData([]);
                setCovidData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [selectedMunicipality]);

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Box bg="white" p={3} borderRadius="md" boxShadow="md">
                    <Text fontWeight="bold">{label}</Text>
                    <Text color={payload[0].color || "#8884d8"}>
                        Count: {payload[0].value}
                    </Text>
                </Box>
            );
        }
        return null;
    };

    // Active sector for pie chart
    const onPieEnter = (_, index) => {
        setActivePieIndex(index);
    };

    // Render active shape for pie chart
    const renderActiveShape = (props) => {
        const {
            cx,
            cy,
            innerRadius,
            outerRadius,
            startAngle,
            endAngle,
            fill,
            payload,
            percent,
            value,
        } = props;

        return (
            <g>
                <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#333">
                    {payload.category}
                </text>
                <text
                    x={cx}
                    y={cy}
                    dy={8}
                    textAnchor="middle"
                    fill="#333"
                    fontSize={16}
                    fontWeight="bold"
                >
                    {value}
                </text>
                <text x={cx} y={cy} dy={25} textAnchor="middle" fill="#999">
                    {`(${(percent * 100).toFixed(2)}%)`}
                </text>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 10}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    innerRadius={outerRadius + 12}
                    outerRadius={outerRadius + 16}
                    fill={fill}
                />
            </g>
        );
    };

    return (
        <Box flex={1} w="full" height="full">
            <Flex
                wrap="wrap"
                gap={4}
                w="full"
                justify="center"
                flexDirection="column"
                padding={10}
            >
                {view === "municipality" ? (
                    <>
                        <Heading size="lg" mb={4} textAlign="center">
                            Typography Analysis of {selectedMunicipality}
                        </Heading>
                        {/* First row */}
                        <Flex direction="row" gap={4} mb={4}>
                            {/* Typeface Data */}
                            <Box
                                flex={1}
                                bg="white"
                                borderRadius="xl"
                                p={6}
                                boxShadow="md"
                                overflow="hidden"
                            >
                                <Heading size="md" mb={4} color="#2D3748">
                                    Typeface Distribution
                                </Heading>
                                <Badge mb={4} colorScheme="purple">
                                    Total:{" "}
                                    {typefaceData.reduce(
                                        (total, typeface) =>
                                            total + typeface.count,
                                        0
                                    )}
                                </Badge>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={typefaceData}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 40,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f0f0f0"
                                        />
                                        <XAxis
                                            dataKey="typeface"
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" />
                                        <Bar
                                            dataKey="count"
                                            name="Number of Occurrences"
                                            radius={[5, 5, 0, 0]}
                                        >
                                            {typefaceData &&
                                                typefaceData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                barColors[
                                                                    index %
                                                                        barColors.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>

                            {/* Lettering Ontology Data */}
                            <Box
                                flex={1}
                                bg="white"
                                borderRadius="xl"
                                p={6}
                                boxShadow="md"
                                overflow="hidden"
                            >
                                <Heading size="md" mb={4} color="#2D3748">
                                    Lettering Classifications
                                </Heading>
                                <Badge mb={4} colorScheme="blue">
                                    Total:{" "}
                                    {letteringData.reduce(
                                        (total, ontology) =>
                                            total + ontology.count,
                                        0
                                    )}
                                </Badge>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={letteringData}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 40,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f0f0f0"
                                        />
                                        <XAxis
                                            dataKey="ontology"
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" />
                                        <Bar
                                            dataKey="count"
                                            name="Number of Typefaces"
                                            radius={[5, 5, 0, 0]}
                                        >
                                            {letteringData &&
                                                letteringData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                barColors[
                                                                    index %
                                                                        barColors.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Flex>

                        {/* Second row */}
                        <Flex direction="row" gap={4}>
                            {/* Message Function Data */}
                            <Box
                                flex={1}
                                bg="white"
                                borderRadius="xl"
                                p={6}
                                boxShadow="md"
                                overflow="hidden"
                            >
                                <Heading size="md" mb={4} color="#2D3748">
                                    Message Functions
                                </Heading>
                                <Badge mb={4} colorScheme="green">
                                    Total:{" "}
                                    {messageFunctionData.reduce(
                                        (total, typefaces) =>
                                            total + typefaces.count,
                                        0
                                    )}
                                </Badge>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={messageFunctionData}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 40,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f0f0f0"
                                        />
                                        <XAxis
                                            dataKey="function"
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" />
                                        <Bar
                                            dataKey="count"
                                            name="Number of Typefaces"
                                            radius={[5, 5, 0, 0]}
                                        >
                                            {messageFunctionData &&
                                                messageFunctionData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                barColors[
                                                                    index %
                                                                        barColors.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>

                            {/* Placement Data */}
                            <Box
                                flex={1}
                                bg="white"
                                borderRadius="xl"
                                p={6}
                                boxShadow="md"
                                overflow="hidden"
                            >
                                <Heading size="md" mb={4} color="#2D3748">
                                    Placement Distribution
                                </Heading>
                                <Badge mb={4} colorScheme="teal">
                                    Total:{" "}
                                    {placementData.reduce(
                                        (total, substrate) =>
                                            total + substrate.count,
                                        0
                                    )}
                                </Badge>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={placementData}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 40,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f0f0f0"
                                        />
                                        <XAxis
                                            dataKey="placement"
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend verticalAlign="top" />
                                        <Bar
                                            dataKey="count"
                                            name="Number of Typefaces"
                                            radius={[5, 5, 0, 0]}
                                        >
                                            {placementData &&
                                                placementData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                barColors[
                                                                    index %
                                                                        barColors.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>

                            {/* COVID Data */}
                            <Box
                                flex={1}
                                bg="white"
                                borderRadius="xl"
                                p={6}
                                boxShadow="md"
                                overflow="hidden"
                            >
                                <Heading size="md" mb={4} color="#2D3748">
                                    COVID-Related Signage
                                </Heading>
                                <Badge mb={4} colorScheme="orange">
                                    Total:{" "}
                                    {covidData.reduce(
                                        (total, substrate) =>
                                            total + substrate.count,
                                        0
                                    )}
                                </Badge>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            activeIndex={activePieIndex}
                                            activeShape={renderActiveShape}
                                            data={covidData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            dataKey="count"
                                            nameKey="category"
                                            onMouseEnter={onPieEnter}
                                        >
                                            {covidData &&
                                                covidData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                pieColors[
                                                                    index %
                                                                        pieColors.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Flex>
                    </>
                ) : (
                    <Box h="calc(100vh - 200px)">
                        <MapView
                            feature={feature}
                            subFeature={subFeature}
                            view={view}
                        />
                    </Box>
                )}
            </Flex>
        </Box>
    );
}
