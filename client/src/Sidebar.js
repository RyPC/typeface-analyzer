// import "./App.css";
import { Button, Divider, HStack, Select, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
    TYPEFACE_STYLES,
    LETTERING_ONTOLOGIES,
    PLACEMENTS,
    MESSAGE_FUNCTIONS,
} from "./constants";
import PageHeader from "./components/PageHeader";

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

    return (
        <PageHeader title="Analysis Dashboard">
            {/* View selection tabs */}
            <HStack spacing={2}>
                <Text fontSize="sm" fontWeight="semibold" mr={2}>
                    View:
                </Text>
                <Button
                    size="sm"
                    colorScheme={view === "municipality" ? "blue" : "gray"}
                    onClick={() => setView("municipality")}
                >
                    Municipality View
                </Button>
                <Button
                    size="sm"
                    colorScheme={view === "map" ? "blue" : "gray"}
                    onClick={() => setView("map")}
                >
                    Map View
                </Button>
            </HStack>

            <Divider
                orientation="vertical"
                height="40px"
                borderColor="gray.300"
            />

            {/* Municipality selection */}
            {view === "municipality" && (
                <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="semibold">
                        Municipality:
                    </Text>
                    <Select
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                        w="200px"
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
                </HStack>
            )}

            {/* Feature selection for map view */}
            {view === "map" && (
                <>
                    <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="semibold">
                            Feature:
                        </Text>
                        <Select
                            value={feature}
                            onChange={(e) => {
                                setFeature(e.target.value);
                                setSubFeature(null);
                            }}
                            w="180px"
                        >
                            <option value="typeface">Typeface Style</option>
                            <option value="lettering">
                                Lettering Ontology
                            </option>
                            <option value="message">Message Function</option>
                            <option value="placement">Placement</option>
                            <option value="covid">COVID Related</option>
                        </Select>
                    </HStack>
                    <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="semibold">
                            Sub-feature:
                        </Text>
                        <Select
                            value={subFeature || ""}
                            onChange={(e) => setSubFeature(e.target.value)}
                            w="180px"
                        >
                            <option value="">Select...</option>
                            {feature === "typeface" &&
                                TYPEFACE_STYLES.map((style) => (
                                    <option key={style} value={style}>
                                        {style}
                                    </option>
                                ))}
                            {feature === "lettering" &&
                                LETTERING_ONTOLOGIES.map((ontology) => (
                                    <option key={ontology} value={ontology}>
                                        {ontology}
                                    </option>
                                ))}
                            {feature === "message" &&
                                MESSAGE_FUNCTIONS.map((func) => (
                                    <option key={func} value={func}>
                                        {func}
                                    </option>
                                ))}
                            {feature === "placement" &&
                                PLACEMENTS.map((placement) => (
                                    <option key={placement} value={placement}>
                                        {placement}
                                    </option>
                                ))}
                            {feature === "covid" && (
                                <>
                                    <option value="COVID-Related">
                                        COVID-Related
                                    </option>
                                    <option value="Non-COVID">Non-COVID</option>
                                </>
                            )}
                        </Select>
                    </HStack>
                </>
            )}
        </PageHeader>
    );
}
