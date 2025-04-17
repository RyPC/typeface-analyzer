// import "./App.css";
import { Box, Button, Flex, Text } from "@chakra-ui/react";

import { useState } from "react";

export default function Sidebar() {
    return (
        <Box
            w="300px"
            h="100%"
            backgroundColor="#55627E"
            pos="sticky"
            top="120px"
            height="calc(100vh - 120px)"
        >
            <Flex
                direction="column"
                h="100%"
                w="100%"
                color="white"
                textAlign="center"
            >
                <Box p={5}>Header</Box>
                <Box p={5}>
                    <Button>New Photo</Button>
                </Box>
                <Box flex={1}></Box>
                <Box p={5}>
                    <Button>{"<<"}</Button>
                </Box>
            </Flex>
        </Box>
    );
}
