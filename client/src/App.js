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
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    Spinner,
    Center,
} from "@chakra-ui/react";
import Dashboard from "./Dashboard.js";
import Sidebar from "./Sidebar.js";
import TableView from "./TableView.js";
import LabelingPage from "./LabelingPage.js";
import { useEffect, useState } from "react";
import AddModal from "./AddModal.js";
import { SettingsIcon, InfoIcon, ChevronDownIcon } from "@chakra-ui/icons";
import Login from "./Login.js";

const API_URL = process.env.REACT_APP_API_URL;

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [photoCount, setPhotoCount] = useState(0);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [currentPage, setCurrentPage] = useState("dashboard"); // "dashboard", "labeling", "table"
    const [view, setView] = useState("municipality"); // "municipality" or "map"
    const [selectedMunicipality, setSelectedMunicipality] =
        useState("All Municipalities");
    const [selectedFeature, setSelectedFeature] = useState("typeface");
    const [selectedSubFeature, setSelectedSubFeature] = useState(null);

    useEffect(() => {
        const validateSession = async () => {
            const storedToken = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (!storedToken || !storedUser) {
                setIsLoading(false);
                return;
            }

            try {
                // Try to make an authenticated request to verify the token
                const response = await fetch(`${API_URL}/api/auth/verify`, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                    },
                });

                if (response.ok) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);
                } else {
                    // If token is invalid, clear everything
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                }
            } catch (error) {
                // If server is not available, clear everything
                console.error("Session validation error:", error);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            } finally {
                setIsLoading(false);
            }
        };

        validateSession();
    }, []);

    // Get count from database
    useEffect(() => {
        const fetchCount = async () => {
            if (!isAuthenticated) return;

            try {
                const url = `${API_URL}/api/stats/count`;
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                setPhotoCount(data.count);
            } catch (error) {
                console.error("Error fetching count:", error);
            }
        };

        fetchCount();
    }, [isAuthenticated, token]);

    const handleLogin = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    if (isLoading) {
        return (
            <Box
                h="100vh"
                bgGradient="linear(to-b, #A5B2CE, #8D9BB8)"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Center>
                    <VStack spacing={4}>
                        <Spinner
                            thickness="4px"
                            speed="0.65s"
                            emptyColor="gray.200"
                            color="#000C5C"
                            size="xl"
                        />
                        <Text color="#000C5C">Loading...</Text>
                    </VStack>
                </Center>
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

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

                        <Flex alignItems="center">
                            <HStack spacing={4} mr={4}>
                                <Button
                                    variant={
                                        currentPage === "dashboard"
                                            ? "solid"
                                            : "ghost"
                                    }
                                    colorScheme={
                                        currentPage === "dashboard"
                                            ? "blue"
                                            : "gray"
                                    }
                                    onClick={() => setCurrentPage("dashboard")}
                                    color={
                                        currentPage === "dashboard"
                                            ? "white"
                                            : "#000C5C"
                                    }
                                >
                                    Dashboard
                                </Button>
                                <Button
                                    variant={
                                        currentPage === "labeling"
                                            ? "solid"
                                            : "ghost"
                                    }
                                    colorScheme={
                                        currentPage === "labeling"
                                            ? "blue"
                                            : "gray"
                                    }
                                    onClick={() => setCurrentPage("labeling")}
                                    color={
                                        currentPage === "labeling"
                                            ? "white"
                                            : "#000C5C"
                                    }
                                >
                                    Labeling
                                </Button>
                            </HStack>
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
                                mr={2}
                                color="#000C5C"
                                _hover={{ bg: "blackAlpha.100" }}
                            >
                                <SettingsIcon />
                            </Button>
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    variant="ghost"
                                    color="#000C5C"
                                    _hover={{ bg: "blackAlpha.100" }}
                                >
                                    <Flex alignItems="center">
                                        <Avatar
                                            size="sm"
                                            name={`${user?.firstName} ${user?.lastName}`}
                                            mr={2}
                                        />
                                        <Text>
                                            {user?.firstName} {user?.lastName}
                                        </Text>
                                    </Flex>
                                </MenuButton>
                                <MenuList>
                                    <MenuItem>Profile</MenuItem>
                                    <MenuDivider />
                                    <MenuItem onClick={handleLogout}>
                                        Logout
                                    </MenuItem>
                                </MenuList>
                            </Menu>
                        </Flex>
                    </Flex>
                </Box>

                {currentPage === "labeling" ? (
                    <Box
                        flex={1}
                        overflowY="auto"
                        p={4}
                        borderRadius="15px 0 0 0"
                        backgroundColor="rgba(255, 255, 255, 0.05)"
                        backdropFilter="blur(10px)"
                        boxShadow="inset 0 4px 12px rgba(0, 0, 0, 0.05)"
                    >
                        <LabelingPage user={user} />
                    </Box>
                ) : (
                    <HStack
                        align="stretch"
                        w="full"
                        flex={1}
                        spacing={0}
                        overflow="hidden"
                    >
                        <Sidebar
                            onOpen={onOpen}
                            view={view}
                            setView={setView}
                            municipality={selectedMunicipality}
                            setMunicipality={setSelectedMunicipality}
                            feature={selectedFeature}
                            setFeature={setSelectedFeature}
                            subFeature={selectedSubFeature}
                            setSubFeature={setSelectedSubFeature}
                            photoCount={photoCount}
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
                            {currentPage === "table" ? (
                                <TableView onOpen={onOpen} />
                            ) : (
                                <Dashboard
                                    view={view}
                                    selectedMunicipality={selectedMunicipality}
                                    feature={selectedFeature}
                                    subFeature={selectedSubFeature}
                                />
                            )}
                        </Box>

                        <AddModal isOpen={isOpen} onClose={onClose} />
                    </HStack>
                )}

                {/* Footer */}
                <Box w="full" py={2} px={6} bg="#000C5C" color="whiteAlpha.800">
                    <Flex justifyContent="space-between" alignItems="center">
                        <Text fontSize="xs">
                            Typeface Analysis Dashboard © 2025
                        </Text>
                        <Text fontSize="xs">{photoCount} photos loaded</Text>
                    </Flex>
                </Box>
            </VStack>
        </Box>
    );
}
