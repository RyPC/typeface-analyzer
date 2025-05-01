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

    // Parses CSV to JSON
    const parseCSV = (csvContent) => {
        Papa.parse(csvContent, {
            complete: (result) => {
                const rows = result.data;
                const header = rows[0]; // Get the header row
                const rawData = rows.slice(1); // Get the data rows

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
                            photo["municipality"] = value;
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
                        } else if (
                            /^Message Function/.test(key) &&
                            currentTypeface
                        ) {
                            currentTypeface["messageFunction"] = value
                                ? value.split(",").map((s) => s.trim())
                                : [];
                        } else if (
                            /^Covid related/.test(key) &&
                            currentTypeface
                        ) {
                            currentTypeface["covidRelated"] = value === "TRUE";
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
            },
            header: false, // CSV header manually handled
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
