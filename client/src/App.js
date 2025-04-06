import "./App.css";
import { Box, Heading, HStack, VStack, Button, Flex } from "@chakra-ui/react";
import Dashboard from "./Dashboard.js";
import Sidebar from "./Sidebar.js";

export default function App() {
    return (
        <Box fontFamily="Inter, sans-serif" h="100vh">
            <Flex height="100%" direction="column">
                <Box w="full">
                    <Heading m={10} color="#000C5C">
                        Typeface Analysis Dashboard
                    </Heading>
                </Box>
                <HStack
                    backgroundColor="#A5B2CE"
                    align="stretch"
                    w="full"
                    flex={1}
                >
                    <Sidebar></Sidebar>
                    <Dashboard />
                </HStack>
            </Flex>
        </Box>
    );
}
