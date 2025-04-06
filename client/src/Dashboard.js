// import "./App.css";
import { Box, HStack, Flex } from "@chakra-ui/react";

export default function Dashboard() {
    return (
        <Box flex={1} w="full" height="full">
            <Flex
                wrap="wrap"
                gap={4}
                w="full"
                height="100%"
                justify="center"
                flexDirection="column"
                padding={5}
            >
                {[0, 0].map((_, row) => (
                    <Flex
                        wrap="wrap"
                        gap={4}
                        w="full"
                        flex={1}
                        justify="center"
                        flexDirection="row"
                        padding={10}
                    >
                        {[0, 0].map((_, col) => (
                            <Box
                                backgroundColor="#55627E"
                                flex={1}
                                color="white"
                                rounded="30px"
                                alignContent="center"
                                textAlign="center"
                                p={4}
                            >
                                CHART {row}, {col}
                            </Box>
                        ))}
                    </Flex>
                ))}
            </Flex>
        </Box>
    );
}
