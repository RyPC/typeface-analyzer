// import "./App.css";
import { Box, Button, Divider, Flex, Text, VStack } from "@chakra-ui/react";
import {
    DownloadIcon,
    AddIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from "@chakra-ui/icons";

import { useState } from "react";

export default function Sidebar({ data, onOpen }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Toggle sidebar collapse state
    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleDownloadCSV = () => {
        // Simple implementation - you might want to customize based on your data structure
        if (Object.keys(data).length <= 0) return;

        // Convert data to CSV format
        const headers = ["Municipality", "Typeface", "Count"];
        const csvRows = [headers.join(",")];

        Object.keys(data).forEach((municipality) => {
            data[municipality].forEach((item) => {
                csvRows.push(`${municipality},${item.typeface},${item.count}`);
            });
        });

        const csvContent = csvRows.join("\n");

        // Create a downloadable link
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "typeface_data.csv");
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

                {isCollapsed ? (
                    <VStack spacing={8} mt={8} mb="auto">
                        <Text fontSize="sm" fontWeight="bold">
                            D
                        </Text>
                    </VStack>
                ) : (
                    <VStack spacing={6} align="stretch" flex={1} px={3}>
                        <Text fontSize="sm" color="whiteAlpha.700">
                            {Object.keys(data).length > 0
                                ? `${
                                      Object.keys(data).length
                                  } municipalities loaded`
                                : "No data loaded"}
                        </Text>

                        {/* Add more sidebar content here if needed */}
                    </VStack>
                )}

                <VStack spacing={4} p={isCollapsed ? 2 : 4} mt="auto">
                    {isCollapsed ? (
                        <>
                            <Button
                                onClick={handleDownloadCSV}
                                disabled={Object.keys(data).length <= 0}
                                p={0}
                                minW="40px"
                                h="40px"
                                borderRadius="full"
                                aria-label="Download CSV"
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
                                onClick={handleDownloadCSV}
                                disabled={Object.keys(data).length <= 0}
                                colorScheme="blue"
                                leftIcon={<DownloadIcon />}
                                w="full"
                                variant="solid"
                                _hover={{ bg: "blue.500" }}
                            >
                                Download CSV
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
