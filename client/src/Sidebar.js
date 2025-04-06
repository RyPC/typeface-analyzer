// import "./App.css";
import { Box, HStack, VStack, Button, Flex } from "@chakra-ui/react";

export default function Sidebar() {
    return (
        <Box w="300px" h="full" backgroundColor="#55627E">
            <Flex
                direction="column"
                h="100%"
                w="100%"
                color="white"
                textAlign="center"
            >
                <Box p={5}>Header</Box>
                <Box flex={1}></Box>
                <Box p={5}>Footer</Box>
            </Flex>
        </Box>
    );
}
