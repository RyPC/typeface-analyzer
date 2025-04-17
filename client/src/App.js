import "./App.css";
import { Box, Heading, HStack, VStack, Button, Flex } from "@chakra-ui/react";
import Dashboard from "./Dashboard.js";
import Sidebar from "./Sidebar.js";
import { useState } from "react";

export default function App() {
    const [countData, setCountData] = useState({});
    return (
        <Box fontFamily="Inter, sans-serif" h="100vh" backgroundColor="#A5B2CE">
            <VStack height="100%" direction="column" gap={0}>
                <Box
                    w="full"
                    height="120px"
                    pos="sticky"
                    top={0}
                    backgroundColor="#F7ECE7"
                    zIndex="1000"
                >
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
                    <Dashboard data={countData} setData={setCountData} />
                </HStack>
            </VStack>
        </Box>
    );
}
