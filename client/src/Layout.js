import {
    Box,
    Heading,
    HStack,
    VStack,
    Button,
    Flex,
    Text,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
} from "@chakra-ui/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDownIcon } from "@chakra-ui/icons";

export default function Layout({ children, user, photoCount, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await onLogout();
        navigate("/login");
    };

    const isActive = (path) => location.pathname === path;

    return (
        <Box
            fontFamily="Inter, sans-serif"
            h="100vh"
            backgroundColor="#A5B2CE"
            bgGradient="linear(to-b, #A5B2CE, #8D9BB8)"
            display="flex"
            flexDirection="row"
            overflow="hidden"
        >
            {/* Left Sidebar Navigation */}
            <Box
                w="250px"
                h="100vh"
                backgroundColor="#F7ECE7"
                boxShadow="4px 0 12px rgba(0, 0, 0, 0.08)"
                zIndex="1000"
                borderRight="3px solid #000C5C"
                flexShrink={0}
                display="flex"
                flexDirection="column"
                overflow="hidden"
            >
                <Flex
                    alignItems="center"
                    justifyContent="center"
                    p={6}
                    borderBottom="2px solid #000C5C"
                    flexShrink={0}
                >
                    <Box mr={3} color="#000C5C">
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
                    <Heading color="#000C5C" size="lg">
                        Typeface Analysis
                    </Heading>
                </Flex>

                <VStack
                    spacing={2}
                    align="stretch"
                    flex={1}
                    p={4}
                    mt={4}
                    minH={0}
                    overflow="hidden"
                >
                    <Button
                        as={Link}
                        to="/dashboard"
                        variant={isActive("/dashboard") ? "solid" : "ghost"}
                        colorScheme={isActive("/dashboard") ? "blue" : "gray"}
                        color={isActive("/dashboard") ? "white" : "#000C5C"}
                        justifyContent="flex-start"
                        leftIcon={
                            <Box>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M3 9h18M9 21V9" />
                                </svg>
                            </Box>
                        }
                    >
                        Dashboard
                    </Button>
                    <Button
                        as={Link}
                        to="/table"
                        variant={isActive("/table") ? "solid" : "ghost"}
                        colorScheme={isActive("/table") ? "blue" : "gray"}
                        color={isActive("/table") ? "white" : "#000C5C"}
                        justifyContent="flex-start"
                        leftIcon={
                            <Box>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M3 3h18v18H3zM3 9h18M9 3v18" />
                                </svg>
                            </Box>
                        }
                    >
                        Table View
                    </Button>
                    <Button
                        as={Link}
                        to="/labeling"
                        variant={isActive("/labeling") ? "solid" : "ghost"}
                        colorScheme={isActive("/labeling") ? "blue" : "gray"}
                        color={isActive("/labeling") ? "white" : "#000C5C"}
                        justifyContent="flex-start"
                        leftIcon={
                            <Box>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                                </svg>
                            </Box>
                        }
                    >
                        Labeling
                    </Button>
                </VStack>

                <VStack spacing={2} p={4} borderTop="2px solid #000C5C" flexShrink={0}>
                    <Menu>
                        <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon />}
                            variant="ghost"
                            color="#000C5C"
                            _hover={{ bg: "blackAlpha.100" }}
                            w="full"
                            justifyContent="flex-start"
                        >
                            <Flex alignItems="center">
                                <Avatar
                                    size="sm"
                                    name={`${user?.firstName} ${user?.lastName}`}
                                    mr={2}
                                />
                                <Text fontSize="sm">
                                    {user?.firstName} {user?.lastName}
                                </Text>
                            </Flex>
                        </MenuButton>
                        <MenuList>
                            <MenuItem isDisabled>Profile</MenuItem>
                            <MenuDivider />
                            <MenuItem onClick={handleLogout}>
                                Logout
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </VStack>

                {/* Footer in sidebar */}
                <Box py={2} px={4} bg="#000C5C" color="whiteAlpha.800" flexShrink={0}>
                    <VStack spacing={1} align="stretch">
                        <Text fontSize="xs" textAlign="center">
                            {photoCount} photos loaded
                        </Text>
                    </VStack>
                </Box>
            </Box>

            {/* Main Content Area */}
            <Box flex={1} h="100vh" display="flex" flexDirection="column" overflow="hidden">
                {children}
            </Box>
        </Box>
    );
}
