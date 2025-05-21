import "./App.css";
import {
    Box,
    Heading,
    HStack,
    VStack,
    Button,
    Flex,
    useDisclosure,
    Text,
    Icon,
    Container,
    useColorModeValue,
    Image,
} from "@chakra-ui/react";
import Dashboard from "./Dashboard.js";
import Sidebar from "./Sidebar.js";
import { useState } from "react";
import AddModal from "./AddModal.js";
import { SettingsIcon, InfoIcon } from "@chakra-ui/icons";

import { LETTERING_ONTOLOGIES } from "./constants.js";

export default function App() {
    const [data, setData] = useState({});
    const [processedData, setProcessedData] = useState({});
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [municipalities, setMunicipalities] = useState([]);

    const [view, setView] = useState("municipality"); // "municipality" or "map"
    const [selectedMunicipality, setSelectedMunicipality] =
        useState("All Municipalities");
    const [selectedFeature, setSelectedFeature] = useState("typeface");
    const [selectedSubFeature, setSelectedSubFeature] = useState(null);

    // Update processedData to display data for new municipality
    const updateSelectedMunicipality = (muni) => {
        setSelectedMunicipality(muni);
    };

    return (
        <Box
            fontFamily="Inter, sans-serif"
            h="100vh"
            backgroundColor="#A5B2CE"
            bgGradient="linear(to-b, #A5B2CE, #8D9BB8)"
            overflow="hidden"
        >
            <VStack height="100%" direction="column" spacing={0}>
                <Box
                    w="full"
                    height="120px"
                    pos="sticky"
                    top={0}
                    backgroundColor="#F7ECE7"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.08)"
                    zIndex="1000"
                    borderBottom="3px solid #000C5C"
                >
                    <Flex
                        alignItems="center"
                        justifyContent="space-between"
                        h="full"
                        px={10}
                    >
                        <Flex alignItems="center">
                            <Box mr={4} color="#000C5C">
                                <svg
                                    width="36"
                                    height="36"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M4 7V4h16v3" />
                                    <path d="M9 20h6" />
                                    <path d="M12 4v16" />
                                </svg>
                            </Box>
                            <Heading color="#000C5C" size="xl">
                                Typeface Analysis
                            </Heading>
                        </Flex>

                        <Flex>
                            <Button
                                variant="ghost"
                                mr={2}
                                color="#000C5C"
                                _hover={{ bg: "blackAlpha.100" }}
                            >
                                <InfoIcon />
                            </Button>
                            <Button
                                variant="ghost"
                                color="#000C5C"
                                _hover={{ bg: "blackAlpha.100" }}
                            >
                                <SettingsIcon />
                            </Button>
                        </Flex>
                    </Flex>
                </Box>

                <HStack
                    align="stretch"
                    w="full"
                    flex={1}
                    spacing={0}
                    overflow="hidden"
                >
                    <Sidebar
                        data={data}
                        onOpen={onOpen}
                        view={view}
                        setView={setView}
                        municipality={selectedMunicipality}
                        updateMunicipality={updateSelectedMunicipality}
                        feature={selectedFeature}
                        setFeature={setSelectedFeature}
                        subFeature={selectedSubFeature}
                        setSubFeature={setSelectedSubFeature}
                        processedData={processedData}
                    />
                    <Box
                        flex={1}
                        overflowY="auto"
                        p={4}
                        borderRadius="15px 0 0 0"
                        backgroundColor="rgba(255, 255, 255, 0.05)"
                        backdropFilter="blur(10px)"
                        boxShadow="inset 0 4px 12px rgba(0, 0, 0, 0.05)"
                    >
                        <Dashboard
                            data={data}
                            setData={setData}
                            processedData={processedData}
                            setProcessedData={setProcessedData}
                            view={view}
                            selectedMunicipality={selectedMunicipality}
                            setMunicipalities={setMunicipalities}
                            feature={selectedFeature}
                            subFeature={selectedSubFeature}
                        />
                    </Box>

                    <AddModal
                        data={data}
                        setData={setData}
                        isOpen={isOpen}
                        onClose={onClose}
                    />
                </HStack>

                {/* Footer */}
                <Box w="full" py={2} px={6} bg="#000C5C" color="whiteAlpha.800">
                    <Flex justifyContent="space-between" alignItems="center">
                        <Text fontSize="xs">
                            Typeface Analysis Dashboard © 2025
                        </Text>
                        <Text fontSize="xs">
                            {Object.keys(data).length} photos loaded
                        </Text>
                    </Flex>
                </Box>
            </VStack>
        </Box>
    );
}
