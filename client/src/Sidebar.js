// import "./App.css";
import {
    Box,
    Button,
    Divider,
    Flex,
    Heading,
    Select,
    Text,
    VStack,
} from "@chakra-ui/react";
import {
    DownloadIcon,
    AddIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@chakra-ui/icons";

import { useState } from "react";

export default function Sidebar({
    data,
    onOpen,
    view,
    setView,
    municipalities,
    municipality,
    updateMunicipality,
    feature,
    setFeature,
    subFeature,
    setSubFeature,
    processedData,
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Toggle sidebar collapse state
    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleDownloadJSON = () => {
        // Simple implementation - you might want to customize based on your data structure
        if (Object.keys(data).length <= 0) return;

        // Convert data to JSON format
        const jsonContent = JSON.stringify(data, null, 2);

        // Create a downloadable link
        const blob = new Blob([jsonContent], {
            type: "application/json;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "typeface_data.json");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box
            w={isCollapsed ? "70px" : "300px"}
            h="100%"
            backgroundColor="#55627E"
            pos="sticky"
            top="120px"
            height="calc(100vh - 120px)"
            borderRadius="0 15px 15px 0"
            boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
            transition="all 0.3s ease"
            overflow="hidden"
        >
            <Flex
                direction="column"
                h="100%"
                w="100%"
                color="white"
                textAlign="center"
                py={6}
                px={isCollapsed ? 2 : 4}
            >
                {!isCollapsed && (
                    <Box p={4}>
                        <Text fontSize="xl" fontWeight="bold">
                            Typeface Dashboard
                        </Text>
                        <Divider my={4} borderColor="whiteAlpha.400" />
                    </Box>
                )}

                {!isCollapsed && (
                    <VStack spacing={6} align="stretch" flex={1} px={3}>
                        <Text fontSize="sm" color="whiteAlpha.700">
                            {Object.keys(data).length > 0
                                ? `${Object.keys(data).length} photo loaded`
                                : "No data loaded"}
                        </Text>

                        <Heading as="h2" size="lg" mb={6} textAlign="center">
                            Sign Analysis
                        </Heading>

                        {/* View selection tabs */}
                        <Box mb={6}>
                            <Heading as="h3" size="md" mb={2}>
                                Select View
                            </Heading>
                            <Button
                                w="full"
                                mb={2}
                                colorScheme={
                                    view === "municipality" ? "blue" : "gray"
                                }
                                onClick={() => setView("municipality")}
                            >
                                Municipality View
                            </Button>
                            <Button
                                w="full"
                                mb={2}
                                colorScheme={view === "map" ? "blue" : "gray"}
                                onClick={() => setView("map")}
                            >
                                Map View
                            </Button>
                        </Box>

                        {/* Municipality selection */}
                        {view === "municipality" && (
                            <VStack align="stretch" mb={6} spacing={4}>
                                <Box>
                                    <Heading as="h3" size="md" mb={2}>
                                        Municipality
                                    </Heading>
                                    <Select
                                        bg="gray.700"
                                        value={municipality}
                                        onChange={(e) =>
                                            updateMunicipality(e.target.value)
                                        }
                                    >
                                        {municipalities.map((muni) => (
                                            <option key={muni} value={muni}>
                                                {muni}
                                            </option>
                                        ))}
                                    </Select>
                                </Box>
                            </VStack>
                        )}

                        {/* Typeface selection */}
                        {view === "map" && (
                            <VStack align="stretch" mb={6} spacing={4}>
                                <Box>
                                    <Heading as="h3" size="md" mb={2}>
                                        Feature
                                    </Heading>
                                    <Select
                                        bg="gray.700"
                                        value={feature}
                                        onChange={(e) => {
                                            setFeature(e.target.value);
                                            console.log(e.target.value);
                                        }}
                                    >
                                        <option value="typeface">
                                            Typeface Style
                                        </option>
                                        <option value="lettering">
                                            Lettering Ontology
                                        </option>
                                        <option value="message">
                                            Message Function
                                        </option>
                                        <option value="placement">
                                            Placement
                                        </option>
                                        <option value="covid">
                                            COVID Related
                                        </option>
                                    </Select>
                                </Box>
                                <Box>
                                    <Heading as="h3" size="md" mb={2}>
                                        Sub-feature
                                    </Heading>
                                    <Select
                                        bg="gray.700"
                                        value={subFeature}
                                        onChange={(e) =>
                                            setSubFeature(e.target.value)
                                        }
                                    >
                                        {feature === "typeface" &&
                                            processedData?.typefaceData?.map(
                                                (item) => (
                                                    <option
                                                        key={item.typeface}
                                                        value={item.typeface}
                                                    >
                                                        {item.typeface}
                                                    </option>
                                                )
                                            )}
                                        {feature === "lettering" &&
                                            processedData?.letteringData?.map(
                                                (item) => (
                                                    <option
                                                        key={item.ontology}
                                                        value={item.ontology}
                                                    >
                                                        {item.ontology}
                                                    </option>
                                                )
                                            )}
                                        {feature === "message" &&
                                            processedData?.messageFunctionData?.map(
                                                (item) => (
                                                    <option
                                                        key={item.function}
                                                        value={item.function}
                                                    >
                                                        {item.function}
                                                    </option>
                                                )
                                            )}
                                        {feature === "placement" &&
                                            processedData?.placementData?.map(
                                                (item) => (
                                                    <option
                                                        key={item.placement}
                                                        value={item.placement}
                                                    >
                                                        {item.placement}
                                                    </option>
                                                )
                                            )}
                                        {feature === "covid" &&
                                            processedData?.covidData?.map(
                                                (item) => (
                                                    <option
                                                        key={item.category}
                                                        value={item.category}
                                                    >
                                                        {item.category}
                                                    </option>
                                                )
                                            )}
                                    </Select>
                                </Box>
                            </VStack>
                        )}
                    </VStack>
                )}

                <VStack spacing={4} p={isCollapsed ? 2 : 4} mt="auto">
                    {isCollapsed ? (
                        <>
                            <Button
                                onClick={handleDownloadJSON}
                                disabled={Object.keys(data).length <= 0}
                                p={0}
                                minW="40px"
                                h="40px"
                                borderRadius="full"
                                aria-label="Download JSON"
                            >
                                <DownloadIcon boxSize={5} />
                            </Button>

                            <Button
                                onClick={onOpen}
                                disabled={Object.keys(data).length <= 0}
                                p={0}
                                minW="40px"
                                h="40px"
                                borderRadius="full"
                                aria-label="New Photo"
                            >
                                <AddIcon boxSize={5} />
                            </Button>

                            <Button
                                onClick={toggleCollapse}
                                p={0}
                                minW="40px"
                                h="40px"
                                borderRadius="full"
                                aria-label="Expand Sidebar"
                            >
                                <ChevronRightIcon boxSize={5} />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                onClick={handleDownloadJSON}
                                disabled={Object.keys(data).length <= 0}
                                colorScheme="blue"
                                leftIcon={<DownloadIcon />}
                                w="full"
                                variant="solid"
                                _hover={{ bg: "blue.500" }}
                            >
                                Download JSON
                            </Button>

                            <Button
                                onClick={onOpen}
                                disabled={Object.keys(data).length <= 0}
                                colorScheme="teal"
                                leftIcon={<AddIcon />}
                                w="full"
                                variant="solid"
                                _hover={{ bg: "teal.500" }}
                            >
                                New Photo
                            </Button>

                            <Button
                                leftIcon={<ChevronLeftIcon />}
                                variant="outline"
                                _hover={{ bg: "whiteAlpha.200" }}
                                w="full"
                                onClick={toggleCollapse}
                            >
                                Collapse
                            </Button>
                        </>
                    )}
                </VStack>
            </Flex>
        </Box>
    );
}
