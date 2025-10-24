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
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

import { useState, useEffect } from "react";
import {
    TYPEFACE_STYLES,
    LETTERING_ONTOLOGIES,
    PLACEMENTS,
    MESSAGE_FUNCTIONS,
} from "./constants";

const API_URL = process.env.REACT_APP_API_URL;

export default function Sidebar({
    onOpen,
    view,
    setView,
    municipality,
    setMunicipality,
    feature,
    setFeature,
    subFeature,
    setSubFeature,
    photoCount,
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [municipalities, setMunicipalities] = useState([]);

    // Fetch municipalities when component mounts
    useEffect(() => {
        const fetchMunicipalities = async () => {
            try {
                const url = `${API_URL}/api/municipalities`;
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error("Failed to fetch municipalities");
                }
                const data = await response.json();
                setMunicipalities(data);
                setMunicipality("All Municipalities");
            } catch (error) {
                console.error("Error fetching municipalities:", error);
            }
        };

        fetchMunicipalities();
    }, []);

    // Toggle sidebar collapse state
    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
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
                            {photoCount > 0
                                ? `${photoCount} photos loaded`
                                : "No photos loaded"}
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
                                            setMunicipality(e.target.value)
                                        }
                                    >
                                        <option value="All Municipalities">
                                            All Municipalities
                                        </option>
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
                                            // Reset subFeature when changing features
                                            setSubFeature(null);
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
                                            TYPEFACE_STYLES.map((style) => (
                                                <option
                                                    key={style}
                                                    value={style}
                                                >
                                                    {style}
                                                </option>
                                            ))}
                                        {feature === "lettering" &&
                                            LETTERING_ONTOLOGIES.map(
                                                (ontology) => (
                                                    <option
                                                        key={ontology}
                                                        value={ontology}
                                                    >
                                                        {ontology}
                                                    </option>
                                                )
                                            )}
                                        {feature === "message" &&
                                            MESSAGE_FUNCTIONS.map((func) => (
                                                <option key={func} value={func}>
                                                    {func}
                                                </option>
                                            ))}
                                        {feature === "placement" &&
                                            PLACEMENTS.map((placement) => (
                                                <option
                                                    key={placement}
                                                    value={placement}
                                                >
                                                    {placement}
                                                </option>
                                            ))}
                                        {feature === "covid" && (
                                            <>
                                                <option value="COVID-Related">
                                                    COVID-Related
                                                </option>
                                                <option value="Non-COVID">
                                                    Non-COVID
                                                </option>
                                            </>
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
