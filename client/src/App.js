import "./App.css";
import {
    Box,
    Spinner,
    Center,
    VStack,
    Text,
    useDisclosure,
} from "@chakra-ui/react";
import Dashboard from "./Dashboard.js";
import Sidebar from "./Sidebar.js";
import TableView from "./TableView.js";
import LabelingPage from "./LabelingPage.js";
import { useEffect, useState } from "react";
import AddModal from "./AddModal.js";
import Login from "./Login.js";
import Layout from "./Layout.js";
import ProtectedRoute from "./ProtectedRoute.js";
import { Routes, Route, Navigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [photoCount, setPhotoCount] = useState(0);
    const { isOpen, onOpen, onClose } = useDisclosure();

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

    // Dashboard Page Component
    const DashboardPage = () => (
        <VStack align="stretch" w="full" h="100%" spacing={0} overflow="hidden">
            <Box px={4} pt={4} flexShrink={0}>
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
            </Box>
            <Box
                flex={1}
                overflowY="auto"
                p={4}
                backgroundColor="rgba(255, 255, 255, 0.05)"
                backdropFilter="blur(10px)"
                boxShadow="inset 0 4px 12px rgba(0, 0, 0, 0.05)"
            >
                <Dashboard
                    view={view}
                    selectedMunicipality={selectedMunicipality}
                    feature={selectedFeature}
                    subFeature={selectedSubFeature}
                />
            </Box>
            <AddModal isOpen={isOpen} onClose={onClose} />
        </VStack>
    );

    // Table View Page Component
    const TablePage = () => (
        <VStack align="stretch" w="full" h="100%" spacing={0} overflow="hidden">
            <TableView onOpen={onOpen} />
            <AddModal isOpen={isOpen} onClose={onClose} />
        </VStack>
    );

    // Labeling Page Component
    const LabelingPageComponent = () => <LabelingPage user={user} />;

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

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <Login onLogin={handleLogin} />
                    )
                }
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <Layout
                            user={user}
                            photoCount={photoCount}
                            onLogout={handleLogout}
                        >
                            <DashboardPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/table"
                element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <Layout
                            user={user}
                            photoCount={photoCount}
                            onLogout={handleLogout}
                        >
                            <TablePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/labeling"
                element={
                    <ProtectedRoute isAuthenticated={isAuthenticated}>
                        <Layout
                            user={user}
                            photoCount={photoCount}
                            onLogout={handleLogout}
                        >
                            <LabelingPageComponent />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/"
                element={
                    <Navigate
                        to={isAuthenticated ? "/dashboard" : "/login"}
                        replace
                    />
                }
            />
        </Routes>
    );
}
