// import "./App.css";
import { Box, Flex, VStack, Button, Select, Text } from "@chakra-ui/react";
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
} from "recharts";

import Papa from "papaparse";

export default function Dashboard({ data, setData }) {
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

    // Parses CSV to...
    const parseCSV = (csvContent) => {
        Papa.parse(csvContent, {
            complete: (result) => {
                const rows = result.data;

                if (rows.length < 2) return;

                const header = rows[0];
                const typefaceCols = header
                    .map((col, i) => ({ col, i }))
                    .filter((item) => item.col.includes("Typeface Style"))
                    .map((item) => item.i);

                const municipalityIndex = header.indexOf("Municipality");

                const records = [];

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    const municipality = row[municipalityIndex];
                    const fontsSet = new Set();

                    typefaceCols.forEach((colIndex) => {
                        const value = row[colIndex];
                        if (value) {
                            const fonts = value
                                .split(",")
                                .map((f) => f.trim())
                                .filter((f) => f !== "");
                            fonts.forEach((f) => fontsSet.add(f));
                        }
                    });

                    fontsSet.forEach((font) => {
                        records.push({
                            Municipality: municipality,
                            TypefaceStyle: font,
                        });
                    });
                }

                // Count occurrences
                const countMap = {};
                records.forEach(({ Municipality, TypefaceStyle }) => {
                    const key = `${Municipality}|||${TypefaceStyle}`.trim();
                    countMap[key] = (countMap[key] || 0) + 1;
                });

                // Aggregate data
                const groupedData = {};
                for (const key in countMap) {
                    const [municipality, style] = key.split("|||");
                    if (!groupedData[municipality])
                        groupedData[municipality] = {};
                    groupedData[municipality][style] = countMap[key];
                }

                // Agregate counts and reformat
                const counts = {};
                for (const muni in groupedData) {
                    counts[muni] = [];
                    for (const style in groupedData[muni]) {
                        counts[muni].push({
                            typeface: style,
                            count: groupedData[muni][style],
                        });
                    }
                }

                setData(counts);
            },
            header: false, // CSV header manually handled
            skipEmptyLines: true,
        });
    };

    useEffect(() => {
        setChartFocus([Object.keys(data)[0], Object.keys(data)[0]]);
    }, [data]);
    const [chartFocus, setChartFocus] = useState([]);
    return (
        <Box flex={1} w="full" height="full">
            <Flex
                wrap="wrap"
                gap={4}
                w="full"
                justify="center"
                flexDirection="row"
                padding={10}
            >
                {Object.keys(data).length > 0 ? (
                    <>
                        {/* Bar Graphs */}
                        {[0, 0].map((_, row) => (
                            <Box
                                backgroundColor="#55627E"
                                flex={1}
                                color="white"
                                rounded="30px"
                                alignContent="center"
                                textAlign="center"
                                p={4}
                            >
                                <VStack>
                                    <Text>
                                        Counts of typefaces in {chartFocus[row]}
                                    </Text>
                                    <ResponsiveContainer
                                        width={600}
                                        height={300}
                                    >
                                        <BarChart data={data[chartFocus[row]]}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="typeface"
                                                stroke="white"
                                            />
                                            <YAxis stroke="white" />
                                            <Tooltip stroke="black" />
                                            <Bar
                                                dataKey="count"
                                                fill="#8884d8"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <Select
                                        onChange={(e) => {
                                            const newChartFocus = [
                                                ...chartFocus,
                                            ];
                                            newChartFocus[row] = e.target.value;
                                            setChartFocus(newChartFocus);

                                            console.log(newChartFocus);
                                        }}
                                    >
                                        {Object.keys(data).map((muni) => (
                                            <option>{muni}</option>
                                        ))}
                                    </Select>
                                </VStack>
                            </Box>
                        ))}
                        {/* Pie Chart */}
                        <Box
                            backgroundColor="#55627E"
                            flex={1}
                            color="white"
                            rounded="30px"
                            alignContent="center"
                            textAlign="center"
                            p={4}
                        >
                            <VStack>
                                <Text>
                                    Distribution of Typefaces by Municipality
                                </Text>
                                <ResponsiveContainer width={600} height={300}>
                                    <PieChart>
                                        <Pie
                                            data={Object.keys(data).map(
                                                (municipality) => ({
                                                    name: municipality,
                                                    value: data[
                                                        municipality
                                                    ].reduce(
                                                        (sum, item) =>
                                                            sum + item.count,
                                                        0
                                                    ),
                                                })
                                            )}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            label={({ name, value }) =>
                                                `${name}: ${value}`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {Object.keys(data).map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={`hsl(${
                                                            (index * 360) /
                                                            Object.keys(data)
                                                                .length
                                                        }, 70%, 60%)`}
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value, name) => [
                                                `${value} typefaces`,
                                                name,
                                            ]}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </VStack>
                        </Box>
                    </>
                ) : (
                    <Box p={5}>
                        <label for="csv_upload">
                            <Text
                                as="b"
                                p="8px"
                                borderRadius="4px"
                                backgroundColor="#FFF"
                                color="#000C5C"
                                _hover={{ backgroundColor: "#FFF8" }}
                                transition="ease-in-out 0.2s"
                            >
                                Upload Data
                            </Text>
                        </label>

                        <input
                            type="file"
                            id="csv_upload"
                            name="csv_upload"
                            accept=".csv"
                            onChange={handleFileUpload}
                            // className="hidden"
                            hidden
                        />
                    </Box>
                )}
            </Flex>
        </Box>
    );
}
