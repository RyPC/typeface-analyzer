// import "./App.css";
import {
    Box,
    Flex,
    VStack,
    Button,
    Select,
    Text,
    HStack,
    Badge,
    Heading,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Label,
    PieChart,
    Pie,
    Cell,
    Legend,
    Sector,
} from "recharts";

import Papa from "papaparse";

import { LETTERING_ONTOLOGIES } from "./constants";
import MapView from "./MapView";

export default function Dashboard({
    data,
    setData,
    processedData,
    setProcessedData,
    view,
    selectedMunicipality,
    setMunicipalities,
    feature,
    subFeature,
}) {
    const [activePieIndex, setActivePieIndex] = useState(0);

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

    // Handles uploading file from user
    const handleFileUpload = (event) => {
        const file = event.target.files[0]; // Get the uploaded file
        if (file) {
            readFile(file); // Call readFile to read the file content
        }
    };

    const readFile = (file) => {
        const reader = new FileReader();

        reader.onload = () => {
            const csvContent = reader.result; // Get the file content as text
            parseCSV(csvContent); // Call parseCSV to parse the content
        };

        reader.readAsText(file); // Read the file as text
    };

    // Parses CSV to JSON
    const parseCSV = (csvContent) => {
        Papa.parse(csvContent, {
            complete: (result) => {
                // Data to be tracked
                const typefaceStyleCounts = {};
                const letteringOntologyCounts = {};
                const messageFunctionCounts = {};
                const placementCounts = {};
                const covidRelatedCounts = {
                    "COVID-Related": 0,
                    "Non-COVID": 0,
                };

                const rows = result.data;
                const header = rows[0]; // Get the header row
                const rawData = rows.slice(1); // Get the data rows

                const municipalities = new Set(["All Municipalities"]);

                // Go through data and include non-empty entries
                const data = [];
                rawData.forEach((row) => {
                    const photo = {};

                    let currentSubstrate = null;
                    let currentTypeface = null;

                    // Go through all photo data and add to photo object
                    for (let i = 0; i < header.length; i++) {
                        const key = header[i];
                        const value = row[i];

                        // Iniital photo data conditions
                        if (key === "Submission ID") {
                            photo["id"] = value;
                        } else if (key === "Initials") {
                            photo["initials"] = value;
                        } else if (key === "Municipality") {
                            photo["municipality"] = value.trim();
                            municipalities.add(value.trim());
                        } else if (key === "Photo name") {
                            photo["custom_id"] = value;
                        } else if (key === "Number of substrates") {
                            photo["substrateCount"] = value;
                            photo["substrates"] = [];
                        }

                        // Multiple substrate conditions
                        else if (/^Placement/.test(key)) {
                            // Push old substrate to substrates array
                            if (currentSubstrate) {
                                photo["substrates"].push(currentSubstrate);
                            }
                            if (value) {
                                currentSubstrate = {};
                                currentSubstrate["placement"] = value;
                                placementCounts[value] =
                                    (placementCounts[value] || 0) + 1;
                            } else {
                                currentSubstrate = null;
                            }
                        } else if (
                            /^Substrate Notes/.test(key) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["additionalNotes"] = value;
                        } else if (
                            /^This isn't really a sign/.test(key) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["thisIsntReallyASign"] = value;
                        } else if (
                            /^What is is?/.test(key) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["notASignDescription"] = value;
                        } else if (
                            /^Number of typefaces on this substrate/.test(
                                key
                            ) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["typefaces"] = [];
                        }

                        // Multiple typeface conditions
                        else if (/^Typeface Style/.test(key)) {
                            // Push old typeface to substrates array
                            if (currentTypeface) {
                                currentSubstrate["typefaces"].push(
                                    currentTypeface
                                );
                            }
                            if (value) {
                                currentTypeface = {};
                                currentTypeface["typefaceStyle"] = value
                                    ? value.split(",").map((s) => s.trim())
                                    : [];
                                // Add to typeface style counts
                                currentTypeface["typefaceStyle"].forEach(
                                    (style) => {
                                        typefaceStyleCounts[style] =
                                            (typefaceStyleCounts[style] || 0) +
                                            1;
                                    }
                                );
                            } else {
                                currentTypeface = null;
                            }
                        } else if (/^Copy/.test(key) && currentTypeface) {
                            currentTypeface["copy"] = value;
                        } else if (
                            /^Lettering Ontology/.test(key) &&
                            currentTypeface
                        ) {
                            currentTypeface["letteringOntology"] = value
                                ? value.split(",").map((s) => s.trim())
                                : [];
                            // Add to lettering ontology counts
                            currentTypeface["letteringOntology"].forEach(
                                (ontology) => {
                                    letteringOntologyCounts[ontology] =
                                        (letteringOntologyCounts[ontology] ||
                                            0) + 1;
                                }
                            );
                        } else if (
                            /^Message Function/.test(key) &&
                            currentTypeface
                        ) {
                            currentTypeface["messageFunction"] = value
                                ? value.split(",").map((s) => s.trim())
                                : [];
                            // Add to message function counts
                            currentTypeface["messageFunction"].forEach(
                                (msgFunction) => {
                                    messageFunctionCounts[msgFunction] =
                                        (messageFunctionCounts[msgFunction] ||
                                            0) + 1;
                                }
                            );
                        } else if (
                            /^Covid related/.test(key) &&
                            currentTypeface
                        ) {
                            currentTypeface["covidRelated"] = value === "true";
                            // Add to covid related counts
                            if (value === "true") {
                                covidRelatedCounts["COVID-Related"]++;
                            } else {
                                covidRelatedCounts["Non-COVID"]++;
                            }
                        } else if (
                            /^Text Notes(?!\?)\b.*/.test(key) &&
                            currentTypeface
                        ) {
                            currentTypeface["additionalNotes"] = value;
                        }

                        // Extra substrate data conditions
                        else if (
                            /^Overall confidence/.test(key) &&
                            currentSubstrate
                        ) {
                            // Push last typeface to substrates array
                            if (currentTypeface) {
                                currentSubstrate["typefaces"].push(
                                    currentTypeface
                                );
                                currentTypeface = null;
                            }
                            currentSubstrate["confidence"] = value;
                        } else if (
                            /^Explain your reasoning/.test(key) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["confidenceReasoning"] = value;
                        } else if (
                            /^Any additional information/.test(key) &&
                            currentSubstrate
                        ) {
                            currentSubstrate["additionalInfo"] = value;
                        }
                    }

                    // Push last substrate and typeface to arrays
                    if (currentSubstrate) {
                        photo["substrates"].push(currentSubstrate);
                        currentSubstrate = null;
                    }

                    // Push photo to data array
                    data.push(photo);
                });

                console.log(data);
                setData(data);
                setMunicipalities([...municipalities]);

                // Process data into counts
                // Convert to arrays for charts
                const typefaceData = Object.keys(typefaceStyleCounts).map(
                    (key) => ({
                        typeface: key,
                        count: typefaceStyleCounts[key],
                    })
                );

                const letteringData = Object.keys(letteringOntologyCounts)
                    .filter((key) => LETTERING_ONTOLOGIES.includes(key))
                    .map((key) => ({
                        ontology: key,
                        count: letteringOntologyCounts[key],
                    }));
                letteringData.push({
                    ontology: "Other",
                    count: Object.keys(letteringOntologyCounts)
                        .filter((key) => !LETTERING_ONTOLOGIES.includes(key))
                        .reduce((acc, key) => {
                            return acc + letteringOntologyCounts[key] || 0;
                        }, 0),
                });

                const messageFunctionData = Object.keys(
                    messageFunctionCounts
                ).map((key) => ({
                    function: key,
                    count: messageFunctionCounts[key],
                }));

                const placementData = Object.keys(placementCounts).map(
                    (key) => ({
                        placement: key,
                        count: placementCounts[key],
                    })
                );

                const covidData = Object.keys(covidRelatedCounts).map(
                    (key) => ({
                        category: key,
                        count: covidRelatedCounts[key],
                        color: key === "COVID-Related" ? "#FF8042" : "#0088FE",
                    })
                );
                setProcessedData({
                    typefaceData,
                    letteringData,
                    messageFunctionData,
                    placementData,
                    covidData,
                });
                console.log({
                    typefaceData,
                    letteringData,
                    messageFunctionData,
                    placementData,
                    covidData,
                });
            },
            header: false, // CSV header manually handled
        });
    };

    // useEffect(() => {
    //     setChartFocus([Object.keys(data)[0], Object.keys(data)[0]]);
    // }, [data]);

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

    const handleJSONUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const jsonData = JSON.parse(reader.result);

                    // Data to be tracked
                    const typefaceStyleCounts = {};
                    const letteringOntologyCounts = {};
                    const messageFunctionCounts = {};
                    const placementCounts = {};
                    const covidRelatedCounts = {
                        "COVID-Related": 0,
                        "Non-COVID": 0,
                    };

                    const municipalities = new Set(["All Municipalities"]);

                    // Process the JSON data
                    jsonData.forEach((photo) => {
                        if (photo.municipality) {
                            municipalities.add(photo.municipality.trim());
                        }

                        photo.substrates?.forEach((substrate) => {
                            if (substrate.placement) {
                                placementCounts[substrate.placement] =
                                    (placementCounts[substrate.placement] ||
                                        0) + 1;
                            }

                            substrate.typefaces?.forEach((typeface) => {
                                // Count typeface styles
                                typeface.typefaceStyle?.forEach((style) => {
                                    typefaceStyleCounts[style] =
                                        (typefaceStyleCounts[style] || 0) + 1;
                                });

                                // Count lettering ontologies
                                typeface.letteringOntology?.forEach(
                                    (ontology) => {
                                        letteringOntologyCounts[ontology] =
                                            (letteringOntologyCounts[
                                                ontology
                                            ] || 0) + 1;
                                    }
                                );

                                // Count message functions
                                typeface.messageFunction?.forEach(
                                    (msgFunction) => {
                                        messageFunctionCounts[msgFunction] =
                                            (messageFunctionCounts[
                                                msgFunction
                                            ] || 0) + 1;
                                    }
                                );

                                // Count COVID-related
                                if (typeface.covidRelated) {
                                    covidRelatedCounts["COVID-Related"]++;
                                } else {
                                    covidRelatedCounts["Non-COVID"]++;
                                }
                            });
                        });
                    });

                    setData(jsonData);
                    setMunicipalities([...municipalities]);

                    // Process data into counts
                    const typefaceData = Object.keys(typefaceStyleCounts).map(
                        (key) => ({
                            typeface: key,
                            count: typefaceStyleCounts[key],
                        })
                    );

                    const letteringData = Object.keys(letteringOntologyCounts)
                        .filter((key) => LETTERING_ONTOLOGIES.includes(key))
                        .map((key) => ({
                            ontology: key,
                            count: letteringOntologyCounts[key],
                        }));
                    letteringData.push({
                        ontology: "Other",
                        count: Object.keys(letteringOntologyCounts)
                            .filter(
                                (key) => !LETTERING_ONTOLOGIES.includes(key)
                            )
                            .reduce((acc, key) => {
                                return acc + letteringOntologyCounts[key] || 0;
                            }, 0),
                    });

                    const messageFunctionData = Object.keys(
                        messageFunctionCounts
                    ).map((key) => ({
                        function: key,
                        count: messageFunctionCounts[key],
                    }));

                    const placementData = Object.keys(placementCounts).map(
                        (key) => ({
                            placement: key,
                            count: placementCounts[key],
                        })
                    );

                    const covidData = Object.keys(covidRelatedCounts).map(
                        (key) => ({
                            category: key,
                            count: covidRelatedCounts[key],
                            color:
                                key === "COVID-Related" ? "#FF8042" : "#0088FE",
                        })
                    );

                    setProcessedData({
                        typefaceData,
                        letteringData,
                        messageFunctionData,
                        placementData,
                        covidData,
                    });
                } catch (error) {
                    console.error("Error parsing JSON file:", error);
                    alert(
                        "Error parsing JSON file. Please make sure it's in the correct format."
                    );
                }
            };
            reader.readAsText(file);
        }
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
                {Object.keys(data).length > 0 ? (
                    <>
                        {view === "municipality" ? (
                            <>
                                <Heading size="lg" mb={4} textAlign="center">
                                    Typography Analysis of{" "}
                                    {selectedMunicipality}
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
                                        <Heading
                                            size="md"
                                            mb={4}
                                            color="#2D3748"
                                        >
                                            Typeface Distribution
                                        </Heading>
                                        <Badge mb={4} colorScheme="purple">
                                            Total:{" "}
                                            {processedData.typefaceData.reduce(
                                                (total, typeface) =>
                                                    total + typeface.count,
                                                0
                                            )}
                                        </Badge>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <BarChart
                                                data={
                                                    processedData.typefaceData
                                                }
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
                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                />
                                                <Legend verticalAlign="top" />
                                                <Bar
                                                    dataKey="count"
                                                    name="Number of Occurrences"
                                                    radius={[5, 5, 0, 0]}
                                                >
                                                    {processedData.typefaceData &&
                                                        processedData.typefaceData.map(
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
                                        <Heading
                                            size="md"
                                            mb={4}
                                            color="#2D3748"
                                        >
                                            Lettering Classifications
                                        </Heading>
                                        <Badge mb={4} colorScheme="blue">
                                            Total:{" "}
                                            {processedData.letteringData.reduce(
                                                (total, ontology) =>
                                                    total + ontology.count,
                                                0
                                            )}
                                        </Badge>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <BarChart
                                                data={
                                                    processedData.letteringData
                                                }
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
                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                />
                                                <Legend verticalAlign="top" />
                                                <Bar
                                                    dataKey="count"
                                                    name="Number of Typefaces"
                                                    radius={[5, 5, 0, 0]}
                                                >
                                                    {processedData.letteringData &&
                                                        processedData.letteringData.map(
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
                                        <Heading
                                            size="md"
                                            mb={4}
                                            color="#2D3748"
                                        >
                                            Message Functions
                                        </Heading>
                                        <Badge mb={4} colorScheme="green">
                                            Total:{" "}
                                            {processedData.messageFunctionData.reduce(
                                                (total, typefaces) =>
                                                    total + typefaces.count,
                                                0
                                            )}
                                        </Badge>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <BarChart
                                                data={
                                                    processedData.messageFunctionData
                                                }
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
                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                />
                                                <Legend verticalAlign="top" />
                                                <Bar
                                                    dataKey="count"
                                                    name="Number of Typefaces"
                                                    radius={[5, 5, 0, 0]}
                                                >
                                                    {processedData.messageFunctionData &&
                                                        processedData.messageFunctionData.map(
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
                                        <Heading
                                            size="md"
                                            mb={4}
                                            color="#2D3748"
                                        >
                                            Placement Distribution
                                        </Heading>
                                        <Badge mb={4} colorScheme="teal">
                                            Total:{" "}
                                            {processedData.placementData.reduce(
                                                (total, substrate) =>
                                                    total + substrate.count,
                                                0
                                            )}
                                        </Badge>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <BarChart
                                                data={
                                                    processedData.placementData
                                                }
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
                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                />
                                                <Legend verticalAlign="top" />
                                                <Bar
                                                    dataKey="count"
                                                    name="Number of Typefaces"
                                                    radius={[5, 5, 0, 0]}
                                                >
                                                    {processedData.placementData &&
                                                        processedData.placementData.map(
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
                                        <Heading
                                            size="md"
                                            mb={4}
                                            color="#2D3748"
                                        >
                                            COVID-Related Signage
                                        </Heading>
                                        <Badge mb={4} colorScheme="orange">
                                            Total:{" "}
                                            {processedData.covidData.reduce(
                                                (total, substrate) =>
                                                    total + substrate.count,
                                                0
                                            )}
                                        </Badge>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <PieChart>
                                                <Pie
                                                    activeIndex={activePieIndex}
                                                    activeShape={
                                                        renderActiveShape
                                                    }
                                                    data={
                                                        processedData.covidData
                                                    }
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    dataKey="count"
                                                    nameKey="category"
                                                    onMouseEnter={onPieEnter}
                                                >
                                                    {processedData.covidData &&
                                                        processedData.covidData.map(
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
                                    data={data}
                                    feature={feature}
                                    subFeature={subFeature}
                                    view={view}
                                    processedData={processedData}
                                />
                            </Box>
                        )}
                    </>
                ) : (
                    <Box p={5}>
                        <HStack spacing={4}>
                            <label htmlFor="csv_upload">
                                <Text
                                    as="b"
                                    p="8px"
                                    borderRadius="4px"
                                    backgroundColor="#FFF"
                                    color="#000C5C"
                                    _hover={{ backgroundColor: "#FFF8" }}
                                    transition="ease-in-out 0.2s"
                                >
                                    Upload CSV
                                </Text>
                            </label>

                            <input
                                type="file"
                                id="csv_upload"
                                name="csv_upload"
                                accept=".csv"
                                onChange={handleFileUpload}
                                hidden
                            />

                            <label htmlFor="json_upload">
                                <Text
                                    as="b"
                                    p="8px"
                                    borderRadius="4px"
                                    backgroundColor="#FFF"
                                    color="#000C5C"
                                    _hover={{ backgroundColor: "#FFF8" }}
                                    transition="ease-in-out 0.2s"
                                >
                                    Upload JSON
                                </Text>
                            </label>

                            <input
                                type="file"
                                id="json_upload"
                                name="json_upload"
                                accept=".json"
                                onChange={handleJSONUpload}
                                hidden
                            />
                        </HStack>
                    </Box>
                )}
            </Flex>
        </Box>
    );
}
